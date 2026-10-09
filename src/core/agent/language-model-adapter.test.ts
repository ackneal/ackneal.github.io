import { describe, expect, mock, test } from 'bun:test';
import type { BrowserConversationMessage, BrowserMessage } from './browser-model.js';
import { LanguageModelAdapter } from './language-model-adapter.js';

interface MockLanguageModelSession {
  prompt: ReturnType<typeof mock>;
  append: ReturnType<typeof mock>;
  clone: ReturnType<typeof mock>;
  destroy: ReturnType<typeof mock>;
  contextUsage: number;
  contextWindow: number;
}

function nativeSession(overrides: Partial<MockLanguageModelSession> = {}): MockLanguageModelSession {
  return {
    prompt: mock(async () => 'answer'),
    append: mock(async () => {}),
    clone: mock(async () => nativeSession()),
    destroy: mock(() => {}),
    contextUsage: 12,
    contextWindow: 100,
    ...overrides,
  };
}

describe('LanguageModelAdapter', () => {
  test('forwards creation, prompt signals and response constraints', async () => {
    const native = nativeSession();
    const create = mock(async (_options: LanguageModelCreateOptions) =>
      native as unknown as LanguageModel
    );
    const model = new LanguageModelAdapter({ create });
    const initialPrompts: BrowserMessage[] = [{ role: 'system', content: 'instructions' }];
    const createSignal = new AbortController().signal;
    const promptSignal = new AbortController().signal;
    const responseConstraint = { type: 'object' };

    const session = await model.createSession({ debugName: 'caller session', initialPrompts, signal: createSignal });
    const result = await session.prompt('question', { signal: promptSignal, responseConstraint });

    expect(create).toHaveBeenCalledWith({ initialPrompts, signal: createSignal });
    expect(native.prompt).toHaveBeenCalledWith('question', { signal: promptSignal, responseConstraint });
    expect(result).toBe('answer');
    expect(session.contextUsage).toBe(12);
    expect(session.contextWindow).toBe(100);
    expect(native.destroy).not.toHaveBeenCalled();
  });

  test('forwards append, clone, and caller-owned cleanup', async () => {
    const clone = nativeSession();
    const native = nativeSession({ clone: mock(async () => clone) });
    const model = new LanguageModelAdapter({
      create: async () => native as unknown as LanguageModel,
    });
    const signal = new AbortController().signal;
    const messages: BrowserConversationMessage[] = [{ role: 'user', content: 'history' }];

    const session = await model.createSession({ debugName: 'any name', initialPrompts: [] });
    await session.append(messages, { signal });
    const clonedSession = await session.clone();
    clonedSession.destroy();
    session.destroy();

    expect(native.append).toHaveBeenCalledWith(messages, { signal });
    expect(native.clone).toHaveBeenCalledTimes(1);
    expect(clone.destroy).toHaveBeenCalledTimes(1);
    expect(native.destroy).toHaveBeenCalledTimes(1);
  });

  test('creates independent sessions without agent-name branching or warm bases', async () => {
    const sessions = [nativeSession(), nativeSession()];
    const create = mock(async (_options: LanguageModelCreateOptions) =>
      sessions.shift()! as unknown as LanguageModel
    );
    const model = new LanguageModelAdapter({ create });

    await model.createSession({ debugName: 'custom', initialPrompts: [{ role: 'system', content: 'first' }] });
    await model.createSession({ debugName: 'other', initialPrompts: [{ role: 'system', content: 'second' }] });

    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls).toEqual([
      [{ initialPrompts: [{ role: 'system', content: 'first' }] }],
      [{ initialPrompts: [{ role: 'system', content: 'second' }] }],
    ]);
  });

  test('logs every operation with caller name, timing, usage, and errors', async () => {
    const error = new Error('prompt failed');
    const native = nativeSession({ prompt: mock(async () => { throw error; }) });
    const debug = mock((_message: string, _details: Record<string, unknown>) => {});
    const originalDebug = console.debug;
    console.debug = debug;

    try {
      const model = new LanguageModelAdapter({
        create: async () => native as unknown as LanguageModel,
      });
      const session = await model.createSession({ debugName: 'research', initialPrompts: [] });
      await session.append([]);
      await session.clone();
      await expect(session.prompt('fail')).rejects.toThrow('prompt failed');
      session.destroy();

      expect(debug.mock.calls.map(([message]) => message)).toEqual([
        '[LanguageModelAdapter][research] create',
        '[LanguageModelAdapter][research] append',
        '[LanguageModelAdapter][research] clone',
        '[LanguageModelAdapter][research] prompt',
        '[LanguageModelAdapter][research] destroy',
      ]);
      for (const [, details] of debug.mock.calls) {
        expect(details.durationMs).toBeNumber();
      }
      expect(debug.mock.calls[0]?.[1]).toMatchObject({ contextUsage: 12, contextWindow: 100 });
      expect(debug.mock.calls[3]?.[1]).toMatchObject({ error });
    } finally {
      console.debug = originalDebug;
    }
  });
});

import type {
  BrowserConversationMessage,
  BrowserMessage,
  BrowserModel,
  BrowserPromptOptions,
  BrowserSession,
} from './browser-model.js';

export type LanguageModelFactory = Pick<typeof LanguageModel, 'create'>;

type Operation = 'create' | 'clone' | 'append' | 'prompt' | 'destroy';

class LanguageModelSession implements BrowserSession {
  constructor(
    private readonly native: LanguageModel,
    private readonly debugName: string
  ) {}

  get contextUsage(): number {
    return this.native.contextUsage;
  }

  get contextWindow(): number {
    return this.native.contextWindow;
  }

  async prompt(input: string, options?: BrowserPromptOptions): Promise<string> {
    return this.run('prompt', () => this.native.prompt(input, options));
  }

  async append(messages: BrowserConversationMessage[], options?: { signal?: AbortSignal }): Promise<void> {
    await this.run('append', () => this.native.append(messages, options));
  }

  async clone(): Promise<BrowserSession> {
    return this.run('clone', async () =>
      new LanguageModelSession(await this.native.clone(), this.debugName)
    );
  }

  destroy(): void {
    const startedAt = performance.now();

    try {
      this.native.destroy();
      this.log('destroy', startedAt);
    } catch (error) {
      this.log('destroy', startedAt, error);
      throw error;
    }
  }

  private async run<T>(operation: Operation, action: () => Promise<T>): Promise<T> {
    const startedAt = performance.now();

    try {
      const result = await action();
      this.log(operation, startedAt);
      return result;
    } catch (error) {
      this.log(operation, startedAt, error);
      throw error;
    }
  }

  private log(operation: Operation, startedAt: number, error?: unknown): void {
    console.debug(`[LanguageModelAdapter][${this.debugName}] ${operation}`, {
      durationMs: performance.now() - startedAt,
      contextUsage: this.contextUsage,
      contextWindow: this.contextWindow,
      ...(error === undefined ? {} : { error }),
    });
  }
}

export class LanguageModelAdapter implements BrowserModel {
  constructor(private readonly nativeFactory: LanguageModelFactory) {}

  async createSession(options: {
    debugName: string;
    initialPrompts: BrowserMessage[];
    signal?: AbortSignal;
  }): Promise<BrowserSession> {
    const { debugName, initialPrompts, signal } = options;
    const startedAt = performance.now();

    try {
      const native = await this.nativeFactory.create({
        initialPrompts: initialPrompts as LanguageModelCreateOptions['initialPrompts'],
        signal,
      });
      const session = new LanguageModelSession(native, debugName);
      console.debug(`[LanguageModelAdapter][${debugName}] create`, {
        durationMs: performance.now() - startedAt,
        contextUsage: session.contextUsage,
        contextWindow: session.contextWindow,
      });
      return session;
    } catch (error) {
      console.debug(`[LanguageModelAdapter][${debugName}] create`, {
        durationMs: performance.now() - startedAt,
        error,
      });
      throw error;
    }
  }
}

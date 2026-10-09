import type {
  BrowserConversationMessage,
  BrowserMessage,
  BrowserModel,
  BrowserPromptOptions,
  BrowserSession,
} from './browser-model.js';

export interface BrowserModelCall {
  debugName: string;
  input: string;
  messages: BrowserMessage[];
  options?: BrowserPromptOptions;
}

export class TestBrowserModel implements BrowserModel {
  readonly calls: BrowserModelCall[] = [];
  readonly created: TestBrowserSession[] = [];

  constructor(
    private readonly respond: (call: BrowserModelCall) => string | Promise<string>,
    private readonly usage = { contextUsage: 100, contextWindow: 4096 }
  ) {}

  async createSession(options: {
    debugName: string;
    initialPrompts: BrowserMessage[];
    signal?: AbortSignal;
  }): Promise<BrowserSession> {
    const session = new TestBrowserSession(
      this,
      options.debugName,
      [...options.initialPrompts],
      this.usage
    );
    this.created.push(session);
    return session;
  }

  async prompt(call: BrowserModelCall): Promise<string> {
    this.calls.push(call);
    return this.respond(call);
  }
}

export class TestBrowserSession implements BrowserSession {
  destroyed = false;

  constructor(
    private readonly model: TestBrowserModel,
    readonly debugName: string,
    readonly messages: BrowserMessage[],
    private readonly usage: { contextUsage: number; contextWindow: number }
  ) {}

  get contextUsage(): number {
    return this.usage.contextUsage;
  }

  get contextWindow(): number {
    return this.usage.contextWindow;
  }

  async prompt(input: string, options?: BrowserPromptOptions): Promise<string> {
    return this.model.prompt({
      debugName: this.debugName,
      input,
      messages: [...this.messages],
      options,
    });
  }

  async append(messages: BrowserConversationMessage[]): Promise<void> {
    this.messages.push(...messages);
  }

  async clone(): Promise<BrowserSession> {
    return new TestBrowserSession(
      this.model,
      this.debugName,
      [...this.messages],
      this.usage
    );
  }

  destroy(): void {
    this.destroyed = true;
  }
}

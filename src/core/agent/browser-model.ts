export interface BrowserMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type BrowserConversationMessage = BrowserMessage & {
  role: 'user' | 'assistant';
};

export interface BrowserPromptOptions {
  signal?: AbortSignal;
  responseConstraint?: Record<string, unknown>;
}

export interface BrowserSession {
  prompt(input: string, options?: BrowserPromptOptions): Promise<string>;
  append(messages: BrowserConversationMessage[], options?: { signal?: AbortSignal }): Promise<void>;
  clone(): Promise<BrowserSession>;
  destroy(): void;
  readonly contextUsage?: number;
  readonly contextWindow?: number;
}

export interface BrowserModel {
  createSession(options: {
    debugName: string;
    initialPrompts: BrowserMessage[];
    signal?: AbortSignal;
  }): Promise<BrowserSession>;
}

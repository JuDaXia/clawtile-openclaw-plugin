/**
 * Type stubs for openclaw/plugin-sdk/core.
 * These are only used for local typechecking when openclaw is not installed.
 * At runtime the real openclaw package resolves these modules.
 */

export type OpenClawConfig = {
  channels?: Record<string, unknown>;
  session?: { store?: unknown };
  [key: string]: unknown;
};

export type ChannelPlugin<ResolvedAccount = any, Probe = unknown, Audit = unknown> = {
  id: string;
  meta: Record<string, unknown>;
  capabilities: Record<string, unknown>;
  config: {
    listAccountIds: (cfg: OpenClawConfig) => string[];
    resolveAccount: (cfg: OpenClawConfig, accountId?: string | null) => ResolvedAccount;
    isEnabled?: (account: ResolvedAccount, cfg: OpenClawConfig) => boolean;
    isConfigured?: (account: ResolvedAccount, cfg: OpenClawConfig) => boolean | Promise<boolean>;
    unconfiguredReason?: (account: ResolvedAccount, cfg: OpenClawConfig) => string;
    [key: string]: unknown;
  };
  setup?: Record<string, unknown>;
  security?: Record<string, unknown>;
  gateway?: {
    startAccount?: (ctx: ChannelGatewayContext<ResolvedAccount>) => Promise<unknown>;
    stopAccount?: (ctx: ChannelGatewayContext<ResolvedAccount>) => Promise<void>;
  };
  outbound?: Record<string, unknown>;
  messaging?: Record<string, unknown>;
  [key: string]: unknown;
};

export type ChannelGatewayContext<ResolvedAccount = unknown> = {
  cfg: OpenClawConfig;
  accountId: string;
  account: ResolvedAccount;
  runtime: unknown;
  abortSignal: AbortSignal;
  log?: ChannelLogSink;
  getStatus: () => Record<string, unknown>;
  setStatus: (next: Record<string, unknown>) => void;
  channelRuntime?: PluginRuntime["channel"];
};

export type ChannelLogSink = {
  info: (...args: unknown[]) => void;
  warn?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
  debug?: (...args: unknown[]) => void;
};

export type PluginRuntime = {
  channel: {
    routing: {
      resolveAgentRoute: (params: {
        cfg: OpenClawConfig;
        channel: string;
        accountId: string;
        peer: { kind: "direct" | "group"; id: string };
      }) => { agentId: string; sessionKey: string; accountId?: string };
    };
    session: {
      resolveStorePath: (params: { cfg: OpenClawConfig; sessionStore?: unknown }) => string;
      readSessionUpdatedAt: (params: { storePath: string; sessionKey: string }) => number | undefined;
      recordInboundSession: (...args: unknown[]) => unknown;
    };
    reply: {
      resolveEnvelopeFormatOptions: (cfg: OpenClawConfig) => unknown;
      formatAgentEnvelope: (...args: unknown[]) => unknown;
      finalizeInboundContext: (ctx: Record<string, unknown>) => unknown;
      dispatchReplyWithBufferedBlockDispatcher: (...args: unknown[]) => unknown;
    };
    text: {
      chunkMarkdownText: (text: string, limit: number) => string[];
    };
    [key: string]: unknown;
  };
  config: {
    readConfig: () => OpenClawConfig;
    writeConfigFile: (cfg: OpenClawConfig) => Promise<void>;
  };
  logging: {
    shouldLogVerbose: () => boolean;
  };
  [key: string]: unknown;
};

export type OpenClawPluginApi = {
  runtime: PluginRuntime;
  registrationMode: "full" | "setup";
  registerChannel: (params: { plugin: ChannelPlugin }) => void;
  [key: string]: unknown;
};

export type OpenClawPluginConfigSchema = Record<string, unknown>;

export declare function defineChannelPluginEntry<TPlugin>(options: {
  id: string;
  name: string;
  description: string;
  plugin: TPlugin;
  configSchema?: OpenClawPluginConfigSchema | (() => OpenClawPluginConfigSchema);
  setRuntime?: (runtime: PluginRuntime) => void;
  registerFull?: (api: OpenClawPluginApi) => void;
}): {
  id: string;
  name: string;
  description: string;
  configSchema: OpenClawPluginConfigSchema;
  register: (api: OpenClawPluginApi) => void;
  channelPlugin: TPlugin;
  setChannelRuntime?: (runtime: PluginRuntime) => void;
};

export declare function defineSetupPluginEntry<TPlugin>(plugin: TPlugin): { plugin: TPlugin };

export declare function createChatChannelPlugin<
  TResolvedAccount extends { accountId?: string | null },
  Probe = unknown,
  Audit = unknown,
>(params: {
  base: Record<string, unknown>;
  security?: Record<string, unknown>;
  pairing?: Record<string, unknown>;
  threading?: Record<string, unknown>;
  outbound?: Record<string, unknown>;
}): ChannelPlugin<TResolvedAccount, Probe, Audit>;

export declare function createChannelPluginBase<TResolvedAccount>(params: {
  id: string;
  meta?: Record<string, unknown>;
  capabilities?: Record<string, unknown>;
  setup: Record<string, unknown>;
  [key: string]: unknown;
}): Record<string, unknown>;

export declare function buildChannelOutboundSessionRoute(params: {
  cfg: OpenClawConfig;
  agentId: string;
  channel: string;
  accountId?: string | null;
  peer: { kind: "direct" | "group" | "channel"; id: string };
  chatType: "direct" | "group" | "channel";
  from: string;
  to: string;
  threadId?: string | number;
}): Record<string, unknown>;

export declare const DEFAULT_ACCOUNT_ID: string;
export declare function normalizeAccountId(id: string): string;
export declare function getChatChannelMeta(id: string): Record<string, unknown>;
export declare const emptyPluginConfigSchema: OpenClawPluginConfigSchema;

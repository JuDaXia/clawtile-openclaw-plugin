/**
 * Type stubs for openclaw/plugin-sdk/channel-inbound.
 */
import type { OpenClawConfig } from "openclaw/plugin-sdk/core";

export type OutboundReplyPayload = {
  text?: string;
  body?: string;
  [key: string]: unknown;
};

export declare function dispatchInboundDirectDmWithRuntime(params: {
  cfg: OpenClawConfig;
  runtime: { channel: unknown };
  channel: string;
  channelLabel: string;
  accountId: string;
  peer: { kind: "direct"; id: string };
  senderId: string;
  senderAddress: string;
  recipientAddress: string;
  conversationLabel: string;
  rawBody: string;
  messageId: string;
  timestamp?: number;
  commandAuthorized?: boolean;
  bodyForAgent?: string;
  commandBody?: string;
  deliver: (payload: OutboundReplyPayload) => Promise<void>;
  onRecordError: (err: unknown) => void;
  onDispatchError: (err: unknown, info: { kind: string }) => void;
}): Promise<{
  route: { agentId: string; sessionKey: string; accountId?: string };
  storePath: string;
  ctxPayload: unknown;
}>;

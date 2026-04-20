import {
  createChatChannelPlugin,
  buildChannelOutboundSessionRoute,
  DEFAULT_ACCOUNT_ID,
} from "openclaw/plugin-sdk/core";
import type {
  OpenClawConfig,
  ChannelPlugin,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/core";
import {
  listClawTileAccountIds,
  resolveClawTileAccount,
  type ResolvedClawTileAccount,
} from "./accounts.js";
import { CloudConnector } from "./cloud-connector.js";
import { getClawTileRuntime } from "./runtime.js";
import type { Frame } from "./types.js";
import { createAddTodoTool, createListTodosTool, createCompleteTodoTool, createDeleteTodoTool } from "./todo-tools.js";

const CLAWTILE_CHANNEL = "clawtile" as const;

/**
 * Module-level connector singleton.
 * Created in startAccount, torn down in stopAccount or on abort.
 */
let activeConnector: CloudConnector | null = null;

// ---------------------------------------------------------------------------
// Config adapter -- tells OpenClaw how to list & resolve accounts
// ---------------------------------------------------------------------------

const clawTileConfigAdapter = {
  listAccountIds: (cfg: OpenClawConfig) => listClawTileAccountIds(cfg),
  resolveAccount: (cfg: OpenClawConfig, accountId?: string | null) =>
    resolveClawTileAccount({ cfg, accountId }),
  isEnabled: (account: ResolvedClawTileAccount) => account.enabled,
  isConfigured: (account: ResolvedClawTileAccount) =>
    Boolean(account.cloudUrl && account.apiKey),
  unconfiguredReason: (account: ResolvedClawTileAccount) => {
    if (!account.cloudUrl) return "cloudUrl is not set in channels.clawtile";
    if (!account.apiKey) return "apiKey is not set in channels.clawtile";
    return "";
  },
};

// ---------------------------------------------------------------------------
// Setup adapter (minimal -- ClawTile has no interactive setup wizard yet)
// ---------------------------------------------------------------------------

const clawTileSetupAdapter = {
  resolveAccountId: () => DEFAULT_ACCOUNT_ID,
  applyAccountConfig: (params: {
    cfg: OpenClawConfig;
    accountId: string;
    input: Record<string, unknown>;
  }) => {
    const next = { ...params.cfg };
    const channels = { ...(next.channels as Record<string, unknown> ?? {}) };
    channels.clawtile = {
      ...((channels.clawtile as Record<string, unknown>) ?? {}),
      cloudUrl: params.input.cloudUrl ?? "",
      apiKey: params.input.apiKey ?? "",
    };
    next.channels = channels;
    return next;
  },
};

// ---------------------------------------------------------------------------
// Helper: send a text message to a device via the cloud connector
// ---------------------------------------------------------------------------

function sendTextToDevice(deviceId: string, text: string): void {
  if (!activeConnector?.isConnected) {
    console.warn("[ClawTile] Cannot send reply -- not connected to cloud platform");
    return;
  }
  activeConnector.send({
    type: "event",
    event: "openclaw.message.outbound",
    payload: { deviceId, text },
  });
}

// ---------------------------------------------------------------------------
// The channel plugin
// ---------------------------------------------------------------------------

export const clawTilePlugin: ChannelPlugin<ResolvedClawTileAccount> = createChatChannelPlugin({
  base: {
    id: CLAWTILE_CHANNEL,
    meta: {
      id: CLAWTILE_CHANNEL,
      label: "ClawTile",
      selectionLabel: "ClawTile (E-Ink Device)",
      docsPath: "/channels/clawtile",
      docsLabel: "clawtile",
      blurb: "connect ClawTile e-ink hardware devices via the cloud platform.",
    },
    capabilities: {
      chatTypes: ["direct" as const],
    },
    config: clawTileConfigAdapter,
    setup: clawTileSetupAdapter,

    // ----- Messaging adapter: target normalization & session routing -----
    messaging: {
      normalizeTarget: (params: { raw: string }) => {
        const trimmed = params.raw.trim().replace(/^clawtile:/i, "");
        return trimmed || null;
      },
      parseExplicitTarget: (params: { raw: string }) => ({
        to: params.raw.trim().replace(/^clawtile:/i, ""),
      }),
      resolveOutboundSessionRoute: (params: {
        cfg: OpenClawConfig;
        agentId: string;
        accountId?: string | null;
        target: string;
      }) => {
        const target = params.target.trim();
        if (!target) return null;

        // Target format: "name:uuid" or just "uuid"
        // Extract UUID (last part after colon)
        const parts = target.split(":");
        const uuid = parts[parts.length - 1];
        if (!uuid) return null;

        // Keep full target string (name:uuid) for display
        const fullTarget = `clawtile:${target}`;

        return buildChannelOutboundSessionRoute({
          cfg: params.cfg,
          agentId: params.agentId,
          channel: CLAWTILE_CHANNEL,
          accountId: params.accountId,
          peer: { kind: "direct", id: uuid },  // Use UUID for backend communication
          chatType: "direct",
          from: fullTarget,
          to: fullTarget,
        });
      },
    },

    // ----- Gateway adapter: WebSocket lifecycle -----
    gateway: {
      startAccount: async (ctx: ChannelGatewayContext<ResolvedClawTileAccount>) => {
        const account = ctx.account as ResolvedClawTileAccount;
        if (!account.cloudUrl || !account.apiKey) {
          ctx.log?.error?.(
            `[${account.accountId}] ClawTile not configured (missing cloudUrl or apiKey)`
          );
          throw new Error("ClawTile channel not configured");
        }

        ctx.log?.info(
          `[${account.accountId}] Connecting to ClawTile cloud: ${account.cloudUrl}`
        );

        const connector = new CloudConnector({
          cloudUrl: account.cloudUrl,
          apiKey: account.apiKey,
        });

        // Grab the channelRuntime from the gateway context for AI dispatch
        const channelRuntime = ctx.channelRuntime;
        if (!channelRuntime) {
          ctx.log?.warn?.(
            "[clawtile] channelRuntime not available -- AI dispatch will not work"
          );
        }

        connector.setOnMessage(async (frame: Frame) => {
          if (frame.type === "event" && frame.event === "device.message.text") {
            const { deviceId, text } = frame.payload as {
              deviceId: string;
              text: string;
            };
            ctx.log?.info?.(`[clawtile] Device ${deviceId} sent: "${text}"`);

            if (!channelRuntime) {
              ctx.log?.warn?.("[clawtile] No channelRuntime -- cannot dispatch");
              return;
            }

            try {
              const pluginRuntime = getClawTileRuntime();
              const cfg = ctx.cfg;

              const route = pluginRuntime.channel.routing.resolveAgentRoute({
                cfg,
                channel: CLAWTILE_CHANNEL,
                accountId: account.accountId,
                peer: { kind: "direct", id: deviceId },
              });

              const fromAddress = `clawtile:${deviceId}`;
              const toAddress = `clawtile:${account.accountId}`;

              const ctxPayload = pluginRuntime.channel.reply.finalizeInboundContext({
                Body: text,
                BodyForAgent: text,
                RawBody: text,
                CommandBody: text,
                From: fromAddress,
                To: toAddress,
                SessionKey: route.sessionKey,
                AccountId: route.accountId,
                ChatType: "direct",
                SenderId: deviceId,
                SenderName: deviceId,
                Provider: "clawtile",
                Surface: "clawtile",
                MessageSid: `ct-${Date.now()}-${deviceId}`,
                Timestamp: Date.now(),
                OriginatingChannel: "clawtile",
                OriginatingTo: toAddress,
                CommandAuthorized: true,
              });

              await pluginRuntime.channel.reply.dispatchReplyWithBufferedBlockDispatcher({
                ctx: ctxPayload,
                cfg,
                dispatcherOptions: {
                  deliver: async (payload: { text?: string; body?: string }, _info: { kind: string }) => {
                    const replyText =
                      typeof payload.text === "string"
                        ? payload.text
                        : typeof payload.body === "string"
                          ? payload.body
                          : String(payload.text ?? payload.body ?? "");
                    if (replyText.trim()) {
                      sendTextToDevice(deviceId, replyText);
                    }
                  },
                },
              });
            } catch (err) {
              ctx.log?.error?.(`[clawtile] dispatch failed: ${String(err)}`);
            }
          }

          // Recording transcripts are now handled by the backend (FunASR)
          // and sent as device.message.text events, so no special handling needed here.

          if (frame.type === "event" && frame.event === "device.online") {
            ctx.log?.info?.(
              `[clawtile] Device ${(frame.payload as Record<string, unknown>).deviceId} came online`
            );
          }

          if (frame.type === "event" && frame.event === "device.offline") {
            ctx.log?.info?.(
              `[clawtile] Device ${(frame.payload as Record<string, unknown>).deviceId} went offline`
            );
          }
        });

        connector.setOnConnected(() => {
          ctx.log?.info?.("[clawtile] WebSocket connected to cloud platform");

          // Register todo tools with OpenClaw
          try {
            const pluginRuntime = getClawTileRuntime();
            const todoTools = [
              createAddTodoTool(),
              createListTodosTool(),
              createCompleteTodoTool(),
              createDeleteTodoTool(),
            ];

            for (const tool of todoTools) {
              (pluginRuntime as any).agent?.tools?.register?.(tool);
            }
            ctx.log?.info?.(`[clawtile] Registered ${todoTools.length} todo tools`);
          } catch (err) {
            ctx.log?.warn?.(`[clawtile] Failed to register todo tools: ${err}`);
          }
        });

        connector.setOnDisconnected(() => {
          ctx.log?.info?.("[clawtile] WebSocket disconnected from cloud platform");
        });

        activeConnector = connector;
        connector.connect();

        // Watch todos.json for changes and auto-sync to backend
        const fs = await import("node:fs");
        const path = await import("node:path");
        const os = await import("node:os");
        const http = await import("node:http");

        const todoFile = path.join(os.homedir(), ".openclaw", "clawtile-data", "todos.json");
        let syncTimer: ReturnType<typeof setTimeout> | null = null;

        function syncTodosToServer() {
          try {
            if (!fs.existsSync(todoFile)) return;
            const data = JSON.parse(fs.readFileSync(todoFile, "utf-8"));
            const todos = (data.todos || []).map((t: any) => ({
              text: t.text, done: t.done, remindAt: t.remindAt || undefined
            }));
            const body = JSON.stringify({ userId: "default", todos });
            const req = http.request("http://localhost:3000/api/todos/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Content-Length": String(Buffer.byteLength(body)) },
            }, (res) => {
              let d = "";
              res.on("data", (c: Buffer) => d += c);
              res.on("end", () => ctx.log?.info?.(`[clawtile] Auto-synced ${todos.length} todos to server`));
            });
            req.on("error", (e: Error) => ctx.log?.warn?.(`[clawtile] Todo sync failed: ${e.message}`));
            req.write(body);
            req.end();
          } catch (err) {
            ctx.log?.warn?.(`[clawtile] Todo sync error: ${err}`);
          }
        }

        // Initial sync
        syncTodosToServer();

        // Watch for file changes (debounce 1 second)
        let watcher: ReturnType<typeof fs.watch> | null = null;
        try {
          const todoDir = path.dirname(todoFile);
          if (!fs.existsSync(todoDir)) {
            fs.mkdirSync(todoDir, { recursive: true });
          }
          watcher = fs.watch(todoDir, (_eventType, filename) => {
            if (filename === "todos.json") {
              if (syncTimer) clearTimeout(syncTimer);
              syncTimer = setTimeout(() => syncTodosToServer(), 1000);
            }
          });
          ctx.log?.info?.("[clawtile] Watching todos.json for changes");
        } catch (err) {
          ctx.log?.warn?.(`[clawtile] Cannot watch todo file: ${err}`);
        }

        // Respect the abort signal so OpenClaw can tear down the gateway
        ctx.abortSignal.addEventListener(
          "abort",
          () => {
            ctx.log?.info?.("[clawtile] Abort signal received, disconnecting");
            connector.disconnect();
            if (watcher) { watcher.close(); watcher = null; }
            if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }
            if (activeConnector === connector) {
              activeConnector = null;
            }
          },
          { once: true }
        );
      },

      stopAccount: async (ctx: ChannelGatewayContext<ResolvedClawTileAccount>) => {
        ctx.log?.info?.(`[clawtile] Stopping account ${ctx.accountId}`);
        if (activeConnector) {
          activeConnector.disconnect();
          activeConnector = null;
        }
      },
    },
  },

  // ----- Security: open DM policy (all devices are allowed) -----
  security: {
    dm: {
      channelKey: CLAWTILE_CHANNEL,
      resolvePolicy: () => "open",
      resolveAllowFrom: () => [],
    },
  },

  // ----- Outbound: send text replies -----
  outbound: {
    base: {
      deliveryMode: "direct" as const,
      textChunkLimit: 500, // e-ink devices have limited display
    },
    attachedResults: {
      channel: CLAWTILE_CHANNEL,
      sendText: async (params: {
        cfg: OpenClawConfig;
        to: string;
        text: string;
        accountId?: string | null;
      }) => {
        const deviceId = params.to.replace(/^clawtile:/i, "").trim();
        sendTextToDevice(deviceId, params.text);
        return { ok: true, messageId: `ct-out-${Date.now()}` };
      },
    },
  },
});

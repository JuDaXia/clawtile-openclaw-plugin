import WebSocket from "ws";
import type { ClawTileChannelConfig, Frame } from "./types.js";

export class CloudConnector {
  private ws: WebSocket | null = null;
  private config: ClawTileChannelConfig;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 300_000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private intentionalClose = false;

  private onMessageHandler: ((frame: Frame) => void) | null = null;
  private onConnectedHandler: (() => void) | null = null;
  private onDisconnectedHandler: (() => void) | null = null;

  constructor(config: ClawTileChannelConfig) {
    this.config = config;
  }

  /** Connect to the ClawTile cloud platform */
  connect(): void {
    if (this.ws) {
      return;
    }

    this.intentionalClose = false;
    const url = new URL(this.config.cloudUrl);
    url.searchParams.set("key", this.config.apiKey);

    console.log(`[CloudConnector] Connecting to ${this.config.cloudUrl} ...`);

    this.ws = new WebSocket(url.toString());

    this.ws.on("open", () => {
      console.log("[CloudConnector] WebSocket connected");
      this.reconnectDelay = 1000;
      this.startPing();
      this.onConnectedHandler?.();
    });

    this.ws.on("message", (data) => {
      try {
        const frame = JSON.parse(data.toString()) as Frame;
        this.onMessageHandler?.(frame);
      } catch (err) {
        console.error("[CloudConnector] Failed to parse message:", err);
      }
    });

    this.ws.on("close", (code, reason) => {
      console.log(
        `[CloudConnector] WebSocket closed (code=${code}, reason=${reason.toString()})`
      );
      this.cleanup();
      this.onDisconnectedHandler?.();
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    });

    this.ws.on("error", (err) => {
      console.error("[CloudConnector] WebSocket error:", err.message);
      // The 'close' event will follow, which handles reconnection
    });

    this.ws.on("pong", () => {
      // Server responded to our ping -- connection is alive
    });
  }

  /** Gracefully disconnect */
  disconnect(): void {
    this.intentionalClose = true;
    this.cleanup();
    if (this.ws) {
      this.ws.close(1000, "client disconnect");
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    console.log("[CloudConnector] Disconnected");
  }

  /** Send a frame to the cloud platform. Returns true if sent. */
  send(frame: Frame): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[CloudConnector] Cannot send -- not connected");
      return false;
    }
    this.ws.send(JSON.stringify(frame));
    return true;
  }

  setOnMessage(handler: (frame: Frame) => void): void {
    this.onMessageHandler = handler;
  }

  setOnConnected(handler: () => void): void {
    this.onConnectedHandler = handler;
  }

  setOnDisconnected(handler: () => void): void {
    this.onDisconnectedHandler = handler;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // --- Private helpers ---

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30_000);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private cleanup(): void {
    this.stopPing();
    this.ws = null;
  }

  private scheduleReconnect(): void {
    console.log(
      `[CloudConnector] Reconnecting in ${this.reconnectDelay / 1000}s ...`
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff: 1s -> 2s -> 4s -> ... -> 300s max
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      this.maxReconnectDelay
    );
  }
}

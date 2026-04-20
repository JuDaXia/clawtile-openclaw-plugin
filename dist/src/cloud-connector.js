import WebSocket from "ws";
export class CloudConnector {
    ws = null;
    config;
    reconnectDelay = 1000;
    maxReconnectDelay = 300_000;
    reconnectTimer = null;
    pingTimer = null;
    intentionalClose = false;
    onMessageHandler = null;
    onConnectedHandler = null;
    onDisconnectedHandler = null;
    constructor(config) {
        this.config = config;
    }
    /** Connect to the ClawTile cloud platform */
    connect() {
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
                const frame = JSON.parse(data.toString());
                this.onMessageHandler?.(frame);
            }
            catch (err) {
                console.error("[CloudConnector] Failed to parse message:", err);
            }
        });
        this.ws.on("close", (code, reason) => {
            console.log(`[CloudConnector] WebSocket closed (code=${code}, reason=${reason.toString()})`);
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
    disconnect() {
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
    send(frame) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn("[CloudConnector] Cannot send -- not connected");
            return false;
        }
        this.ws.send(JSON.stringify(frame));
        return true;
    }
    setOnMessage(handler) {
        this.onMessageHandler = handler;
    }
    setOnConnected(handler) {
        this.onConnectedHandler = handler;
    }
    setOnDisconnected(handler) {
        this.onDisconnectedHandler = handler;
    }
    get isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
    // --- Private helpers ---
    startPing() {
        this.stopPing();
        this.pingTimer = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.ping();
            }
        }, 30_000);
    }
    stopPing() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    }
    cleanup() {
        this.stopPing();
        this.ws = null;
    }
    scheduleReconnect() {
        console.log(`[CloudConnector] Reconnecting in ${this.reconnectDelay / 1000}s ...`);
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, this.reconnectDelay);
        // Exponential backoff: 1s -> 2s -> 4s -> ... -> 300s max
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }
}

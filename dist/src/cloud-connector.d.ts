import type { ClawTileChannelConfig, Frame } from "./types.js";
export declare class CloudConnector {
    private ws;
    private config;
    private reconnectDelay;
    private maxReconnectDelay;
    private reconnectTimer;
    private pingTimer;
    private intentionalClose;
    private onMessageHandler;
    private onConnectedHandler;
    private onDisconnectedHandler;
    constructor(config: ClawTileChannelConfig);
    /** Connect to the ClawTile cloud platform */
    connect(): void;
    /** Gracefully disconnect */
    disconnect(): void;
    /** Send a frame to the cloud platform. Returns true if sent. */
    send(frame: Frame): boolean;
    setOnMessage(handler: (frame: Frame) => void): void;
    setOnConnected(handler: () => void): void;
    setOnDisconnected(handler: () => void): void;
    get isConnected(): boolean;
    private startPing;
    private stopPing;
    private cleanup;
    private scheduleReconnect;
}

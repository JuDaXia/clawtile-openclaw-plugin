export type RequestFrame = {
    type: "req";
    id: string;
    method: string;
    params: Record<string, unknown>;
};
export type ResponseFrame = {
    type: "res";
    id: string;
    ok: boolean;
    payload: Record<string, unknown>;
};
export type EventFrame = {
    type: "event";
    event: string;
    payload: Record<string, unknown>;
};
export type Frame = RequestFrame | ResponseFrame | EventFrame;
export interface ClawTileChannelConfig {
    /** Whether the ClawTile channel is enabled */
    enabled?: boolean;
    /** WebSocket URL of the ClawTile cloud platform, e.g. ws://192.168.31.154:3000/ws/openclaw */
    cloudUrl: string;
    /** API key generated from the ClawTile web console, e.g. ct_key_xxxxx */
    apiKey: string;
}
export interface EinkDisplayFrame {
    v: 1;
    ts: number;
    mode: "full" | "partial";
    regions: EinkRegion[];
}
export interface EinkRegion {
    id: string;
    type: "text" | "list" | "kv";
    content: EinkTextContent | EinkListContent | EinkKvContent;
}
export interface EinkTextContent {
    text: string;
    size: 1 | 2 | 3;
    align?: "l" | "c" | "r";
}
export interface EinkListContent {
    items: Array<{
        t: string;
        done?: boolean;
    }>;
}
export interface EinkKvContent {
    pairs: Array<{
        k: string;
        v: string;
        icon?: string;
    }>;
}

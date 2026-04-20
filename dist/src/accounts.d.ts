import type { OpenClawConfig } from "openclaw/plugin-sdk/core";
import type { ClawTileChannelConfig } from "./types.js";
/** Resolved account representation for ClawTile. */
export type ResolvedClawTileAccount = {
    accountId: string;
    enabled: boolean;
    cloudUrl: string;
    apiKey: string;
    config: ClawTileChannelConfig;
};
/**
 * ClawTile only has a single account (the "default" account).
 * Multi-account is not supported since each OpenClaw instance connects
 * to one ClawTile cloud platform key.
 */
export declare function listClawTileAccountIds(cfg: OpenClawConfig): string[];
/** Resolve the single ClawTile account from the config. */
export declare function resolveClawTileAccount(params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
}): ResolvedClawTileAccount;

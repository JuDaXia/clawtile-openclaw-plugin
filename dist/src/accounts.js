import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/core";
/** Read the raw channels.clawtile config section from the OpenClaw config. */
function readClawTileConfig(cfg) {
    const channels = cfg.channels;
    if (!channels || typeof channels !== "object")
        return undefined;
    const section = channels.clawtile;
    if (!section || typeof section !== "object")
        return undefined;
    return section;
}
/**
 * ClawTile only has a single account (the "default" account).
 * Multi-account is not supported since each OpenClaw instance connects
 * to one ClawTile cloud platform key.
 */
export function listClawTileAccountIds(cfg) {
    const section = readClawTileConfig(cfg);
    if (!section)
        return [];
    return [DEFAULT_ACCOUNT_ID];
}
/** Resolve the single ClawTile account from the config. */
export function resolveClawTileAccount(params) {
    const section = readClawTileConfig(params.cfg);
    const config = section ?? { cloudUrl: "", apiKey: "" };
    return {
        accountId: DEFAULT_ACCOUNT_ID,
        enabled: config.enabled !== false,
        cloudUrl: (config.cloudUrl ?? "").trim(),
        apiKey: (config.apiKey ?? "").trim(),
        config,
    };
}

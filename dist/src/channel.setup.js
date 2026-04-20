import { clawTilePlugin } from "./channel.js";
/**
 * Setup-only plugin surface. Used by OpenClaw when registering the channel
 * in setup-only mode (e.g. during `openclaw setup`). Only exposes config,
 * meta, and setup adapters -- no gateway or outbound.
 */
export const clawTileSetupPlugin = {
    id: clawTilePlugin.id,
    meta: clawTilePlugin.meta,
    capabilities: clawTilePlugin.capabilities,
    config: clawTilePlugin.config,
    setup: clawTilePlugin.setup,
};

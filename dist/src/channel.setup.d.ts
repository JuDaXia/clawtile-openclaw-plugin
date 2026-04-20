import type { ChannelPlugin } from "openclaw/plugin-sdk/core";
import { type ResolvedClawTileAccount } from "./accounts.js";
/**
 * Setup-only plugin surface. Used by OpenClaw when registering the channel
 * in setup-only mode (e.g. during `openclaw setup`). Only exposes config,
 * meta, and setup adapters -- no gateway or outbound.
 */
export declare const clawTileSetupPlugin: ChannelPlugin<ResolvedClawTileAccount>;

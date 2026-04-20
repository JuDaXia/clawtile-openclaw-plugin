import type { OpenClawConfig } from "openclaw/plugin-sdk/core";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/core";
import type { ClawTileChannelConfig } from "./types.js";

/** Resolved account representation for ClawTile. */
export type ResolvedClawTileAccount = {
  accountId: string;
  enabled: boolean;
  cloudUrl: string;
  apiKey: string;
  config: ClawTileChannelConfig;
};

/** Read the raw channels.clawtile config section from the OpenClaw config. */
function readClawTileConfig(cfg: OpenClawConfig): ClawTileChannelConfig | undefined {
  const channels = cfg.channels as Record<string, unknown> | undefined;
  if (!channels || typeof channels !== "object") return undefined;
  const section = channels.clawtile;
  if (!section || typeof section !== "object") return undefined;
  return section as ClawTileChannelConfig;
}

/**
 * ClawTile only has a single account (the "default" account).
 * Multi-account is not supported since each OpenClaw instance connects
 * to one ClawTile cloud platform key.
 */
export function listClawTileAccountIds(cfg: OpenClawConfig): string[] {
  const section = readClawTileConfig(cfg);
  if (!section) return [];
  return [DEFAULT_ACCOUNT_ID];
}

/** Resolve the single ClawTile account from the config. */
export function resolveClawTileAccount(params: {
  cfg: OpenClawConfig;
  accountId?: string | null;
}): ResolvedClawTileAccount {
  const section = readClawTileConfig(params.cfg);
  const config: ClawTileChannelConfig = section ?? { cloudUrl: "", apiKey: "" };
  return {
    accountId: DEFAULT_ACCOUNT_ID,
    enabled: config.enabled !== false,
    cloudUrl: (config.cloudUrl ?? "").trim(),
    apiKey: (config.apiKey ?? "").trim(),
    config,
  };
}

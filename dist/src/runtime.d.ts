import type { PluginRuntime } from "openclaw/plugin-sdk/core";
declare const setClawTileRuntime: (next: PluginRuntime) => void, clearClawTileRuntime: () => void, getClawTileRuntime: () => PluginRuntime;
export { clearClawTileRuntime, getClawTileRuntime, setClawTileRuntime };

import type { PluginRuntime } from "openclaw/plugin-sdk/core";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

const {
  setRuntime: setClawTileRuntime,
  clearRuntime: clearClawTileRuntime,
  getRuntime: getClawTileRuntime,
} = createPluginRuntimeStore<PluginRuntime>("ClawTile runtime not initialized");

export { clearClawTileRuntime, getClawTileRuntime, setClawTileRuntime };

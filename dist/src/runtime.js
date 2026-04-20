import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
const { setRuntime: setClawTileRuntime, clearRuntime: clearClawTileRuntime, getRuntime: getClawTileRuntime, } = createPluginRuntimeStore("ClawTile runtime not initialized");
export { clearClawTileRuntime, getClawTileRuntime, setClawTileRuntime };

import { defineSetupPluginEntry } from "openclaw/plugin-sdk/core";
import { clawTileSetupPlugin } from "./src/channel.setup.js";
export { clawTileSetupPlugin } from "./src/channel.setup.js";
export default defineSetupPluginEntry(clawTileSetupPlugin);

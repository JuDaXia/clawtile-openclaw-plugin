import type { ChannelPlugin } from "openclaw/plugin-sdk/core";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";
import { clawTilePlugin } from "./src/channel.js";
import { setClawTileRuntime } from "./src/runtime.js";

export { clawTilePlugin } from "./src/channel.js";
export { setClawTileRuntime } from "./src/runtime.js";

export default defineChannelPluginEntry({
  id: "clawtile",
  name: "ClawTile",
  description: "ClawTile e-ink device channel plugin",
  plugin: clawTilePlugin as ChannelPlugin,
  setRuntime: setClawTileRuntime,
});

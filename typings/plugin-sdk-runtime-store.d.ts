/**
 * Type stubs for openclaw/plugin-sdk/runtime-store.
 */

export type { PluginRuntime } from "openclaw/plugin-sdk/core";

export declare function createPluginRuntimeStore<T>(errorMessage: string): {
  setRuntime: (next: T) => void;
  clearRuntime: () => void;
  tryGetRuntime: () => T | null;
  getRuntime: () => T;
};

import { memory } from "./memory/memory.js";
import { file } from "./file/index.js";
import { sqlite } from "./sqlite/index.js";

const adapters = {
  memory,
  file,
  sqlite,
};

/**
 * Register a new custom adapter
 */
function registerAdapter(name, adapter) {
  if (!adapter || typeof adapter.createQueue !== "function") {
    throw new Error("Adapter must implement the required interface.");
  }
  adapters[name] = adapter;
}

/**
 * Get a registered adapter by name
 */
function getAdapter(name) {
  if (!adapters[name]) {
    throw new Error(`Adapter "${name}" not found. Did you register it?`);
  }
  return adapters[name];
}

export { adapters as queue, registerAdapter, getAdapter };

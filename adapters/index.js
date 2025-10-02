import { memory } from "./memory/memory.js";
import { file } from "./file/index.js";
import { sqlite } from "./sqlite/index.js";

export const queue = { memory, file, sqlite };

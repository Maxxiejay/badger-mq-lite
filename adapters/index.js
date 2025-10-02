import { memory } from "./memory/memory.js";
import { file } from "./file/index.js";
import { sqlite } from "./sqlite/index.js";


const queue = {
  memory,
  file,
  sqlite
}

export { queue }; 
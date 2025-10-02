import dotenv from "dotenv/config.js";
import { memory } from "./memory/memory.js";
import { file } from "./file/index.js";
import { sqlite } from "./sqlite/index.js";
const storageOption = process.env.STORAGE_OPTION;

let storage;
switch (storageOption) {
  case "memory":
    storage = memory;
    break;
  case "file":
    storage = file;
    break;
  case "sqlite":
    storage = sqlite;
    break;
}


export const getStorageOption = () => storageOption;
export { storage }; 
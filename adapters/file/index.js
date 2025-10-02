import { v4 as uuid } from "uuid";
import fs from "fs";
import path from "path";

const dataDir = path.resolve("./storage/file/queues");

// Ensure the data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Utility helpers
const queueFile = (name) => path.join(dataDir, `${name}.json`);

const loadQueue = (name) => {
  const filePath = queueFile(name);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
};

const saveQueue = (name, queue) => {
  fs.writeFileSync(queueFile(name), JSON.stringify(queue, null, 2));
};

// Simple ID generator
const generateId = () => uuid();

export const file = {
  createQueue: (name) => {
    if (!fs.existsSync(queueFile(name))) {
      saveQueue(name, []);
    }
  },

  listQueues: () => {
    return fs.readdirSync(dataDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => path.basename(f, ".json"));
  },

  deleteQueue: (name) => {
    const filePath = queueFile(name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  },

  sendMessage: (name, body) => {
    let queue = loadQueue(name);
    const message = { id: generateId(), body, acked: false };
    queue.push(message);
    saveQueue(name, queue);
    return message;
  },

  receiveMessage: (name) => {
    const queue = loadQueue(name);
    return queue.find((m) => !m.acked) || null;
  },

  ackMessage: (name, id) => {
    let queue = loadQueue(name);
    const msg = queue.find((m) => m.id === id);
    if (msg) {
      msg.acked = true;
      saveQueue(name, queue);
      return true;
    }
    return false;
  },

  getMessages: (name) => {
    return loadQueue(name);
  },
};

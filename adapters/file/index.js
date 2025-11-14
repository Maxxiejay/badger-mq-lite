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
    return fs
      .readdirSync(dataDir)
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

  purgeQueue: (name) => {
    let queue = loadQueue(name);
    const before = queue.length;

    // Keep only messages that are NOT acked
    queue = queue.filter((m) => !m.acked);

    saveQueue(name, queue);
    return queue.length !== before; // true if anything was removed
  },

  moveToDeadLetterQueue: (name, id) => {
    let queue = loadQueue(name);

    const index = queue.findIndex((m) => m.id === id);
    if (index === -1) return false;

    // Remove the message from the source queue
    const [msg] = queue.splice(index, 1);
    saveQueue(name, queue);

    // Load or create dead letter queue
    const deadQueueName = "dead_jobs";
    let deadQueue = loadQueue(deadQueueName);

    // Optionally annotate the message
    msg.queue = deadQueueName;

    deadQueue.push(msg);
    saveQueue(deadQueueName, deadQueue);

    return true;
  },

  getMessages: (name) => {
    return loadQueue(name);
  },
};

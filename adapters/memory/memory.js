import { v4 as uuid } from "uuid";

let queues = {};

// Utility to generate message IDs
function generateId() {
  return uuid();
}

export const memory = {
  // Create a new queue if it doesn’t exist
  createQueue: (name) => {
    if (!queues[name]) {
      queues[name] = [];
    }
  },

  // List all queues
  listQueues: () => {
    return Object.keys(queues);
  },

  // Delete a queue
  deleteQueue: (name) => {
    delete queues[name];
  },

  // Send (enqueue) a message
  sendMessage: (name, body) => {
    if (!queues[name]) this.createQueue(name);

    const message = { id: generateId(), body, acked: false };
    queues[name].push(message);
    return message;
  },

  // Receive the first unacked message
  receiveMessage: (name) => {
    if (!queues[name]) return null;
    return queues[name].find((m) => !m.acked) || null;
  },

  // Acknowledge (ack) a message by ID
  ackMessage: (name, id) => {
    if (!queues[name]) return false;

    const msg = queues[name].find((m) => m.id === id);
    if (msg) {
      msg.acked = true;
      return true;
    }
    return false;
  },

  // Handle failed jobs
  moveToDeadLetterQueue(name, id) {
    if (!this.queues[name]) return false;

    const index = this.queues[name].findIndex((msg) => msg.id === id);
    if (index === -1) return false;

    const [msg] = this.queues[name].splice(index, 1);

    // Ensure DLQ exists
    if (!this.queues["dead_jobs"]) {
      this.queues["dead_jobs"] = [];
    }

    msg.queue = "dead_jobs"; // optional: track new queue name
    this.queues["dead_jobs"].push(msg);

    return true;
  },

  purgeQueue(name) {
    if (!this.queues[name]) return false;

    const before = this.queues[name].length;

    // Keep only non-acked messages
    this.queues[name] = this.queues[name].filter((msg) => msg.acked !== 1);

    return this.queues[name].length !== before;
  },

  // Get all messages (for debugging / admin)
  getMessages: (name) => {
    return queues[name] || null;
  },
};

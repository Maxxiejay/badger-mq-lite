import { v4 as uuid } from "uuid";

let queues = {}

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
  receiveMessage : (name) => {
    if (!queues[name]) return null;
    return queues[name].find((m) => !m.acked) || null;
  },

  // Acknowledge (ack) a message by ID
  ackMessage : (name, id) => {
    if (!queues[name]) return false;

    const msg = queues[name].find((m) => m.id === id);
    if (msg) {
      msg.acked = true;
      return true;
    }
    return false;
  },

  // Get all messages (for debugging / admin)
  getMessages : (name) => {
    return queues[name] || null;
  }
}

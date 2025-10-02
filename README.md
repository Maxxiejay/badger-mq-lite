
# 📦 Badger MQ Lite

A lightweight, pluggable **message queue library for Node.js** with multiple storage adapters (`memory`, `file`, `sqlite`).

Useful for learning, prototyping, and small-scale applications where you want to implement background processing, task scheduling, or job queues without relying on heavy external brokers like RabbitMQ or Kafka.

---

## ✨ Features

* 🔌 **Multiple Adapters** – switch between `memory`, `file`, and `sqlite` storage
* 🛠 **Simple API** – create, list, delete queues and send/receive messages
* 💾 **Persistence** – use `file` or `sqlite` adapters for persistent storage
* 🚀 **Pluggable** – extend with your own storage adapter easily
* 🧪 Great for **learning queues** and testing queue-driven architectures

---

## 📦 Installation

```bash
npm install badger-mq-lite
```

For SQLite support, also install:

```bash
npm install sqlite sqlite3
```

---

## 🚀 Quick Start

### 1. Import the library

```js
import { queue } from "badger-mq-lite";
```

### 2. Select an adapter

You can choose one of:

* `queue.memory` → in-memory queue (volatile, cleared when process restarts)
* `queue.file` → file-based storage (persistent)
* `queue.sqlite` → SQLite database storage (persistent)

Example with SQLite:

```js
import { queue } from "badger-mq-lite";

const mq = queue.sqlite;

// Create a queue
await mq.createQueue("emailQueue");

// Send a message
await mq.sendMessage("emailQueue", { to: "user@example.com", subject: "Welcome!" });

// Receive messages
const messages = await mq.receiveMessages("emailQueue");

// Ack messages
const messages = await mq.ackMessage("emailQueue", "message-id");

// Get All Queue messages
const messages = await mq.ackMessage("emailQueue");

// Delete a queue
await mq.deleteQueue("emailQueue");
```

---

## 🔧 API Reference

### `createQueue(queueName: string): Promise<void>`

Creates a new queue with the given name.

### `listQueues(): Promise<string[] | object>`

Lists all existing queues.

* Memory/File → returns an array of queue names.
* SQLite → returns an object of queues.

### `deleteQueue(queueName: string): Promise<void>`

Deletes a queue and its messages.

### `sendMessage(queueName: string, body: any): Promise<void>`

Sends a message into the queue.
`body` can be any serializable object.

### `receiveMessages(queueName: string): Promise<any[]>`

Retrieves messages from the queue.

### `ackMessage(queueName: string, messageId: string): Promise<any[]>`

Acknowlege a message

---

## ⚙️ Adapters

### 1. Memory Adapter

* Fast, volatile
* Good for testing & dev

```js
const mq = queue.memory;
```

### 2. File Adapter

* Stores queues/messages in JSON files
* Persistent across restarts
* Great for small-scale persistence

```js
const mq = queue.file;
```

### 3. SQLite Adapter

* Stores queues/messages in SQLite database
* Best persistence option for production-like testing

```js
const mq = queue.sqlite;
```

---

## 🧩 Writing Your Own Adapter

Each adapter must implement these methods:

```js
{
  createQueue(queueName),
  listQueues(),
  deleteQueue(queueName),
  sendMessage(queueName, body),
  ackMessage(queueName, messageId),
  receiveMessage(queueName),
  getMessages(queueName),
  purgeQueue(queueName)
}
```

This makes it easy to add support for other databases like **MongoDB, PostgreSQL, Redis**.

---

## 💡 Use Cases

* Background job processing
* Task scheduling
* Worker queue for API requests
* Learning message queue patterns

---

## 📜 License

MIT © 2025 AmazingMax


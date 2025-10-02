
# 📘 Messaging Queue Service – Documentation

## 1. Overview

The **Messaging Queue Service** is a lightweight message broker built with **Node.js + Express**.
It allows producers to send messages to queues, and consumers to receive and acknowledge them asynchronously.

This system is useful for:

* Task scheduling
* Background job processing
* Decoupling services
* Learning message queue fundamentals

---

## 2. Features (MVP)

* Create named queues dynamically.
* Send messages to a queue.
* Receive messages from a queue.
* Acknowledge (ACK) messages after successful processing.
* In-memory storage (non-persistent).

---

## 3. Architecture

* **Producer** → sends messages via HTTP POST.
* **Queue Manager** → stores messages in-memory.
* **Consumer** → fetches messages via API, processes them, and ACKs.
* **Ack mechanism** → prevents re-processing of completed tasks.

---

## 4. Setup

### Requirements

* Node.js (v18+ recommended)
* npm (comes with Node)

### Installation

```bash
git clone <your-repo-url>
cd my-mq
npm install
```

### Start the Service

```bash
node index.js
```

The service runs at:

```
http://localhost:3000
```

---

## 5. API Reference

### 5.1 Create Queue

**Endpoint**

```
POST /queues/:name
```

**Description**
Creates a new queue with the given name.

**Request**

```http
POST /queues/jobs
```

**Response**

```json
{
  "message": "Queue 'jobs' created."
}
```

---

### 5.2 Send Message

**Endpoint**

```
POST /queues/:name/messages
```

**Description**
Sends a message to the specified queue.

**Request**

```http
POST /queues/jobs/messages
Content-Type: application/json

{
  "task": "send-email",
  "to": "user@example.com"
}
```

**Response**

```json
{
  "messageId": "5e9a2c7a-8c01-4c1a-9b2b-90c5a11e3a7e"
}
```

---

### 5.3 Receive Message

**Endpoint**

```
POST /queues/:name/receive
```

**Description**
Retrieves the next available message from the queue.
If no messages exist, returns `null`.

**Request**

```http
POST /queues/jobs/receive
```

**Response**

```json
{
  "id": "5e9a2c7a-8c01-4c1a-9b2b-90c5a11e3a7e",
  "body": {
    "task": "send-email",
    "to": "user@example.com"
  },
  "acked": false
}
```

If queue is empty:

```json
{ "message": null }
```

---

### 5.4 Acknowledge Message

**Endpoint**

```
POST /queues/:name/ack
```

**Description**
Acknowledges a message so it won’t be delivered again.

**Request**

```http
POST /queues/jobs/ack
Content-Type: application/json

{
  "messageId": "5e9a2c7a-8c01-4c1a-9b2b-90c5a11e3a7e"
}
```

**Response**

```json
{
  "status": "ACKED"
}
```

If not found:

```json
{
  "error": "Message not found"
}
```

---

## 6. Example Workflows

### Producer Workflow

1. Create a queue: `POST /queues/jobs`
2. Send tasks: `POST /queues/jobs/messages`

### Consumer Workflow

1. Poll messages: `POST /queues/jobs/receive`
2. Process message locally (e.g., send email).
3. Acknowledge success: `POST /queues/jobs/ack`

---

## 7. Error Handling

| Error             | Cause                    | Example Response                   |
| ----------------- | ------------------------ | ---------------------------------- |
| Queue not found   | Queue name doesn’t exist | `{ "error": "Queue not found" }`   |
| Message not found | Wrong messageId in ACK   | `{ "error": "Message not found" }` |
| Empty queue       | No messages to receive   | `{ "message": null }`              |

---

## 8. Limitations (Current MVP)

* **In-memory only** → messages are lost on server restart.
* **No visibility timeout** → if consumer crashes, unacked messages stay stuck.
* **Single-node only** → no clustering or scaling.
* **No DLQ (dead-letter queue)** → failed messages aren’t tracked.

---

## 9. Future Improvements

1. **Persistence** → Store messages in files (WAL), SQLite, or Redis.
2. **Visibility timeout** → Re-deliver unacked messages after X seconds.
3. **Dead-letter queues (DLQ)** → Move messages after max retries.
4. **Long polling / WebSockets** → Real-time message push.
5. **Multiple consumers** → Fair distribution & load balancing.
6. **Queue stats API** → Count messages, inflight, acked.
7. **Security** → Add authentication (API keys, JWT).
8. **Scalability** → Partition queues, support clustering.

---

## 10. Quick Test with cURL

```bash
# Create queue
curl -X POST http://localhost:3000/queues/jobs

# Send message
curl -X POST http://localhost:3000/queues/jobs/messages \
-H "Content-Type: application/json" \
-d '{"task":"send-email","to":"user@example.com"}'

# Receive message
curl -X POST http://localhost:3000/queues/jobs/receive

# Acknowledge message
curl -X POST http://localhost:3000/queues/jobs/ack \
-H "Content-Type: application/json" \
-d '{"messageId":"<id from receive>"}'
```

---

✅ With this documentation, you (or anyone else) can start using your message queue like a real service.

Do you want me to **expand this into a Markdown README file** format so you can drop it directly into your project?

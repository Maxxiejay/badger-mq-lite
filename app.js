import express from "express";
import bodyParser from "body-parser";
import { storage, getStorageOption } from "./storage/index.js";

console.log("Using storage option:", getStorageOption());

const app = express();
app.use(bodyParser.json());

// Create a queue
app.post("/queues/:name", (req, res) => {
  storage.createQueue(req.params.name);
  res.json({ success: true, message: `Queue '${req.params.name}' created.` });
});

// List queues
app.get("/queues", (req, res) => {
  res.json(storage.listQueues());
});

// Send message
app.post("/queues/:name/send", (req, res) => {
  const msg = storage.sendMessage(req.params.name, req.body);
  res.json(msg);
});

// Receive message
app.post("/queues/:name/receive", (req, res) => {
  const msg = storage.receiveMessage(req.params.name);
  if (!msg) return res.json({ message: null });
  res.json(msg);
});

// Acknowledge message
app.post("/queues/:name/ack/:id", (req, res) => {
  const success = storage.ackMessage(req.params.name, req.params.id);
  res.json({ success });
});

// Debug: get all messages in a queue
app.get("/queues/:name/messages", (req, res) => {
  const messages = storage.getMessages(req.params.name);
  if (!messages) return res.status(404).json({ error: "Queue not found" });
  res.json(messages);
});
app.listen(7185, () => console.log("Message queue running on port 7185"));

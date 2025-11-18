import fs from "fs";
import path from "path";

let db = null;

/**
 * Ensure the SQLite database is initialized before any operation.
 */
async function initDb() {
  if (db) return db; // already initialized

  let sqlite, sqlite3;
  try {
    sqlite = (await import("sqlite")).default || (await import("sqlite"));
    sqlite3 = (await import("sqlite3")).default || (await import("sqlite3"));
  } catch (e) {
    throw new Error(
      "SQLite adapter selected, but `sqlite` and `sqlite3` are not installed. Please run `npm install sqlite sqlite3`."
    );
  }

  // Ensure storage folder exists
  const storageDir = path.resolve("./storage/sqlite");
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  // Open database
  const dbPath = path.join(storageDir, "queues.db");
  db = await sqlite.open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Create messages table if not exists
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      queue TEXT NOT NULL,
      body TEXT NOT NULL,
      acked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

export const sqlite = {
  // Create a new queue
  createQueue: async (name) => {
    await initDb();
    return { queue: name, created: true };
  },

  // List all queues
  listQueues: async () => {
    const db = await initDb();
    const rows = await db.all(`SELECT DISTINCT queue FROM messages`);
    return rows.map((r) => r.queue);
  },

  // Delete a queue
  deleteQueue: async (name) => {
    const db = await initDb();
    const result = await db.run(`DELETE FROM messages WHERE queue = ?`, [name]);
    return { queue: name, deleted: result.changes };
  },

  // Send message
  sendMessage: async (name, body) => {
    const db = await initDb();
    const result = await db.run(
      `INSERT INTO messages (queue, body, acked) VALUES (?, ?, 0)`,
      [name, JSON.stringify(body)]
    );
    const row = await db.get(`SELECT * FROM messages WHERE id = ?`, [
      result.lastID,
    ]);
    return { ...row, body: JSON.parse(row.body) };
  },

  // Receive first unacked message
  receiveMessage: async (name) => {
    const db = await initDb();
    const row = await db.get(
      `SELECT * FROM messages WHERE queue = ? AND acked = 0 ORDER BY id ASC LIMIT 1`,
      [name]
    );
    return row ? { ...row, body: JSON.parse(row.body) } : null;
  },

  // Acknowledge message
  ackMessage: async (name, id) => {
    const db = await initDb();
    const result = await db.run(
      `UPDATE messages SET acked = 1 WHERE queue = ? AND id = ?`,
      [name, id]
    );
    return result.changes > 0;
  },

  // Delete all acked messages
  purgeQueue: async (name) => {
    const db = await initDb();
    const result = await db.run(
      `DELETE FROM messages WHERE queue = ? AND acked = 1`,
      [name]
    );
    return result.changes > 0;
  },

  moveToDeadLetterQueue: async (name, id) => {
    const db = await initDb();
    const result = await db.run(
      `UPDATE messages SET queue = ? WHERE queue = ? AND id = ?`,
      ["dead_jobs", name, id]
    );
    return result.changes > 0;
  },

  // Get all messages
  getMessages: async (name) => {
    const db = await initDb();
    const rows = await db.all(`SELECT * FROM messages WHERE queue = ?`, [name]);
    return rows.map((r) => ({ ...r, body: JSON.parse(r.body) }));
  },
};

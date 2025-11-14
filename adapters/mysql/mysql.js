import { v4 as uuidv4 } from "uuid";

export function setConfig(config) {
  if (config.host) process.env.DB_HOST = config.host;
  if (config.user) process.env.DB_USER = config.user;
  if (config.password) process.env.DB_PASS = config.password;
  if (config.database) process.env.DB_NAME = config.database;
}

let mysql;
try {
  const mysqlModule = await import("mysql2/promise");
  mysql = mysqlModule.default || mysqlModule;
} catch (e) {
  throw new Error(
    "MySQL adapter selected, but `mysql2` is not installed. Please run `npm install mysql2`."
  );
}

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "queue_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Ensure table + index exists
async function init() {
  const createTable = `
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(36) PRIMARY KEY,        -- UUID for message ID
      queue VARCHAR(255) NOT NULL,
      body JSON NOT NULL,
      acked TINYINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  const createIndex = `
    CREATE INDEX IF NOT EXISTS idx_queue_acked_time 
    ON messages(queue, acked, created_at)
  `;

  const conn = await pool.getConnection();
  await conn.query(createTable);
  // MySQL before 8.0 doesn’t support IF NOT EXISTS on indexes
  try {
    await conn.query(createIndex);
  } catch (e) {
    if (!e.message.includes("Duplicate key name")) throw e;
  }
  conn.release();
}

await init();

export const mysqlAdapter = {
  // Create a new queue (logical only)
  async createQueue(name) {
    return { queue: name, created: true };
  },

  // List all queues
  async listQueues() {
    const [rows] = await pool.query(`SELECT DISTINCT queue FROM messages`);
    return rows.map(r => r.queue);
  },

  // Delete a queue
  async deleteQueue(name) {
    const [result] = await pool.query(`DELETE FROM messages WHERE queue = ?`, [name]);
    return { queue: name, deleted: result.affectedRows };
  },

  async purgeQueue(name){
    await pool.query(`DELETE FROM messages WHERE acked = 1`)
    return { queue: name, deleted: result.affectedRows }
  },

  // Send a message
  async sendMessage(name, body) {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO messages (id, queue, body, acked) VALUES (?, ?, ?, 0)`,
      [id, name, JSON.stringify(body)]
    );
    const [rows] = await pool.query(`SELECT * FROM messages WHERE id = ?`, [id]);
    return { ...rows[0], body: JSON.parse(rows[0].body) };
  },

  // Receive the first unacked message (oldest by time)
  async receiveMessage(name) {
    const [rows] = await pool.query(
      `SELECT * FROM messages 
       WHERE queue = ? AND acked = 0 
       ORDER BY created_at ASC 
       LIMIT 1`,
      [name]
    );
    return rows.length > 0 ? { ...rows[0], body: JSON.parse(rows[0].body) } : null;
  },

  // Explicitly acknowledge a message
  async ackMessage(name, id) {
    const [result] = await pool.query(
      `UPDATE messages SET acked = 1 WHERE queue = ? AND id = ?`,
      [name, id]
    );
    return result.affectedRows > 0;
  },

  // Delete acked messages
  async purgeQueue(name) {
    const [result] = await pool.query(`DELETE messages WHERE queue = ? AND acked = 1`, [name]);
    return result.affectedRows > 0;
  },

  // Handle failed jobs
  async moveToDeadLetterQueue(name, id){
    const [result] = await pool.query(
      `UPDATE messages SET queue = dead_jobs WHERE queue = ? AND id = ?`,
      [name, id]
    );
    return result.affectedRows > 0;
  },

  // Get all messages in a queue
  async getMessages(name) {
    const [rows] = await pool.query(
      `SELECT * FROM messages WHERE queue = ? ORDER BY created_at ASC`,
      [name]
    );
    return rows.map(r => ({ ...r, body: JSON.parse(r.body) }));
  }
};

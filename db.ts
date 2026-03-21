import { Database } from "bun:sqlite";

const db = new Database("whitelist.sqlite", { create: true });

db.run(`
  CREATE TABLE IF NOT EXISTS members (
    discord_id TEXT PRIMARY KEY,
    mc_username TEXT NOT NULL
  )
`);

export const saveMember = db.prepare(
  "INSERT OR REPLACE INTO members (discord_id, mc_username) VALUES (?, ?)",
);
export const getMember = db.prepare(
  "SELECT mc_username FROM members WHERE discord_id = ?",
);
export const deleteMember = db.prepare(
  "DELETE FROM members WHERE discord_id = ?",
);
export const getAllMembers = db.prepare("SELECT * FROM members");
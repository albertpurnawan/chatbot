// Simple JSON file DB for chat histories keyed by sessionId
import fs from 'fs';
import path from 'path';

const DB_FILE = process.env.DB_FILE || path.resolve(process.cwd(), 'chat-db.json');

let db = {};

export const loadDb = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      db = {};
      return;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    if (parsed && typeof parsed === 'object') {
      db = parsed;
    } else {
      db = {};
    }
  } catch (e) {
    console.warn('[server] Failed to load DB:', e);
    db = {};
  }
};

export const saveDb = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.warn('[server] Failed to save DB:', e);
  }
};

export const getSession = (sessionId) => {
  if (!sessionId) return [];
  const val = db[sessionId];
  if (!Array.isArray(val)) return [];
  // Basic validation: ensure items have role/content
  return val.filter(m => m && typeof m.role === 'string' && typeof m.content === 'string');
};

export const setSession = (sessionId, messages) => {
  if (!sessionId || !Array.isArray(messages)) return;
  db[sessionId] = messages.map(m => ({ role: String(m.role), content: String(m.content ?? '') }));
  saveDb();
};


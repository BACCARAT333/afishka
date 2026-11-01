import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';

export type Db = Database.Database;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS venues (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  address   TEXT NOT NULL,
  city      TEXT NOT NULL,
  latitude  REAL,
  longitude REAL
);

CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  city        TEXT NOT NULL,
  category    TEXT NOT NULL,
  starts_at   TEXT NOT NULL,
  ends_at     TEXT,
  is_free     INTEGER NOT NULL,
  price       TEXT,
  image_url   TEXT,
  venue_id    TEXT REFERENCES venues(id),
  extra       TEXT NOT NULL DEFAULT '{}',
  cached_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_city_start ON events (city, starts_at);

CREATE TABLE IF NOT EXISTS sync_state (
  city      TEXT PRIMARY KEY,
  synced_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id   TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, event_id)
);
`;

/** Открывает базу SQLite и создаёт таблицы, если их ещё нет. Путь ':memory:' — база в памяти. */
export function openDatabase(path: string): Db {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new Database(path);
  db.pragma('foreign_keys = ON');
  if (path !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  db.exec(SCHEMA);
  return db;
}

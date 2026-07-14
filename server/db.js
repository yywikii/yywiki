import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'database.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS series (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT,
    status TEXT,
    rating INTEGER,
    tags TEXT,
    platform TEXT,
    progress TEXT,
    watched_at TEXT,
    review TEXT,
    series_id INTEGER,
    FOREIGN KEY (series_id) REFERENCES series (id)
  );

  CREATE TABLE IF NOT EXISTS studies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    color TEXT,
    category TEXT,
    description TEXT,
    target_date TEXT
  );

  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    done BOOLEAN DEFAULT 0,
    date TEXT NOT NULL,
    study_id INTEGER,
    FOREIGN KEY (study_id) REFERENCES studies (id)
  );

  CREATE TABLE IF NOT EXISTS budget (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    amount INTEGER NOT NULL,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS memo_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS memos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    group_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES memo_groups (id)
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT,
    color TEXT
  );
  CREATE TABLE IF NOT EXISTS content_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    relation_type TEXT NOT NULL,
    FOREIGN KEY (source_id) REFERENCES contents (id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES contents (id) ON DELETE CASCADE
  );
`);

try {
  db.exec('ALTER TABLE budget ADD COLUMN method TEXT;');
} catch (e) {
  // column already exists
}

try {
  db.exec('ALTER TABLE studies ADD COLUMN category TEXT;');
} catch (e) {}

try {
  db.exec('ALTER TABLE studies ADD COLUMN description TEXT;');
} catch (e) {}

try {
  db.exec('ALTER TABLE studies ADD COLUMN target_date TEXT;');
} catch (e) {}

try {
  db.exec('ALTER TABLE contents ADD COLUMN publication_status TEXT;');
} catch (e) {}

try {
  db.exec('ALTER TABLE contents ADD COLUMN release_year TEXT;');
} catch (e) {}

export default db;

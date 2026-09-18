const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'taskflow.db');
const db = new Database(dbPath);

// Enable foreign key constraints and high-performance WAL mode
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// Initialize database tables
function initDb() {
  // Categories Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#3b82f6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Tasks Table with Foreign Key connection to Categories
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category_id INTEGER,
      priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
      due_date TEXT,
      status TEXT CHECK(status IN ('pending', 'completed')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
  `);

  // Seed default categories if empty
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (categoryCount === 0) {
    const insertCat = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)');
    const defaultCategories = [
      ['Work', '#6366f1'],        // Indigo
      ['Personal', '#ec4899'],    // Pink
      ['Development', '#10b981'], // Emerald
      ['Urgent', '#ef4444']       // Red
    ];
    for (const [name, color] of defaultCategories) {
      insertCat.run(name, color);
    }
  }

  // Seed default tasks if empty
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
  if (taskCount === 0) {
    const devCat = db.prepare('SELECT id FROM categories WHERE name = ?').get('Development');
    const workCat = db.prepare('SELECT id FROM categories WHERE name = ?').get('Work');
    const urgentCat = db.prepare('SELECT id FROM categories WHERE name = ?').get('Urgent');

    const insertTask = db.prepare(`
      INSERT INTO tasks (title, description, category_id, priority, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertTask.run(
      'Optimize SQLite Query Performance',
      'Add composite indexes and measure response latency across API endpoints.',
      devCat ? devCat.id : null,
      'High',
      new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      'pending'
    );

    insertTask.run(
      'Design TaskFlow Modern UI Components',
      'Implement glassmorphism styling, responsive sidebar drawer, and priority pills.',
      workCat ? workCat.id : null,
      'Medium',
      new Date(Date.now() + 86400000).toISOString().split('T')[0],
      'completed'
    );

    insertTask.run(
      'Refactor API Endpoint Route Handlers',
      'Ensure parameterized queries prevent SQL injection and return clean metadata.',
      urgentCat ? urgentCat.id : null,
      'High',
      new Date().toISOString().split('T')[0],
      'pending'
    );
  }
}

initDb();

module.exports = db;

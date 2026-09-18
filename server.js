const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Pre-compiled prepared statements for optimal performance
const stmts = {
  getCategories: db.prepare(`
    SELECT c.*, COUNT(t.id) AS task_count 
    FROM categories c 
    LEFT JOIN tasks t ON c.id = t.category_id 
    GROUP BY c.id 
    ORDER BY c.name ASC
  `),
  insertCategory: db.prepare(`INSERT INTO categories (name, color) VALUES (?, ?)`),
  getCategoryById: db.prepare(`SELECT * FROM categories WHERE id = ?`),
  getTaskById: db.prepare(`
    SELECT t.*, c.name AS category_name, c.color AS category_color 
    FROM tasks t 
    LEFT JOIN categories c ON t.category_id = c.id 
    WHERE t.id = ?
  `),
  getTaskRaw: db.prepare(`SELECT * FROM tasks WHERE id = ?`),
  insertTask: db.prepare(`
    INSERT INTO tasks (title, description, category_id, priority, due_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  updateTask: db.prepare(`
    UPDATE tasks 
    SET title = ?, description = ?, category_id = ?, priority = ?, due_date = ?, status = ?
    WHERE id = ?
  `),
  deleteTask: db.prepare(`DELETE FROM tasks WHERE id = ?`),
  getStats: db.prepare(`
    SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed 
    FROM tasks
  `)
};

// GET /api/categories
app.get('/api/categories', (req, res) => {
  try {
    res.json({ data: stmts.getCategories.all() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/categories
app.post('/api/categories', (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const catColor = color || '#4f46e5';
    const info = stmts.insertCategory.run(name.trim(), catColor);
    const newCategory = stmts.getCategoryById.get(info.lastInsertRowid);
    res.status(201).json({ data: newCategory });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/tasks
app.get('/api/tasks', (req, res) => {
  try {
    const { search, priority, category_id, status } = req.query;
    
    let sql = `
      SELECT t.*, c.name AS category_name, c.color AS category_color 
      FROM tasks t 
      LEFT JOIN categories c ON t.category_id = c.id
    `;
    
    const conditions = [];
    const params = [];

    if (search && search.trim() !== '') {
      conditions.push(`(t.title LIKE ? OR t.description LIKE ?)`);
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    if (priority && priority !== 'All') {
      conditions.push(`t.priority = ?`);
      params.push(priority);
    }

    if (category_id && category_id !== 'All') {
      conditions.push(`t.category_id = ?`);
      params.push(Number(category_id));
    }

    if (status && status !== 'All') {
      conditions.push(`t.status = ?`);
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }

    sql += ` ORDER BY CASE t.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 END, t.created_at DESC`;

    const tasks = db.prepare(sql).all(...params);
    const stats = stmts.getStats.get();

    res.json({
      data: tasks,
      stats: {
        total: stats.total || 0,
        completed: stats.completed || 0,
        pending: (stats.total || 0) - (stats.completed || 0)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:id
app.get('/api/tasks/:id', (req, res) => {
  try {
    const task = stmts.getTaskById.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ data: task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
app.post('/api/tasks', (req, res) => {
  try {
    const { title, description, category_id, priority, due_date, status } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const info = stmts.insertTask.run(
      title.trim(),
      description ? description.trim() : null,
      category_id ? Number(category_id) : null,
      priority || 'Medium',
      due_date || null,
      status || 'pending'
    );

    const createdTask = stmts.getTaskById.get(info.lastInsertRowid);
    res.status(201).json({ data: createdTask });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/tasks/:id
app.put('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = stmts.getTaskRaw.get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const title = req.body.title !== undefined ? req.body.title.trim() : existing.title;
    const description = req.body.description !== undefined ? req.body.description : existing.description;
    const category_id = req.body.category_id !== undefined ? (req.body.category_id ? Number(req.body.category_id) : null) : existing.category_id;
    const priority = req.body.priority !== undefined ? req.body.priority : existing.priority;
    const due_date = req.body.due_date !== undefined ? req.body.due_date : existing.due_date;
    const status = req.body.status !== undefined ? req.body.status : existing.status;

    stmts.updateTask.run(title, description, category_id, priority, due_date, status, id);
    const updatedTask = stmts.getTaskById.get(id);

    res.json({ data: updatedTask });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const info = stmts.deleteTask.run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ data: { id: Number(id) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`TaskFlow Server running on http://localhost:${PORT}`);
});

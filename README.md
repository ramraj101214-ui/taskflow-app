# TaskFlow - Task Manager Web Application

A modern, fast, and responsive full-stack Task Management web application built with **Node.js**, **Express**, **SQLite (better-sqlite3)**, and vanilla **HTML/CSS/JavaScript**.

---

## 🚀 Features

- **Task Management**: Create, edit, delete, and mark tasks as pending or completed.
- **Categories & Tags**: Organize tasks under customizable categories with distinctive color indicators.
- **Priority & Due Dates**: Assign priorities (`Low`, `Medium`, `High`) and set due dates for tasks.
- **Search & Filtering**: Real-time task filtering by status, category, priority, and text search.
- **Statistics Dashboard**: Visual summary of total, pending, and completed tasks with completion rate indicators.
- **Responsive & Modern UI**: Dark-themed, glassmorphic UI with smooth animations and responsive mobile-friendly layouts.
- **Fast & Reliable Storage**: Persistent local database using SQLite in WAL mode with indexed lookups.

---

## 🛠️ Tech Stack & Technologies Used

### **Backend**
- **[Node.js](https://nodejs.org/)**: JavaScript runtime environment.
- **[Express.js](https://expressjs.com/)**: Fast, unopinionated web framework for Node.js to handle RESTful API endpoints and static file serving.
- **[better-sqlite3](https://github.com/WiseLibs/better-sqlite3)**: Fast and synchronous SQLite3 library for Node.js.
- **[cors](https://www.npmjs.com/package/cors)**: Middleware for handling Cross-Origin Resource Sharing.

### **Frontend**
- **HTML5**: Semantic web markup.
- **CSS3**: Modern styling with custom CSS variables, flexbox, grid, glassmorphism, and animations.
- **Vanilla JavaScript (ES6+)**: Dynamic DOM manipulation, asynchronous Fetch API requests, modal controls, and state management without external heavy frameworks.
- **[Lucide Icons](https://lucide.dev/) / Font Awesome / Google Fonts**: Clean iconography and typography.

### **Database**
- **SQLite (`taskflow.db`)**:
  - `categories` table (id, name, color, created_at)
  - `tasks` table (id, title, description, category_id, priority, due_date, status, created_at)
  - Configured with WAL (`Write-Ahead Logging`) mode, foreign key enforcement, and indexed queries.

---

## 📂 Project Structure

```text
task-manager/
├── db/
│   ├── database.js       # SQLite connection, schema initialization & seed data
│   └── taskflow.db       # SQLite database file (auto-generated)
├── public/
│   ├── app.js            # Frontend JavaScript (API calls, UI interactions & filtering)
│   ├── index.html        # Main dashboard interface
│   └── styles.css        # Custom CSS styling & themes
├── package.json          # Project metadata and dependencies
├── server.js             # Express server and REST API routes
└── README.md             # Project documentation
```

---

## ⚙️ How It Works / How It's Made

1. **Database Layer (`db/database.js`)**:
   - Initializes a SQLite database instance.
   - Automatically runs `CREATE TABLE IF NOT EXISTS` for `categories` and `tasks`.
   - Seeds initial default categories (`Work`, `Personal`, `Development`, `Urgent`) and sample tasks on first launch.

2. **REST API (`server.js`)**:
   - Serves the frontend static files from the `public/` directory.
   - Exposes RESTful endpoints:
     - `GET /api/tasks` - Fetch all tasks (supports query parameters: `status`, `category_id`, `priority`, `search`, `sort`)
     - `POST /api/tasks` - Create a new task
     - `PUT /api/tasks/:id` - Update task details or toggle status
     - `DELETE /api/tasks/:id` - Remove a task
     - `GET /api/categories` - Fetch all categories with task counts
     - `POST /api/categories` - Create a new category
     - `GET /api/stats` - Fetch overall task statistics

3. **Client-Side Application (`public/app.js`)**:
   - Uses the Fetch API to communicate asynchronously with backend endpoints.
   - Dynamically renders task cards, categories, statistics counters, and modal forms.
   - Handles real-time search inputs and filter changes seamlessly.

---

## 📦 Getting Started & Installation

### 1. Prerequisites
Make sure you have **Node.js** (v16 or higher) installed on your machine.

### 2. Installation
Open your terminal in the project directory and run:

```bash
npm install
```

### 3. Running the Application
Start the Node.js server:

```bash
node server.js
```

### 4. Access the App
Open your web browser and navigate to:
```text
http://localhost:3000
```

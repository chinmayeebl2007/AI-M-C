const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'riskintel.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        date TEXT,
        transcript TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        owner TEXT,
        risk_score INTEGER,
        status TEXT,
        meeting_id INTEGER,
        created_at TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT,
        meeting_id INTEGER,
        created_at TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS team (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        reliability INTEGER,
        tasks_completed INTEGER
    )`);

    console.log('✅ Database initialized');
});

module.exports = db;
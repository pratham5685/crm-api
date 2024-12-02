// config/db.js
const mysql = require('mysql2');

// Create a connection pool
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',       // Use your MySQL username (default is 'root' in XAMPP)
  password: '',       // Leave this blank if you haven’t set a MySQL password
  database: 'workflow_system'
});

// Export the connection pool
module.exports = db;

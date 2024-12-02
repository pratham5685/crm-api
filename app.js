// app.js
const express = require('express');
const bodyParser = require('body-parser');
const workflowRoutes = require('./routes/workflow');
const leadRoutes = require('./routes/leadRoutes.js'); // Import the lead router
const db = require('./config/db'); 
const app = express();

// Middleware to parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set view engine to EJS
app.set('view engine', 'ejs');


// Route to render index page and fetch existing workflows
app.get('/', (req, res) => {
    db.query('SELECT * FROM workflows', (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching workflows' });
        }
        res.render('index', { workflows: results }); // Pass workflows to the view
    });
});


// Route to render the workflow details page
app.get('/workflow/:id', (req, res) => {
    const workflowId = req.params.id;
    
    db.query('SELECT * FROM workflows WHERE id = ?', [workflowId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: 'Workflow not found' });
        }
        const workflow = results[0];
        res.render('workflowDetails', { workflow }); // Pass the specific workflow data to the view
    });
});


// Use the lead routes for '/leads' endpoint
app.use('/leads', leadRoutes);

// Use the workflow routes
app.use('/api/workflow', workflowRoutes);

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

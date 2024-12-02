// routes/leads.js
const express = require('express');
const router = express.Router();
const workflowModel = require('../models/workflowModel');
const db = require('../config/db');  // Assuming db.js is in the config directory

// Route to display all leads
router.get('/', (req, res) => {
    const query = 'SELECT * FROM lead_info'; // Query to get all leads from the lead_info table

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching leads:', err);
            return res.status(500).json({ message: 'Error fetching leads' });
        }

        // Render the 'leads-list' view and pass the leads data
        res.render('leads-list', { leads: results });
    });
});


// Route to view lead details
router.get('/view/:user_id', (req, res) => {
    const userId = req.params.user_id;  // Get the user_id from the route parameter

    // Query to join all relevant tables and fetch lead data for the given user_id
    const query = `
        SELECT 
            li.*, 
            cd.*, 
            ce.*, 
            er.*, 
            pi.* 
        FROM lead_info li
        LEFT JOIN company_details cd ON li.user_id = cd.user_id
        LEFT JOIN courses_enrolled ce ON li.user_id = ce.user_id
        LEFT JOIN event_registration er ON li.user_id = er.user_id
        LEFT JOIN personal_info pi ON li.user_id = pi.user_id
        WHERE li.user_id = ?;
    `;

    // Execute the query
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error fetching lead data');
        }

        if (results.length === 0) {
            return res.status(404).send('Lead not found');
        }

        // Since we're joining multiple tables, we can access all the fields in the results
        const lead = results[0]; // Since user_id is unique, we expect only one result

        // Render the viewlead.ejs page with the lead data
        res.render('viewlead', { lead });
    });
});


module.exports = router;

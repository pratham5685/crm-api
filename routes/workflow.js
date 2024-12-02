// routes/workflow.js
const express = require('express');
const router = express.Router();
const workflowModel = require('../models/workflowModel');

const db = require('../config/db'); // Import your database connection














// Function to generate a random alphanumeric ID
function generateRandomId(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

// Route to create a new workflow
router.post('/create', (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Workflow name is required' });
    }

    const workflowId = generateRandomId(50);
    workflowModel.createWorkflow(workflowId, name, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        workflowModel.createWorkflowTable(name, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error creating workflow table' });
            }

            res.status(201).json({
                message: 'Workflow created successfully',
                workflowId: workflowId
            });
        });
    });
});

// Route to rename a workflow
router.post('/:id/rename', (req, res) => {
    const workflowId = req.params.id;
    const { newName } = req.body;

    if (!newName) {
        return res.status(400).json({ error: 'New workflow name is required' });
    }

    workflowModel.renameWorkflow(workflowId, newName, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error renaming workflow' });
        }

        res.json({ message: 'Workflow renamed successfully' });
    });
});

// Route to delete a workflow
router.delete('/:id/delete', (req, res) => {
    const workflowId = req.params.id;

    workflowModel.deleteWorkflow(workflowId, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error deleting workflow' });
        }

        res.json({ message: 'Workflow deleted successfully' });
    });
});











// Route to generate a dynamic API URL for a workflow
router.post('/:id/generate', (req, res) => {
    const workflowId = req.params.id;
    const apiUrl = `http://localhost:3000/api/workflow/${workflowId}/submit`;

    res.json({
        message: 'API generated successfully',
        apiUrl: apiUrl
    });
});



router.post('/:id/submit', (req, res) => {
    const workflowId = req.params.id;  // Get workflow ID from URL
    const formData = req.body;         // Get form data from the request body

    // Step 1: Fetch the table name for the given workflow ID (dynamic table selection)
    workflowModel.getSelectedTableName(workflowId, (err, tableName) => {
        if (err) {
            return res.status(500).json({ error: 'Error retrieving table name for workflow' });
        }

        if (!tableName) {
            return res.status(400).json({ error: 'No table selected for this workflow' });
        }

        // Step 2: Check if the table is 'lead_info' or another table
        if (tableName === 'lead_info') {
            // Generate a unique 4-digit user_id for lead_info
            const generateUserId = () => {
                return Math.floor(1000 + Math.random() * 9000); // Generates a 4-digit number
            };
            const userId = generateUserId();  // Generate the 4-digit user_id

            // Add user_id to formData
            formData.user_id = userId;

            // Step 3: Insert the form data into the lead_info table
            const query = `
                INSERT INTO lead_info (user_id, first_name, last_name, email, phone_number)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(query, [userId, formData.first_name, formData.last_name, formData.email, formData.phone_number], (err, result) => {
                if (err) {
                    console.error('Error saving form data:', err);
                    return res.status(500).json({ error: 'Error saving form data to the table' });
                }

                // Return success response
                res.status(201).json({ message: 'Form data submitted and saved successfully', userId });
            });

        } else {
            // For other selected tables (not 'lead_info')
            // Step 4: Dynamically generate the INSERT query for the selected table
            const columns = Object.keys(formData).join(', ');  // Column names (keys of formData)
            const values = Object.values(formData).map(value => `'${value}'`).join(', '); // Formatted values

            const insertQuery = `INSERT INTO ${tableName} (${columns}) VALUES (${values})`; // SQL query

            // Step 5: Execute the query to insert data into the selected table
            db.query(insertQuery, (err, result) => {
                if (err) {
                    console.error('Error saving form data:', err);
                    return res.status(500).json({ error: 'Error saving form data to the table' });
                }

                // Return success response
                res.status(201).json({ message: 'Form data submitted and saved successfully' });
            });
        }
    });
});



























// Route to fetch form data for a specific workflow
router.get('/:id/data', (req, res) => {
    const workflowId = req.params.id;

    workflowModel.getWorkflowName(workflowId, (err, workflowName) => {
        if (err) {
            return res.status(500).json({ error: 'Error retrieving workflow name' });
        }

        workflowModel.getFormData(workflowName, (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Error retrieving form data' });
            }

            res.json({ formData: results });
        });
    });
});






// Route to fetch list of tables from the database (workflow_system)
router.get('/:id/tables', (req, res) => {
    // Get the workflow ID from the URL
    const workflowId = req.params.id;

    // Query the database to fetch the list of tables in the workflow_system database
    db.query("SHOW TABLES IN workflow_system", (err, tables) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching table names' });
        }

        // Return the list of tables
        res.json({ tables: tables.map(table => table['Tables_in_workflow_system']) });
    });
});

// Route to handle saving the selected table name in the workflow table
router.post('/:id/setTable', (req, res) => {
    const workflowId = req.params.id; // Get the workflow ID from the URL
    const { tableName } = req.body; // Get the table name from the request body

    if (!tableName) {
        return res.status(400).json({ error: 'Table name is required' });
    }

    // Update the workflow table with the selected table name
    db.query('UPDATE workflows SET table_name = ? WHERE id = ?', [tableName, workflowId], (err, result) => {
        if (err) {
            console.error('Error updating table name:', err);
            return res.status(500).json({ error: 'Error saving table name' });
        }

        // Check if the row was updated
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Workflow not found' });
        }

        res.json({ message: 'Table name saved successfully' });
    });
});




// Route to get the selected table for a workflow
router.get('/:id/selected-table', (req, res) => {
    const workflowId = req.params.id;

    // Query to fetch the selected table name for the given workflow ID
    const query = `SELECT table_name FROM workflows WHERE id = ?`;

    db.query(query, [workflowId], (err, result) => {
        if (err) {
            console.error('Error fetching selected table:', err);
            return res.status(500).json({ error: 'Error fetching selected table' });
        }

        if (result.length === 0) {
            console.log('Workflow not found or no table selected');
            return res.status(404).json({ message: 'Workflow not found or table not selected' });
        }

        // Return the selected table name if found
        const tableName = result[0].table_name;
        res.json({ tableName: tableName || 'No table selected' });
    });
});




module.exports = router;

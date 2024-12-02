// models/workflowModel.js
const db = require('../config/db');

const workflowModel = {
    // Function to create a workflow in the 'workflows' table
    createWorkflow: (id, name, callback) => {
        const query = 'INSERT INTO workflows (id, name) VALUES (?, ?)';
        db.query(query, [id, name], callback);
    },

    // Function to dynamically create a table for storing form submissions
    createWorkflowTable: (workflowName, callback) => {
        const tableName = `workflow_${workflowName.replace(/\s+/g, '_').toLowerCase()}_data`; // Name of the dynamic table
        const query = `
            CREATE TABLE IF NOT EXISTS ${tableName} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                form_data JSON NOT NULL,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        db.query(query, callback);
    },

    // Function to save form data to the dynamically created table
    saveFormData: (workflowName, formData, callback) => {
        const tableName = `workflow_${workflowName.replace(/\s+/g, '_').toLowerCase()}_data`; // Name of the dynamic table
        const query = `INSERT INTO ${tableName} (form_data) VALUES (?);`;
        db.query(query, [JSON.stringify(formData)], callback);
    },

    // Function to get form data from the dynamically created table
    getFormData: (workflowName, callback) => {
        const tableName = `workflow_${workflowName.replace(/\s+/g, '_').toLowerCase()}_data`; // Name of the dynamic table
        const query = `SELECT form_data FROM ${tableName};`;
        
        db.query(query, (err, results) => {
            if (err) {
                return callback(err);
            }
            // Parse JSON data from the database
            const parsedResults = results.map(row => JSON.parse(row.form_data));
            callback(null, parsedResults);
        });
    },

    // Function to get the workflow name by ID
    getWorkflowName: (id, callback) => {
        const query = 'SELECT name FROM workflows WHERE id = ?';
        db.query(query, [id], (err, results) => {
            if (err || results.length === 0) {
                return callback(err || new Error('Workflow not found'));
            }
            callback(null, results[0].name);
        });
    },


// Function to rename a workflow
renameWorkflow: (id, newName, callback) => {
    // Get the old name first
    workflowModel.getWorkflowName(id, (err, oldName) => {
        if (err) return callback(err);
        
        const updateQuery = 'UPDATE workflows SET name = ? WHERE id = ?';
        db.query(updateQuery, [newName, id], (err) => {
            if (err) return callback(err);

            // Rename the associated table
            const oldTableName = `workflow_${oldName.replace(/\s+/g, '_').toLowerCase()}_data`;
            const newTableName = `workflow_${newName.replace(/\s+/g, '_').toLowerCase()}_data`;
            const renameTableQuery = `RENAME TABLE ${oldTableName} TO ${newTableName}`;
            
            db.query(renameTableQuery, callback); // Call the callback after renaming the table
        });
    });
},
// Function to get all workflows from the 'workflows' table
getAllWorkflows: (callback) => {
    const query = 'SELECT * FROM workflows'; // Query to fetch all workflows
    db.query(query, callback);
},




getSelectedTableName(workflowId, callback) {
    // Query the workflows table to get the table_name for the given workflow ID
    const query = 'SELECT table_name FROM workflows WHERE id = ?';
    
    db.query(query, [workflowId], (err, result) => {
        if (err) {
            return callback(err);  // If there was an error with the query, pass the error to the callback
        }

        if (result.length === 0) {
            return callback(new Error('Workflow not found'));  // If no workflow is found
        }

        callback(null, result[0].table_name);  // If successful, pass the table name
    });
},










// Function to delete a workflow
deleteWorkflow: (id, callback) => {
    // Use the workflowModel directly instead of `this`
    workflowModel.getWorkflowName(id, (err, name) => {
        if (err) return callback(err); // Handle any errors

        const query = 'DELETE FROM workflows WHERE id = ?';
        db.query(query, [id], (err) => {
            if (err) return callback(err); // Handle any errors

            // Now that we have the name, we can safely create the table name
            const tableName = `workflow_${name.replace(/\s+/g, '_').toLowerCase()}_data`;
            const dropTableQuery = `DROP TABLE IF EXISTS ${tableName}`;
            db.query(dropTableQuery, callback); // Call the callback after dropping the table
        });
    });
},


};

module.exports = workflowModel;

const express = require('express');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint to log step data
app.post('/api/steps', (req, res) => {
  const { step_number, action, status } = req.body;
  if (step_number === undefined || !action || !status) {
    return res.status(400.json({ error: 'Missing required fields: step_number, action, status' });
  }

  const query = `INSERT INTO steps (step_number, action, status) VALUES (?, ?, ?)`;
  db.run(query, [step_number, action, status], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      step_number,
      action,
      status
    });
  });
});

// Endpoint to fetch all step data
app.get('/api/steps', (req, res) => {
  const query = `SELECT * FROM steps ORDER BY timestamp DESC`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      steps: rows
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

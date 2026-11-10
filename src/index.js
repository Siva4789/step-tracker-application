const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Get all steps
app.get('/api/steps', (req, res) => {
    db.all('SELECT * FROM steps ORDER BY date DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Create or update steps for a date
app.post('/api/steps', (req, res) => {
    const { date, count } = req.body;
    if (!date || count === undefined) {
        res.status(400).json({ error: 'Date and count are required' });
        return;
    }

    const query = `
        INSERT INTO steps (date, count)
        VALUES (?, ?)
        ON CONFLICT(date) 
        DO UPDATE SET count = excluded.count
    `;

    db.run(query, [date, count], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, date, count });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

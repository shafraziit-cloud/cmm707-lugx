import express from 'express';
import cors from 'cors';
import pkg from 'pg';

const { Pool } = pkg;

// Database connection pool (update environment variables if needed)
const pool = new Pool({
  user: process.env.DB_USER || 'user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'lugx',
  password: process.env.DB_PASSWORD || 'pass',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

// Ensure table exists
async function createTableIfNotExists() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS games (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      category VARCHAR(50),
      release_date DATE,
      price NUMERIC(10,2)
    );
  `);
  console.log('Table "games" is ready');
}

const app = express();
app.use(cors());
app.use(express.json());

// CREATE
app.post('/games', async (req, res) => {
  const { name, category, release_date, price } = req.body;
  if (!name || !category || price == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO games (name, category, release_date, price) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, category, release_date, price]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('DB insert error:', err);
    res.status(500).json({ error: 'DB insert error' });
  }
});

// READ ALL
app.get('/games', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM games ORDER BY id ASC');

    // Check if user requested pretty format
    if (req.query.pretty === 'true') {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(result.rows, null, 2)); // pretty print
    } else {
      res.json(result.rows); // default compact
    }
  } catch (err) {
    console.error('DB fetch error:', err);
    res.status(500).json({ error: 'DB fetch error' });
  }
});

// READ ONE
app.get('/games/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM games WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('DB fetch error:', err);
    res.status(500).json({ error: 'DB fetch error' });
  }
});

// UPDATE
app.put('/games/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, release_date, price } = req.body;
  if (!name || !category || price == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const result = await pool.query(
      `UPDATE games
       SET name = $1, category = $2, release_date = $3, price = $4
       WHERE id = $5 RETURNING *`,
      [name, category, release_date, price, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('DB update error:', err);
    res.status(500).json({ error: 'DB update error' });
  }
});

// DELETE
app.delete('/games/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM games WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Game not found' });
    res.json({ message: 'Game deleted', game: result.rows[0] });
  } catch (err) {
    console.error('DB delete error:', err);
    res.status(500).json({ error: 'DB delete error' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await createTableIfNotExists();
  console.log(`Game Service listening on port ${PORT}`);
});

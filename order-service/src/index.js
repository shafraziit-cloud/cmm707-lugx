import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;

// const pool = new Pool({
//   user: 'user',
//   host: 'host.docker.internal',
//   database: 'lugx',
//   password: 'pass',
//   port: 5432,
// });

const pool = new Pool({
  user: process.env.DB_USER || 'user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'lugx',
  password: process.env.DB_PASSWORD || 'pass',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

async function createTableIfNotExists() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      items JSONB NOT NULL,
      total_price NUMERIC(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Table "orders" is ready');
}

const app = express();
app.use(express.json());

// CREATE ORDER
app.post('/orders', async (req, res) => {
  const { items, total_price } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO orders (items, total_price) VALUES ($1, $2) RETURNING *',
      [JSON.stringify(items), total_price]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('DB insert error');
  }
});

// GET ALL ORDERS
app.get('/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('DB fetch error');
  }
});

// GET ONE ORDER
app.get('/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).send('Order not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('DB fetch error');
  }
});

// DELETE ORDER
app.delete('/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).send('Order not found');
    res.json({ message: 'Order deleted', order: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send('DB delete error');
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  await createTableIfNotExists();
  console.log(`Order Service listening on port ${PORT}`);
});

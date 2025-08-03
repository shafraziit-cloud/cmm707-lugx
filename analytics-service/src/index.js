import express from 'express';
import { createClient } from '@clickhouse/client';
import cors from 'cors';

// const client = createClient({
//   host: 'http://host.docker.internal:8123'
// });

const client = createClient({
  host: process.env.CLICKHOUSE_HOST || 'http://localhost:8123'
});


async function createTableIfNotExists() {
  await client.query({
    query: `
      CREATE TABLE IF NOT EXISTS events (
        id UUID DEFAULT generateUUIDv4(),
        event_type String,
        page_url String,
        timestamp DateTime DEFAULT now()
      ) ENGINE = MergeTree()
      ORDER BY (timestamp)
    `
  });
  console.log('Table "events" is ready');
}

const app = express();
app.use(cors()); // Allow all origins (fixes localhost:8080 → localhost:5000 requests)
app.use(express.json());

// POST event
app.post('/analytics', async (req, res) => {
  const { event_type, page_url } = req.body;
  try {
    await client.insert({
      table: 'events',
      values: [{ event_type, page_url }],
      format: 'JSONEachRow'
    });
    res.status(201).send('Event recorded');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to insert event');
  }
});

// GET all events
app.get('/analytics', async (req, res) => {
  try {
    const resultSet = await client.query({ query: 'SELECT * FROM events' });
    const { data } = await resultSet.json();
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data, null, 2)); // Pretty print
    // res.json(data);   // returns only rows, not metadata
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch events');
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await createTableIfNotExists();
  console.log(`Analytics Service listening on port ${PORT}`);
});

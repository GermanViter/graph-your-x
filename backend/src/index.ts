import express from 'express';
import cors from 'cors';
import { getRoadmap } from './db.js';

const app = express();
const port = 8000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/roadmap/:topic', (req, res) => {
  const roadmap = getRoadmap(req.params.topic);
  if (!roadmap) {
    return res.status(404).json({ error: 'Roadmap not found' });
  }
  res.json(roadmap);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

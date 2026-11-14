import { db } from './db.js';

const concepts = [
  { id: 'machine-learning', label: 'Machine Learning', description: 'Study of algorithms that learn from data.', category: 'domain', difficulty: 4 },
  { id: 'linear-algebra', label: 'Linear Algebra', description: 'Study of vectors, matrices and linear transformations.', category: 'math', difficulty: 3 },
  { id: 'python', label: 'Python Programming', description: 'General-purpose programming language.', category: 'programming', difficulty: 1 },
  { id: 'statistics', label: 'Statistics', description: 'Collection, analysis, interpretation of data.', category: 'math', difficulty: 3 },
  { id: 'calculus', label: 'Calculus', description: 'Study of continuous change.', category: 'math', difficulty: 3 },
  { id: 'probability', label: 'Probability', description: 'Study of uncertainty.', category: 'math', difficulty: 2 },
  { id: 'data-manipulation', label: 'Data Manipulation', description: 'Cleaning and preparing data.', category: 'tools', difficulty: 2 },
  { id: 'machine-learning-basics', label: 'ML Basics', description: 'Introduction to supervised/unsupervised learning.', category: 'theory', difficulty: 3 },
  { id: 'scikit-learn', label: 'Scikit-Learn', description: 'ML library for Python.', category: 'tools', difficulty: 3 },
  { id: 'numpy', label: 'NumPy', description: 'Library for numerical computing.', category: 'tools', difficulty: 3 },
];

const prerequisites = [
  { concept_id: 'machine-learning', requires_id: 'machine-learning-basics', type: 'required' },
  { concept_id: 'machine-learning', requires_id: 'scikit-learn', type: 'required' },
  { concept_id: 'machine-learning-basics', requires_id: 'statistics', type: 'required' },
  { concept_id: 'machine-learning-basics', requires_id: 'probability', type: 'required' },
  { concept_id: 'machine-learning-basics', requires_id: 'calculus', type: 'recommended' },
  { concept_id: 'scikit-learn', requires_id: 'python', type: 'required' },
  { concept_id: 'scikit-learn', requires_id: 'numpy', type: 'required' },
  { concept_id: 'numpy', requires_id: 'linear-algebra', type: 'required' },
  { concept_id: 'numpy', requires_id: 'python', type: 'required' },
  { concept_id: 'data-manipulation', requires_id: 'python', type: 'required' },
  { concept_id: 'machine-learning-basics', requires_id: 'data-manipulation', type: 'required' },
];

const insertConcept = db.prepare(`
  INSERT OR IGNORE INTO concepts (id, label, description, category, difficulty)
  VALUES (?, ?, ?, ?, ?)
`);

const insertPrereq = db.prepare(`
  INSERT OR IGNORE INTO prerequisites (concept_id, requires_id, type)
  VALUES (?, ?, ?)
`);

const seed = db.transaction(() => {
  for (const c of concepts) {
    insertConcept.run(c.id, c.label, c.description, c.category, c.difficulty);
  }

  for (const p of prerequisites) {
    insertPrereq.run(p.concept_id, p.requires_id, p.type);
  }
});

seed();
console.log('Database seeded.');

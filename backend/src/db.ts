import Database from 'better-sqlite3';
import path from 'path';
import type { Roadmap, RoadmapNode, RoadmapEdge } from './types.js';

export const db = new Database(path.join(import.meta.dirname, '..', 'data.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS concepts (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('math', 'programming', 'theory', 'tools', 'domain')),
    difficulty INTEGER NOT NULL CHECK(difficulty BETWEEN 1 AND 5)
  );

  CREATE TABLE IF NOT EXISTS prerequisites (
    concept_id TEXT NOT NULL,
    requires_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('required', 'recommended')),
    PRIMARY KEY (concept_id, requires_id),
    FOREIGN KEY (concept_id) REFERENCES concepts(id),
    FOREIGN KEY (requires_id) REFERENCES concepts(id)
  );
`);

export function getRoadmap(goalId: string): Roadmap | null {
  const goal = db.prepare('SELECT * FROM concepts WHERE id = ?').get(goalId) as RoadmapNode | undefined;
  if (!goal) return null;

  const nodes = db.prepare(`
    WITH RECURSIVE roadmap_nodes(id) AS (
      SELECT ?
      UNION
      SELECT requires_id
      FROM prerequisites
      JOIN roadmap_nodes ON prerequisites.concept_id = roadmap_nodes.id
    )
    SELECT concepts.* FROM concepts
    JOIN roadmap_nodes ON concepts.id = roadmap_nodes.id
  `).all(goalId) as RoadmapNode[];

  const edges = db.prepare(`
    WITH RECURSIVE roadmap_nodes(id) AS (
      SELECT ?
      UNION
      SELECT requires_id
      FROM prerequisites
      JOIN roadmap_nodes ON prerequisites.concept_id = roadmap_nodes.id
    )
    SELECT prerequisites.concept_id as "to", prerequisites.requires_id as "from", prerequisites.type
    FROM prerequisites
    JOIN roadmap_nodes AS n1 ON prerequisites.concept_id = n1.id
    JOIN roadmap_nodes AS n2 ON prerequisites.requires_id = n2.id
  `).all(goalId) as { to: string, from: string, type: 'required' | 'recommended' }[];

  // Map edges to match the interface { from, to, type }
  const roadmapEdges: RoadmapEdge[] = edges.map(e => ({
      from: e.from,
      to: e.to,
      type: e.type
  }));

  return {
    goal: goalId,
    nodes,
    edges: roadmapEdges
  };
}

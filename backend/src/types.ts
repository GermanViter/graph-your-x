export interface RoadmapNode {
  id: string;
  label: string;
  category: 'math' | 'programming' | 'theory' | 'tools' | 'domain';
  difficulty: number;
  description: string;
}

export interface RoadmapEdge {
  from: string;
  to: string;
  type: 'required' | 'recommended';
}

export interface Roadmap {
  goal: string;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}

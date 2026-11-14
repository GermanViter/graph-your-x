export type Topic = { id: string; label: string };
export type RoadmapNode = {
    id: string;
    label: string;
    description: string;
    category: 'math' | 'programming' | 'theory' | 'tools' | 'domain';
    difficulty: number;
};
export type Roadmap = {
    goal: string;
    nodes: RoadmapNode[];
    edges: { from: string; to: string; type: 'required' | 'recommended' }[];
};

function record(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function id(value: unknown): value is string {
    return typeof value === 'string' && value.trim() === value && value.length > 0 && !/[:,\r\n]/.test(value);
}

export function parseTopics(data: unknown): Topic[] {
    if (!Array.isArray(data)) throw new Error('Expected a list of topics.');
    const seen = new Set<string>();
    return data.map((item) => {
        if (!record(item) || !id(item.id) || typeof item.label !== 'string' || !item.label.trim() || seen.has(item.id)) {
            throw new Error('Invalid or duplicate topic.');
        }
        seen.add(item.id);
        return { id: item.id, label: item.label };
    });
}

export function parseRoadmap(data: unknown, expectedGoal: string): Roadmap {
    if (!record(data) || data.goal !== expectedGoal || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
        throw new Error('Invalid roadmap response.');
    }
    const seen = new Set<string>();
    const nodes = data.nodes.map((item): RoadmapNode => {
        if (!record(item) || !id(item.id) || seen.has(item.id) || typeof item.label !== 'string' || !item.label.trim() ||
            typeof item.description !== 'string' || typeof item.category !== 'string' ||
            !['math', 'programming', 'theory', 'tools', 'domain'].includes(item.category) ||
            typeof item.difficulty !== 'number' || !Number.isInteger(item.difficulty) || item.difficulty < 1 || item.difficulty > 5) {
            throw new Error('Invalid roadmap node.');
        }
        seen.add(item.id);
        return { id: item.id, label: item.label, description: item.description,
            category: item.category as RoadmapNode['category'], difficulty: item.difficulty };
    });
    if (!seen.has(expectedGoal)) throw new Error('The roadmap is missing its goal.');
    const edges = data.edges.map((edge): Roadmap['edges'][number] => {
        if (!record(edge) || !id(edge.from) || !id(edge.to) || !seen.has(edge.from) || !seen.has(edge.to) ||
            edge.from === edge.to || (edge.type !== 'required' && edge.type !== 'recommended')) {
            throw new Error('Invalid roadmap connection.');
        }
        return { from: edge.from, to: edge.to, type: edge.type };
    });
    return { goal: expectedGoal, nodes, edges };
}

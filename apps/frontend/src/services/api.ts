import { parseRoadmap, parseTopics, type RoadmapNode } from './roadmap.ts';

export type CatalogCourse = {
    id: string;
    name?: string;
    prereqs: string[];
    description?: string;
    category?: RoadmapNode['category'];
    difficulty?: number;
    recommended?: string[];
    isTopic?: boolean;
};

function validId(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0 && !/[:,\r\n]/.test(value);
}

/** Load the catalog from the backend. There is no local-data fallback. */
export async function fetchCourses(signal?: AbortSignal): Promise<CatalogCourse[]> {
    // Retain compatibility with installations using the earlier course-array API.
    const endpoint = import.meta.env.VITE_COURSES_API_URL;
    if (endpoint) return fetchCoursesFromBackend(endpoint, signal);
    return fetchRoadmapCatalog(import.meta.env.VITE_API_BASE_URL || '/api', signal);
}

/** Optional legacy course-array endpoint; database access stays on the server. */
export async function fetchCoursesFromBackend(endpoint: string, signal?: AbortSignal): Promise<CatalogCourse[]> {
    const response = await fetch(endpoint, { signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Course request failed (${response.status}).`);
    const data: unknown = await response.json();
    return parseCatalog(data);
}

export function parseCatalog(data: unknown): CatalogCourse[] {
    if (!Array.isArray(data)) throw new Error('Expected a course array from the server.');
    const seen = new Set<string>();
    return data.map((item: unknown) => {
        if (!item || typeof item !== 'object') throw new Error('Invalid course data.');
        const course = item as Record<string, unknown>;
        if (!validId(course.id) || !Array.isArray(course.prereqs) ||
            !course.prereqs.every(validId) ||
            (course.name !== undefined && typeof course.name !== 'string')) {
            throw new Error('Invalid course data.');
        }
        const id = course.id.trim();
        if (seen.has(id)) throw new Error('Duplicate course IDs in the catalog.');
        seen.add(id);
        return { id, name: course.name as string | undefined, prereqs: course.prereqs.map((p: string) => p.trim()) };
    });
}


/** Adapt the backend's topics + node/edge roadmaps to the existing editor. */
export async function fetchRoadmapCatalog(baseUrl = '/api', signal?: AbortSignal): Promise<CatalogCourse[]> {
    const base = baseUrl.replace(/\/+$/, '');
    const timeout = AbortSignal.timeout(15000);
    const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
    async function getJson(url: string): Promise<unknown> {
        const response = await fetch(url, { signal: requestSignal, headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`Backend request failed (${response.status}).`);
        return response.json();
    }
    const topics = parseTopics(await getJson(`${base}/topics`));
    const roadmaps = await Promise.all(topics.map(async (topic) =>
        parseRoadmap(await getJson(`${base}/roadmap/${encodeURIComponent(topic.id)}`), topic.id)));
    const topicIds = new Set(topics.map((topic) => topic.id));
    const courses = new Map<string, CatalogCourse>();
    for (const roadmap of roadmaps) {
        for (const node of roadmap.nodes) {
            const previous = courses.get(node.id);
            if (previous) {
                if (previous.name !== node.label || previous.description !== node.description ||
                    previous.category !== node.category || previous.difficulty !== node.difficulty) {
                    throw new Error(`Conflicting backend data for ${node.id}.`);
                }
                continue;
            }
            courses.set(node.id, { id: node.id, name: node.label, description: node.description,
                category: node.category, difficulty: node.difficulty, prereqs: [], recommended: [], isTopic: topicIds.has(node.id) });
        }
        for (const edge of roadmap.edges) {
            const target = courses.get(edge.to)!;
            // API direction is prerequisite -> dependent. Optional edges never block readiness.
            const list = edge.type === 'required' ? target.prereqs : target.recommended!;
            if (!list.includes(edge.from)) list.push(edge.from);
        }
    }
    for (const course of courses.values()) {
        course.recommended = course.recommended!.filter((id) => !course.prereqs.includes(id));
    }
    return [...courses.values()];
}

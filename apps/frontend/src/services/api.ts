import templateCourses from '../../data.json';

export type CatalogCourse = {
    id: string;
    name?: string;
    prereqs: string[];
};

function validId(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0 && !/[:,\r\n]/.test(value);
}

/** Use the local template until a backend endpoint is configured. */
export async function fetchCourses(signal?: AbortSignal): Promise<CatalogCourse[]> {
    const endpoint = import.meta.env.VITE_COURSES_API_URL;
    if (!endpoint) return parseCatalog(templateCourses);
    return fetchCoursesFromBackend(endpoint, signal);
}

/** Future SQLite-backed HTTP API; no database access happens in the browser. */
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


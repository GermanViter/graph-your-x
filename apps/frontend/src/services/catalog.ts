import type { CatalogCourse } from './api.ts';

/** Append missing definitions, preserving existing text and manual prerequisite edits. */
export function addCatalogCourse(source: string, id: string, catalog: CatalogCourse[]): string {
    const defined = new Set(source.split('\n').map((line) => line.split(':')[0].trim()).filter(Boolean));
    const byId = new Map(catalog.map((course) => [course.id, course]));
    const visited = new Set<string>();
    const lines: string[] = [];
    function visit(courseId: string) {
        if (visited.has(courseId) || defined.has(courseId)) return;
        visited.add(courseId);
        const course = byId.get(courseId);
        course?.prereqs.forEach(visit);
        lines.push(`${courseId}: ${course?.prereqs.join(', ') ?? ''}`.trimEnd());
    }
    if (!byId.has(id)) return source;
    visit(id);
    if (!lines.length) return source;
    return source + (source && !source.endsWith('\n') ? '\n' : '') + lines.join('\n');
}

/** Remove a node and all incoming references so the parser cannot recreate it. */
export function removeCourse(source: string, id: string): string {
    return source.split('\n').flatMap((line) => {
        const [name, rest = ''] = line.split(':');
        if (name.trim() === id) return [];
        const prereqs = rest.split(',').map((part) => part.trim()).filter(Boolean);
        if (!prereqs.includes(id)) return [line];
        return [`${name}: ${prereqs.filter((prereq) => prereq !== id).join(', ')}`.trimEnd()];
    }).join('\n');
}

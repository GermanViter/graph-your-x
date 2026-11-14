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

/** Find the selected course and every course that transitively requires it. */
export function getDependentCourseIds(source: string, id: string): Set<string> {
    const dependents = new Map<string, Set<string>>();
    for (const line of source.split('\n')) {
        const [name, rest = ''] = line.split(':');
        const courseId = name.trim();
        if (!courseId) continue;
        for (const prereq of rest.split(',').map((part) => part.trim()).filter(Boolean)) {
            const children = dependents.get(prereq) ?? new Set<string>();
            children.add(courseId);
            dependents.set(prereq, children);
        }
    }

    const removed = new Set<string>();
    const pending = [id];
    while (pending.length > 0) {
        const current = pending.pop()!;
        if (removed.has(current)) continue;
        removed.add(current);
        for (const child of dependents.get(current) ?? []) pending.push(child);
    }
    return removed;
}

/** Remove dependent courses too; never rewrite a remaining course's requirements. */
export function removeCourse(source: string, id: string): string {
    const removed = getDependentCourseIds(source, id);
    return source.split('\n')
        .filter((line) => !removed.has(line.split(':')[0].trim()))
        .join('\n');
}

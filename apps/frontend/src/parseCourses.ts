import { COLUMN_GAP, GRAPH_PADDING, NODE_HEIGHT, ROW_PITCH } from './constants/constants.ts';
import type { Course, Status } from './types/types.ts';

/** Turn "Name: prereq, prereq" lines into positioned courses. */
type Metadata = Pick<Course, 'name' | 'description' | 'category' | 'difficulty' | 'recommended'>;
export function parseCourses(text: string, metadata: ReadonlyMap<string, Metadata> = new Map()): Course[] {
    const prereqMap = readLines(text);
    const depths = computeDepths(prereqMap);

    const courses: Course[] = [...prereqMap].map(([id, prereqs]) => ({
        ...metadata.get(id),
        id,
        prereqs,
        depth: depths.get(id) ?? 0,
        x: 0,
        y: 0,
        w: Math.max(116, (metadata.get(id)?.name ?? id).length * 7.4 + 28),
    }));

    layoutColumns(courses);
    return courses;
}

/** Read each line into a map of course -> prerequisites. Unknown prerequisites become courses too. */
function readLines(text: string): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const line of text.split("\n")) {
        if (!line.trim()) continue;
        const [name, rest = ""] = line.split(":");
        const id = name.trim();
        if (!id) continue;
        const prereqs = rest.split(",").map((s) => s.trim()).filter(Boolean);
        map.set(id, [...(map.get(id) ?? []), ...prereqs]);
        prereqs.forEach((p) => !map.has(p) && map.set(p, []));
    }
    return map;
}

/** Depth = length of the longest prerequisite path. Cycles are cut so they can't loop forever. */
function computeDepths(prereqMap: Map<string, string[]>): Map<string, number> {
    const depths = new Map<string, number>();
    const visit = (id: string, path: Set<string>): number => {
        if (depths.has(id)) return depths.get(id)!;
        if (path.has(id)) return 0;
        path.add(id);
        const parents = prereqMap.get(id) ?? [];
        const depth = Math.max(-1, ...parents.map((p) => visit(p, path))) + 1;
        path.delete(id);
        depths.set(id, depth);
        return depth;
    };
    prereqMap.forEach((_, id) => visit(id, new Set()));
    return depths;
}

/** Place courses in columns by depth, stacking each column top to bottom. */
function layoutColumns(courses: Course[]) {
    const columnCount = Math.max(0, ...courses.map((c) => c.depth)) + 1;
    let x = GRAPH_PADDING;
    for (let col = 0; col < columnCount; col++) {
        const inColumn = courses.filter((c) => c.depth === col);
        const colWidth = Math.max(0, ...inColumn.map((c) => c.w));
        inColumn.forEach((c, row) => {
            c.x = x;
            c.y = GRAPH_PADDING + row * ROW_PITCH;
            c.w = colWidth;
        });
        x += colWidth + COLUMN_GAP;
    }
}

/** Size of the SVG canvas needed to fit every course. */
export function graphSize(courses: Course[]) {
    return {
        width: Math.max(...courses.map((c) => c.x + c.w), 300) + GRAPH_PADDING,
        height: Math.max(...courses.map((c) => c.y + NODE_HEIGHT), 200) + GRAPH_PADDING,
    };
}

export function getStatus(course: Course, done: Set<string>): Status {
    if (done.has(course.id)) return "done";
    return course.prereqs.every((p) => done.has(p)) ? "ready" : "locked";
}

/** The course plus everything it depends on, directly or indirectly. */
export function getPrereqChain(id: string | null, byId: Map<string, Course>): Set<string> {
    const chain = new Set<string>();
    const walk = (current: string) => {
        if (chain.has(current)) return;
        chain.add(current);
        byId.get(current)?.prereqs.forEach(walk);
    };
    if (id && byId.has(id)) walk(id);
    return chain;
}
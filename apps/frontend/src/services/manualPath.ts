import { removeCourse } from './catalog.ts';

/** Apply deletions without leaving references that recreate removed steps. */
export function reconcileManualPath(before: string, draft: string) {
    const remaining = definedSteps(draft);
    let source = draft;
    for (const step of definedSteps(before)) {
        if (!remaining.has(step)) source = removeCourse(source, step);
    }
    const after = definedSteps(source);
    const removedDependents = [...remaining].filter((step) => !after.has(step)).length;
    return { source, removedDependents };
}

/** Read explicitly defined steps, not prerequisites mentioned only on the right. */
export function definedSteps(source: string): Set<string> {
    return new Set(source.split('\n').map((line) => line.split(':')[0].trim()).filter(Boolean));
}

export function validateStepName(name: string): string | null {
    if (!name.trim()) return 'Enter a name for this step.';
    if (/[:,\r\n]/.test(name)) return 'Names cannot contain colons, commas, or line breaks.';
    return null;
}

export function validatePathText(source: string): string | null {
    const seen = new Set<string>();
    const prerequisites = new Map<string, string[]>();
    for (const [index, line] of source.split('\n').entries()) {
        if (!line.trim()) continue;
        const parts = line.split(':');
        if (parts.length !== 2 || validateStepName(parts[0])) {
            return `Line ${index + 1}: use Step name: prerequisite, prerequisite. Leave the right side empty for a starting step.`;
        }
        const name = parts[0].trim();
        if (seen.has(name)) return `Line ${index + 1}: "${name}" is listed more than once.`;
        seen.add(name);
        prerequisites.set(name, parts[1].split(',').map((item) => item.trim()).filter(Boolean));
    }
    const visited = new Set<string>();
    const active = new Set<string>();
    function hasCycle(name: string): boolean {
        if (active.has(name)) return true;
        if (visited.has(name)) return false;
        active.add(name);
        if ((prerequisites.get(name) ?? []).some(hasCycle)) return true;
        active.delete(name);
        visited.add(name);
        return false;
    }
    for (const name of seen) {
        if (hasCycle(name)) return 'This path contains a circular dependency. A step cannot depend on itself, directly or indirectly.';
    }
    return null;
}

/** Indentation is visual only; prerequisites after the colon define connections. */
export function formatPathText(source: string): string {
    if (validatePathText(source)) return source;
    const entries = source.split('\n').filter((line) => line.trim()).map((line) => {
        const [name, rest = ''] = line.split(':');
        return { name: name.trim(), prereqs: [...new Set(rest.split(',').map((item) => item.trim()).filter(Boolean))] };
    });
    const byName = new Map(entries.map((entry) => [entry.name, entry]));
    const depths = new Map<string, number>();
    function depth(name: string): number {
        if (depths.has(name)) return depths.get(name)!;
        const entry = byName.get(name);
        const level = entry?.prereqs.length ? 1 + Math.max(...entry.prereqs.map(depth)) : 0;
        depths.set(name, level);
        return level;
    }
    // Keep the user's ordering and blank lines; format only each line's whitespace.
    return source.split('\n').map((line) => {
        if (!line.trim()) return line;
        const name = line.split(':')[0].trim();
        const entry = byName.get(name)!;
        return `${'  '.repeat(Math.min(depth(name), 12))}${name}: ${entry.prereqs.join(', ')}`.trimEnd();
    }).join('\n');
}

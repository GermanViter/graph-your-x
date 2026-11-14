import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCourseCatalog } from './useCourseCatalog.ts';
import { SAMPLE_CURRICULUM } from '../constants/constants.ts';
import { getPrereqChain, getStatus, parseCourses } from '../parseCourses.ts';

type Options = {
    storageKey?: string; // set this to remember progress in the browser
    initialDone?: string[];
    initialSelected?: string | null;
};

function readStorage<T>(key: string | undefined, fallback: T): T {
    if (!key) return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function writeStorage(key: string | undefined, value: unknown) {
    if (!key) return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // storage unavailable (private mode, quota): the planner still works
    }
}

/** All planner state and derived data, shared by every page that shows the graph. */
export function usePrereqPlanner({ storageKey, initialDone = [], initialSelected = null }: Options = {}) {
    const { courses: catalog } = useCourseCatalog();
    const metadata = useMemo(() => new Map(catalog.map((course) => [course.id, course])), [catalog]);
    const sourceKey = storageKey ? `${storageKey}:source` : undefined;
    const doneKey = storageKey ? `${storageKey}:done` : undefined;

    const [source, setSource] = useState<string>(() => readStorage(sourceKey, storageKey ? '' : SAMPLE_CURRICULUM));
    const [done, setDone] = useState<Set<string>>(() => new Set(readStorage(doneKey, initialDone)));
    const [selectedId, setSelectedId] = useState<string | null>(initialSelected);

    useEffect(() => writeStorage(sourceKey, source), [sourceKey, source]);
    useEffect(() => writeStorage(doneKey, [...done]), [doneKey, done]);

    const courses = useMemo(() => parseCourses(source, metadata), [source, metadata]);
    const byId = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

    const selected = selectedId ? byId.get(selectedId) ?? null : null;
    const chain = useMemo(() => getPrereqChain(selected?.id ?? null, byId), [selected, byId]);

    const missing = selected ? [...chain].filter((id) => id !== selected.id && !done.has(id)) : [];
    const unlocks = selected ? courses.filter((c) => c.prereqs.includes(selected.id)) : [];
    const readyCourses = courses.filter((c) => getStatus(c, done) === 'ready');
    const doneCount = courses.filter((c) => done.has(c.id)).length;

    const toggleDone = useCallback((id: string) => {
        setDone((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);
    const clearProgress = useCallback(() => setDone(new Set()), []);
    const resetCurriculum = useCallback(() => setSource(SAMPLE_CURRICULUM), []);

    return {
        source, setSource, resetCurriculum, metadata,
        courses, byId, done, doneCount,
        selected, select: setSelectedId, chain, missing, unlocks, readyCourses,
        toggleDone, clearProgress,
    };
}

export type Planner = ReturnType<typeof usePrereqPlanner>;
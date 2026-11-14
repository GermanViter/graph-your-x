import { useEffect, useState, type ReactNode } from 'react';
import { fetchCourses, type CatalogCourse } from '../services/api.ts';
import { CourseCatalogContext } from './useCourseCatalog.ts';

export function CourseCatalogProvider({ children }: { children: ReactNode }) {
    const [courses, setCourses] = useState<CatalogCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        fetchCourses(controller.signal).then((data) => {
            if (controller.signal.aborted) return;
            setCourses(data);
            setLoading(false);
        }).catch((reason: unknown) => {
            if (controller.signal.aborted) return;
            setError(reason instanceof Error ? reason.message : 'Could not load the course catalog.');
            setLoading(false);
        });
        return () => controller.abort();
    }, [attempt]);
    function reload() {
        setLoading(true);
        setError(null);
        setAttempt((current) => current + 1);
    }
    return <CourseCatalogContext.Provider value={{ courses, loading, error, reload }}>
        {children}
    </CourseCatalogContext.Provider>;
}

import { createContext, useContext } from 'react';
import type { CatalogCourse } from '../services/api.ts';

export type CourseCatalogState = {
    courses: CatalogCourse[];
    loading: boolean;
    error: string | null;
    reload: () => void;
};
export const CourseCatalogContext = createContext<CourseCatalogState | null>(null);
export function useCourseCatalog(): CourseCatalogState {
    const context = useContext(CourseCatalogContext);
    if (!context) throw new Error('CourseCatalogProvider is required.');
    return context;
}

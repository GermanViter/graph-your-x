import { describe, expect, it } from 'vitest';
import type { CatalogCourse } from '../api.ts';
import { addCatalogCourse, getDependentCourseIds, removeCourse } from '../catalog.ts';

const catalog: CatalogCourse[] = [
    { id: 'A', prereqs: [] },
    { id: 'B', prereqs: ['A'] },
    { id: 'C', prereqs: ['A', 'B'] },
    { id: 'D', prereqs: [] },
];

describe('addCatalogCourse', () => {
    it('adds the course after its prerequisites, in dependency order', () => {
        expect(addCatalogCourse('', 'C', catalog)).toBe('A:\nB: A\nC: A, B');
    });

    it('skips courses already defined in the source', () => {
        expect(addCatalogCourse('A: X', 'B', catalog)).toBe('A: X\nB: A');
    });

    it('adds a newline separator only when needed', () => {
        expect(addCatalogCourse('D:\n', 'A', catalog)).toBe('D:\nA:');
    });

    it('returns the source unchanged for unknown ids', () => {
        expect(addCatalogCourse('D:', 'nope', catalog)).toBe('D:');
    });

    it('returns the source unchanged when the course is already present', () => {
        expect(addCatalogCourse('B: A', 'B', catalog)).toBe('B: A');
    });

    it('writes a bare entry for prereqs missing from the catalog', () => {
        expect(addCatalogCourse('', 'X', [{ id: 'X', prereqs: ['ghost'] }])).toBe('ghost:\nX: ghost');
    });
});

describe('getDependentCourseIds', () => {
    const source = 'A:\nB: A\nC: A, B\nD:';

    it('includes the course and everything that transitively requires it', () => {
        expect(getDependentCourseIds(source, 'A')).toEqual(new Set(['A', 'B', 'C']));
    });

    it('returns only the course itself for a leaf', () => {
        expect(getDependentCourseIds(source, 'C')).toEqual(new Set(['C']));
    });

    it('terminates on cycles', () => {
        expect(getDependentCourseIds('X: Y\nY: X', 'X')).toEqual(new Set(['X', 'Y']));
    });
});

describe('removeCourse', () => {
    it('removes the course and its dependents, leaving other lines untouched', () => {
        expect(removeCourse('A:\nB: A\nC: A, B\nD:', 'B')).toBe('A:\nD:');
    });

    it('does nothing for an id not in the source', () => {
        expect(removeCourse('A:\nB: A', 'nope')).toBe('A:\nB: A');
    });
});

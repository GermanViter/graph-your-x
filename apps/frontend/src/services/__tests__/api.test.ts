import { afterEach, describe, expect, it, vi } from 'vitest';
import templateCourses from '../../../data.json';
import { fetchCourses, fetchCoursesFromBackend, parseCatalog } from '../api.ts';

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

describe('parseCatalog', () => {
    it('parses valid courses and trims ids and prereqs', () => {
        expect(parseCatalog([
            { id: ' MATH101 ', name: 'Calculus I', prereqs: [] },
            { id: 'MATH201', prereqs: [' MATH101 '] },
        ])).toEqual([
            { id: 'MATH101', name: 'Calculus I', prereqs: [] },
            { id: 'MATH201', name: undefined, prereqs: ['MATH101'] },
        ]);
    });

    it('accepts the bundled template data', () => {
        expect(parseCatalog(templateCourses).length).toBe(templateCourses.length);
    });

    it('rejects a non-array payload', () => {
        expect(() => parseCatalog({ courses: [] })).toThrow('Expected a course array');
    });

    it.each([
        ['null item', null],
        ['primitive item', 'MATH101'],
        ['missing id', { prereqs: [] }],
        ['empty id', { id: '   ', prereqs: [] }],
        ['id with colon', { id: 'A:B', prereqs: [] }],
        ['id with comma', { id: 'A,B', prereqs: [] }],
        ['id with newline', { id: 'A\nB', prereqs: [] }],
        ['missing prereqs', { id: 'A' }],
        ['non-string prereq', { id: 'A', prereqs: [1] }],
        ['invalid prereq id', { id: 'A', prereqs: ['B:C'] }],
        ['non-string name', { id: 'A', name: 42, prereqs: [] }],
    ])('rejects %s', (_label, item) => {
        expect(() => parseCatalog([item])).toThrow('Invalid course data.');
    });

    it('rejects duplicate ids, including after trimming', () => {
        expect(() => parseCatalog([
            { id: 'A', prereqs: [] },
            { id: ' A ', prereqs: [] },
        ])).toThrow('Duplicate course IDs');
    });
});

describe('fetchCoursesFromBackend', () => {
    it('requests JSON and parses the response', async () => {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ id: 'A', prereqs: [] }]));
        vi.stubGlobal('fetch', fetchMock);
        const controller = new AbortController();

        const courses = await fetchCoursesFromBackend('http://api.test/courses', controller.signal);

        expect(courses).toEqual([{ id: 'A', name: undefined, prereqs: [] }]);
        expect(fetchMock).toHaveBeenCalledWith('http://api.test/courses', {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        });
    });

    it('throws with the status code on a non-OK response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ detail: 'x' }, 500)));
        await expect(fetchCoursesFromBackend('http://api.test/courses')).rejects.toThrow('Course request failed (500).');
    });

    it('throws when the server returns invalid data', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([{ id: '' }])));
        await expect(fetchCoursesFromBackend('http://api.test/courses')).rejects.toThrow('Invalid course data.');
    });

    it('propagates network errors', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
        await expect(fetchCoursesFromBackend('http://api.test/courses')).rejects.toThrow('Failed to fetch');
    });
});

describe('fetchCourses', () => {
    it('falls back to the local template when no endpoint is configured', async () => {
        vi.stubEnv('VITE_COURSES_API_URL', '');
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        expect(await fetchCourses()).toEqual(parseCatalog(templateCourses));
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('uses the backend when an endpoint is configured', async () => {
        vi.stubEnv('VITE_COURSES_API_URL', 'http://api.test/courses');
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ id: 'B', prereqs: [] }]));
        vi.stubGlobal('fetch', fetchMock);

        expect(await fetchCourses()).toEqual([{ id: 'B', name: undefined, prereqs: [] }]);
        expect(fetchMock).toHaveBeenCalledOnce();
    });
});

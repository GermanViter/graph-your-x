/// <reference types="node" />
import { env } from 'node:process';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCourses, fetchRoadmapCatalog } from '../api.ts';
import { parseRoadmap, parseTopics } from '../roadmap.ts';
import { addCatalogCourse } from '../catalog.ts';
import { getStatus, parseCourses } from '../../parseCourses.ts';

const node = (id: string) => ({ id, label: `Learn ${id}`, description: `About ${id}`, category: 'tools', difficulty: 2 });
const roadmap = { goal: 'goal', nodes: [node('goal'), node('basic'), node('extra')], edges: [
    { from: 'basic', to: 'goal', type: 'required' },
    { from: 'extra', to: 'goal', type: 'recommended' },
] };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

function mockCatalog() {
    const mock = vi.fn().mockResolvedValueOnce(json([{ id: 'goal', label: 'Goal' }])).mockResolvedValueOnce(json(roadmap));
    vi.stubGlobal('fetch', mock);
    return mock;
}

describe('FastAPI roadmap integration', () => {
    it('uses topics and roadmaps by default, not the sample catalog', async () => {
        vi.stubEnv('VITE_COURSES_API_URL', '');
        vi.stubEnv('VITE_API_BASE_URL', '');
        const mock = mockCatalog();
        const catalog = await fetchCourses();
        expect(mock.mock.calls.map(([url]) => url)).toEqual(['/api/topics', '/api/roadmap/goal']);
        expect(catalog.find((course) => course.id === 'goal')).toMatchObject({
            name: 'Learn goal', description: 'About goal', difficulty: 2, category: 'tools',
            prereqs: ['basic'], recommended: ['extra'], isTopic: true,
        });
    });
    it('keeps recommendations optional while importing the complete required chain', async () => {
        mockCatalog();
        const catalog = await fetchRoadmapCatalog();
        const source = addCatalogCourse('Custom:', 'goal', catalog);
        expect(source).toBe('Custom:\nbasic:\ngoal: basic');
        const courses = parseCourses(source, new Map(catalog.map((course) => [course.id, course])));
        const goal = courses.find((course) => course.id === 'goal')!;
        expect(goal.name).toBe('Learn goal');
        expect(goal.depth).toBe(1);
        expect(getStatus(goal, new Set(['basic']))).toBe('ready');
        expect(getStatus(goal, new Set())).toBe('locked');
    });
    it('deduplicates concepts and shared edges across topics', async () => {
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce(json([{ id: 'goal', label: 'Goal' }, { id: 'basic', label: 'Basic' }]))
            .mockResolvedValueOnce(json(roadmap))
            .mockResolvedValueOnce(json({ goal: 'basic', nodes: [node('basic')], edges: [] })));
        const catalog = await fetchRoadmapCatalog();
        expect(catalog).toHaveLength(3);
        expect(catalog.find((course) => course.id === 'goal')!.prereqs).toEqual(['basic']);
    });
    it('accepts an empty database without inserting sample data', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json([])));
        expect(await fetchRoadmapCatalog()).toEqual([]);
    });
    it('does not silently substitute samples on server errors', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({}, 503)));
        await expect(fetchRoadmapCatalog()).rejects.toThrow('503');
    });
    it('rejects a missing roadmap instead of returning a partial catalog', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(json([{id:'goal',label:'Goal'}])).mockResolvedValueOnce(json({},404)));
        await expect(fetchRoadmapCatalog()).rejects.toThrow('404');
    });
    it('normalizes the API base URL and encodes topic IDs', async () => {
        const id = 'goal / one';
        const mock = vi.fn().mockResolvedValueOnce(json([{id,label:id}])).mockResolvedValueOnce(json({goal:id,nodes:[node(id)],edges:[]}));
        vi.stubGlobal('fetch', mock);
        await fetchRoadmapCatalog('https://api.example.test/api/');
        expect(mock.mock.calls[1][0]).toBe('https://api.example.test/api/roadmap/goal%20%2F%20one');
    });
    it('forwards cancellation', async () => {
        const controller = new AbortController();
        controller.abort();
        vi.stubGlobal('fetch', vi.fn((_url, options) => {
            expect(options.signal.aborted).toBe(true);
            return Promise.reject(new DOMException('Aborted', 'AbortError'));
        }));
        await expect(fetchRoadmapCatalog('/api',controller.signal)).rejects.toThrow('Aborted');
    });
    it('rejects duplicate topics', () => {
        expect(() => parseTopics([{id:'a',label:'A'},{id:'a',label:'A'}])).toThrow();
    });
    it('rejects wrong goals, dangling edges, and invalid difficulty', () => {
        expect(() => parseRoadmap(roadmap, 'wrong')).toThrow();
        expect(() => parseRoadmap({...roadmap, edges:[{from:'missing',to:'goal',type:'required'}]}, 'goal')).toThrow();
        expect(() => parseRoadmap({...roadmap, nodes:[{...node('goal'),difficulty:6}]}, 'goal')).toThrow();
    });
});

// Optional smoke test against a running, seeded backend (direct or through Vite).
describe.skipIf(!env.LIVE_API_URL)('live FastAPI and SQLite', () => {
    it('loads seeded topics and can build the machine-learning graph', async () => {
        const catalog = await fetchRoadmapCatalog(env.LIVE_API_URL);
        expect(catalog.filter((course) => course.isTopic).map((course) => course.id).sort())
            .toEqual(['cybersecurity', 'machine-learning', 'web-development']);
        expect(catalog).toHaveLength(26);
        const source = addCatalogCourse('', 'machine-learning', catalog);
        expect(source).toContain('machine-learning:');
        expect(source).toContain('python:');
        expect(source).not.toContain('calculus:');
        const goal = catalog.find((course) => course.id === 'machine-learning-basics')!;
        expect(goal.recommended).toContain('calculus');
    });
});

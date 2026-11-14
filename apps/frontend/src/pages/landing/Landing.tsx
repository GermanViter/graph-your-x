import { useMemo, useState } from 'react';
import './Landing.css';
import { CourseDetails } from './components/course-details/CourseDetails.tsx';
import { CurriculumEditor } from '../../components/graph/curriculum-editor/CurriculumEditor.tsx';
import { Features } from './components/features/Features.tsx';
import { Hero } from './components/hero/Hero.tsx';
import { Legend } from './components/legends/Legend.tsx';
import { PrereqGraph } from './components/prereq-graph/PrereqGraph.tsx';
import { SAMPLE_CURRICULUM } from '../../constants/constants.ts';
import { getPrereqChain, getStatus, parseCourses } from '../../parseCourses.ts';

export default function Landing() {
    const [source, setSource] = useState(SAMPLE_CURRICULUM);
    const [done, setDone] = useState<Set<string>>(new Set(["Intro Programming", "Calculus I"]));
    const [selectedId, setSelectedId] = useState<string | null>("Machine Learning");

    const courses = useMemo(() => parseCourses(source), [source]);
    const byId = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

    const selected = selectedId ? byId.get(selectedId) ?? null : null;
    const chain = useMemo(() => getPrereqChain(selected?.id ?? null, byId), [selected, byId]);

    const missing = selected ? [...chain].filter((id) => id !== selected.id && !done.has(id)) : [];
    const unlocks = selected ? courses.filter((c) => c.prereqs.includes(selected.id)) : [];

    const toggleDone = (id: string) =>
        setDone((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    return (
        <div className="pv">
            <div className="pv-wrap">
                <Hero />

                <div className="pv-stage" id="map">
                    <PrereqGraph
                        courses={courses}
                        byId={byId}
                        selectedId={selected?.id ?? null}
                        chain={chain}
                        done={done}
                        onSelect={setSelectedId}
                    />
                    <CourseDetails
                        course={selected}
                        status={selected ? getStatus(selected, done) : "locked"}
                        missing={missing}
                        unlocks={unlocks}
                        onToggleDone={toggleDone}
                        onClearProgress={() => setDone(new Set())}
                    />
                </div>
                <Legend />

                <Features />
                <CurriculumEditor value={source} onChange={setSource} onReset={() => setSource(SAMPLE_CURRICULUM)} />
            </div>
        </div>
    );
}
import type { Planner } from '../../../hooks/usePrereqPlanner.ts';
import { getStatus } from '../../../parseCourses.ts';
import { CourseDetails } from '../course-details/CourseDetails.tsx';
import { Legend } from '../legends/Legend.tsx';
import { PrereqGraph } from '../prereq-graph/PrereqGraph.tsx';
import './PrereqWorkspace.css';

/** The graph, the side panel and the legend: the part every page reuses. */
export function PrereqWorkspace({ planner }: { planner: Planner }) {
    const { courses, byId, selected, chain, done, missing, unlocks, select, toggleDone, clearProgress } = planner;

    return (
        <>
            <div className="pv-stage" id="map">
                <PrereqGraph
                    courses={courses}
                    byId={byId}
                    selectedId={selected?.id ?? null}
                    chain={chain}
                    done={done}
                    onSelect={select}
                />
                <CourseDetails
                    course={selected}
                    status={selected ? getStatus(selected, done) : 'locked'}
                    missing={missing}
                    unlocks={unlocks}
                    onToggleDone={toggleDone}
                    onClearProgress={clearProgress}
                />
            </div>
            <Legend />
        </>
    );
}
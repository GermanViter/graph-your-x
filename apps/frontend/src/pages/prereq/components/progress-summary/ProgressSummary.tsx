import './ProgressSummary.css';
import type { Planner } from '../../../../hooks/usePrereqPlanner.ts';

export function ProgressSummary({ planner }: { planner: Planner }) {
    const { doneCount, courses, readyCourses, select } = planner;
    const total = courses.length;
    const percent = total ? Math.round((doneCount / total) * 100) : 0;

    return (
        <div className="progress-summary">
            <div>
                <p className="progress-label ui">
                    {doneCount} of {total} courses completed
                </p>
                <div
                    className="progress-bar"
                    role="progressbar"
                    aria-label="Courses completed"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                >
                    <span style={{ width: `${percent}%` }} />
                </div>
            </div>

            <div>
                <p className="progress-label ui">Ready to take now</p>
                {readyCourses.length > 0 ? (
                    <div className="progress-ready">
                        {readyCourses.map((c) => (
                            <button key={c.id} className="progress-chip" onClick={() => select(c.id)}>
                                {c.id}
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="progress-none">Nothing is ready yet. Mark the courses you have finished.</p>
                )}
            </div>
        </div>
    );
}
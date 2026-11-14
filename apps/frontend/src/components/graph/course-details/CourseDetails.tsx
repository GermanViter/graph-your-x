import "./CourseDetails.css";
import { STATUS_STYLES } from "../../../constants/constants";
import type { Course, Status } from "../../../types/types";

type Props = {
    course: Course | null;
    catalog: Map<string, { name?: string }>;
    status: Status;
    missing: string[]; // prerequisites not yet completed
    unlocks: Course[]; // courses that list this one as a prerequisite
    onToggleDone: (id: string) => void;
    onClearProgress: () => void;
};

/** Side panel describing the selected course. */
export function CourseDetails({ course, catalog, status, missing, unlocks, onToggleDone, onClearProgress }: Props) {
    if (!course) {
        return (
            <aside className="pv-side" aria-live="polite">
                <p>Select a course on the map to see its prerequisites.</p>
            </aside>
        );
    }

    const style = STATUS_STYLES[status];

    return (
        <aside className="pv-side" aria-live="polite">
            <h3>{course.name ?? course.id}</h3>
            {course.description && <p>{course.description}</p>}
            {course.difficulty !== undefined && <p>{course.category} · Difficulty {course.difficulty}/5</p>}
            {Boolean(course.recommended?.length) && <p><strong>Recommended, not required:</strong> {course.recommended!.map((id) => catalog.get(id)?.name ?? id).join(', ')}</p>}

            <span
                className="pv-tag"
                style={{ background: style.fill, color: style.text, border: `1.5px solid ${style.stroke}` }}
            >
                {style.label}
            </span>

            {missing.length > 0 ? (
                <div>
                    <p>
                        {missing.length} course{missing.length > 1 ? "s" : ""} to finish first:
                    </p>
                    <ul>
                        {missing.map((id) => (
                            <li key={id}>{catalog.get(id)?.name ?? id}</li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p>Nothing left to take before this one.</p>
            )}

            {unlocks.length > 0 && (
                <p>
                    <strong>Opens up:</strong> {unlocks.map((u) => u.name ?? u.id).join(", ")}
                </p>
            )}

            <button className="pv-btn" onClick={() => onToggleDone(course.id)}>
                {status === "done" ? "Mark as not completed" : "Mark as completed"}
            </button>
            <button className="pv-btn alt" onClick={onClearProgress}>
                Clear all progress
            </button>
        </aside>
    );
}
import { useEffect, useId, useState } from 'react';
import { fetchCourses, type CatalogCourse } from '../../../services/api.ts';
import { addCatalogCourse, getDependentCourseIds, removeCourse } from '../../../services/catalog.ts';
import { parseCourses } from '../../../parseCourses.ts';

type Props = { value: string; onChange: (value: string) => void };

export function CoursePicker({ value, onChange }: Props) {
    const inputId = useId();
    const [courses, setCourses] = useState<CatalogCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [notice, setNotice] = useState('');
    const [query, setQuery] = useState('');
    const [selectedOnly, setSelectedOnly] = useState(false);
    const [undo, setUndo] = useState<{ before: string; after: string } | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchCourses(controller.signal).then((data) => {
            if (!controller.signal.aborted) {
                setCourses(data);
                setLoading(false);
            }
        }).catch(() => {
            if (!controller.signal.aborted) {
                setError(true);
                setLoading(false);
            }
        });
        return () => controller.abort();
    }, [attempt]);

    // Derive selection from the same text as the graph, including implicit prerequisites.
    const selected = new Set(parseCourses(value).map((course) => course.id));
    const catalogIds = new Set(courses.map((course) => course.id));
    const options = [
        ...courses,
        ...[...selected].filter((id) => !catalogIds.has(id)).map((id) => ({ id, name: 'Custom course', prereqs: [] })),
    ];
    const search = query.trim().toLowerCase();
    const visible = options.filter((course) =>
        (!selectedOnly || selected.has(course.id)) &&
        `${course.id} ${course.name ?? ''}`.toLowerCase().includes(search));

    function change(next: string, message: string) {
        setUndo({ before: value, after: next });
        onChange(next);
        setNotice(message);
    }

    return (
        <div className="pv-course-picker">
            <details className="pv-course-menu" open>
                <summary>Choose courses <span>{selected.size} selected</span></summary>
                <div className="pv-course-controls">
                    <label htmlFor={inputId}>Search courses</label>
                    <input id={inputId} type="search" value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by code or name" aria-controls={`${inputId}-list`} />
                    <label className="pv-course-filter">
                        <input type="checkbox" checked={selectedOnly}
                            onChange={(event) => setSelectedOnly(event.target.checked)} />
                        Selected only
                    </label>
                    <p id={`${inputId}-help`}>Check to add a course and its prerequisites. Unchecking also removes courses that depend on it, keeping prerequisite requirements intact. Use Undo to restore the selection.</p>
                </div>
                {loading && <p className="pv-course-message" role="status">Loading catalog…</p>}
                {error && <div className="pv-course-message" role="alert">
                    <p>Could not load the catalog. You can still remove selected courses or edit the list below.</p>
                    <button className="pv-btn alt" onClick={() => {
                        setError(false);
                        setLoading(true);
                        setAttempt((current) => current + 1);
                    }}>Retry loading courses</button>
                </div>}
                <div id={`${inputId}-list`} className="pv-course-list" role="group"
                    aria-label="Course selection" aria-describedby={`${inputId}-help`}>
                    {visible.map((course) => (
                        <label key={course.id} className="pv-course-option">
                            <input type="checkbox" checked={selected.has(course.id)}
                                onChange={(event) => {
                                    if (event.target.checked) {
                                        change(addCatalogCourse(value, course.id, courses), `${course.id} and missing prerequisites added.`);
                                    } else {
                                        const dependentCount = getDependentCourseIds(value, course.id).size - 1;
                                        change(removeCourse(value, course.id), dependentCount > 0
                                            ? `${course.id} and ${dependentCount} dependent ${dependentCount === 1 ? 'course' : 'courses'} removed. Use Undo to restore them.`
                                            : `${course.id} removed. Use Undo to restore it.`);
                                    }
                                }} />
                            <span><strong>{course.id}</strong>{course.name && <small>{course.name}</small>}</span>
                        </label>
                    ))}
                    {!visible.length && !loading && <p className="pv-course-message">
                        {search ? 'No courses match your search.' : selectedOnly ? 'No courses selected.' : 'No courses available.'}
                    </p>}
                </div>
            </details>
            <div className="pv-course-actions">
                <button className="pv-btn alt" disabled={selected.size === 0}
                    onClick={() => change('', 'All courses removed from the graph.')}>Clear graph</button>
                <button className="pv-btn alt" disabled={!undo || undo.after !== value}
                    onClick={() => {
                        if (undo && undo.after === value) {
                            onChange(undo.before);
                            setUndo(null);
                            setNotice('Last selection change undone.');
                        }
                    }}>Undo</button>
            </div>
            <p role="status">{notice}</p>
        </div>
    );
}

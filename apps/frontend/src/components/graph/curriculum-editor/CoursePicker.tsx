import { useId, useState } from 'react';
import type { CatalogCourse } from '../../../services/api.ts';
import { useCourseCatalog } from '../../../hooks/useCourseCatalog.ts';
import { addCatalogCourse, getDependentCourseIds, removeCourse } from '../../../services/catalog.ts';
import { parseCourses } from '../../../parseCourses.ts';

type Props = { value: string; onChange: (value: string) => void };

export function CoursePicker({ value, onChange }: Props) {
    const inputId = useId();
    const { courses, loading, error, reload } = useCourseCatalog();
    const [notice, setNotice] = useState('');
    const [query, setQuery] = useState('');
    const [selectedOnly, setSelectedOnly] = useState(false);
    const [undo, setUndo] = useState<{ before: string; after: string } | null>(null);

    // Derive selection from the same text as the graph, including implicit prerequisites.
    const selected = new Set(parseCourses(value).map((course) => course.id));
    const catalogIds = new Set(courses.map((course) => course.id));
    const options: CatalogCourse[] = [
        ...[...courses].sort((a, b) => Number(Boolean(b.isTopic)) - Number(Boolean(a.isTopic)) || (a.name ?? a.id).localeCompare(b.name ?? b.id)),
        ...[...selected].filter((id) => !catalogIds.has(id)).map((id) => ({ id, name: id, prereqs: [] })),
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
                <summary>Choose a topic or step <span>{selected.size} selected</span></summary>
                <div className="pv-course-controls">
                    <label htmlFor={inputId}>Search topics and steps</label>
                    <input id={inputId} type="search" value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by code or name" aria-controls={`${inputId}-list`} />
                    <label className="pv-course-filter">
                        <input type="checkbox" checked={selectedOnly}
                            onChange={(event) => setSelectedOnly(event.target.checked)} />
                        Selected only
                    </label>
                    <p id={`${inputId}-help`}>Check to add a topic or step and its required prerequisites. Recommendations are optional and can be selected separately. Unchecking also removes courses that depend on it, keeping prerequisite requirements intact. Use Undo to restore the selection.</p>
                </div>
                {loading && <p className="pv-course-message" role="status">Loading catalog…</p>}
                {error && <div className="pv-course-message" role="alert">
                    <p>Could not load the catalog: {error} You can still edit your saved path manually.</p>
                    <button className="pv-btn alt" onClick={reload}>Retry loading courses</button>
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
                            <span><strong>{course.name ?? course.id}</strong>
                                <small>{course.id}{course.isTopic ? ' · Topic' : ''}</small>
                                {course.description && <small>{course.description}</small>}
                                {course.difficulty !== undefined && <small>{course.category} · Difficulty {course.difficulty}/5</small>}
                                {Boolean(course.recommended?.length) && <small>Recommended (optional): {course.recommended!.map((id) => courses.find((item) => item.id === id)?.name ?? id).join(', ')}</small>}
                            </span>
                        </label>
                    ))}
                    {!visible.length && !loading && !error && <p className="pv-course-message">
                        {search ? 'No courses match your search.' : selectedOnly ? 'No courses selected.' : 'No topics available. Ask your teammate to seed the database.'}
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

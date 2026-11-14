import { useEffect, useId, useState } from 'react';
import { fetchCourses, type CatalogCourse } from '../../../services/api.ts';
import { addCatalogCourse } from '../../../services/catalog.ts';

export function CoursePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const inputId = useId();
    const [courses, setCourses] = useState<CatalogCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [notice, setNotice] = useState('');

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

    const defined = new Set(value.split('\n').map((line) => line.split(':')[0].trim()));
    return (
        <div className="pv-course-picker">
            <label htmlFor={inputId}>Add a course from the catalog</label>
            <select
                id={inputId}
                value=""
                disabled={loading || error || courses.length === 0}
                aria-describedby={`${inputId}-help`}
                onChange={(event) => {
                    const id = event.target.value;
                    if (!id) return;
                    onChange(addCatalogCourse(value, id, courses));
                    setNotice(`${id} added. You can edit or remove it in the list below.`);
                }}
            >
                <option value="">{loading ? 'Loading courses…' : error ? 'Courses unavailable' : courses.length === 0 ? 'No courses available' : 'Choose a course…'}</option>
                {courses.map((course) => (
                    <option key={course.id} value={course.id} disabled={defined.has(course.id)}>
                        {course.id}{course.name ? ` — ${course.name}` : ''}{defined.has(course.id) ? ' (already added)' : ''}
                    </option>
                ))}
            </select>
            <p id={`${inputId}-help`}>Adds the course and its prerequisites. Edit the list below to add or remove courses and connections.</p>
            {error && <div role="alert">
                <p>Could not load courses. You can still edit the list manually.</p>
                <button className="pv-btn alt" onClick={() => {
                    setError(false);
                    setLoading(true);
                    setAttempt((current) => current + 1);
                }}>Retry loading courses</button>
            </div>}
            <p role="status">{notice}</p>
        </div>
    );
}

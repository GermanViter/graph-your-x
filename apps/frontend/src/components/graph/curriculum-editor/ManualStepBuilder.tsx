import { useId, useState, type FormEvent } from 'react';
import { parseCourses } from '../../../parseCourses.ts';
import { validateStepName } from '../../../services/manualPath.ts';

type Props = { value: string; onChange: (value: string) => void };

export function ManualStepBuilder({ value, onChange }: Props) {
    const id = useId();
    const [name, setName] = useState('');
    const [prerequisite, setPrerequisite] = useState('');
    const [chosen, setChosen] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const existing = parseCourses(value).map((course) => course.id);
    // A removed graph step must not survive as a stale form selection.
    const selected = chosen.filter((item) => existing.includes(item));
    const suggestions = existing.filter((item) => !selected.includes(item) && item !== name.trim());

    function addPrerequisite() {
        const next = prerequisite.trim();
        if (!suggestions.includes(next)) {
            setError('Choose an existing step from the suggestions. Add a new starting step first if needed.');
            return;
        }
        setChosen([...selected, next]);
        setPrerequisite('');
        setError('');
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const title = name.trim();
        const invalid = validateStepName(title);
        if (invalid) { setError(invalid); return; }
        if (existing.includes(title)) { setError('This step already exists. Edit its line in the text editor below.'); return; }
        let dependencies = selected;
        if (prerequisite.trim()) {
            if (!suggestions.includes(prerequisite.trim())) {
                setError('Choose an existing prerequisite or clear the prerequisite field.');
                return;
            }
            dependencies = [...selected, prerequisite.trim()];
        }
        const line = `${title}: ${dependencies.join(', ')}`.trimEnd();
        onChange(value + (value && !value.endsWith('\n') ? '\n' : '') + line);
        setName('');
        setPrerequisite('');
        setChosen([]);
        setError('');
        setNotice(`Added ${title} to your path.`);
    }

    return (
        <form className="pv-manual-builder" onSubmit={submit}>
            <h3>Add a learning step</h3>
            <p>Give it a name, then choose what you need to learn first. Leave prerequisites empty for a starting step.</p>
            <label htmlFor={`${id}-name`}>Step name</label>
            <input id={`${id}-name`} value={name} onChange={(event) => { setName(event.target.value); setError(''); }}
                placeholder="e.g. Build a website" autoComplete="off" aria-describedby={error ? `${id}-error` : undefined} />
            <label htmlFor={`${id}-prereq`}>Prerequisites (optional)</label>
            <div className="pv-manual-input-row">
                <input id={`${id}-prereq`} list={`${id}-suggestions`} value={prerequisite}
                    onChange={(event) => { setPrerequisite(event.target.value); setError(''); }}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') { event.preventDefault(); addPrerequisite(); }
                    }} placeholder="Type to find an existing step" autoComplete="off" />
                <datalist id={`${id}-suggestions`}>
                    {suggestions.map((item) => <option key={item} value={item} />)}
                </datalist>
                <button type="button" className="pv-btn alt" disabled={!prerequisite.trim()} onClick={addPrerequisite}>Add prerequisite</button>
            </div>
            {selected.length > 0 && <ul className="pv-manual-chips" aria-label="Chosen prerequisites">
                {selected.map((item) => <li key={item}>
                    <span>{item}</span>
                    <button type="button" aria-label={`Remove prerequisite ${item}`} onClick={() => setChosen(selected.filter((entry) => entry !== item))}>×</button>
                </li>)}
            </ul>}
            {name.trim() && <p className="pv-manual-preview">Text preview: <code>{name.trim()}: {[...selected, ...(prerequisite.trim() ? [prerequisite.trim()] : [])].join(', ')}</code></p>}
            {error && <p id={`${id}-error`} role="alert">{error}</p>}
            <button className="pv-btn" type="submit">Add step</button>
            <p role="status">{notice}</p>
        </form>
    );
}

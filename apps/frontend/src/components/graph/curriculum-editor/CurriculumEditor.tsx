import { useId, useState } from 'react';
import './CurriculumEditor.css';
import { CoursePicker } from './CoursePicker.tsx';
import { ManualStepBuilder } from './ManualStepBuilder.tsx';
import { PathTextEditor } from './PathTextEditor.tsx';
import { formatPathText, reconcileManualPath, validatePathText } from '../../../services/manualPath.ts';

type Props = {
    value: string;
    onChange: (value: string) => void;
    onReset: () => void;
};

export function CurriculumEditor({ value, onChange, onReset }: Props) {
    const id = useId();
    const [view, setView] = useState<'catalog' | 'builder' | 'text'>('catalog');
    const [draft, setDraft] = useState<{ base: string; text: string } | null>(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [undo, setUndo] = useState<{ before: string; after: string } | null>(null);
    const conflict = draft !== null && draft.base !== value;

    function change(next: string) {
        setUndo({ before: value, after: next });
        onChange(next);
    }

    function applyText() {
        if (!draft || conflict) return;
        const invalid = validatePathText(draft.text);
        if (invalid) { setError(invalid); return; }
        const { source: next, removedDependents } = reconcileManualPath(draft.base, draft.text);
        change(next);
        setDraft(null);
        setError('');
        setNotice(removedDependents
            ? `Changes applied. Also removed ${removedDependents} dependent ${removedDependents === 1 ? 'step' : 'steps'} to preserve prerequisite requirements. Undo is available.`
            : 'Changes applied to the graph and picker.');
    }

    return (
        <div className="pv-editor">
            <div className="pv-editor-views" role="group" aria-label="Path editing options">
                <button type="button" aria-pressed={view === 'catalog'} onClick={() => setView('catalog')}>Catalog</button>
                <button type="button" aria-pressed={view === 'builder'} onClick={() => setView('builder')}>Add a step</button>
                <button type="button" aria-pressed={view === 'text'} onClick={() => setView('text')}>Edit text{draft ? ' •' : ''}</button>
            </div>
            <div className="pv-editor-section" hidden={view !== 'catalog'}>
            <CoursePicker value={value} onChange={onChange} />
            </div>
            <div className="pv-editor-section" hidden={view !== 'builder'}>
            <ManualStepBuilder value={value} onChange={change} />
            </div>
            <div className="pv-editor-section" hidden={view !== 'text'}>
            <details className="pv-manual-guide">
                <summary>How to write your own path</summary>
                <p>Write one step per line. Put its name before the colon and the steps it requires after it, separated by commas.</p>
                <pre>{'HTML basics:\nCSS basics:\n  Build a website: HTML basics, CSS basics\n    Publish a website: Build a website'}</pre>
                <p>Indentation shows prerequisite depth. Connections are still defined by the names after the colon, not by spaces.</p>
                <p>An empty right side means there are no prerequisites. Names must match exactly and cannot contain commas or colons. A prerequisite mentioned without its own line still appears as a starting step.</p>
                <p>Apply changes when you finish editing. Deleting a step’s line also removes steps that depend on it. To keep a dependent step, edit its prerequisites explicitly. Catalog items remain available to add again; deleted custom steps disappear from the picker.</p>
            </details>
            <label htmlFor={`${id}-text`}><strong>Edit path text</strong></label>
            <p id={`${id}-help`} className="pv-editor-help">Tab indents; Shift+Tab outdents. Enter keeps indentation. Press Escape then Tab to leave the editor. Apply changes when you finish; your spacing and line order are preserved.</p>
            <PathTextEditor id={`${id}-text`} value={draft?.text ?? value} describedBy={`${id}-help`}
                onChange={(text) => {
                    setDraft({ base: draft?.base ?? value, text });
                    setError('');
                }} />
            {conflict && <p role="alert">The graph changed while you were editing. Copy any draft text you want to keep, then reload the current list before applying changes.</p>}
            {error && <p role="alert">{error}</p>}
            <div className="pv-course-actions">
                <button type="button" className="pv-btn alt" disabled={conflict} onClick={() => {
                    const text = draft?.text ?? value;
                    const invalid = validatePathText(text);
                    if (invalid) { setError(invalid); return; }
                    setDraft({ base: draft?.base ?? value, text: formatPathText(text) });
                    setError('');
                }}>Format text</button>
                <button type="button" className="pv-btn" disabled={!draft || conflict} onClick={applyText}>Apply changes</button>
                {draft && <button type="button" className="pv-btn alt" onClick={() => { setDraft(null); setError(''); }}>
                    {conflict ? 'Reload current list' : 'Cancel edits'}
                </button>}
                <button type="button" className="pv-btn alt" disabled={!undo || undo.after !== value || draft !== null} onClick={() => {
                    if (undo && undo.after === value) {
                        onChange(undo.before);
                        setUndo(null);
                        setNotice('Last manual change undone.');
                    }
                }}>Undo manual change</button>
                <button type="button" className="pv-btn alt" onClick={() => { setDraft(null); setError(''); setUndo(null); setNotice(''); onReset(); }}>Restore sample curriculum</button>
            </div>
            </div>
            <p role="status">{notice}</p>
        </div>
    );
}

import { useEffect, useId, useRef, useState } from 'react';
import './Prereq.css';
import { CurriculumEditor } from '../../components/graph/curriculum-editor/CurriculumEditor.tsx';
import PageHeader from '../../components/page-header/PageHeader.tsx';
import { PrereqPage } from '../../components/graph/prereq-page/PrereqPage.tsx';
import { PrereqWorkspace } from '../../components/graph/prereq-workspace/PrereqWorkspace.tsx';
import { usePrereqPlanner } from '../../hooks/usePrereqPlanner.ts';
import { ProgressSummary } from './components/progress-summary/ProgressSummary.tsx';

export default function Graph() {
    const planner = usePrereqPlanner({ storageKey: 'prereq-graph' });
    const [editorOpen, setEditorOpen] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        if (!editorOpen) return;
        const dialog = dialogRef.current;
        if (!dialog) return;
        dialog.showModal();
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
            if (dialog.open) dialog.close();
        };
    }, [editorOpen]);

    return (
        <PrereqPage>
            <div className="graph-top">
                <PageHeader
                    title="Graph viewer"
                    customAction={<button type="button" className="pv-btn" aria-haspopup="dialog"
                        onClick={() => setEditorOpen(true)}>Manage path</button>}
                />
                <p className="graph-save-note">Progress and courses are saved in this browser.</p>
            </div>
            <ProgressSummary planner={planner} />
            {planner.courses.length === 0 && <p>Open Manage path to choose a topic from the database or create your own learning path.</p>}
            <PrereqWorkspace planner={planner} />

            <dialog ref={dialogRef} className="graph-editor-drawer" aria-labelledby={titleId}
                onClose={() => setEditorOpen(false)}>
                <header className="graph-drawer-header">
                    <div>
                        <h2 id={titleId}>Manage your path</h2>
                        <p>Select courses, add learning steps, or edit your path.</p>
                    </div>
                    <button type="button" className="pv-btn alt" onClick={() => dialogRef.current?.close()}>Close</button>
                </header>
                <div className="graph-drawer-content">
                    <CurriculumEditor value={planner.source} onChange={planner.setSource} onReset={planner.resetCurriculum} />
                </div>
            </dialog>
        </PrereqPage>
    );
}

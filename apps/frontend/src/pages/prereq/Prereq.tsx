import './Prereq.css';
import { CurriculumEditor } from '../../components/graph/curriculum-editor/CurriculumEditor.tsx';
import PageHeader from '../../components/page-header/PageHeader.tsx';
import { PrereqPage } from '../../components/graph/prereq-page/PrereqPage.tsx';
import { PrereqWorkspace } from '../../components/graph/prereq-workspace/PrereqWorkspace.tsx';
import { usePrereqPlanner } from '../../hooks/usePrereqPlanner.ts';
import { ProgressSummary } from './components/progress-summary/ProgressSummary.tsx';

export default function Graph() {
    // storageKey keeps progress and the curriculum between visits
    const planner = usePrereqPlanner({ storageKey: 'prereq-graph' });

    return (
        <PrereqPage>
            <div className="graph-top">
                <PageHeader
                    title="Graph viewer"
                    customAction={<p>Progress and courses are saved in this browser.</p>}
                />
            </div>

            <ProgressSummary planner={planner} />
            <PrereqWorkspace planner={planner} />

            <section className="graph-edit">
                <div>
                    <h2>Your courses</h2>
                    <p>
                        One line per course as <code>Name: prerequisite, prerequisite</code>. Edit the list to match
                        your own program.
                    </p>
                </div>
                <CurriculumEditor
                    value={planner.source}
                    onChange={planner.setSource}
                    onReset={planner.resetCurriculum}
                />
            </section>
        </PrereqPage>
    );
}
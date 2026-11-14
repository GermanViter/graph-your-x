import "./BuildSection.css";
import { CurriculumEditor } from '../../../../components/graph/curriculum-editor/CurriculumEditor.tsx';
import type { Planner } from '../../../../hooks/usePrereqPlanner.ts';

export function BuildSection({ planner }: { planner: Planner }) {
    return (
        <section className="pv-sec" id="build">
            <div className="pv-build">
                <div>
                    <h2>Works for any subject tree.</h2>
                    <p className="pv-lede">
                        Write one line per item as <code>Name: prerequisite, prerequisite</code>. The map redraws as
                        you type. Use it for a degree plan, a skill tree, a certification path or a learning roadmap.
                    </p>
                </div>
                <CurriculumEditor
                    value={planner.source}
                    onChange={planner.setSource}
                    onReset={planner.resetCurriculum}
                />
            </div>
        </section>
    );
}
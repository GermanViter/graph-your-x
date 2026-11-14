import './Landing.css';
import { PrereqPage } from '../../components/graph/prereq-page/PrereqPage.tsx';
import { PrereqWorkspace } from '../../components/graph/prereq-workspace/PrereqWorkspace.tsx';
import { usePrereqPlanner } from '../../hooks/usePrereqPlanner.ts';
import { BuildSection } from './components/build-section/BuildSection.tsx';
import { Features } from './components/features/Features.tsx';
import { Hero } from './components/hero/Hero.tsx';

export default function Landing() {
    // No storageKey: the landing demo always starts from the same example
    const planner = usePrereqPlanner({
        initialDone: ['Intro Programming', 'Calculus I'],
        initialSelected: 'Machine Learning',
    });

    return (
        <PrereqPage>
            <Hero />
            <PrereqWorkspace planner={planner} />
            <Features />
            <BuildSection planner={planner} />
        </PrereqPage>
    );
}
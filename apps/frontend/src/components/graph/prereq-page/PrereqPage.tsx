import type { ReactNode } from 'react';
import './PrereqPage.css';

/** Themed page container shared by every page that shows the graph. */
export function PrereqPage({ children }: { children: ReactNode }) {
    return (
        <div className="pv">
            <div className="pv-wrap">{children}</div>
        </div>
    );
}
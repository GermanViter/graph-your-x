import "./GraphEdge.css";
import { NODE_HEIGHT, SELECTED_COLOR } from "../../../constants/constants";
import type { Course } from "../../../types/types";

type Props = {
    from: Course;
    to: Course;
    highlighted: boolean;
    dimmed: boolean;
};

/** A curved line from a prerequisite to the course that needs it. */
export function GraphEdge({ from, to, highlighted, dimmed }: Props) {
    const x1 = from.x + from.w;
    const y1 = from.y + NODE_HEIGHT / 2;
    const x2 = to.x;
    const y2 = to.y + NODE_HEIGHT / 2;
    const mid = (x1 + x2) / 2;

    return (
        <path
            className="pv-edge"
            d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`}
            style={{
                stroke: highlighted ? SELECTED_COLOR : undefined,
                strokeWidth: highlighted ? 2.5 : undefined,
                opacity: dimmed ? 0.35 : 1,
            }}
        />
    );
}
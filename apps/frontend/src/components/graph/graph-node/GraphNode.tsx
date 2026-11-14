import { NODE_HEIGHT, SELECTED_COLOR, STATUS_STYLES } from "../../../../constants/constants";
import type { Course, Status } from "../../../../types/types";

type Props = {
    course: Course;
    status: Status;
    isSelected: boolean;
    dimmed: boolean;
    onSelect: (id: string) => void;
};

/** One clickable course box. */
export function GraphNode({ course, status, isSelected, dimmed, onSelect }: Props) {
    const style = STATUS_STYLES[status];
    const select = () => onSelect(course.id);

    return (
        <g
            className="pv-node"
            tabIndex={0}
            role="button"
            aria-pressed={isSelected}
            aria-label={`${course.id}, ${style.label}`}
            opacity={dimmed ? 0.45 : 1}
            onClick={select}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    select();
                }
            }}
        >
            <rect
                x={course.x}
                y={course.y}
                width={course.w}
                height={NODE_HEIGHT}
                rx={6}
                fill={style.fill}
                stroke={isSelected ? SELECTED_COLOR : style.stroke}
                strokeWidth={isSelected ? 3.5 : 1.5}
            />
            <text x={course.x + course.w / 2} y={course.y + NODE_HEIGHT / 2 + 4.5} textAnchor="middle" fill={style.text}>
                {course.id}
            </text>
        </g>
    );
}
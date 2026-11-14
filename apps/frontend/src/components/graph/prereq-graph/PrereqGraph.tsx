import "./PrereqGraph.css";
import { useRef, useState, type PointerEvent } from "react";
import { getStatus, graphSize } from "../../../parseCourses";
import type { Course } from "../../../types/types";
import { GraphEdge } from "../graph-edge/GraphEdge";
import { GraphNode } from "../graph-node/GraphNode";

type Props = {
    courses: Course[];
    byId: Map<string, Course>;
    selectedId: string | null;
    chain: Set<string>; // selected course + all its prerequisites
    done: Set<string>;
    onSelect: (id: string) => void;
};

export function PrereqGraph({ courses, byId, selectedId, chain, done, onSelect }: Props) {
    const { width, height } = graphSize(courses);
    const hasSelection = selectedId !== null && chain.size > 0;
    const [isPanning, setIsPanning] = useState(false);
    const drag = useRef<{
        pointerId: number;
        x: number;
        y: number;
        scrollLeft: number;
        scrollTop: number;
        moved: boolean;
    } | null>(null);
    const suppressClick = useRef(false);

    function startPan(event: PointerEvent<HTMLDivElement>) {
        // Touch keeps the browser's native scrolling and pinch gestures.
        if (event.pointerType === 'touch' || event.button !== 0 || !event.isPrimary) return;
        const viewport = event.currentTarget;
        const bounds = viewport.getBoundingClientRect();
        // Leave native scrollbar interactions alone.
        if (event.clientX >= bounds.left + viewport.clientLeft + viewport.clientWidth ||
            event.clientY >= bounds.top + viewport.clientTop + viewport.clientHeight) return;
        suppressClick.current = false;
        drag.current = {
            pointerId: event.pointerId, x: event.clientX, y: event.clientY,
            scrollLeft: viewport.scrollLeft, scrollTop: viewport.scrollTop, moved: false,
        };
    }

    function movePan(event: PointerEvent<HTMLDivElement>) {
        const current = drag.current;
        if (!current || event.pointerId !== current.pointerId) return;
        const dx = event.clientX - current.x;
        const dy = event.clientY - current.y;
        // Small hand movements should still count as a normal course click.
        if (!current.moved && Math.hypot(dx, dy) < 5) return;
        if (!current.moved) {
            current.moved = true;
            suppressClick.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            setIsPanning(true);
        }
        event.preventDefault();
        event.currentTarget.scrollLeft = current.scrollLeft - dx;
        event.currentTarget.scrollTop = current.scrollTop - dy;
    }

    function endPan(event: PointerEvent<HTMLDivElement>) {
        if (drag.current?.pointerId !== event.pointerId) return;
        drag.current = null;
        setIsPanning(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    }

    return (
        <div
            className={`pv-graph${isPanning ? ' is-panning' : ''}`}
            tabIndex={0}
            role="region"
            aria-label="Course graph. Drag to pan, or use arrow keys when focused."
            title="Drag to move around the graph. Click a course to select it."
            onPointerDown={startPan}
            onPointerMove={movePan}
            onPointerUp={endPan}
            onPointerCancel={endPan}
            onLostPointerCapture={endPan}
            onPointerLeave={(event) => {
                if (!drag.current?.moved) endPan(event);
            }}
            onClickCapture={(event) => {
                if (suppressClick.current && event.detail > 0) {
                    event.preventDefault();
                    event.stopPropagation();
                    suppressClick.current = false;
                }
            }}
            onDragStart={(event) => event.preventDefault()}
        >
            <svg width={width} height={height} role="group" aria-label="Course prerequisite graph">
                {courses.flatMap((course) =>
                    course.prereqs.map((prereqId) => {
                        const from = byId.get(prereqId);
                        if (!from) return null;
                        const highlighted = chain.has(prereqId) && chain.has(course.id);
                        return (
                            <GraphEdge
                                key={`${prereqId}>${course.id}`}
                                from={from}
                                to={course}
                                highlighted={hasSelection && highlighted}
                                dimmed={hasSelection && !highlighted}
                            />
                        );
                    })
                )}
                {courses.map((course) => (
                    <GraphNode
                        key={course.id}
                        course={course}
                        status={getStatus(course, done)}
                        isSelected={course.id === selectedId}
                        dimmed={hasSelection && !chain.has(course.id)}
                        onSelect={onSelect}
                    />
                ))}
            </svg>
        </div>
    );
}

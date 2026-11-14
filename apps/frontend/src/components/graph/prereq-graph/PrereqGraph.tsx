import "./PrereqGraph.css";
import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";
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
    const viewportRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const pendingScroll = useRef<{ left: number; top: number } | null>(null);

    useLayoutEffect(() => {
        if (viewportRef.current && pendingScroll.current) {
            viewportRef.current.scrollTo(pendingScroll.current);
            pendingScroll.current = null;
        }
    }, [zoom]);

    function changeZoom(next: number, fit = false) {
        const viewport = viewportRef.current;
        if (!viewport) return;
        const position = fit ? { left: 0, top: 0 } : {
            left: (viewport.scrollLeft + viewport.clientWidth / 2) * next / zoom - viewport.clientWidth / 2,
            top: (viewport.scrollTop + viewport.clientHeight / 2) * next / zoom - viewport.clientHeight / 2,
        };
        if (next === zoom) {
            viewport.scrollTo(position);
        } else {
            pendingScroll.current = position;
            setZoom(next);
        }
    }

    function fitToScreen() {
        const viewport = viewportRef.current;
        if (!viewport) return;
        // Leave a little spare room so rounding cannot introduce a scrollbar.
        const availableWidth = Math.max(1, viewport.clientWidth - 2);
        const availableHeight = Math.max(1, viewport.clientHeight - 2);
        changeZoom(Math.min(1, availableWidth / width, availableHeight / height), true);
    }
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
        suppressClick.current = false;
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
        <div className="pv-graph-panel">
            <div className="pv-graph-toolbar" role="group" aria-label="Graph zoom controls">
                <button type="button" className="pv-btn alt" aria-label="Zoom out" title="Zoom out"
                    disabled={zoom <= 0.1} onClick={() => changeZoom(Math.max(0.1, zoom / 1.25))}>−</button>
                <output className="pv-graph-zoom" aria-live="polite" aria-label="Zoom level">
                    {Math.round(zoom * 1000) / 10}%
                </output>
                <button type="button" className="pv-btn alt" aria-label="Zoom in" title="Zoom in"
                    disabled={zoom >= 3} onClick={() => changeZoom(Math.min(3, Math.max(0.1, zoom * 1.25)))}>+</button>
                <button type="button" className="pv-btn alt" onClick={fitToScreen}>Fit to screen</button>
                <button type="button" className="pv-btn alt" onClick={() => changeZoom(1)}>Reset to 100%</button>
            </div>
        <div
            ref={viewportRef}
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
            <svg width={width * zoom} height={height * zoom} viewBox={`0 0 ${width} ${height}`}
                role="group" aria-label="Course prerequisite graph">
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
        </div>
    );
}

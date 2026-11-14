import "./PrereqGraph.css";
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

    return (
        <div className="pv-graph">
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
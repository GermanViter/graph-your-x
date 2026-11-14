export type Course = {
    id: string;
    prereqs: string[];
    depth: number; // column index in the graph
    x: number;
    y: number;
    w: number;
};

export type Status = "done" | "ready" | "locked";
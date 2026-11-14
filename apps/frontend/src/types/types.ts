export type Course = {
    id: string;
    name?: string;
    description?: string;
    category?: string;
    difficulty?: number;
    recommended?: string[];
    prereqs: string[];
    depth: number; // column index in the graph
    x: number;
    y: number;
    w: number;
};

export type Status = "done" | "ready" | "locked";
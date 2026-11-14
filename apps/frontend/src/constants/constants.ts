import type { Status } from '../types/types';

// Graph layout
export const NODE_HEIGHT = 44;
export const ROW_PITCH = 66;
export const COLUMN_GAP = 84;
export const GRAPH_PADDING = 28;

// Colors and labels for each course status
export const STATUS_STYLES: Record<Status, { fill: string; stroke: string; text: string; label: string }> = {
    done: { fill: "#0e8a7d", stroke: "#0e8a7d", text: "#fff", label: "Completed" },
    ready: { fill: "#fff6dd", stroke: "#c98a00", text: "#16213a", label: "Ready to take" },
    locked: { fill: "#f3f5f8", stroke: "#b6c0cd", text: "#7a8599", label: "Locked" },
};

export const SELECTED_COLOR = "#5a3fd0";

// Sample curriculum in the "Name: prereq, prereq" format
export const SAMPLE_CURRICULUM = `Intro Programming:
Calculus I:
Data Structures: Intro Programming
Discrete Math: Calculus I
Calculus II: Calculus I
Computer Organization: Data Structures
Algorithms: Data Structures, Discrete Math
Linear Algebra: Calculus II
Probability: Calculus II
Operating Systems: Computer Organization, Algorithms
Databases: Algorithms
Compilers: Algorithms, Computer Organization
Machine Learning: Algorithms, Linear Algebra, Probability
Distributed Systems: Operating Systems, Databases
Deep Learning: Machine Learning`;
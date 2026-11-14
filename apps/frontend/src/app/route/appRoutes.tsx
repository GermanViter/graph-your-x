import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import ErrorBoundary from "../../components/error-boundary/ErrorBoundary.tsx";
import MainLayout from "../../components/layout/MainLayout.tsx";

const Landing = lazy(() => import("../../pages/landing/Landing.tsx"));
const Graph = lazy(() => import("../../pages/graph/Graph.tsx"));


export const router = createBrowserRouter([
    {
        errorElement: <ErrorBoundary />,
        children: [
            {
                element: <MainLayout />,
                children: [
                    { path: "/", element: <Landing /> },
                    { path: "/graph", element: <Graph /> },
                ]
            }
        ]
    }
]);
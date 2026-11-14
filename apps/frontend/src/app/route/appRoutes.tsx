import { Landing, Graph } from "./RoutePages.tsx";
import { createBrowserRouter } from "react-router-dom";
import ErrorBoundary from "../../components/error-boundary/ErrorBoundary.tsx";
import MainLayout from "../../components/layout/MainLayout.tsx";



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
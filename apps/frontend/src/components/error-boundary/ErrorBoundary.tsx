import "./ErrorBoundary.css";
import { useRouteError } from "react-router-dom";

export default function ErrorBoundary() {
  const error = useRouteError() as any;
  console.error(error);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Oops! Something went wrong.</h2>
      <p>We're working on fixing this issue.</p>
      <pre style={{ color: "red" }}>
        {error.statusText || error.message}
      </pre>
    </div>
  );
}
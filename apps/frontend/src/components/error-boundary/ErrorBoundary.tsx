import "./ErrorBoundary.css";
import { useRouteError } from "react-router-dom";

export default function ErrorBoundary() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message :
    error && typeof error === 'object' && 'statusText' in error ? String(error.statusText) : 'Please reload the page and try again.';
  console.error(error);

  return (
    <div className="error-state">
      <h2>Oops! Something went wrong.</h2>
      <p>We're working on fixing this issue.</p>
      <pre>
        {message}
      </pre>
    </div>
  );
}
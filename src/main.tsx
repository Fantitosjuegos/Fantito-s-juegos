import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary"; // 1. Import it
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ErrorBoundary> {/* 2. Wrap App here */}
      <App />
    </ErrorBoundary>
  </HelmetProvider>
);
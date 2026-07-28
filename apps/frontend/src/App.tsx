// @ts-ignore — CSS side-effect import
import "./index.css";

import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import type { ReactNode } from "react";

import Auth from "./screens/Auth";
import Dashboard from "./screens/Dashboard";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* Catch-all: redirect unknown routes to auth */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

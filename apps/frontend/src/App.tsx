// @ts-ignore — CSS side-effect import
import "./index.css";

import { useState, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import type { ReactNode } from "react";

import Auth from "./screens/Auth";
import Dashboard from "./screens/Dashboard";
import Editor from "./screens/Editor";
import Submissions from "./screens/Submissions";
import { fetchCurrentUser } from "./lib/api";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      try {
        const user = await fetchCurrentUser();
        if (mounted) {
          setIsAuthenticated(!!user);
          setChecking(false);
        }
      } catch {
        if (mounted) {
          setIsAuthenticated(false);
          setChecking(false);
        }
      }
    }
    checkAuth();
    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground font-sans">
        <div className="flex items-center gap-3 text-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Verifying session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      try {
        const user = await fetchCurrentUser();
        if (mounted) {
          setIsAuthenticated(!!user);
          setChecking(false);
        }
      } catch {
        if (mounted) {
          setIsAuthenticated(false);
          setChecking(false);
        }
      }
    }
    checkAuth();
    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/problem/:id"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/submissions"
          element={
            <ProtectedRoute>
              <Submissions />
            </ProtectedRoute>
          }
        />

        {/* Catch-all: redirect unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

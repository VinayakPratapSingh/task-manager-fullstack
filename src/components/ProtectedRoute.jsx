import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AUTH_URL } from "../config";

function ProtectedRoute() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    async function checkAuthentication() {
      try {
        const response = await fetch(`${AUTH_URL}/me`, {
          credentials: "include",
        });

        if (!response.ok) {
          setStatus("unauthenticated");
          return;
        }

        const result = await response.json();

        setStatus(
          result.success ? "authenticated" : "unauthenticated"
        );
      } catch {
        setStatus("error");
      }
    }

    checkAuthentication();
  }, []);

  if (status === "checking") {
    return (
      <main className="app">
        <p>Checking your login session...</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="app">
        <p className="notice error">
          Cannot connect to the backend. Please check whether your server is running.
        </p>
      </main>
    );
  }

  return status === "authenticated" ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
}

export default ProtectedRoute;
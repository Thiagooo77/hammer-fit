import { createFileRoute, Link, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => <Navigate to="/reception/dashboard" />,
});

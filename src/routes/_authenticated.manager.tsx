import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/manager")({
  beforeLoad: ({ context }) => {
    // Skip during SSR
    if (typeof window === "undefined") return;
    
    if (context.role !== "manager" && context.role !== "admin") {
      console.warn('[PERMISSION_DENIED] Manager module bypass attempt detected', { user: context.user?.email });
      throw redirect({ to: "/unauthorized" });
    }
  },
  component: () => <Outlet />,
});

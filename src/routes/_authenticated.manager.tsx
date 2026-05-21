import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/manager")({
  beforeLoad: ({ context }) => {
    if (context.role !== "manager" && context.role !== "admin") {
      throw redirect({ to: "/unauthorized" });
    }
  },
  component: () => <Outlet />,
});

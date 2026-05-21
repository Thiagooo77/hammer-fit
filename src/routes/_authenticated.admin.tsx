import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    // context comes from parent layout (_authenticated)
    if (context.role !== "admin" && context.role !== "manager") {
      throw redirect({ to: "/unauthorized" });
    }
  },
  component: () => <Outlet />,
});

import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    // context comes from parent layout (_authenticated)
    if (context.role !== "admin" && context.role !== "manager") {
      console.log('[PERMISSION_DENIED] Admin module bypass attempt detected', { user: context.user.email });
      throw redirect({ to: "/unauthorized" });
    }
  },
  component: () => <Outlet />,
});

import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/clube")({
  component: () => <Outlet />,
});

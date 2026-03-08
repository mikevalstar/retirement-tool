import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/simulation/")({
  beforeLoad: () => {
    throw redirect({ to: "/simulation/results" });
  },
  component: () => null,
});

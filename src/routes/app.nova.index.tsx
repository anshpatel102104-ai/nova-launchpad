// Nova's front door — the product home for the operating layer.
// Kept as a redirect so existing links, bookmarks, and AI tool chips keep working.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/nova/")({
  beforeLoad: () => {
    throw redirect({ to: "/app/nova-home", replace: true });
  },
});

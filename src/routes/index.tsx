import { createFileRoute } from "@tanstack/react-router";
import { GameEntry } from "@/GameEntry";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Expedice – minihra" },
      {
        name: "description",
        content: "Krátká odpočinková hra: vyber cestu a nasbírej co nejvíc bodů.",
      },
      { property: "og:title", content: "Expedice – minihra" },
      {
        property: "og:description",
        content: "Krátká odpočinková hra: vyber cestu a nasbírej co nejvíc bodů.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GameEntry,
});

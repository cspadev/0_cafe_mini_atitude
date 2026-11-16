import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Game } from "@/Game";
import { config } from "@/model/config";
import { Placeholder } from "@/Placeholder";

export function GameEntry() {
  const [embedded, setEmbedded] = useState<boolean | null>(null);

  useEffect(() => {
    setEmbedded(window.parent !== window);
  }, []);

  if (embedded === null) return null;
  return config.placeholderInIframe && embedded ? <Placeholder /> : <Game />;
}

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

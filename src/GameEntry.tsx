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

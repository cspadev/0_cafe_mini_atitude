import { Cloud, Flag, Flame, Mountain, Scale, Shield, Sun, Tent } from "lucide-react";
import type { ButtonId } from "@/model/config";

export function SunArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-label="slunce" role="img">
      <g stroke="var(--sun)" strokeWidth="4" strokeLinecap="round">
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return <line key={i} x1={32 + Math.cos(a) * 20} y1={32 + Math.sin(a) * 20} x2={32 + Math.cos(a) * 27} y2={32 + Math.sin(a) * 27} />;
        })}
      </g>
      <circle cx="32" cy="32" r="14" fill="var(--sun)" />
      <circle cx="27" cy="27" r="4" fill="var(--sun-glow)" opacity=".8" />
    </svg>
  );
}

export function CloudArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-label="mráček" role="img">
      <path d="M18 46h30a10 10 0 0 0 0-20 14 14 0 0 0-27-2A11 11 0 0 0 18 46z" fill="var(--cloud)" />
      <path d="M22 40h22" stroke="var(--snow)" strokeWidth="3" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}

export const ButtonIcon = ({ id, className }: { id: ButtonId; className?: string }) =>
  id === "jistota" ? <Tent className={className} aria-hidden /> : id === "prilezitost" ? <Flag className={className} aria-hidden /> : <Mountain className={className} aria-hidden />;

export const ProfileIcon = ({ icon, className }: { icon: string; className?: string }) =>
  icon === "shield" ? <Shield className={className} aria-hidden /> : icon === "scale" ? <Scale className={className} aria-hidden /> : <Flame className={className} aria-hidden />;

export const MiniSun = () => <Sun className="inline size-4 text-sun" aria-label="slunce" />;
export const MiniCloud = () => <Cloud className="inline size-4 text-cloud" aria-label="mráček" />;

export const CHOICE_STYLE: Record<ButtonId, { bg: string; soft: string; text: string; fill: string }> = {
  jistota: { bg: "bg-jistota", soft: "bg-jistota-soft", text: "text-jistota", fill: "var(--jistota)" },
  prilezitost: { bg: "bg-prilezitost", soft: "bg-prilezitost-soft", text: "text-prilezitost", fill: "var(--prilezitost)" },
  vrchol: { bg: "bg-vrchol", soft: "bg-vrchol-soft", text: "text-vrchol", fill: "var(--vrchol)" },
};

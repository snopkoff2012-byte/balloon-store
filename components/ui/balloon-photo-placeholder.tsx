import type { CSSProperties } from "react";

export type BalloonPhotoVariant =
  | "hero"
  | "wedding"
  | "birthday"
  | "baby"
  | "gender"
  | "product";

type BalloonPhotoPlaceholderProps = {
  variant?: BalloonPhotoVariant;
  className?: string;
  compact?: boolean;
  label?: string;
};

const palettes: Record<BalloonPhotoVariant, string[]> = {
  hero: ["#7c2342", "#ef9d7f", "#f6d6ca", "#cbbce0", "#fff6ea", "#ba4965"],
  wedding: ["#f8efe1", "#e7d4b6", "#ffffff", "#c8b49a", "#efe5d9", "#9d6c5b"],
  birthday: ["#77314f", "#dc7390", "#f5c2b1", "#d2c6e7", "#f0dd95", "#ffffff"],
  baby: ["#d5e2e5", "#f3ddd2", "#fff7ea", "#b7cdd2", "#e9c3cf", "#ffffff"],
  gender: ["#eab8cb", "#bdd8e9", "#fff3dc", "#d38caf", "#8ebcd6", "#ffffff"],
  product: ["#b74563", "#ed9c82", "#f4d4c8", "#d3c7e3", "#fff6e9", "#762440"],
};

const positions = [
  { left: "8%", top: "22%", width: "31%", height: "40%", rotate: "-8deg" },
  { left: "31%", top: "8%", width: "29%", height: "38%", rotate: "4deg" },
  { left: "57%", top: "20%", width: "34%", height: "43%", rotate: "8deg" },
  { left: "20%", top: "48%", width: "30%", height: "38%", rotate: "7deg" },
  { left: "48%", top: "48%", width: "29%", height: "37%", rotate: "-5deg" },
  { left: "69%", top: "53%", width: "22%", height: "29%", rotate: "10deg" },
];

export function BalloonPhotoPlaceholder({
  variant = "hero",
  className = "",
  compact = false,
  label = "Локальная заглушка фотографии композиции из воздушных шаров",
}: BalloonPhotoPlaceholderProps) {
  const colors = palettes[variant];

  return (
    <div
      className={`balloon-photo relative isolate overflow-hidden bg-[#e9dfd9] ${className}`}
      role="img"
      aria-label={label}
    >
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.56),transparent_58%)]" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[#c8b8ae]/35" />
      {positions.map((position, index) => (
        <span
          key={`${variant}-${index}`}
          className="balloon-shape absolute shadow-[0_18px_35px_rgba(69,42,54,0.15)]"
          style={
            {
              left: position.left,
              top: position.top,
              width: position.width,
              height: position.height,
              rotate: position.rotate,
              background: colors[index],
              "--balloon-delay": `${index * -0.55}s`,
            } as CSSProperties
          }
          aria-hidden="true"
        />
      ))}
      <span
        className="absolute bottom-0 left-1/2 h-[43%] w-px -translate-x-1/2 bg-[#6d535c]/25"
        aria-hidden="true"
      />
      {!compact ? (
        <div className="absolute inset-x-4 bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl bg-white/90 px-4 py-3 text-xs font-bold text-[#5e4f59] shadow-lg shadow-[#5b3040]/10 backdrop-blur sm:inset-x-6 sm:bottom-6">
          <span>Композиция собирается вручную</span>
          <span className="size-2 shrink-0 rounded-full bg-[#a42a4d]" />
        </div>
      ) : null}
    </div>
  );
}

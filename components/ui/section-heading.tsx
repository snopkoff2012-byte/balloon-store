type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  inverted?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  inverted = false,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p
        className={`text-xs font-extrabold uppercase tracking-[0.2em] ${
          inverted ? "text-[#f2ad92]" : "text-[#a42a4d]"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-3 font-display text-[2.15rem] leading-[1.08] tracking-[-0.03em] sm:text-5xl ${
          inverted ? "text-white" : "text-[#281d28]"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-4 text-base leading-7 sm:text-lg ${
            inverted ? "text-white/70" : "text-[#6f626d]"
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

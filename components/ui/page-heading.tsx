type PageHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeading({
  eyebrow,
  title,
  description,
}: PageHeadingProps) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.2em] text-[#a42a4d]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-display text-4xl leading-[1.08] tracking-[-0.03em] text-[#281d28] sm:text-6xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-5 text-base leading-7 text-[#6f626d] sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

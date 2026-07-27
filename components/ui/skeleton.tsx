type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <span
      className={`skeleton block rounded-2xl bg-[#e9e1dc] ${className}`}
      aria-hidden="true"
    />
  );
}

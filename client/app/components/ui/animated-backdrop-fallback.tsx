type AnimatedBackdropFallbackProps = {
  title?: string;
  className?: string;
};

export default function AnimatedBackdropFallback({
  className = "",
}: AnimatedBackdropFallbackProps) {
  return (
    <div
      className={`backdrop-fallback-bg absolute inset-0 h-full w-full overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(255,244,196,0.16),transparent_22%),radial-gradient(circle_at_78%_24%,rgba(125,211,252,0.18),transparent_24%),radial-gradient(circle_at_68%_76%,rgba(16,185,129,0.14),transparent_22%),radial-gradient(circle_at_28%_72%,rgba(249,115,22,0.12),transparent_20%)]" />
      <div className="absolute inset-0 opacity-70 mix-blend-screen backdrop-fallback-orbs" />
    </div>
  );
}

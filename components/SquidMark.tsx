export default function SquidMark({ size = 40 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.62,
        background: "radial-gradient(circle at 35% 30%, #1a3a52 0%, #0b1220 70%)",
        boxShadow: "0 0 0 2px #2dd4bf inset, 0 0 18px rgba(45,212,191,0.35)",
        lineHeight: 1,
      }}
      aria-hidden
    >
      🦑
    </span>
  );
}

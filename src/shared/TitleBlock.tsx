export interface BadgeSpec {
  label: string
  value: string
  color: string
}

/** Generic title + subtitle + complexity badges, sized for the 1080-wide
 *  design canvas so it stays proportional in the 9:16 frame. */
export default function TitleBlock({
  title,
  subtitle,
  badges = [],
}: {
  title: string
  subtitle?: string
  badges?: BadgeSpec[]
}) {
  return (
    <header className="flex flex-col items-center text-center select-none">
      <h1
        className="font-bold text-white"
        style={{
          letterSpacing: '0.4em',
          fontSize: 72,
          lineHeight: 1.1,
          textShadow: '0 0 28px rgba(59,130,246,0.4)',
        }}
      >
        {title}
      </h1>

      {subtitle && (
        <p className="mt-5 text-neutral-400" style={{ fontSize: 26, maxWidth: 760 }}>
          {subtitle}
        </p>
      )}

      {badges.length > 0 && (
        <div className="mt-8 flex items-center justify-center gap-5">
          {badges.map((b) => (
            <Badge key={b.label} {...b} />
          ))}
        </div>
      )}
    </header>
  )
}

function Badge({ label, value, color }: BadgeSpec) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-full border font-mono tracking-wider"
      style={{
        borderColor: `${color}55`,
        background: `${color}14`,
        boxShadow: `0 0 18px ${color}22`,
        fontSize: 22,
        padding: '10px 22px',
      }}
    >
      <span className="text-neutral-400">{label}</span>
      <span style={{ color }}>·</span>
      <span className="font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

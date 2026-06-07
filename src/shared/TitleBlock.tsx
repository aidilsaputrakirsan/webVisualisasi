import { useCourseTheme } from './courseTheme'

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
  const theme = useCourseTheme()
  return (
    <header className="flex flex-col items-center text-center select-none">
      <h1
        className="font-serif font-semibold"
        style={{
          letterSpacing: '0.06em',
          fontSize: 78,
          lineHeight: 1.05,
          color: theme.ink,
        }}
      >
        {title}
      </h1>

      {subtitle && (
        <p className="mt-5" style={{ fontSize: 26, maxWidth: 780, color: '#6B6258' }}>
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
        borderColor: `${color}66`,
        background: `${color}12`,
        fontSize: 22,
        padding: '9px 22px',
      }}
    >
      <span style={{ color: '#6B6258' }}>{label}</span>
      <span style={{ color }}>·</span>
      <span className="font-semibold" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

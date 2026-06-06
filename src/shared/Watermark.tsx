/**
 * Branding watermark rendered *inside* the recording canvas, so it is captured
 * when the tab is screen-recorded. Edit the two constants below to rebrand.
 */
const INSTAGRAM = '@aidilsaputrakirsan'
const WEBSITE = 'myst-tech.com'

export default function Watermark() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-12 flex select-none items-center justify-center gap-8 font-mono"
      style={{ zIndex: 5, fontSize: 26 }}
    >
      <span className="flex items-center gap-2.5" style={{ color: '#6B6258' }}>
        <InstagramGlyph />
        <span className="tracking-wide">{INSTAGRAM}</span>
      </span>
      <span style={{ color: '#A89E90' }}>•</span>
      <span className="flex items-center gap-2.5">
        <GlobeGlyph />
        <span className="tracking-wide font-semibold" style={{ color: '#B45309' }}>
          {WEBSITE}
        </span>
      </span>
    </div>
  )
}

function InstagramGlyph() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" stroke="#6B6258" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" stroke="#6B6258" strokeWidth="1.8" />
      <circle cx="17.4" cy="6.6" r="1.2" fill="#6B6258" />
    </svg>
  )
}

function GlobeGlyph() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.2" stroke="#B45309" strokeWidth="1.6" />
      <path
        d="M3 12h18M12 3c2.5 2.5 3.8 5.8 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.8-3.8-9S9.5 5.5 12 3z"
        stroke="#B45309"
        strokeWidth="1.6"
      />
    </svg>
  )
}

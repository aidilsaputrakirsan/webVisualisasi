/**
 * Line icons for the Laravel course (Lucide-style, 24×24 grid). All strokes use
 * `currentColor` so a parent's colour drives them — never emoji.
 */
interface IconProps {
  size?: number
  strokeWidth?: number
}

function Svg({ size = 24, strokeWidth = 1.8, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

/** Terminal / artisan CLI. */
export function TerminalIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="2.5" y="4" width="19" height="16" rx="2.5" />
      <path d="M7 9.5l3 2.5-3 2.5M13 15h4" />
    </Svg>
  )
}

/** Package / composer dependency. */
export function PackageIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.8l8 4.2v10L12 21.2 4 17V7z" />
      <path d="M4 7l8 4.2L20 7M12 11.2V21" />
    </Svg>
  )
}

/** Folder — directory structure. */
export function FolderIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 6.5A1.5 1.5 0 014.5 5h4l2 2.5h7A1.5 1.5 0 0119 9v8.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 013 17.5z" />
    </Svg>
  )
}

/** Globe — incoming HTTP request from the browser. */
export function GlobeIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
    </Svg>
  )
}

/** Layers — the middleware stack. */
export function LayersIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3l9 4.5-9 4.5-9-4.5z" />
      <path d="M3 12.5l9 4.5 9-4.5M3 16.8l9 4.5 9-4.5" />
    </Svg>
  )
}

/** Signpost — the router matching a URI. */
export function RouteIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="6" cy="18" r="2.6" />
      <circle cx="18" cy="6" r="2.6" />
      <path d="M6 15.4V9a3 3 0 013-3h4M18 8.6V15a3 3 0 01-3 3h-4" />
    </Svg>
  )
}

/** Sliders — a controller dispatching work. */
export function ControllerIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="9" cy="7" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="8" cy="17" r="2" />
    </Svg>
  )
}

/** Database cylinder — the model's table. */
export function DatabaseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </Svg>
  )
}

/** Cube — a model instance / object. */
export function ModelIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.8l8 4.2v10L12 21.2 4 17V7z" />
      <path d="M4 7l8 4.2 8-4.2M12 11.2V21" />
      <circle cx="12" cy="11.2" r="0.6" fill="currentColor" />
    </Svg>
  )
}

/** Document — a Blade view / rendered page. */
export function ViewIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 3h7l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M13 3v5h5M8.5 13h7M8.5 17h5" />
    </Svg>
  )
}

/** Arrow leaving a box — the response sent back. */
export function ResponseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20 12H9M13 7l-4 5 4 5" />
      <path d="M4 4v16" />
    </Svg>
  )
}

/** Shield — CSRF / auth middleware. */
export function ShieldIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.8l7 2.8v6c0 4.4-2.9 8.2-7 9.6-4.1-1.4-7-5.2-7-9.6v-6z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </Svg>
  )
}

/** Gear — service container / bootstrapping. */
export function GearIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.6v2.6M12 18.8v2.6M21.4 12h-2.6M5.2 12H2.6M18.6 5.4l-1.8 1.8M7.2 16.8l-1.8 1.8M18.6 18.6l-1.8-1.8M7.2 7.2L5.4 5.4" />
    </Svg>
  )
}

/** Download cloud — installing PHP / dependencies. */
export function DownloadIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 3v11M8 10.5l4 4 4-4" />
      <path d="M4 17.5V19a2 2 0 002 2h12a2 2 0 002-2v-1.5" />
    </Svg>
  )
}

/** Lightning — the dev server running. */
export function BoltIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M13 2.5L5 13.5h6l-2 8 8-11h-6z" />
    </Svg>
  )
}

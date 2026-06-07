import { useEffect, useState, type ReactNode } from 'react'
import Watermark from './Watermark'
import { useCourseTheme } from './courseTheme'

/** Fixed 9:16 design canvas (matches a 1080×1920 reel). */
export const CANVAS_W = 1080
export const CANVAS_H = 1920

/**
 * Renders a pixel-perfect 1080×1920 (9:16) canvas, scaled uniformly to fit the
 * viewport. Because everything inside is sized in fixed px against this canvas,
 * the layout, fonts and spacing always stay proportional — what you see is
 * exactly what gets recorded.
 *
 * Keep playback controls OUTSIDE this component (render as siblings) so the
 * recorded frame stays clean.
 */
export default function MaterialStage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1)
  const theme = useCourseTheme()

  useEffect(() => {
    const update = () => {
      const pad = 32 // breathing room around the frame
      const s = Math.min(
        (window.innerWidth - pad) / CANVAS_W,
        (window.innerHeight - pad) / CANVAS_H,
      )
      setScale(s > 0 ? s : 1)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ background: theme.letterbox }}>
      <div
        className="relative shrink-0 overflow-hidden"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          background: theme.stageBg,
          border: '1px solid #E4DCCF',
          boxShadow: '0 18px 60px rgba(33,28,22,0.14)',
        }}
      >
        {children}
        <Watermark />
      </div>
    </div>
  )
}

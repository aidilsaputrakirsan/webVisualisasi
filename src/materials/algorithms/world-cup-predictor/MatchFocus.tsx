import { theme, NODE } from '../../../shared/theme'
import { CheckIcon } from '../../../shared/Icons'
import { TEAM_MAP, winProbability, formatPct, type PredictorStep, type Team } from './worldCup'
import { DiceIcon } from './Icons'

const ROUND_LABELS: Record<number, string> = { 0: 'ROUND OF 16', 1: 'QUARTERFINAL', 2: 'SEMIFINAL', 3: 'FINAL' }
const ROUND_SIZES: Record<number, number> = { 0: 8, 1: 4, 2: 2, 3: 1 }

interface FooterNote {
  icon: 'check' | null
  text: string
}

/** One big "current match" card — only the match actually being narrated
 *  right now gets screen space, so its text can be large and legible in the
 *  recorded 9:16 frame. A small chip trail below gives context (who else
 *  already advanced this round) without competing for space. */
export default function MatchFocus({ step }: { step: PredictorStep }) {
  if (step.stage === 'r32') {
    if (step.activeR32Index == null) return null
    const m = step.r32[step.activeR32Index]
    const a = TEAM_MAP[m.teamAId]
    const b = TEAM_MAP[m.teamBId]
    const trail = step.r32.filter((x) => x.winnerId && x.index !== m.index).map((x) => TEAM_MAP[x.winnerId!])
    const footer: FooterNote | null = m.decided
      ? { icon: 'check', text: `Real result · ${m.resultNote}` }
      : m.winnerId
        ? { icon: null, text: 'Simulated result' }
        : null

    return (
      <Focus
        roundLabel="ROUND OF 32"
        position={`MATCH ${m.index + 1} OF 16`}
        a={a}
        b={b}
        winnerId={m.winnerId}
        showProb={step.showR32Prob}
        footer={footer}
        trail={trail}
      />
    )
  }

  if (step.stage === 'tree') {
    if (!step.activeTreeKey) return null
    const [roundStr, idxStr] = step.activeTreeKey.split('-')
    const round = Number(roundStr)
    const idx = Number(idxStr)
    const m = step.tree.find((x) => x.round === round && x.matchIndex === idx)
    if (!m || !m.teamAId || !m.teamBId) return null
    const a = TEAM_MAP[m.teamAId]
    const b = TEAM_MAP[m.teamBId]
    const trail = step.tree
      .filter((x) => x.round === round && x.winnerId && x.matchIndex !== idx)
      .map((x) => TEAM_MAP[x.winnerId!])

    return (
      <Focus
        roundLabel={ROUND_LABELS[round]}
        position={`MATCH ${idx + 1} OF ${ROUND_SIZES[round]}`}
        a={a}
        b={b}
        winnerId={m.winnerId}
        showProb={step.showTreeProb}
        footer={m.winnerId ? { icon: null, text: 'Simulated result' } : null}
        trail={trail}
      />
    )
  }

  return null
}

function Focus({
  roundLabel,
  position,
  a,
  b,
  winnerId,
  showProb,
  footer,
  trail,
}: {
  roundLabel: string
  position: string
  a: Team
  b: Team
  winnerId: string | null
  showProb: boolean
  footer: FooterNote | null
  trail: Team[]
}) {
  const probA = winProbability(a, b)
  const active = showProb && !winnerId

  return (
    <div style={{ width: 900 }}>
      <div
        className="flex items-center justify-center gap-3 font-mono"
        style={{ fontSize: 19, letterSpacing: '0.06em', color: theme.inkFaint, marginBottom: 14 }}
      >
        <span>{roundLabel}</span>
        <span style={{ color: theme.lineStrong }}>·</span>
        <span>{position}</span>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border"
        style={{
          borderColor: active ? NODE.active.border : theme.line,
          background: theme.surface,
          boxShadow: active ? NODE.active.shadow : '0 4px 16px rgba(33,28,22,0.06)',
          transition: 'border-color 0.25s, box-shadow 0.25s',
        }}
      >
        {active && (
          <div className="absolute" style={{ top: 14, right: 18, color: NODE.active.border }}>
            <DiceIcon size={26} />
          </div>
        )}
        <BigTeamRow team={a} isWinner={winnerId === a.id} decided={!!winnerId} prob={active ? probA : null} />
        <div style={{ height: 1, background: theme.line }} />
        <BigTeamRow team={b} isWinner={winnerId === b.id} decided={!!winnerId} prob={active ? 1 - probA : null} />

        {footer && (
          <div
            className="flex items-center justify-center gap-2 px-4 font-mono"
            style={{ height: 40, fontSize: 17, color: NODE.done.text, background: NODE.done.bg, borderTop: `1px solid ${theme.line}` }}
          >
            {footer.icon === 'check' && <CheckIcon size={16} strokeWidth={2.6} />}
            {footer.text}
          </div>
        )}
      </div>

      {trail.length > 0 && (
        <div className="flex flex-wrap items-center justify-center" style={{ gap: 8, marginTop: 16 }}>
          {trail.map((t) => (
            <span
              key={t.id}
              className="flex items-center gap-1.5 rounded-full border font-mono"
              style={{ padding: '5px 12px', fontSize: 14, borderColor: theme.line, background: theme.paperDeep, color: theme.inkSoft }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 999, background: t.color }} />
              {t.id}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function BigTeamRow({
  team,
  isWinner,
  decided,
  prob,
}: {
  team: Team
  isWinner: boolean
  decided: boolean
  prob: number | null
}) {
  const dim = decided && !isWinner
  return (
    <div
      className="flex items-center justify-between px-7"
      style={{
        height: 82,
        background: isWinner ? NODE.done.bg : 'transparent',
        opacity: dim ? 0.45 : 1,
        transition: 'background-color 0.25s, opacity 0.25s',
      }}
    >
      <span className="flex items-center" style={{ gap: 14, minWidth: 0 }}>
        <span style={{ width: 16, height: 16, borderRadius: 999, background: team.color, flexShrink: 0 }} />
        <span className="truncate font-mono font-semibold" style={{ fontSize: 30, color: isWinner ? NODE.done.text : theme.ink }}>
          {team.name}
        </span>
        {isWinner && <CheckIcon size={20} strokeWidth={2.6} />}
      </span>
      {prob != null ? (
        <span className="font-mono font-bold" style={{ fontSize: 28, color: NODE.active.text }}>
          {formatPct(prob)}
        </span>
      ) : (
        <span className="font-mono" style={{ fontSize: 19, color: theme.inkFaint }}>
          rating {team.rating}
        </span>
      )}
    </div>
  )
}

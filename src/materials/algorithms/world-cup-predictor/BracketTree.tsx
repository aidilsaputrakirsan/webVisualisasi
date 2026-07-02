import { theme, NODE } from '../../../shared/theme'
import { TEAM_MAP, winProbability, formatPct, type BracketMatch, type PredictorStep, type Team } from './worldCup'
import { DiceIcon } from './Icons'

const COL_W = 240
const ROW_H = 64
const ROW_GAP = 12
const LEAF_ROWS = 8 // 2 unit-rows per each of the 4 Quarterfinal matches

const ROUND_LABELS = ['QUARTERFINAL', 'SEMIFINAL', 'FINAL']

/** Bracket diagram for the last 3 rounds (8 quarterfinalists -> champion).
 *  Deliberately starts at the Quarterfinal, not the full 32/16-team field —
 *  with only 8 leaves the cards get real room, so this stays legible.
 *  This shows ONE simulated path (trial 1 of the Monte Carlo run); the
 *  trophy/"predicted champion" only ever appears in <ChampionReveal>, after
 *  all 4,000 trials, so this diagram is never mistaken for the prediction. */
export default function BracketTree({ step }: { step: PredictorStep }) {
  const find = (round: 1 | 2 | 3, idx: number) => step.tree.find((m) => m.round === round && m.matchIndex === idx)!

  return (
    <div style={{ width: 780 }}>
      <div className="flex justify-center" style={{ marginBottom: 12 }}>
        <span
          className="rounded-full border font-mono"
          style={{ padding: '6px 18px', fontSize: 16, borderColor: `${NODE.info.border}66`, background: NODE.info.bg, color: NODE.info.text }}
        >
          just ONE random simulation — this winner is not the prediction
        </span>
      </div>

      <div className="grid" style={{ gridTemplateColumns: `repeat(3, ${COL_W}px)`, columnGap: 24, marginBottom: 12 }}>
        {ROUND_LABELS.map((label) => (
          <div key={label} className="text-center font-mono" style={{ fontSize: 15, letterSpacing: '0.07em', color: theme.inkFaint }}>
            {label}
          </div>
        ))}
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(3, ${COL_W}px)`,
          gridTemplateRows: `repeat(${LEAF_ROWS}, ${ROW_H}px)`,
          columnGap: 24,
          rowGap: ROW_GAP,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={`qf-${i}`} style={{ gridColumn: 1, gridRow: `${i * 2 + 1} / span 2`, alignSelf: 'center' }}>
            <MatchCard match={find(1, i)} step={step} />
          </div>
        ))}
        {[0, 1].map((i) => (
          <div key={`sf-${i}`} style={{ gridColumn: 2, gridRow: `${i * 4 + 1} / span 4`, alignSelf: 'center' }}>
            <MatchCard match={find(2, i)} step={step} />
          </div>
        ))}
        <div style={{ gridColumn: 3, gridRow: `1 / span ${LEAF_ROWS}`, alignSelf: 'center' }}>
          <MatchCard match={find(3, 0)} step={step} />
        </div>
      </div>
    </div>
  )
}

function MatchCard({ match, step }: { match: BracketMatch; step: PredictorStep }) {
  const key = `${match.round}-${match.matchIndex}`
  const active = step.activeTreeKey === key && step.showTreeProb
  const a = match.teamAId ? TEAM_MAP[match.teamAId] : null
  const b = match.teamBId ? TEAM_MAP[match.teamBId] : null
  const probA = a && b ? winProbability(a, b) : null

  return (
    <div
      className="relative overflow-hidden rounded-xl border"
      style={{
        width: COL_W,
        borderColor: active ? NODE.active.border : theme.line,
        background: theme.surface,
        boxShadow: active ? NODE.active.shadow : '0 1px 6px rgba(0,0,0,0.05)',
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}
    >
      {active && (
        <div className="absolute" style={{ top: 8, right: 10, color: NODE.active.border }}>
          <DiceIcon size={18} />
        </div>
      )}
      <TeamRow team={a} isWinner={match.winnerId === a?.id} decided={!!match.winnerId} prob={active ? probA : null} />
      <div style={{ height: 1, background: theme.line }} />
      <TeamRow
        team={b}
        isWinner={match.winnerId === b?.id}
        decided={!!match.winnerId}
        prob={active && probA != null ? 1 - probA : null}
      />
    </div>
  )
}

function TeamRow({
  team,
  isWinner,
  decided,
  prob,
}: {
  team: Team | null
  isWinner: boolean
  decided: boolean
  prob: number | null
}) {
  if (!team) {
    return (
      <div className="flex items-center px-3" style={{ height: 60, fontSize: 15, color: theme.inkFaint, fontFamily: 'ui-monospace, monospace' }}>
        TBD
      </div>
    )
  }
  const dim = decided && !isWinner
  return (
    <div
      className="flex items-center justify-between px-3"
      style={{
        height: 60,
        background: isWinner ? NODE.done.bg : 'transparent',
        opacity: dim ? 0.45 : 1,
        transition: 'background-color 0.25s, opacity 0.25s',
      }}
    >
      <span className="flex items-center" style={{ gap: 10, minWidth: 0 }}>
        <span style={{ width: 12, height: 12, borderRadius: 999, background: team.color, flexShrink: 0 }} />
        <span className="truncate font-mono font-semibold" style={{ fontSize: 22, color: isWinner ? NODE.done.text : theme.ink }}>
          {team.id}
        </span>
      </span>
      {prob != null ? (
        <span className="font-mono font-semibold" style={{ fontSize: 19, color: NODE.active.text }}>
          {formatPct(prob)}
        </span>
      ) : (
        <span className="font-mono" style={{ fontSize: 16, color: theme.inkFaint }}>
          {team.rating}
        </span>
      )}
    </div>
  )
}

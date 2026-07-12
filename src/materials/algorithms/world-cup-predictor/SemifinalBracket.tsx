import { theme, NODE } from '../../../shared/theme'
import { CheckIcon } from '../../../shared/Icons'
import { TrophyIcon } from './Icons'
import { TEAM_MAP, winProbability, formatPct, type BracketMatch, type PredictorStep, type Team, type MatchKey } from './worldCup'

const COL_W = 320

/** Bagan empat tim: dua semifinal menuju final, lalu juara. Selalu tampil.
 *  Sampai fase Monte Carlo selesai, pemenang belum diisi (TBD). Di langkah
 *  hasil, bagan menampilkan JALUR PREDIKSI (pemenang paling mungkin tiap laga)
 *  sehingga selalu konsisten dengan grafik peluang. */
export default function SemifinalBracket({ step }: { step: PredictorStep }) {
  const get = (key: MatchKey) => step.bracket.find((m) => m.key === key)!
  const isResult = step.stage === 'result'
  const champPct = step.championId && step.probabilities ? step.probabilities[step.championId] : null

  return (
    <div style={{ width: 1000 }}>
      <div className="flex justify-center" style={{ height: 30, marginBottom: 10 }}>
        {isResult && (
          <span
            className="rounded-full border font-mono"
            style={{ padding: '5px 20px', fontSize: 18, borderColor: `${NODE.done.border}66`, background: NODE.done.bg, color: NODE.done.text }}
          >
            PREDIKSI · jalur paling mungkin
          </span>
        )}
      </div>

      <div className="grid" style={{ gridTemplateColumns: `${COL_W}px ${COL_W}px ${COL_W}px`, columnGap: 20 }}>
        <ColLabel text="SEMIFINAL" />
        <ColLabel text="FINAL" />
        <ColLabel text="JUARA" />
      </div>

      <div
        className="grid items-center"
        style={{ gridTemplateColumns: `${COL_W}px ${COL_W}px ${COL_W}px`, columnGap: 20, marginTop: 12 }}
      >
        <div className="flex flex-col justify-center" style={{ gap: 44 }}>
          <MatchCard match={get('sf-0')} step={step} showQf />
          <MatchCard match={get('sf-1')} step={step} showQf />
        </div>

        <div className="flex flex-col justify-center">
          <MatchCard match={get('final')} step={step} />
        </div>

        <div className="flex flex-col justify-center">
          <ChampionSlot finalMatch={get('final')} champPct={champPct} />
        </div>
      </div>
    </div>
  )
}

function ColLabel({ text }: { text: string }) {
  return (
    <div className="text-center font-mono" style={{ fontSize: 18, letterSpacing: '0.08em', color: theme.inkFaint }}>
      {text}
    </div>
  )
}

function MatchCard({ match, step, showQf }: { match: BracketMatch; step: PredictorStep; showQf?: boolean }) {
  const a = match.teamAId ? TEAM_MAP[match.teamAId] : null
  const b = match.teamBId ? TEAM_MAP[match.teamBId] : null
  const probA = a && b ? winProbability(a, b) : null
  const showProb = step.showProb && probA != null

  return (
    <div
      className="relative overflow-hidden rounded-2xl border"
      style={{
        borderColor: theme.line,
        background: theme.surface,
        boxShadow: '0 3px 12px rgba(33,28,22,0.06)',
      }}
    >
      <TeamRow team={a} isWinner={match.winnerId === a?.id} decided={!!match.winnerId} prob={showProb ? probA : null} qf={showQf} />
      <div style={{ height: 1, background: theme.line }} />
      <TeamRow
        team={b}
        isWinner={match.winnerId === b?.id}
        decided={!!match.winnerId}
        prob={showProb && probA != null ? 1 - probA : null}
        qf={showQf}
      />
    </div>
  )
}

function TeamRow({
  team,
  isWinner,
  decided,
  prob,
  qf,
}: {
  team: Team | null
  isWinner: boolean
  decided: boolean
  prob: number | null
  qf?: boolean
}) {
  if (!team) {
    return (
      <div className="flex items-center px-5" style={{ height: 74, fontSize: 22, color: theme.inkFaint, fontFamily: 'ui-monospace, monospace' }}>
        pemenang SF
      </div>
    )
  }
  const dim = decided && !isWinner
  return (
    <div
      className="flex items-center justify-between px-5"
      style={{
        height: qf ? 82 : 78,
        background: isWinner ? NODE.done.bg : 'transparent',
        opacity: dim ? 0.4 : 1,
        transition: 'background-color 0.25s, opacity 0.25s',
      }}
    >
      <span className="flex items-center" style={{ gap: 14, minWidth: 0 }}>
        <span style={{ width: 16, height: 16, borderRadius: 999, background: team.color, flexShrink: 0 }} />
        <span className="flex flex-col" style={{ minWidth: 0 }}>
          <span className="flex items-center" style={{ gap: 9 }}>
            <span className="truncate font-semibold" style={{ fontSize: 32, color: isWinner ? NODE.done.text : theme.ink }}>
              {team.name}
            </span>
            {isWinner && <CheckIcon size={20} strokeWidth={2.6} />}
          </span>
          {qf && (
            <span className="truncate font-mono" style={{ fontSize: 15, color: theme.inkFaint }}>
              8 besar · {team.qf}
            </span>
          )}
        </span>
      </span>
      {prob != null ? (
        <span className="font-mono font-bold" style={{ fontSize: 27, color: NODE.active.text }}>
          {formatPct(prob)}
        </span>
      ) : (
        <span className="font-mono" style={{ fontSize: 18, color: theme.inkFaint }}>
          {team.rating}
        </span>
      )}
    </div>
  )
}

function ChampionSlot({ finalMatch, champPct }: { finalMatch: BracketMatch; champPct: number | null }) {
  const id = finalMatch.winnerId
  if (!id) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed"
        style={{ height: 168, borderColor: theme.lineStrong, color: theme.inkFaint }}
      >
        <TrophyIcon size={40} />
        <span className="mt-2 font-mono" style={{ fontSize: 16 }}>
          menunggu
        </span>
      </div>
    )
  }
  const t = TEAM_MAP[id]
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border text-center"
      style={{ height: 168, borderColor: NODE.done.border, background: NODE.done.bg, boxShadow: NODE.done.shadow, color: NODE.done.text, padding: '0 16px' }}
    >
      <TrophyIcon size={40} />
      <span className="mt-2 font-mono" style={{ fontSize: 15, letterSpacing: '0.06em', color: theme.inkSoft }}>
        PREDIKSI JUARA
      </span>
      <span className="mt-1 truncate font-serif font-bold" style={{ fontSize: 30, maxWidth: COL_W - 40 }}>
        {t.name}
      </span>
      {champPct != null && (
        <span className="mt-1 font-mono font-semibold" style={{ fontSize: 19 }}>
          {formatPct(champPct)} juara
        </span>
      )}
    </div>
  )
}

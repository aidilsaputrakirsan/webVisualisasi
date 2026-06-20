/**
 * Vibe Coding — a comprehensive, chaptered tour.
 *
 * Source material: the "Vibe Coding" roadmap (roadmap.sh/vibe-coding). Vibe
 * coding = building software by describing intent to an AI in a fast loop, while
 * you stay the pilot. This material walks the whole workflow: the mindset, then
 * Plan → Prompt → Build/Context → Debug → Commit → Test → Secure, the tools, and
 * a recap.
 *
 * Same project pattern as every material: precompute ALL frames into `Step[]`,
 * then the component plays them. Each Step is a full snapshot of one frame
 * (which chapter, which pipeline stage is lit, which chat line, which tip card).
 *
 * Visual identity is deliberately different from the Claude Code material: a
 * cool indigo/violet theme, a horizontal workflow Pipeline as the spine, and a
 * You ↔ AI ChatThread instead of a terminal — because vibe coding is a
 * conversation, not a command line.
 */

// ── Palette (cool "creative night" theme, local to this material) ────────────
export const VC = {
  bg: '#15131F',
  panel: '#211E30',
  panelSoft: '#2A2640',
  panelHi: '#352F50',
  line: '#403A5C',
  lineSoft: '#352F4D',
  ink: '#F3F0FB',
  inkSoft: '#CBC4E6',
  inkFaint: '#8A82AE',
  violet: '#A78BFA',
  violetDeep: '#8B5CF6',
  violetText: '#C9BBFF',
  cyan: '#38BDF8',
  mint: '#5EEAD4',
  amber: '#FBBF24',
  pink: '#F472B6',
  green: '#86EFAC',
} as const

// ── Chapters ─────────────────────────────────────────────────────────────────
export type ActId =
  | 'intro'
  | 'plan'
  | 'prompt'
  | 'context'
  | 'debug'
  | 'git'
  | 'test'
  | 'secure'
  | 'tools'
  | 'recap'

export interface Chapter {
  id: ActId
  label: string
  /** Index into PIPELINE that this chapter lights up (-1 = none). */
  stage: number
}

export const CHAPTERS: Chapter[] = [
  { id: 'intro', label: 'The Mindset', stage: -1 },
  { id: 'plan', label: 'Plan', stage: 0 },
  { id: 'prompt', label: 'Prompt', stage: 1 },
  { id: 'context', label: 'Context', stage: 2 },
  { id: 'debug', label: 'Debug', stage: 3 },
  { id: 'git', label: 'Version Control', stage: 4 },
  { id: 'test', label: 'Testing', stage: 5 },
  { id: 'secure', label: 'Security', stage: 6 },
  { id: 'tools', label: 'The Tools', stage: -1 },
  { id: 'recap', label: 'Recap', stage: 6 },
]

// ── The workflow spine (Pipeline header) ─────────────────────────────────────
export interface Stage {
  id: string
  label: string
}
export const PIPELINE: Stage[] = [
  { id: 'plan', label: 'Plan' },
  { id: 'prompt', label: 'Prompt' },
  { id: 'build', label: 'Build' },
  { id: 'debug', label: 'Debug' },
  { id: 'commit', label: 'Commit' },
  { id: 'test', label: 'Test' },
  { id: 'ship', label: 'Ship' },
]

// ── Chat thread model ────────────────────────────────────────────────────────
export type Who = 'you' | 'ai' | 'note'
export interface ChatMsg {
  who: Who
  text: string
  /** Show a small "attachment" chip (mockup / file reference). */
  attach?: string
}

// ── Tip-grid model ───────────────────────────────────────────────────────────
export interface GridItem {
  id: string
  label: string
  /** Icon name resolved by Icons.tsx (no emoji). */
  glyph: string
  tag: string
  detail: string
  color: string
}

// ── Step (one frame) ─────────────────────────────────────────────────────────
export type SoundCue = 'type' | 'send' | 'reply' | 'tip' | 'done'
export interface Step {
  act: ActId
  chapter: number
  heading: string
  sub: string
  status: string
  activeMsg: number // index into CHATS[act], or -1
  sound: SoundCue
  dwell: number
  grid?: { activeId: string | null }
}

// ── Per-chapter chat threads (You ↔ AI) ──────────────────────────────────────
export const CHATS: Record<ActId, ChatMsg[]> = {
  intro: [
    { who: 'you', text: 'Build me a habit tracker app.' },
    { who: 'ai', text: 'Let’s start tiny: add habits and check them off. Good?' },
    { who: 'you', text: 'Yes — keep it simple.' },
    { who: 'ai', text: 'Done. Add + toggle works. Want streaks next?' },
  ],
  plan: [
    { who: 'you', text: 'Plan an MVP for a recipe app, in phases.' },
    { who: 'ai', text: 'P1 list & view · P2 search · P3 favorites. Start P1?' },
    { who: 'you', text: 'Yes. Here’s the layout.', attach: 'mockup.png' },
    { who: 'ai', text: 'Building Phase 1 to match the mockup…' },
  ],
  prompt: [
    { who: 'you', text: 'Add auth.' },
    { who: 'ai', text: 'Email + password, or social? Which provider?' },
    { who: 'you', text: 'Email + password only. No social. Act as a security-minded dev.' },
    { who: 'ai', text: 'Clear. Email/password with hashing, no social login.' },
  ],
  context: [
    { who: 'you', text: 'Still broken after 3 tries…' },
    { who: 'ai', text: 'Context is cluttered. Let’s start a fresh chat.' },
    { who: 'note', text: 'new session — only the failing file' },
    { who: 'ai', text: 'Clean slate. Paste the file and the error.' },
  ],
  debug: [
    { who: 'you', text: 'TypeError: cannot read “map” of undefined' },
    { who: 'ai', text: 'Likely data is null before load. Adding logs + a guard.' },
    { who: 'ai', text: 'Logs show the fetch returns null on first render — adding a loading state.' },
    { who: 'you', text: 'That fixed it.' },
  ],
  git: [
    { who: 'you', text: 'Feature works — save it.' },
    { who: 'ai', text: 'Committing “feat: habit streaks”. New branch for the next one?' },
    { who: 'you', text: 'Yes, new branch.' },
    { who: 'ai', text: 'On “feature/reminders”. Clean slate to build on.' },
  ],
  test: [
    { who: 'you', text: 'Write tests for the cart.' },
    { who: 'ai', text: 'Adding E2E: add item · update qty · checkout. Running…' },
    { who: 'ai', text: '1 failing — total ignores discounts. Fixing, then re-run.' },
    { who: 'you', text: 'Green now. Nice.' },
  ],
  secure: [
    { who: 'you', text: 'Ready to ship?' },
    { who: 'ai', text: 'Quick audit first — found a hardcoded API key. Moving it to .env.' },
    { who: 'you', text: 'Anything else?' },
    { who: 'ai', text: 'Inputs validated, deps look clean. Safe to ship.' },
  ],
  tools: [
    { who: 'you', text: 'Which tool should I use?' },
    { who: 'ai', text: 'Depends on your flow — terminal agent, AI editor, or autocomplete.' },
    { who: 'ai', text: 'Here are the popular ones — pick what fits your loop.' },
  ],
  recap: [
    { who: 'ai', text: 'Plan small · prompt clearly · commit often · test · secure — then ship.' },
    { who: 'you', text: 'Let’s build.' },
  ],
}

const c = VC

// ── Per-chapter tip grids ────────────────────────────────────────────────────
export const GRIDS: Partial<Record<ActId, { cols: number; items: GridItem[] }>> = {
  intro: {
    cols: 1,
    items: [
      { id: 'describe', label: 'Describe, don’t dictate', glyph: 'chat', tag: 'intent over syntax', detail: 'You say what you want in plain language; the AI writes the code to get there.', color: c.violet },
      { id: 'steer', label: 'Stay the pilot', glyph: 'compass', tag: 'you navigate', detail: 'The AI drives, but you review, redirect, and decide. Judgment is still yours.', color: c.cyan },
      { id: 'flow', label: 'Build in flow', glyph: 'wave', tag: 'tight loops', detail: 'Fast cycles of prompt → see result → refine keep momentum and ideas moving.', color: c.mint },
    ],
  },
  plan: {
    cols: 2,
    items: [
      { id: 'mvp', label: 'Scope an MVP', glyph: 'layers', tag: 'smallest thing that works', detail: 'List the minimum that delivers value, then grow it in clear phases.', color: c.violet },
      { id: 'steps', label: 'One step at a time', glyph: 'steps', tag: 'feature by feature', detail: 'Build incrementally — don’t ask the AI to generate the whole app at once.', color: c.cyan },
      { id: 'mockup', label: 'Show, don’t just tell', glyph: 'image', tag: 'mockups & samples', detail: 'Feed mockups, sample code, and images so the AI builds to a real target.', color: c.amber },
      { id: 'spec', label: 'Spec-driven', glyph: 'doc', tag: 'write the spec first', detail: 'A short spec up front gives the AI a clear, testable goal to build toward.', color: c.pink },
    ],
  },
  prompt: {
    cols: 2,
    items: [
      { id: 'specific', label: 'Be specific', glyph: 'target', tag: 'exact > vague', detail: 'Concrete requirements beat high-level wishes — say exactly what you want.', color: c.violet },
      { id: 'onetask', label: 'One task per prompt', glyph: 'list', tag: 'not five at once', detail: 'Ask for a single change at a time so each step is easy to verify.', color: c.cyan },
      { id: 'donot', label: 'Say what NOT to do', glyph: 'ban', tag: 'name the traps', detail: 'Tell the AI the mistakes to avoid based on your past sessions.', color: c.pink },
      { id: 'actas', label: '“Act as…”', glyph: 'persona', tag: 'role framing', detail: 'Frame a role (“act as a senior React dev”) when it sharpens the answer.', color: c.amber },
      { id: 'contextdoc', label: 'Keep a context doc', glyph: 'doc', tag: 'e.g. CLAUDE.md', detail: 'Maintain a project doc so the AI remembers your conventions every session.', color: c.mint },
      { id: 'think', label: 'Tell it to think', glyph: 'brain', tag: '“brainstorm first”', detail: 'Ask the AI to plan or reason before tackling a complex problem.', color: c.violet },
    ],
  },
  context: {
    cols: 2,
    items: [
      { id: 'longctx', label: 'Use the long context', glyph: 'window', tag: 'when it helps', detail: 'Lean on a large context window when the task genuinely needs the extra room.', color: c.violet },
      { id: 'fresh', label: '3 strikes, restart', glyph: 'refresh', tag: 'fresh chat', detail: 'If it keeps failing after ~3 prompts, start a clean chat rather than piling on.', color: c.cyan },
      { id: 'clean', label: 'Clean sessions', glyph: 'broom', tag: 'one task per session', detail: 'New, unrelated task? Clear the context and start fresh to avoid confusion.', color: c.mint },
      { id: 'subagents', label: 'Delegate to subagents', glyph: 'users', tag: 'parallel helpers', detail: 'Spin up subagents for independent sub-tasks when your tool supports it.', color: c.amber },
    ],
  },
  debug: {
    cols: 2,
    items: [
      { id: 'paste', label: 'Paste the error', glyph: 'bug', tag: 'let AI take it', detail: 'Drop the full error message in and let the AI work backward from it.', color: c.pink },
      { id: 'causes', label: 'List the causes', glyph: 'list', tag: 'when it persists', detail: 'Stuck? Ask for a ranked list of likely causes, then test them one by one.', color: c.violet },
      { id: 'logs', label: 'Add logs', glyph: 'logs', tag: 'see what’s happening', detail: 'Have the AI insert logging to pinpoint where things actually break.', color: c.cyan },
      { id: 'mcp', label: 'Use MCP tools', glyph: 'plug', tag: 'e.g. Playwright', detail: 'Connect tools like Playwright so the AI can drive the browser and observe.', color: c.amber },
    ],
  },
  git: {
    cols: 2,
    items: [
      { id: 'commit', label: 'Commit often', glyph: 'commit', tag: 'after each win', detail: 'Save a checkpoint after every successful AI task — easy to roll back.', color: c.violet },
      { id: 'slate', label: 'Clean slate per feature', glyph: 'branch', tag: 'fresh branch', detail: 'Start each new feature on its own branch to keep changes isolated.', color: c.cyan },
      { id: 'revert', label: 'Revert with Git', glyph: 'undo', tag: 'not AI undo', detail: 'When you need to go back, use Git history — it’s reliable and precise.', color: c.pink },
      { id: 'aigit', label: 'Let AI run Git', glyph: 'terminal', tag: 'git & gh CLI', detail: 'Hand off routine git and GitHub CLI chores to the AI to stay in flow.', color: c.amber },
    ],
  },
  test: {
    cols: 2,
    items: [
      { id: 'write', label: 'Ask for tests', glyph: 'flask', tag: 'E2E builds trust', detail: 'Have the AI write tests — end-to-end ones make for a stable product.', color: c.violet },
      { id: 'tdd', label: 'Try TDD', glyph: 'cycle', tag: 'tests first', detail: 'Let tests define the behavior before the code that satisfies them.', color: c.cyan },
      { id: 'breaking', label: 'Bug? Failing test first', glyph: 'bug', tag: 'reproduce, then fix', detail: 'Write a test that captures the bug, then fix until it goes green.', color: c.pink },
      { id: 'refactor', label: 'Refactor safely', glyph: 'refactor', tag: 'tests have your back', detail: 'With tests in place, clean up and restructure without fear of breaking things.', color: c.mint },
    ],
  },
  secure: {
    cols: 2,
    items: [
      { id: 'env', label: 'No hardcoded secrets', glyph: 'key', tag: 'use env vars', detail: 'Keep API keys and passwords in environment variables, never in the code.', color: c.pink },
      { id: 'audit', label: 'Ask for an audit', glyph: 'shield', tag: 'security review', detail: 'Have the AI security-review the app before you ship it.', color: c.violet },
      { id: 'review', label: 'Review the AI’s code', glyph: 'eye', tag: 'read before shipping', detail: 'Skim what the AI wrote — you own every line that goes out.', color: c.cyan },
      { id: 'deps', label: 'Mind dependencies', glyph: 'box', tag: 'don’t add blindly', detail: 'Vet packages the AI suggests; each one is new surface area and risk.', color: c.amber },
    ],
  },
  tools: {
    cols: 3,
    items: [
      { id: 'claude', label: 'Claude Code', glyph: 'terminal', tag: 'terminal agent', detail: 'An agent in your terminal that reads, edits, and runs your whole repo.', color: c.violet },
      { id: 'cursor', label: 'Cursor', glyph: 'cursor', tag: 'AI-native editor', detail: 'An editor built around AI, with deep in-file assistance and chat.', color: c.cyan },
      { id: 'copilot', label: 'Copilot', glyph: 'wing', tag: 'inline autocomplete', detail: 'Suggests the next lines right inside your editor as you type.', color: c.mint },
      { id: 'v0', label: 'v0 · Lovable', glyph: 'image', tag: 'prompt → app', detail: 'Generate working UIs and small apps straight from a prompt.', color: c.amber },
      { id: 'windsurf', label: 'Windsurf', glyph: 'wave', tag: 'agentic IDE', detail: 'An agentic IDE designed to keep you in a flow state while building.', color: c.pink },
      { id: 'more', label: 'Gemini · Codex', glyph: 'sparkles', tag: 'and more', detail: 'Other capable assistants — the field is moving fast, so try a few.', color: c.violet },
    ],
  },
}

// ── Step builders ────────────────────────────────────────────────────────────
function chapterIndex(act: ActId): number {
  return CHAPTERS.findIndex((ch) => ch.id === act)
}

function lastMsg(act: ActId): number {
  return CHATS[act].length - 1
}

/** A "grid chapter": overview frame, then one frame per tip card. */
function gridChapter(
  act: ActId,
  heading: string,
  sub: string,
  overview: string,
  itemDwell: number,
): Step[] {
  const grid = GRIDS[act]!
  const ch = chapterIndex(act)
  const msgs = CHATS[act].length
  const out: Step[] = [
    {
      act,
      chapter: ch,
      heading,
      sub,
      status: overview,
      activeMsg: 0,
      sound: 'send',
      dwell: 1.05,
      grid: { activeId: null },
    },
  ]
  grid.items.forEach((item, i) => {
    out.push({
      act,
      chapter: ch,
      heading,
      sub,
      status: `${item.label} — ${item.detail}`,
      activeMsg: Math.min(i + 1, msgs - 1),
      sound: 'tip',
      dwell: itemDwell,
      grid: { activeId: item.id },
    })
  })
  return out
}

function buildIntro(): Step[] {
  const act: ActId = 'intro'
  const ch = chapterIndex(act)
  const heading = 'Vibe Coding'
  const sub = 'Build by describing intent — and stay the pilot'
  return [
    {
      act,
      chapter: ch,
      heading,
      sub,
      status: 'Vibe coding: you describe what you want, the AI writes the code, and you steer in a fast loop.',
      activeMsg: 0,
      sound: 'send',
      dwell: 1.25,
      grid: { activeId: null },
    },
    ...GRIDS.intro!.items.map((item, i): Step => ({
      act,
      chapter: ch,
      heading,
      sub,
      status: `${item.label} — ${item.detail}`,
      activeMsg: Math.min(i + 1, lastMsg(act)),
      sound: 'tip',
      dwell: 1.1,
      grid: { activeId: item.id },
    })),
    {
      act,
      chapter: ch,
      heading,
      sub,
      status: 'It works best as a workflow. Let’s walk it: Plan → Prompt → Build → Debug → Commit → Test → Ship.',
      activeMsg: lastMsg(act),
      sound: 'reply',
      dwell: 1.2,
      grid: { activeId: 'flow' },
    },
  ]
}

function buildRecap(): Step[] {
  const act: ActId = 'recap'
  const ch = chapterIndex(act)
  const heading = 'The Whole Loop'
  const sub = 'A workflow you repeat, with you in command'
  const mk = (status: string, activeId: string | null, activeMsg: number, sound: SoundCue, dwell: number): Step => ({
    act,
    chapter: ch,
    heading,
    sub,
    status,
    activeMsg,
    sound,
    dwell,
    grid: { activeId },
  })
  return [
    mk('Plan small, then build feature by feature — never the whole app in one prompt.', 'plan', 0, 'send', 1.2),
    mk('Prompt clearly and keep a context doc so the AI stays on your conventions.', 'prompt', 0, 'tip', 1.2),
    mk('Manage context, commit after every win, and test as you go.', 'commit', 0, 'tip', 1.2),
    mk('Secure it — no hardcoded secrets, ask for an audit — then ship.', 'ship', 1, 'done', 1.25),
  ]
}

// Recap chips reference pipeline-ish ids; map them to colours in the component.
const RECAP_KEYS = ['plan', 'prompt', 'commit', 'ship'] as const

// Which tip first-lights which chat message is handled in gridChapter via index.
export function buildSteps(): Step[] {
  return [
    ...buildIntro(),
    ...gridChapter('plan', 'Plan Before You Code', 'Aim before you fire', 'A little planning makes every prompt land better — scope it, phase it, show it.', 0.9),
    ...gridChapter('prompt', 'Prompting Well', 'The skill that carries everything', 'How you ask decides what you get. These habits make prompts reliable.', 0.72),
    ...gridChapter('context', 'Managing Context', 'Keep the AI’s view clean', 'The AI only reasons over what’s in front of it — curate that window.', 0.9),
    ...gridChapter('debug', 'Debugging', 'Turn errors into next steps', 'When something breaks, the error message is your best prompt.', 0.9),
    ...gridChapter('git', 'Master Version Control', 'Your safety net', 'Frequent commits make bold AI changes safe — you can always roll back.', 0.9),
    ...gridChapter('test', 'Testing', 'Confidence to move fast', 'Tests let you and the AI refactor and ship without holding your breath.', 0.9),
    ...gridChapter('secure', 'Security', 'Don’t ship the keys', 'AI will happily write insecure code — these habits keep you safe.', 0.9),
    ...gridChapter('tools', 'The Tools', 'Pick what fits your flow', 'Many tools enable vibe coding — they differ in how they meet your loop.', 0.85),
    ...buildRecap(),
  ]
}

export { RECAP_KEYS }

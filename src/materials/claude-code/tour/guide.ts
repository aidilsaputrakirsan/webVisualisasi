/**
 * Claude Code — a comprehensive, chaptered tour.
 *
 * Source material: the "Claude Code" roadmap (roadmap.sh/claude-code). Rather
 * than animate one algorithm, this material walks the whole picture: what Claude
 * Code is, the agentic loop at its heart, the tools it drives, how context &
 * memory work, every customisation surface (skills, subagents, hooks, MCP…),
 * model choice, permission modes, scaling, and security.
 *
 * Same project pattern as every other material: precompute ALL frames into
 * `Step[]`, then the component just plays them. Each Step is a full snapshot of
 * one frame (which chapter, what the terminal shows, which card/phase is lit).
 */

// ── Palette (dark "terminal" theme, local to this material) ──────────────────
export const CC = {
  bg: '#1E1A17',
  panel: '#272118',
  panelSoft: '#2F281F',
  panelHi: '#3A3025',
  line: '#473D31',
  lineSoft: '#3A3127',
  ink: '#F6EFE6',
  inkSoft: '#CDC2B2',
  inkFaint: '#938678',
  coral: '#D97757',
  coralDeep: '#C15F3C',
  coralText: '#F0B79A',
  green: '#86B86B',
  blue: '#79A6D2',
  violet: '#B49BE0',
  amber: '#E0A458',
  rose: '#D98AA0',
} as const

// ── Chapters (drive the top progress rail) ───────────────────────────────────
export type ActId =
  | 'intro'
  | 'loop'
  | 'tools'
  | 'context'
  | 'customize'
  | 'models'
  | 'permissions'
  | 'scaling'
  | 'security'
  | 'recap'

export interface Chapter {
  id: ActId
  label: string
}

export const CHAPTERS: Chapter[] = [
  { id: 'intro', label: 'Intro' },
  { id: 'loop', label: 'Agentic Loop' },
  { id: 'tools', label: 'Tools' },
  { id: 'context', label: 'Context' },
  { id: 'customize', label: 'Customize' },
  { id: 'models', label: 'Models' },
  { id: 'permissions', label: 'Permissions' },
  { id: 'scaling', label: 'Scaling' },
  { id: 'security', label: 'Security' },
  { id: 'recap', label: 'Recap' },
]

// ── Terminal panel model ─────────────────────────────────────────────────────
export type TKind = 'comment' | 'cmd' | 'slash' | 'agent' | 'out' | 'ok'
export interface TLine {
  kind: TKind
  text: string
}

// ── Feature-grid model (reused by most chapters) ─────────────────────────────
export interface GridItem {
  id: string
  label: string
  /** Icon name resolved by Icons.tsx (no emoji — professional line-icons). */
  glyph: string
  tag: string
  detail: string
  color: string
}

// ── Agentic-loop model ───────────────────────────────────────────────────────
export type LoopPhase = 'prompt' | 'reason' | 'act' | 'observe' | 'respond' | 'idle'

export interface LoopState {
  phase: LoopPhase
  iteration: number
  tool?: string
  caption: string
}

// ── Context-window model ─────────────────────────────────────────────────────
export interface CtxSeg {
  id: string
  label: string
  size: number
  color: string
}
export interface ContextState {
  segments: CtxSeg[]
  note: string
  mode: 'fill' | 'compact' | 'clear'
}

// ── Step (one frame) ─────────────────────────────────────────────────────────
export type SoundCue = 'type' | 'tool' | 'select' | 'run' | 'done'

export interface Step {
  act: ActId
  chapter: number // index into CHAPTERS
  heading: string
  sub: string
  status: string
  activeLine: number // index into TERMINALS[act], or -1
  sound: SoundCue
  /** Per-step pacing multiplier on the base autoplay delay (1 = normal). List-
   *  heavy chapters use < 1 to skim; core chapters use > 1 to linger. The user's
   *  Speed slider still multiplies on top of this. */
  dwell: number
  loop?: LoopState
  grid?: { activeId: string | null }
  context?: ContextState
}

// ── Per-chapter terminal scripts ─────────────────────────────────────────────
export const TERMINALS: Record<ActId, TLine[]> = {
  intro: [
    { kind: 'comment', text: 'cd into your project, then just run:' },
    { kind: 'cmd', text: 'claude' },
    { kind: 'agent', text: 'Claude Code — ready. What should we build?' },
    { kind: 'cmd', text: 'add rate limiting to the API and write tests' },
    { kind: 'agent', text: "On it. I'll read the code, edit it, then run the tests." },
  ],
  loop: [
    { kind: 'cmd', text: 'fix the failing checkout test' },
    { kind: 'agent', text: 'Reading checkout.ts to understand the flow…' },
    { kind: 'agent', text: 'Found it — total ignored the discount. Editing line 42.' },
    { kind: 'agent', text: 'Running the test suite…' },
    { kind: 'ok', text: '✓ 14 passed' },
    { kind: 'agent', text: 'Fixed. The checkout test is green now.' },
  ],
  tools: [
    { kind: 'comment', text: 'Claude picks the right tool for each move:' },
    { kind: 'agent', text: 'Grep "createOrder"  →  3 matches' },
    { kind: 'agent', text: 'Read order.ts (lines 1–60)' },
    { kind: 'agent', text: 'Edit order.ts  (+8 −2)' },
    { kind: 'agent', text: 'Bash: npm test' },
    { kind: 'ok', text: '✓ all green' },
  ],
  context: [
    { kind: 'comment', text: 'Context = everything Claude can see right now' },
    { kind: 'out', text: 'system + CLAUDE.md + open files + chat history' },
    { kind: 'comment', text: 'CLAUDE.md is auto-loaded every session' },
    { kind: 'slash', text: '/compact   summarise history, free up room' },
    { kind: 'slash', text: '/clear     wipe context, start fresh' },
  ],
  customize: [
    { kind: 'slash', text: '/agents          create a focused subagent' },
    { kind: 'slash', text: '/hooks           run shell on lifecycle events' },
    { kind: 'slash', text: '/mcp             connect external tools' },
    { kind: 'comment', text: 'skills  → .claude/skills/*/SKILL.md' },
    { kind: 'comment', text: 'plugins → bundle commands + agents + hooks' },
  ],
  models: [
    { kind: 'slash', text: '/model opus            switch models anytime' },
    { kind: 'comment', text: 'Fable 5 — most capable; premium, for the hardest work' },
    { kind: 'comment', text: 'Opus    — flagship all-rounder, the default here' },
    { kind: 'comment', text: 'Sonnet  — fast & balanced daily driver' },
    { kind: 'comment', text: 'Haiku   — quick & cheap for simple edits' },
    { kind: 'cmd', text: 'think harder           (more reasoning effort)' },
  ],
  permissions: [
    { kind: 'comment', text: 'You stay in control of what actually runs:' },
    { kind: 'out', text: 'default      ask before edits & commands' },
    { kind: 'out', text: 'acceptEdits  auto-apply file edits' },
    { kind: 'out', text: 'plan         read-only — plan first, no changes' },
    { kind: 'out', text: 'bypass       skip prompts (use with care)' },
  ],
  scaling: [
    { kind: 'cmd', text: 'claude -p "summarise PR #42"     # headless' },
    { kind: 'comment', text: 'git worktrees → run branches in parallel' },
    { kind: 'comment', text: 'subagents     → a team working at once' },
    { kind: 'slash', text: '/schedule        run jobs on a cron' },
  ],
  security: [
    { kind: 'comment', text: 'Trust, but verify:' },
    { kind: 'out', text: '• review diffs before accepting them' },
    { kind: 'out', text: '• scope permissions per project' },
    { kind: 'out', text: '• never paste secrets into prompts' },
    { kind: 'slash', text: '/security-review' },
  ],
  recap: [
    { kind: 'agent', text: 'prompt → reason → tools → observe → ship.' },
    { kind: 'comment', text: "That's the whole loop. Now go build." },
  ],
}

// ── Grid data per chapter ────────────────────────────────────────────────────
const c = CC

export const GRIDS: Partial<Record<ActId, { cols: number; items: GridItem[] }>> = {
  intro: {
    cols: 1,
    items: [
      {
        id: 'vibe',
        label: 'Vibe coding',
        glyph: 'sparkles',
        tag: 'describe the goal',
        detail: 'You say what you want in plain language — not how to type every line.',
        color: c.violet,
      },
      {
        id: 'agent',
        label: 'Coding agent',
        glyph: 'cpu',
        tag: 'it acts, not autocompletes',
        detail: 'Claude reads files, edits them, runs commands, and checks the result itself.',
        color: c.coral,
      },
      {
        id: 'loop',
        label: 'Agentic loop',
        glyph: 'loop',
        tag: 'reason - act - observe',
        detail: 'It repeats that cycle, using what it learns each turn, until the goal is met.',
        color: c.amber,
      },
    ],
  },
  tools: {
    cols: 3,
    items: [
      { id: 'read', label: 'Read', glyph: 'file', tag: 'open files', detail: 'Read any file — code, config, logs — to understand before changing anything.', color: c.blue },
      { id: 'edit', label: 'Edit / Write', glyph: 'pencil', tag: 'change code', detail: 'Make precise edits or write new files, in place, across the repo.', color: c.coral },
      { id: 'bash', label: 'Bash', glyph: 'terminal', tag: 'run commands', detail: 'Run tests, builds, git, installs — and read the output to decide what to do next.', color: c.amber },
      { id: 'grep', label: 'Grep', glyph: 'search', tag: 'search content', detail: 'Search code by regex to locate functions, usages, and definitions fast.', color: c.green },
      { id: 'glob', label: 'Glob', glyph: 'folders', tag: 'find files', detail: 'Match files by pattern (**/*.ts) to map the project structure.', color: c.violet },
      { id: 'web', label: 'WebFetch', glyph: 'globe', tag: 'read the web', detail: 'Pull in docs or pages when the answer lives outside the repo.', color: c.rose },
    ],
  },
  customize: {
    cols: 2,
    items: [
      { id: 'slash', label: 'Slash commands', glyph: 'slash', tag: 'reusable prompts', detail: 'Save a prompt as /name and rerun it anytime — your own shortcuts.', color: c.coral },
      { id: 'skills', label: 'Skills', glyph: 'book', tag: 'on-demand know-how', detail: 'Markdown playbooks Claude loads only when a task matches — domain expertise on tap.', color: c.amber },
      { id: 'subagents', label: 'Subagents', glyph: 'users', tag: 'specialised helpers', detail: 'Spin up a focused agent with its own tools & context for a sub-task.', color: c.blue },
      { id: 'hooks', label: 'Hooks', glyph: 'hook', tag: 'event automation', detail: 'Run your own shell commands on events (e.g. format after every edit).', color: c.green },
      { id: 'mcp', label: 'MCP', glyph: 'plug', tag: 'connect tools', detail: 'Model Context Protocol plugs in external tools & data: DBs, Slack, browsers.', color: c.violet },
      { id: 'plugins', label: 'Plugins', glyph: 'puzzle', tag: 'shareable bundles', detail: 'Package commands + agents + hooks together and share them across a team.', color: c.rose },
      { id: 'output', label: 'Output styles', glyph: 'type', tag: 'change the voice', detail: 'Reshape how Claude responds — concise, explanatory, or a custom persona.', color: c.coral },
      { id: 'status', label: 'Status line', glyph: 'statusbar', tag: 'live HUD', detail: 'Customise the bottom bar to show model, branch, context use — anything.', color: c.blue },
    ],
  },
  models: {
    cols: 2,
    items: [
      { id: 'fable', label: 'Fable 5', glyph: 'sparkles', tag: 'most capable', detail: 'Anthropic’s most capable model — the hardest reasoning and long, autonomous agentic runs. Premium-priced, so save it for the toughest work.', color: c.rose },
      { id: 'opus', label: 'Opus', glyph: 'brain', tag: 'flagship default', detail: 'The powerful all-rounder and Claude Code’s default — big refactors, tricky bugs, architecture & planning.', color: c.coral },
      { id: 'sonnet', label: 'Sonnet', glyph: 'scale', tag: 'fast & balanced', detail: 'Strong and quick — a great everyday driver when you want speed with high quality.', color: c.amber },
      { id: 'haiku', label: 'Haiku', glyph: 'rocket', tag: 'fastest & cheapest', detail: 'Snappy and low-cost for simple edits, lookups, and quick tasks.', color: c.green },
      { id: 'think', label: 'Thinking & effort', glyph: 'cloud', tag: '"think harder"', detail: 'Independent of the model — raise the reasoning effort so Claude thinks longer before acting on hard problems.', color: c.violet },
    ],
  },
  permissions: {
    cols: 2,
    items: [
      { id: 'default', label: 'Default', glyph: 'bell', tag: 'ask first', detail: 'Claude asks before edits and commands — you approve each one.', color: c.blue },
      { id: 'accept', label: 'Accept Edits', glyph: 'checkcircle', tag: 'auto-apply edits', detail: 'File edits apply automatically; commands still ask. Faster flow, still safe.', color: c.green },
      { id: 'plan', label: 'Plan Mode', glyph: 'map', tag: 'read-only first', detail: 'Claude explores and proposes a plan but changes nothing until you approve.', color: c.amber },
      { id: 'bypass', label: 'Bypass', glyph: 'alert', tag: 'no prompts', detail: 'Skips all approvals for trusted, sandboxed automation — use with care.', color: c.rose },
    ],
  },
  scaling: {
    cols: 2,
    items: [
      { id: 'headless', label: 'Headless mode', glyph: 'terminal', tag: 'claude -p', detail: 'Run Claude non-interactively in scripts & CI — pipe a prompt, get a result.', color: c.blue },
      { id: 'worktrees', label: 'Git worktrees', glyph: 'branch', tag: 'parallel branches', detail: 'Work several branches at once in isolated checkouts — no context clashes.', color: c.green },
      { id: 'team', label: 'Agent team', glyph: 'users', tag: 'work in parallel', detail: 'Delegate independent sub-tasks to subagents that run at the same time.', color: c.coral },
      { id: 'schedule', label: 'Scheduled jobs', glyph: 'clock', tag: 'cron agents', detail: 'Schedule recurring runs — nightly reviews, PR triage, dependency bumps.', color: c.violet },
    ],
  },
  security: {
    cols: 2,
    items: [
      { id: 'review', label: 'Review diffs', glyph: 'eye', tag: 'before accepting', detail: 'Read what changed before you accept it — you own every commit.', color: c.amber },
      { id: 'scope', label: 'Scoped permissions', glyph: 'lock', tag: 'least privilege', detail: 'Grant only the commands a project needs; deny the rest by default.', color: c.green },
      { id: 'secrets', label: 'Protect secrets', glyph: 'key', tag: 'no keys in prompts', detail: 'Keep tokens & passwords out of prompts and out of the repo.', color: c.rose },
      { id: 'trust', label: 'Trusted MCP only', glyph: 'shield', tag: 'vet integrations', detail: 'Only connect MCP servers & plugins you trust — they can act on your machine.', color: c.blue },
    ],
  },
}

// ── Step builders ────────────────────────────────────────────────────────────
function chapterIndex(act: ActId): number {
  return CHAPTERS.findIndex((ch) => ch.id === act)
}

/** Build a "grid chapter": an overview frame, then one frame per card.
 *  `itemDwell` paces the per-card frames (lower = skims faster). */
function gridChapter(
  act: ActId,
  heading: string,
  sub: string,
  overview: string,
  lineFor: (id: string, i: number) => number,
  itemDwell: number,
): Step[] {
  const grid = GRIDS[act]!
  const ch = chapterIndex(act)
  const out: Step[] = [
    {
      act,
      chapter: ch,
      heading,
      sub,
      status: overview,
      activeLine: 0,
      sound: 'select',
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
      activeLine: lineFor(item.id, i),
      sound: 'tool',
      dwell: itemDwell,
      grid: { activeId: item.id },
    })
  })
  return out
}

function buildIntro(): Step[] {
  const act: ActId = 'intro'
  const ch = chapterIndex(act)
  const sub = 'A coding agent that lives in your terminal'
  return [
    {
      act,
      chapter: ch,
      heading: 'Claude Code',
      sub,
      status:
        'Not autocomplete — an agent. You describe a goal; it plans, edits files, runs commands, and checks its own work.',
      activeLine: 1,
      sound: 'type',
      dwell: 1.25,
      grid: { activeId: null },
    },
    ...GRIDS.intro!.items.map((item, i): Step => ({
      act,
      chapter: ch,
      heading: 'Claude Code',
      sub,
      status: `${item.label} — ${item.detail}`,
      activeLine: [2, 3, 4][i] ?? 4,
      sound: 'select',
      dwell: 1.1,
      grid: { activeId: item.id },
    })),
    {
      act,
      chapter: ch,
      heading: 'Claude Code',
      sub,
      status: 'Those three ideas come together in one engine — the agentic loop. Let’s open it up.',
      activeLine: 4,
      sound: 'tool',
      dwell: 1.15,
      grid: { activeId: 'loop' },
    },
  ]
}

function buildLoop(): Step[] {
  const act: ActId = 'loop'
  const ch = chapterIndex(act)
  const heading = 'The Agentic Loop'
  const sub = 'Every turn: reason → act → observe → repeat'
  const mk = (phase: LoopPhase, iteration: number, tool: string | undefined, caption: string, status: string, line: number, sound: SoundCue): Step => ({
    act,
    chapter: ch,
    heading,
    sub,
    status,
    activeLine: line,
    sound,
    dwell: 1.3,
    loop: { phase, iteration, tool, caption },
  })
  return [
    mk('prompt', 1, undefined, 'You give a goal', 'It starts with your prompt — a goal in plain language, not step-by-step instructions.', 0, 'type'),
    mk('reason', 1, undefined, 'Claude thinks', 'Reason: Claude inspects the situation and decides the next action to take.', 1, 'select'),
    mk('act', 1, 'Read', 'Calls a tool', 'Act: it runs a tool — here, reading the file to understand the bug.', 1, 'tool'),
    mk('observe', 1, 'Read', 'Reads the result', 'Observe: it reads the tool’s output and folds that new knowledge back in.', 2, 'run'),
    mk('reason', 2, undefined, 'Thinks again', 'Turn 2 — with what it learned, it reasons about the fix.', 2, 'select'),
    mk('act', 2, 'Edit', 'Edits the code', 'Act: it edits the code to apply the fix.', 2, 'tool'),
    mk('act', 2, 'Bash', 'Runs the tests', 'Act: it runs the test suite to verify the change.', 3, 'tool'),
    mk('observe', 2, 'Bash', 'Tests pass', 'Observe: all tests pass — the evidence the goal is met.', 4, 'run'),
    mk('respond', 2, undefined, 'Goal met → reply', 'The loop ends when the goal is satisfied, and Claude reports back.', 5, 'done'),
  ]
}

function buildContext(): Step[] {
  const act: ActId = 'context'
  const ch = chapterIndex(act)
  const heading = 'Context & Memory'
  const sub = 'What Claude can see — and how to manage it'
  const seg = (id: string, label: string, size: number, color: string): CtxSeg => ({ id, label, size, color })
  const base = [
    seg('system', 'System', 8, CC.inkFaint),
    seg('claudemd', 'CLAUDE.md', 10, CC.coral),
  ]
  const mk = (segments: CtxSeg[], note: string, mode: ContextState['mode'], status: string, line: number, sound: SoundCue): Step => ({
    act,
    chapter: ch,
    heading,
    sub,
    status,
    activeLine: line,
    sound,
    dwell: 1.3,
    context: { segments, note, mode },
  })
  return [
    mk(base, 'The window starts with the system prompt and your project memory.', 'fill',
      'Context is the finite window Claude reasons over — everything it can “see” at once.', 1, 'select'),
    mk([...base], 'CLAUDE.md is loaded automatically every session — your standing instructions.', 'fill',
      'CLAUDE.md is auto-loaded each session: conventions, commands, do-nots. Free, persistent memory.', 2, 'tool'),
    mk([...base, seg('files', 'Open files', 22, CC.blue)], 'As Claude reads files, they fill the window.', 'fill',
      'Every file it reads and command it runs takes up space in the window.', 1, 'run'),
    mk([...base, seg('files', 'Open files', 26, CC.blue), seg('history', 'Chat history', 30, CC.amber)], 'Long sessions accumulate history and approach the limit.', 'fill',
      'A long session fills up — older turns crowd the window and slow things down.', 1, 'run'),
    mk([...base, seg('files', 'Open files', 14, CC.blue), seg('summary', 'Summary', 8, CC.green)], '/compact summarises the old history into a compact note.', 'compact',
      '/compact distils the history into a summary — keeps the gist, frees up room.', 3, 'tool'),
    mk(base, '/clear wipes the window for a brand-new, unrelated task.', 'clear',
      '/clear resets to a clean slate — start a fresh task with no baggage.', 4, 'done'),
  ]
}

function buildRecap(): Step[] {
  const act: ActId = 'recap'
  const ch = chapterIndex(act)
  const heading = 'The Whole Picture'
  const sub = 'One loop, many surfaces to shape it'
  const mk = (status: string, activeId: string | null, line: number, sound: SoundCue): Step => ({
    act,
    chapter: ch,
    heading,
    sub,
    status,
    activeLine: line,
    sound,
    dwell: 1.2,
    loop: { phase: 'respond', iteration: 2, caption: 'reason · act · observe' },
    grid: { activeId },
  })
  return [
    mk('At the centre is always the same loop: reason, act with tools, observe, repeat.', null, 0, 'select'),
    mk('Context & memory feed the loop — CLAUDE.md, /compact, /clear keep it sharp.', 'context', 0, 'tool'),
    mk('Skills, subagents, hooks, MCP and plugins customise what the loop can do.', 'customize', 0, 'tool'),
    mk('Models and permission modes set how it thinks and what it’s allowed to run.', 'models', 1, 'tool'),
    mk('Headless, worktrees and scheduling scale it from one chat to a whole team.', 'scaling', 1, 'tool'),
    mk('You stay in control — review the diffs, scope the access, ship with confidence.', 'security', 1, 'done'),
  ]
}

// First-line index to highlight for each card in a grid chapter.
const TOOL_LINE: Record<string, number> = { read: 2, edit: 3, bash: 4, grep: 1, glob: 1, web: 1 }
const CUSTOM_LINE: Record<string, number> = { subagents: 0, hooks: 1, mcp: 2, skills: 3, plugins: 4, slash: 0, output: 0, status: 0 }
const MODEL_LINE: Record<string, number> = { fable: 1, opus: 2, sonnet: 3, haiku: 4, think: 5 }
const PERM_LINE: Record<string, number> = { default: 1, accept: 2, plan: 3, bypass: 4 }
const SCALE_LINE: Record<string, number> = { headless: 0, worktrees: 1, team: 2, schedule: 3 }
const SEC_LINE: Record<string, number> = { review: 1, scope: 1, secrets: 3, trust: 4 }

export function buildSteps(): Step[] {
  return [
    ...buildIntro(),
    ...buildLoop(),
    ...gridChapter('tools', 'The Toolbox', 'How Claude actually changes your project', 'Claude doesn’t guess — it drives real tools, choosing the right one each turn.', (id) => TOOL_LINE[id] ?? 0, 0.8),
    ...buildContext(),
    ...gridChapter('customize', 'Make It Yours', 'Extend what the loop can do', 'Claude Code is built to be shaped — these are the surfaces you customise.', (id) => CUSTOM_LINE[id] ?? 0, 0.62),
    ...gridChapter('models', 'Choosing a Model', 'Match the brain to the task', 'Pick the model — and how hard it thinks — to fit the job and your budget.', (id) => MODEL_LINE[id] ?? 0, 0.95),
    ...gridChapter('permissions', 'Permission Modes', 'You decide what runs', 'Four modes trade speed for control — from ask-everything to fully autonomous.', (id) => PERM_LINE[id] ?? 0, 0.95),
    ...gridChapter('scaling', 'Scaling Up', 'From one chat to a whole team', 'Beyond a single session, Claude Code scales into automation and parallelism.', (id) => SCALE_LINE[id] ?? 0, 0.85),
    ...gridChapter('security', 'Staying Safe', 'Powerful — so use it responsibly', 'An agent that runs commands needs guardrails. A few habits keep you safe.', (id) => SEC_LINE[id] ?? 0, 0.85),
    ...buildRecap(),
  ]
}

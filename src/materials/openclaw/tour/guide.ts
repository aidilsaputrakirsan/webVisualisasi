/**
 * OpenClaw — a comprehensive, chaptered tour.
 *
 * Source material: the "OpenClaw" roadmap (roadmap.sh/openclaw). OpenClaw is an
 * open-source, self-hosted AI agent that connects your messaging apps (Telegram,
 * WhatsApp, Discord, iMessage, Slack, Signal) to AI models you control — it runs
 * on your own infrastructure and can even reach out to you proactively.
 *
 * Same project pattern: precompute ALL frames into `Step[]`, then play them.
 *
 * Visual identity is deliberately different again: a dark emerald "homelab"
 * theme, a network Topology (channels → gateway → your agent → models) as the
 * hero, and a GatewayConsole panel showing real `openclaw …` commands.
 */

// ── Palette (dark "homelab / server" theme, local to this material) ──────────
export const OC = {
  bg: '#0E1512',
  panel: '#16201B',
  panelSoft: '#1C2A23',
  panelHi: '#24362C',
  line: '#2E4438',
  lineSoft: '#26382E',
  ink: '#ECF6EF',
  inkSoft: '#BBD0C2',
  inkFaint: '#7E9686',
  emerald: '#34D399',
  emeraldDeep: '#10B981',
  emeraldText: '#86EFAC',
  cyan: '#22D3EE',
  lime: '#A3E635',
  amber: '#FBBF24',
  rose: '#FB7185',
  violet: '#C4B5FD',
} as const

// ── Chapters ─────────────────────────────────────────────────────────────────
export type ActId =
  | 'intro'
  | 'architecture'
  | 'host'
  | 'providers'
  | 'channels'
  | 'gateway'
  | 'memory'
  | 'extend'
  | 'proactive'
  | 'security'
  | 'recap'

export interface Chapter {
  id: ActId
  label: string
}

export const CHAPTERS: Chapter[] = [
  { id: 'intro', label: 'What is OpenClaw' },
  { id: 'architecture', label: 'How It Works' },
  { id: 'host', label: 'Where to Run It' },
  { id: 'providers', label: 'Model Providers' },
  { id: 'channels', label: 'Messaging Channels' },
  { id: 'gateway', label: 'The Gateway' },
  { id: 'memory', label: 'Memory & Automation' },
  { id: 'extend', label: 'Extend It' },
  { id: 'proactive', label: 'Proactive Core' },
  { id: 'security', label: 'Security' },
  { id: 'recap', label: 'Recap' },
]

// ── Topology stages (the hero diagram) ───────────────────────────────────────
export type TopoStage = 'channels' | 'gateway' | 'agent' | 'models' | 'reply' | 'all'

// ── Console model ────────────────────────────────────────────────────────────
export type CKind = 'cmd' | 'ok' | 'out' | 'comment' | 'warn'
export interface CLine {
  kind: CKind
  text: string
}

// ── Tip-grid model ───────────────────────────────────────────────────────────
export interface GridItem {
  id: string
  label: string
  glyph: string
  tag: string
  detail: string
  color: string
}

// ── Step ─────────────────────────────────────────────────────────────────────
export type SoundCue = 'type' | 'send' | 'recv' | 'tip' | 'done'
export interface Step {
  act: ActId
  chapter: number
  heading: string
  sub: string
  status: string
  activeLine: number // index into CONSOLES[act], or -1
  sound: SoundCue
  dwell: number
  grid?: { activeId: string | null }
  topo?: { active: TopoStage }
}

// ── Per-chapter gateway consoles ─────────────────────────────────────────────
export const CONSOLES: Record<ActId, CLine[]> = {
  intro: [
    { kind: 'comment', text: 'a self-hosted AI agent that lives in your messaging apps' },
    { kind: 'cmd', text: 'openclaw onboard' },
    { kind: 'ok', text: '✓ provider linked · channel connected · agent ready' },
  ],
  architecture: [
    { kind: 'cmd', text: 'you → telegram: “summarize my unread emails”' },
    { kind: 'out', text: 'channel → gateway → your agent → model' },
    { kind: 'ok', text: '✓ the agent texts the summary back to you' },
  ],
  host: [
    { kind: 'comment', text: 'run it wherever you control the box' },
    { kind: 'cmd', text: 'curl -fsSL openclaw.sh | sh      # or docker' },
    { kind: 'ok', text: '✓ installed · bound to localhost' },
  ],
  providers: [
    { kind: 'cmd', text: 'openclaw models auth add anthropic' },
    { kind: 'cmd', text: 'openclaw models set claude' },
    { kind: 'ok', text: '✓ provider ready — cloud, or local via Ollama' },
  ],
  channels: [
    { kind: 'cmd', text: 'openclaw channels add --channel telegram' },
    { kind: 'cmd', text: 'openclaw channels status --probe' },
    { kind: 'ok', text: '✓ telegram · whatsapp · discord connected' },
  ],
  gateway: [
    { kind: 'cmd', text: 'openclaw doctor --deep' },
    { kind: 'ok', text: '✓ gateway · channels · model · cron healthy' },
    { kind: 'cmd', text: 'openclaw security audit' },
  ],
  memory: [
    { kind: 'cmd', text: 'openclaw memory index --all' },
    { kind: 'cmd', text: 'openclaw cron add “0 8 * * *” “daily brief”' },
    { kind: 'ok', text: '✓ indexed · job scheduled · backup saved' },
  ],
  extend: [
    { kind: 'comment', text: 'skills · plugins · multi-agents · MCP' },
    { kind: 'cmd', text: 'openclaw skills install <name>   # from ClawHub' },
    { kind: 'warn', text: 'review a skill before you trust it' },
  ],
  proactive: [
    { kind: 'comment', text: 'it doesn’t just reply — it reaches out' },
    { kind: 'cmd', text: 'heartbeat: every 30m during active hours' },
    { kind: 'ok', text: '→ “heads up: your deploy just finished ✓”' },
  ],
  security: [
    { kind: 'comment', text: 'always-on & powerful — so lock it down' },
    { kind: 'ok', text: '✓ isolated host · non-root · localhost · auth token' },
    { kind: 'warn', text: 'never hardcode keys · run an audit after changes' },
  ],
  recap: [
    { kind: 'cmd', text: 'channels → gateway → your agent → models → you' },
    { kind: 'ok', text: '✓ self-hosted, proactive, and entirely yours' },
  ],
}

const c = OC

// ── Per-chapter tip grids ────────────────────────────────────────────────────
export const GRIDS: Partial<Record<ActId, { cols: number; items: GridItem[] }>> = {
  intro: {
    cols: 1,
    items: [
      { id: 'selfhost', label: 'Self-hosted', glyph: 'server', tag: 'your infra, your rules', detail: 'Runs on hardware you control — a VPS, a Raspberry Pi, a Mac Mini, or your laptop.', color: c.emerald },
      { id: 'messaging', label: 'Lives in your chats', glyph: 'chat', tag: 'Telegram, WhatsApp…', detail: 'Talk to your agent from the messaging apps you already use, from anywhere.', color: c.cyan },
      { id: 'yourmodels', label: 'Models you choose', glyph: 'cpu', tag: 'cloud or fully local', detail: 'Point it at Anthropic, OpenAI, or Gemini — or run a local model with Ollama.', color: c.lime },
    ],
  },
  host: {
    cols: 3,
    items: [
      { id: 'local', label: 'Local machine', glyph: 'laptop', tag: 'quick start', detail: 'Run it on your own computer to try it out fast.', color: c.emerald },
      { id: 'vps', label: 'VPS / Cloud', glyph: 'cloud', tag: 'always-on', detail: 'A small cloud server keeps it running 24/7, reachable anywhere.', color: c.cyan },
      { id: 'dedicated', label: 'Dedicated device', glyph: 'server', tag: 'isolated', detail: 'A box that does only this — clean separation from everything else.', color: c.lime },
      { id: 'pi', label: 'Raspberry Pi', glyph: 'chip', tag: 'cheap & low-power', detail: 'Tiny, low-power, always-on — a self-host favorite.', color: c.amber },
      { id: 'mac', label: 'Mac Mini', glyph: 'desktop', tag: 'run local models', detail: 'Enough muscle to run capable local models at home.', color: c.violet },
      { id: 'docker', label: 'Docker (isolated)', glyph: 'box', tag: 'sandboxed', detail: 'A containerized install keeps it sandboxed from the host.', color: c.rose },
    ],
  },
  providers: {
    cols: 2,
    items: [
      { id: 'anthropic', label: 'Anthropic', glyph: 'sparkles', tag: 'Claude models', detail: 'Use Claude — strong reasoning to power your agent.', color: c.emerald },
      { id: 'openai', label: 'OpenAI', glyph: 'swirl', tag: 'GPT models', detail: 'Plug in GPT models as the agent’s brain.', color: c.cyan },
      { id: 'gemini', label: 'Gemini', glyph: 'star', tag: 'Google models', detail: 'Google’s Gemini family, if that’s your preference.', color: c.violet },
      { id: 'ollama', label: 'Ollama (local)', glyph: 'home', tag: 'fully offline', detail: 'Run an open model locally — no data ever leaves your machine.', color: c.lime },
    ],
  },
  channels: {
    cols: 3,
    items: [
      { id: 'imessage', label: 'iMessage', glyph: 'apple', tag: 'on Apple devices', detail: 'Chat with your agent right from Messages on your Apple gear.', color: c.cyan },
      { id: 'telegram', label: 'Telegram', glyph: 'send', tag: 'fast & scriptable', detail: 'A popular, snappy channel that’s easy to automate.', color: c.emerald },
      { id: 'slack', label: 'Slack', glyph: 'hash', tag: 'for your workspace', detail: 'Bring the agent into your team’s Slack.', color: c.amber },
      { id: 'whatsapp', label: 'WhatsApp', glyph: 'phone', tag: 'reach anyone', detail: 'Message your agent over WhatsApp from anywhere.', color: c.lime },
      { id: 'discord', label: 'Discord', glyph: 'game', tag: 'communities & bots', detail: 'Great for servers, bots, and community use.', color: c.violet },
      { id: 'signal', label: 'Signal', glyph: 'shieldchat', tag: 'privacy-first', detail: 'For when private, encrypted messaging matters most.', color: c.rose },
    ],
  },
  gateway: {
    cols: 2,
    items: [
      { id: 'doctor', label: 'doctor', glyph: 'stethoscope', tag: 'health check', detail: '“openclaw doctor --deep” checks your whole setup is wired up right.', color: c.emerald },
      { id: 'audit', label: 'security audit', glyph: 'shield', tag: 'find risks', detail: 'Scan for misconfig and exposure before — and after — going live.', color: c.rose },
      { id: 'onboard', label: 'onboard', glyph: 'rocket', tag: 'guided setup', detail: 'A guided flow to connect providers and channels in minutes.', color: c.cyan },
      { id: 'channels', label: 'channels', glyph: 'plug', tag: 'list / add / probe', detail: 'Manage which messaging apps are connected and healthy.', color: c.amber },
    ],
  },
  memory: {
    cols: 2,
    items: [
      { id: 'index', label: 'memory index', glyph: 'database', tag: 'remember everything', detail: 'Index your notes and history so the agent can recall them later.', color: c.emerald },
      { id: 'search', label: 'memory search', glyph: 'search', tag: 'find fast', detail: 'Query your memory in plain language to pull up what you need.', color: c.cyan },
      { id: 'cron', label: 'Cron jobs', glyph: 'clock', tag: 'scheduled tasks', detail: 'Schedule recurring work — daily briefs, reminders, health checks.', color: c.lime },
      { id: 'backup', label: 'Backups', glyph: 'save', tag: 'stay safe', detail: '“openclaw backup create” snapshots your workspace.', color: c.amber },
    ],
  },
  extend: {
    cols: 3,
    items: [
      { id: 'skills', label: 'Skills', glyph: 'book', tag: 'on-demand know-how', detail: 'Reusable playbooks; install more from ClawHub (vet them first).', color: c.emerald },
      { id: 'plugins', label: 'Plugins', glyph: 'puzzle', tag: 'add capabilities', detail: 'Extend the agent with installable plugins.', color: c.cyan },
      { id: 'multi', label: 'Multi-agents', glyph: 'users', tag: 'a small team', detail: 'Run several specialized agents working together.', color: c.violet },
      { id: 'routing', label: 'Routing rules', glyph: 'route', tag: 'right agent for the job', detail: 'Send each request to the agent that best fits it.', color: c.amber },
      { id: 'mcp', label: 'MCP', glyph: 'plug', tag: 'connect tools', detail: 'Model Context Protocol plugs in external tools and data.', color: c.lime },
      { id: 'workspace', label: 'Workspace files', glyph: 'doc', tag: 'AGENTS · SOUL · USER', detail: 'Plain-text files define the agent’s persona, who you are, and its memory.', color: c.rose },
    ],
  },
  proactive: {
    cols: 2,
    items: [
      { id: 'hooks', label: 'Hooks', glyph: 'anchor', tag: 'run on events', detail: 'Trigger your own actions on lifecycle events.', color: c.emerald },
      { id: 'webhooks', label: 'Webhooks', glyph: 'webhook', tag: 'react to the world', detail: 'Let external services ping your agent — and secure those endpoints.', color: c.cyan },
      { id: 'heartbeats', label: 'Heartbeats', glyph: 'pulse', tag: 'it texts you first', detail: 'On an interval (during active hours) the agent wakes and reaches out proactively.', color: c.lime },
      { id: 'sessions', label: 'Sessions', glyph: 'window', tag: 'context per chat', detail: 'Each conversation keeps its own running context.', color: c.amber },
    ],
  },
  security: {
    cols: 3,
    items: [
      { id: 'isolate', label: 'Isolate the host', glyph: 'box', tag: 'VPS / VM / device', detail: 'Deploy on a dedicated, isolated machine — not your main box.', color: c.emerald },
      { id: 'nonroot', label: 'Run as non-root', glyph: 'user', tag: 'least privilege', detail: 'Never run the agent as the root user.', color: c.cyan },
      { id: 'localhost', label: 'Bind to localhost', glyph: 'lock', tag: 'secure the ports', detail: 'Keep the gateway on localhost and lock down exposed ports.', color: c.lime },
      { id: 'token', label: 'Strong auth token', glyph: 'key', tag: 'gate the gateway', detail: 'Set a strong gateway auth token; rotate it if a breach is suspected.', color: c.amber },
      { id: 'pairing', label: 'Device pairing', glyph: 'shield', tag: 'allowlist only', detail: 'Pair devices and allowlist exactly who can talk to it.', color: c.violet },
      { id: 'secrets', label: 'No hardcoded keys', glyph: 'eye', tag: 'env vars · read-only', detail: 'Keep keys in env vars, start read-only, and audit after every change.', color: c.rose },
    ],
  },
}

// ── Step builders ────────────────────────────────────────────────────────────
function chapterIndex(act: ActId): number {
  return CHAPTERS.findIndex((ch) => ch.id === act)
}

function gridChapter(
  act: ActId,
  heading: string,
  sub: string,
  overview: string,
  itemDwell: number,
): Step[] {
  const grid = GRIDS[act]!
  const ch = chapterIndex(act)
  const lines = CONSOLES[act].length
  const out: Step[] = [
    {
      act,
      chapter: ch,
      heading,
      sub,
      status: overview,
      activeLine: 0,
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
      activeLine: Math.min(i + 1, lines - 1),
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
  const heading = 'OpenClaw'
  const sub = 'A self-hosted AI agent in your messaging apps'
  return [
    {
      act,
      chapter: ch,
      heading,
      sub,
      status: 'Open-source and self-hosted: connect your chat apps to AI models you control, running on your own box.',
      activeLine: 1,
      sound: 'type',
      dwell: 1.25,
      grid: { activeId: null },
    },
    ...GRIDS.intro!.items.map((item, i): Step => ({
      act,
      chapter: ch,
      heading,
      sub,
      status: `${item.label} — ${item.detail}`,
      activeLine: Math.min(i + 1, CONSOLES.intro.length - 1),
      sound: 'tip',
      dwell: 1.1,
      grid: { activeId: item.id },
    })),
    {
      act,
      chapter: ch,
      heading,
      sub,
      status: 'Where Claude Code lives in your terminal, OpenClaw lives in your chats — and can even text you first. Let’s see how.',
      activeLine: 2,
      sound: 'recv',
      dwell: 1.2,
      grid: { activeId: 'messaging' },
    },
  ]
}

function buildArchitecture(): Step[] {
  const act: ActId = 'architecture'
  const ch = chapterIndex(act)
  const heading = 'How It Works'
  const sub = 'Channels → Gateway → your Agent → Models'
  const mk = (active: TopoStage, status: string, line: number, sound: SoundCue, dwell: number): Step => ({
    act,
    chapter: ch,
    heading,
    sub,
    status,
    activeLine: line,
    sound,
    dwell,
    topo: { active },
  })
  return [
    mk('channels', 'You message your agent from any connected app — that’s the way in.', 0, 'type', 1.25),
    mk('gateway', 'The Gateway is the front door: it authenticates you and routes the message.', 1, 'send', 1.3),
    mk('agent', 'Your Agent runs on your hardware — it reasons, recalls memory, and uses skills.', 1, 'tip', 1.3),
    mk('models', 'It calls the model you chose — a cloud provider, or a local one via Ollama.', 1, 'tip', 1.3),
    mk('reply', 'The reply lands back in the same chat. You never leave your messaging app.', 2, 'recv', 1.3),
  ]
}

function buildProactive(): Step[] {
  // Uses the tip grid like other chapters, but emphasizes the proactive idea.
  return gridChapter(
    'proactive',
    'The Proactive Core',
    'It reaches out — you don’t always ask first',
    'Most assistants only answer. OpenClaw can also start the conversation — on a schedule or an event.',
    0.92,
  )
}

function buildRecap(): Step[] {
  const act: ActId = 'recap'
  const ch = chapterIndex(act)
  const heading = 'The Whole Picture'
  const sub = 'Your apps, your server, your models — one agent'
  const mk = (status: string, line: number, sound: SoundCue, dwell: number): Step => ({
    act,
    chapter: ch,
    heading,
    sub,
    status,
    activeLine: line,
    sound,
    dwell,
    topo: { active: 'all' },
  })
  return [
    mk('Your messaging apps reach a Gateway you secure on a box you own.', 0, 'send', 1.2),
    mk('Behind it, your Agent holds memory and skills, and calls the models you picked.', 0, 'tip', 1.2),
    mk('It runs jobs, reacts to events, and texts you first when something matters.', 1, 'tip', 1.2),
    mk('Self-hosted, proactive, and entirely yours — lock it down and make it your own.', 1, 'done', 1.3),
  ]
}

export function buildSteps(): Step[] {
  return [
    ...buildIntro(),
    ...buildArchitecture(),
    ...gridChapter('host', 'Where to Run It', 'You own the box', 'OpenClaw runs wherever you control the hardware — pick what fits your life.', 0.85),
    ...gridChapter('providers', 'Model Providers', 'Bring your own brain', 'Connect the AI you trust — a cloud provider, or a fully local model.', 0.95),
    ...gridChapter('channels', 'Messaging Channels', 'Meet it where you already chat', 'Connect the apps you use every day — talk to your agent from anywhere.', 0.8),
    ...gridChapter('gateway', 'The Gateway', 'Your command center', 'The gateway is the hub you run and manage — a handful of commands keep it healthy.', 0.9),
    ...gridChapter('memory', 'Memory & Automation', 'It remembers, and it runs on its own', 'Give it lasting memory and recurring jobs so it works even when you’re away.', 0.9),
    ...gridChapter('extend', 'Extend It', 'Make it yours', 'Skills, plugins, multi-agents, and MCP shape what your agent can do.', 0.82),
    ...buildProactive(),
    ...gridChapter('security', 'Security First', 'Powerful, so lock it down', 'An always-on agent on the internet needs guardrails — these are the essentials.', 0.82),
    ...buildRecap(),
  ]
}

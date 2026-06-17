/**
 * Precomputed "RAG (Retrieval-Augmented Generation)" pipeline — one Step = a
 * full snapshot of the board. The animation just replays these frames.
 *
 * Three sequential phases (build -> find -> answer):
 *   - 'index'    : OFFLINE. Document -> chunks -> embeddings -> store in vector DB.
 *   - 'retrieve' : User question -> embed -> cosine similarity against every chunk
 *                  -> take the top-k most similar (by MEANING, not exact words).
 *   - 'generate' : Retrieved chunks are joined into a context -> inserted into the
 *                  LLM prompt -> a GROUNDED answer (anti-hallucination).
 *
 * Example: the help-center knowledge base of a fintech / e-commerce app.
 */

export type Mode = 'index' | 'retrieve' | 'generate'

export type Cue =
  | 'send'
  | 'embed'
  | 'store'
  | 'score'
  | 'select'
  | 'augment'
  | 'process'
  | 'answer'
  | 'done'
  | null

export type NodeId = 'query' | 'embed' | 'llm' | 'answer'

/** Packet tone → colour family in the view. */
export type Tone = 'text' | 'vector' | 'context' | 'answer'

export interface Packet {
  from: NodeId | 'vdb'
  to: NodeId | 'vdb'
  tag: string
  tone: Tone
}

export interface ChunkState {
  id: string
  tag: string
  text: string
  /** Already stored in the vector DB (drives the indexing animation). */
  stored: boolean
  /** Cosine similarity score against the question (null = not computed yet). */
  score: number | null
  /** Picked as one of the top-k retrieval hits. */
  selected: boolean
}

export interface RagStep {
  /** Which flow phase this step belongs to (drives the code & the top node). */
  phase: Mode
  packet: Packet | null
  activeNodes: (NodeId | 'vdb')[]
  chunks: ChunkState[]
  /** Show the "query vector" chip on the Embedding Model output. */
  queryVec: boolean
  /** Final LLM answer (null = none yet). */
  answer: string | null
  line: number
  status: string
  sound: Cue
}

export interface NodeSpec {
  id: NodeId
  cx: number
  cy: number
  w: number
  h: number
}

/** Fixed positions on the 920×860 board (design px). The VDB panel is drawn separately. */
export const NODES: Record<NodeId, NodeSpec> = {
  query: { id: 'query', cx: 460, cy: 44, w: 580, h: 72 },
  embed: { id: 'embed', cx: 460, cy: 168, w: 360, h: 70 },
  llm: { id: 'llm', cx: 460, cy: 712, w: 384, h: 70 },
  answer: { id: 'answer', cx: 460, cy: 818, w: 680, h: 66 },
}

/** Vector DB panel (drawn as a list of chunks + scores). */
export const VDB_BOX = { cx: 460, cy: 430, w: 820, h: 420 }

export interface EdgeSpec {
  a: NodeId | 'vdb'
  b: NodeId | 'vdb'
  ax: number
  ay: number
  bx: number
  by: number
}

/** Straight vertical pipeline at x=460. */
export const EDGES: EdgeSpec[] = [
  { a: 'query', b: 'embed', ax: 460, ay: 80, bx: 460, by: 133 },
  { a: 'embed', b: 'vdb', ax: 460, ay: 203, bx: 460, by: 220 },
  { a: 'vdb', b: 'llm', ax: 460, ay: 640, bx: 460, by: 677 },
  { a: 'llm', b: 'answer', ax: 460, ay: 747, bx: 460, by: 785 },
]

export function edgeBetween(x: NodeId | 'vdb', y: NodeId | 'vdb'): EdgeSpec | undefined {
  return EDGES.find((e) => (e.a === x && e.b === y) || (e.a === y && e.b === x))
}

/** Starter knowledge base (help-center). Scores are relative to the refund question. */
const KB: { id: string; tag: string; text: string; score: number }[] = [
  { id: 'c1', tag: 'refund', text: 'Refunds take 1–3 business days.', score: 0.91 },
  { id: 'c2', tag: 'account', text: 'Change your password in Settings.', score: 0.11 },
  { id: 'c3', tag: 'fees', text: 'Bank transfer fee is Rp2,500.', score: 0.46 },
  { id: 'c4', tag: 'system', text: 'Works on Android 8.0 and up.', score: 0.07 },
  { id: 'c5', tag: 'promo', text: 'Enter promo codes at checkout.', score: 0.29 },
]

const TOP_K = 2
const TOP_IDS = ['c1', 'c3'] // the two highest scores
const QUESTION = 'How long until my refund arrives?'
const ANSWER = 'Your refund arrives in 1–3 business days.'

function makeChunks(opts: { stored: boolean; scored: boolean; selected: boolean }): ChunkState[] {
  return KB.map((c) => ({
    id: c.id,
    tag: c.tag,
    text: c.text,
    stored: opts.stored,
    score: opts.scored ? c.score : null,
    selected: opts.selected ? TOP_IDS.includes(c.id) : false,
  }))
}

export const PHASES: Record<Mode, { label: string; desc: string; filename: string; code: string[] }> = {
  index: {
    label: 'Indexing',
    desc: 'Offline — document → chunks → embeddings → vector DB',
    filename: 'ingest.py',
    code: [
      '# 1. Split the document into small chunks',
      'chunks = split_text(document, size=200)',
      '',
      '# 2. Turn each chunk into a vector (embedding)',
      'for chunk in chunks:',
      '    vector = embed(chunk)      # e.g. 1536 dims',
      '    # 3. Store the vector + original text',
      '    vector_db.add(id, vector, chunk)',
    ],
  },
  retrieve: {
    label: 'Retrieval',
    desc: 'Question → embed → find the most similar chunks (top-k)',
    filename: 'retrieve.py',
    code: [
      '# 1. Embed the user question (same model)',
      'q_vector = embed(question)',
      '',
      '# 2. Find the most similar chunks (cosine sim)',
      'hits = vector_db.search(q_vector, top_k=2)',
      '',
      '# hits, sorted by score:',
      '#   c1  refund   0.91',
      '#   c3  fees     0.46',
    ],
  },
  generate: {
    label: 'Generation',
    desc: 'Context + question → LLM → grounded answer',
    filename: 'generate.py',
    code: [
      '# 1. Build context from the retrieved chunks',
      'context = "\\n".join(h.text for h in hits)',
      '',
      '# 2. Put context + question into the prompt',
      'prompt = f"""Answer ONLY from the context below.',
      'Context:',
      '{context}',
      'Question: {question}"""',
      '',
      '# 3. The LLM answers — grounded, not made up',
      'answer = llm.generate(prompt)',
    ],
  },
}

type Required = Pick<RagStep, 'line' | 'status'>

function b(p: Partial<RagStep> & Required): RagStep {
  return {
    phase: 'index',
    packet: null,
    activeNodes: [],
    chunks: makeChunks({ stored: true, scored: false, selected: false }),
    queryVec: false,
    answer: null,
    sound: null,
    ...p,
  }
}

const withPhase = (steps: RagStep[], phase: Mode): RagStep[] => steps.map((s) => ({ ...s, phase }))

const VEC = (s: string) => `[${s}, …]`

function buildIndex(): RagStep[] {
  const steps: RagStep[] = []
  // Start: nothing stored yet.
  const empty = makeChunks({ stored: false, scored: false, selected: false })
  steps.push(
    b({ chunks: empty, activeNodes: ['query'], line: 1, status: `The document is split into ${KB.length} small chunks.`, sound: 'send' }),
  )
  // Store each chunk one by one.
  const vectors = ['0.82, -0.14, 0.39', '0.05, 0.61, -0.22', '0.18, -0.40, 0.55', '-0.31, 0.12, 0.48', '0.27, 0.33, -0.09']
  KB.forEach((_, i) => {
    const chunks = empty.map((ch, j) => ({ ...ch, stored: j <= i }))
    steps.push(
      b({
        chunks,
        packet: { from: 'embed', to: 'vdb', tag: VEC(vectors[i]), tone: 'vector' },
        activeNodes: ['query', 'embed', 'vdb'],
        line: 7,
        status: `Chunk #${i + 1}: turned into a vector, then stored in the DB.`,
        sound: 'store',
      }),
    )
  })
  steps.push(
    b({ activeNodes: ['vdb'], line: 7, status: `Knowledge base ready: ${KB.length} vectors stored (done once, offline).`, sound: 'done' }),
  )
  return steps
}

function buildRetrieve(): RagStep[] {
  const scored = makeChunks({ stored: true, scored: true, selected: false })
  const selected = makeChunks({ stored: true, scored: true, selected: true })
  return [
    b({ activeNodes: ['query'], line: 0, status: `User question: "${QUESTION}"`, sound: 'send' }),
    b({ packet: { from: 'query', to: 'embed', tag: 'question', tone: 'text' }, activeNodes: ['query', 'embed'], queryVec: true, line: 1, status: 'The question becomes a vector — the SAME embedding model as indexing.', sound: 'embed' }),
    b({ packet: { from: 'embed', to: 'vdb', tag: VEC('0.77, 0.20, 0.41'), tone: 'vector' }, activeNodes: ['embed', 'vdb'], line: 4, status: "Compare the question's vector against every chunk.", sound: 'store' }),
    b({ chunks: scored, activeNodes: ['vdb'], line: 4, status: 'Score each chunk by similarity (0–1). Higher = closer in meaning.', sound: 'score' }),
    b({ chunks: selected, activeNodes: ['vdb'], line: 7, status: 'Pick the top 2 scores: c1 refund (0.91) and c3 fees (0.46).', sound: 'select' }),
    b({ chunks: selected, activeNodes: ['vdb'], line: 8, status: 'Matched by meaning, not exact words.', sound: 'done' }),
  ]
}

function buildGenerate(): RagStep[] {
  const selected = makeChunks({ stored: true, scored: true, selected: true })
  return [
    b({ chunks: selected, activeNodes: ['vdb'], line: 0, status: `The ${TOP_K} retrieved chunks become the answer's source.`, sound: 'send' }),
    b({ chunks: selected, packet: { from: 'vdb', to: 'llm', tag: 'context: c1 + c3', tone: 'context' }, activeNodes: ['vdb', 'llm'], line: 1, status: 'Their text is joined into a context.', sound: 'augment' }),
    b({ chunks: selected, activeNodes: ['query', 'llm'], line: 6, status: 'Context + question form the augmented prompt (see code).', sound: 'augment' }),
    b({ chunks: selected, activeNodes: ['llm'], line: 9, status: 'The LLM reads the prompt and answers using only the context.', sound: 'process' }),
    b({ chunks: selected, packet: { from: 'llm', to: 'answer', tag: 'answer', tone: 'answer' }, activeNodes: ['llm', 'answer'], answer: ANSWER, line: 9, status: 'Grounded answer, based on c1 — not made up.', sound: 'answer' }),
    b({ chunks: selected, activeNodes: ['answer'], answer: ANSWER, line: 9, status: 'RAG = answers from real data → fewer hallucinations, with a citable source.', sound: 'done' }),
  ]
}

/**
 * One continuous flow through all three phases: indexing (offline) -> retrieval
 * -> generation. Chunk state flows smoothly across phases (DB fills up -> gets
 * scored -> top-k selected -> becomes the answer's context).
 */
export function buildSteps(): RagStep[] {
  return [
    ...withPhase(buildIndex(), 'index'),
    ...withPhase(buildRetrieve(), 'retrieve'),
    ...withPhase(buildGenerate(), 'generate'),
  ]
}

export { QUESTION }

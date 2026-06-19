/**
 * Precomputed "Agentic RAG" flow — one Step = a full snapshot of the board. The
 * animation just replays these frames.
 *
 * Plain RAG is a straight line: retrieve once → generate. Agentic RAG wraps an
 * AGENT around that pipeline, so it can:
 *
 *   PLAN     : decide it needs the knowledge base.
 *   RETRIEVE : pull the top-k chunks for the current query.
 *   GRADE    : judge whether those chunks actually answer the question.
 *   REWRITE  : if not good enough, fix the query and retrieve AGAIN (the loop).
 *   GENERATE : once the context is sufficient, write a grounded answer.
 *   VALIDATE : check the answer is supported by the docs (anti-hallucination).
 *
 * The retry loop + self-grading is exactly what plain RAG lacks.
 *
 * Example: a fintech help-center where the first query misses and a rewrite
 * finds the right policy.
 */

export type Phase = 'plan' | 'retrieve' | 'grade' | 'rewrite' | 'generate' | 'validate'

export type Verdict = 'sufficient' | 'insufficient' | null

export type Cue = 'plan' | 'retrieve' | 'grade' | 'rewrite' | 'generate' | 'answer' | 'done' | null

/** A chunk retrieved on the current attempt, with the agent's relevance grade. */
export interface DocState {
  id: string
  tag: string
  text: string
  /** 'relevant' = green, 'weak' = off-topic / not enough. null = not graded yet. */
  grade: 'relevant' | 'weak' | null
}

export interface AgenticStep {
  phase: Phase
  /** Retrieval attempt, 1-based. */
  attempt: number
  /** The query used for this attempt (rewrites change it). */
  query: string
  /** Docs retrieved on this attempt. */
  docs: DocState[]
  /** Grading verdict for this attempt. */
  verdict: Verdict
  answer: string | null
  /** Final answer passed the grounded-ness check. */
  validated: boolean
  line: number
  status: string
  sound: Cue
}

export const QUESTION = 'Can I get a refund to a different bank account than I paid with?'
const ANSWER = 'No — refunds always go back to your original payment method.'

/** Agentic RAG pipeline (pseudocode) shown in the CodeBlock. */
export const CODE_SOURCE = [
  '# Agentic RAG — retrieve, self-grade, loop, then answer',
  'def agentic_rag(question):',
  '    query = question',
  '    for attempt in range(MAX_TRIES):',
  '        docs = vector_db.search(query, top_k=2)   # retrieve',
  '        if grade(docs, question) == "sufficient": # self-grade',
  '            break',
  '        query = llm.rewrite(question, docs)        # fix + retry',
  '    answer = llm.generate(question, docs)          # grounded',
  '    assert grounded(answer, docs)                  # validate',
  '    return answer',
]

/** What each attempt retrieves and how the agent grades it. */
const ATTEMPTS: { query: string; docs: DocState[]; verdict: Exclude<Verdict, null> }[] = [
  {
    query: 'refund different bank account',
    docs: [
      { id: 'd1', tag: 'refund', text: 'Refunds take 1–3 business days.', grade: 'weak' },
      { id: 'd2', tag: 'fees', text: 'Bank transfer fee is Rp2,500.', grade: 'weak' },
    ],
    verdict: 'insufficient',
  },
  {
    query: 'refund destination account policy',
    docs: [
      { id: 'd3', tag: 'policy', text: 'Refunds always return to the original payment method.', grade: 'relevant' },
      { id: 'd1', tag: 'refund', text: 'Refunds take 1–3 business days.', grade: 'weak' },
    ],
    verdict: 'sufficient',
  },
]

type Req = Pick<AgenticStep, 'line' | 'status'>

function b(p: Partial<AgenticStep> & Req): AgenticStep {
  return {
    phase: 'plan',
    attempt: 1,
    query: QUESTION,
    docs: [],
    verdict: null,
    answer: null,
    validated: false,
    sound: null,
    ...p,
  }
}

/** Strip grades so retrieval shows raw hits before the agent judges them. */
const ungraded = (docs: DocState[]): DocState[] => docs.map((d) => ({ ...d, grade: null }))

export function buildSteps(): AgenticStep[] {
  const steps: AgenticStep[] = []

  // PLAN
  steps.push(
    b({
      phase: 'plan',
      line: 2,
      status: `Question: "${QUESTION}"`,
      sound: 'plan',
    }),
  )
  steps.push(
    b({
      phase: 'plan',
      line: 3,
      status: 'Plan — this needs facts from the knowledge base. Start retrieving.',
      sound: 'plan',
    }),
  )

  ATTEMPTS.forEach((att, i) => {
    const attempt = i + 1

    // RETRIEVE
    steps.push(
      b({
        phase: 'retrieve',
        attempt,
        query: att.query,
        docs: ungraded(att.docs),
        line: 4,
        status: `Attempt ${attempt} · Retrieve — search the vector DB for "${att.query}".`,
        sound: 'retrieve',
      }),
    )

    // GRADE
    steps.push(
      b({
        phase: 'grade',
        attempt,
        query: att.query,
        docs: att.docs,
        verdict: att.verdict,
        line: 5,
        status:
          att.verdict === 'sufficient'
            ? `Attempt ${attempt} · Grade — relevant chunk found. Context is sufficient.`
            : `Attempt ${attempt} · Grade — chunks are off-topic. Context is insufficient.`,
        sound: 'grade',
      }),
    )

    // REWRITE (only when insufficient and another attempt follows)
    if (att.verdict === 'insufficient' && i + 1 < ATTEMPTS.length) {
      steps.push(
        b({
          phase: 'rewrite',
          attempt,
          query: att.query,
          docs: att.docs,
          verdict: att.verdict,
          line: 7,
          status: `Self-correct — rewrite the query and loop back to retrieve. (plain RAG would stop here)`,
          sound: 'rewrite',
        }),
      )
    }
  })

  const finalDocs = ATTEMPTS[ATTEMPTS.length - 1].docs

  // GENERATE
  steps.push(
    b({
      phase: 'generate',
      attempt: ATTEMPTS.length,
      query: ATTEMPTS[ATTEMPTS.length - 1].query,
      docs: finalDocs,
      verdict: 'sufficient',
      line: 8,
      status: 'Generate — write the answer using only the relevant chunk (d3).',
      sound: 'generate',
    }),
  )
  steps.push(
    b({
      phase: 'generate',
      attempt: ATTEMPTS.length,
      query: ATTEMPTS[ATTEMPTS.length - 1].query,
      docs: finalDocs,
      verdict: 'sufficient',
      answer: ANSWER,
      line: 8,
      status: 'A grounded answer, built from the retrieved policy.',
      sound: 'answer',
    }),
  )

  // VALIDATE
  steps.push(
    b({
      phase: 'validate',
      attempt: ATTEMPTS.length,
      query: ATTEMPTS[ATTEMPTS.length - 1].query,
      docs: finalDocs,
      verdict: 'sufficient',
      answer: ANSWER,
      line: 9,
      status: 'Validate — every claim is supported by d3. No hallucination.',
      sound: 'generate',
    }),
  )
  steps.push(
    b({
      phase: 'validate',
      attempt: ATTEMPTS.length,
      query: ATTEMPTS[ATTEMPTS.length - 1].query,
      docs: finalDocs,
      verdict: 'sufficient',
      answer: ANSWER,
      validated: true,
      line: 10,
      status: 'Agentic RAG = RAG + grade + retry + validate — reliable, not one lucky shot.',
      sound: 'done',
    }),
  )

  return steps
}

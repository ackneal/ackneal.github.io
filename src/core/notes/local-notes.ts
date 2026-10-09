import type { BrowserModel } from '../agent/browser-model.js';
import {
  evidenceTopics,
  getEvidenceByTopic,
  getProject,
  type EvidenceTopic,
} from '../web-mcp/career-data.js';
import { careerExperiences } from '../../content/resume.js';

export type BroadFocusId =
  | 'applied-ai'
  | 'backend-systems'
  | 'distributed-systems'
  | 'architecture'
  | 'search-discovery'
  | 'leadership'
  | 'legacy-modernization';

export const BROAD_FOCUS_CHOICES: readonly { id: BroadFocusId; label: string }[] = [
  { id: 'applied-ai', label: 'Applied AI' },
  { id: 'backend-systems', label: 'Backend Systems' },
  { id: 'distributed-systems', label: 'Distributed Systems' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'search-discovery', label: 'Search & Discovery' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'legacy-modernization', label: 'Legacy Modernization' },
];

/** Stable expansion order is part of the local-note contract. */
export const BROAD_FOCUS_REPRESENTATIVES: Readonly<Record<BroadFocusId, readonly string[]>> = {
  'applied-ai': ['project:conversational-booking-agent', 'project:content-intelligence-workflow', 'project:platform-mcp-server', 'experience:funnow-ai-team-lead'],
  'backend-systems': ['experience:funnow-backend-lead', 'project:dual-track-inventory-engine', 'project:distributed-read-write-lock', 'project:geospatial-proximity-search'],
  'distributed-systems': ['project:distributed-read-write-lock', 'project:geospatial-proximity-search', 'experience:funnow-backend-engineer'],
  architecture: ['project:ddd-architecture-adoption', 'project:dual-track-inventory-engine', 'experience:funnow-backend-lead'],
  'search-discovery': ['project:realtime-nickname-autocomplete', 'project:geospatial-proximity-search', 'project:content-intelligence-workflow', 'project:conversational-booking-agent'],
  leadership: ['experience:funnow-backend-lead', 'experience:funnow-ai-team-lead'],
  'legacy-modernization': ['project:cross-brand-identity-migration', 'project:zero-downtime-elasticsearch-migration', 'project:dual-track-inventory-engine', 'experience:funnow-backend-lead'],
};

export const BROAD_FOCUS_TOPICS: Readonly<Record<BroadFocusId, readonly EvidenceTopic[]>> = {
  'applied-ai': ['agentic-systems', 'conversational-agents', 'llm-evaluation', 'model-routing', 'prompt-caching', 'content-intelligence', 'mcp'],
  'backend-systems': ['concurrency', 'inventory-systems'],
  'distributed-systems': ['distributed-systems', 'distributed-locking'],
  architecture: ['system-architecture', 'domain-driven-design', 'inventory-systems'],
  'search-discovery': ['search-infrastructure', 'geospatial-search', 'content-intelligence', 'conversational-agents'],
  leadership: ['engineering-leadership', 'cross-functional-delivery'],
  'legacy-modernization': ['identity-migration', 'platform-consolidation', 'inventory-systems', 'zero-downtime-migration'],
};

const focusIds = BROAD_FOCUS_CHOICES.map(({ id }) => id);
export const INTENT_RESPONSE_CONSTRAINT = {
  type: 'object',
  properties: {
    primary: { type: 'string', enum: focusIds },
    secondary: { type: ['string', 'null'], enum: [...focusIds, null] },
  },
  required: ['primary', 'secondary'],
  additionalProperties: false,
};

export const LOCAL_NOTES_SYSTEM_PROMPT = `You write the "What stands out" section of a private career reading note. Use only the supplied evidence. Explain the strongest directly supported relevance between the visitor's request and the selected evidence. Use concrete facts and connect evidence only when that connection is directly supported and useful. Do not search for or invent a deeper career narrative. Do not infer motivations, outcomes, qualities, or relationships that the evidence does not explicitly support. Do not evaluate, recommend, score, or make claims about the person's aptitude, capability, suitability, effectiveness, or potential. Chronology does not imply causality; do not claim that one project led to, refined, or improved another unless stated. Prefer concrete implementation details over generic adjectives. Do not introduce claims such as scalable, resilient, robust, data integrity, data loss prevention, high performance, or production reliability unless directly supported. Explain relevance rather than restating every project. Start with the evidence that most directly answers the request. Mention additional evidence only when it adds a distinct relevant point; do not try to cover every supplied item. Prefer explaining one or two strong pieces precisely over summarizing the full set. Answer directly without introductory framing such as "The provided evidence highlights," "The evidence demonstrates," "The visitor seeks," or "What stands out is." If one item answers the request, focus on it; if several answer different parts, explain those parts clearly. Write 1–3 concise sentences. Stop immediately once the concrete evidence has answered the visitor's request. Do not add a concluding interpretation, summary, or broader implication after the answer is complete.`;
const CLASSIFICATION_SYSTEM_PROMPT = 'Identify the primary visitor intent as the single best main intent. Choose secondary only for an independently requested distinct dimension, never merely related support; use null when primary is sufficient. Return JSON matching the response schema, using only the supplied Focus enum.';

export interface LocalNoteOptions { signal?: AbortSignal; }
export interface LocalNoteInput extends LocalNoteOptions { intent: string; focusIds: BroadFocusId[]; }
type Focus = { id: BroadFocusId; label: string; topics: readonly EvidenceTopic[] };
type EvidenceBundle = ReturnType<typeof getEvidenceByTopic>;
export type SelectedEvidence = EvidenceBundle['evidence'][number];

export interface LocalNoteDebugTrace {
  originalIntent: string;
  rawFocusClassification: string | null;
  primaryFocus: BroadFocusId | null;
  secondaryFocus: BroadFocusId | null;
  classifiedFocuses: BroadFocusId[];
  classificationError: string | null;
  manualFocuses: readonly { id: BroadFocusId; topics: readonly EvidenceTopic[] }[];
  resolvedFocuses: readonly Focus[];
  expandedInternalTopics: EvidenceTopic[];
  evidenceCandidates: readonly { id: string; focuses: BroadFocusId[]; topics: EvidenceTopic[]; selected: boolean; selectionReason?: string }[];
  synthesisInput: { intent: string; focuses: { id: BroadFocusId; label: string }[]; evidenceIds: string[] };
  synthesisOutput: string;
}

export interface LocalNoteResult {
  intent: string;
  selectedFocus: readonly Focus[];
  selectedEvidence: SelectedEvidence[];
  interpretation: string;
  intentClassificationFailed: boolean;
  debugTrace: LocalNoteDebugTrace;
}

function focus(id: BroadFocusId): Focus {
  return { id, label: BROAD_FOCUS_CHOICES.find((choice) => choice.id === id)!.label, topics: BROAD_FOCUS_TOPICS[id] };
}

function idOf(evidence: SelectedEvidence) {
  return evidence.sourceType === 'experience' ? `experience:${evidence.experienceId}` : `project:${evidence.projectId}`;
}

function validateInput(input: LocalNoteInput, intent: string) {
  if (!intent && input.focusIds.length === 0) {
    throw new Error('Provide an intent or at least one focus.');
  }
  if (input.focusIds.length > 3) {
    throw new Error('At most 3 focus IDs are allowed.');
  }
  if (input.focusIds.some((id) => !focusIds.includes(id))) {
    throw new Error('Invalid focus ID.');
  }
}

function initializeTrace(intent: string, manualFocuses: readonly Focus[]): LocalNoteDebugTrace {
  return {
    originalIntent: intent,
    rawFocusClassification: null,
    primaryFocus: null,
    secondaryFocus: null,
    classifiedFocuses: [],
    classificationError: null,
    manualFocuses: manualFocuses.map(({ id, topics }) => ({ id, topics })),
    resolvedFocuses: [],
    expandedInternalTopics: [],
    evidenceCandidates: [],
    synthesisInput: { intent, focuses: [], evidenceIds: [] },
    synthesisOutput: '',
  };
}

async function classifyIntent(model: BrowserModel, intent: string, signal: AbortSignal | undefined) {
  let session;
  let raw: string | null = null;
  try {
    session = await model.createSession({ debugName: 'Local notes intent classification', initialPrompts: [{ role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT }], signal });
    const availableFocuses = BROAD_FOCUS_CHOICES.map(({ id, label }) => `${id}: ${label}`).join('\n');
    raw = await session.prompt(`Classify the primary visitor intent and, only when independently requested, a distinct secondary dimension.\nFOCUS VALUES:\n${availableFocuses}\n\nVISITOR INTENT:\n${intent}`, { signal, responseConstraint: INTENT_RESPONSE_CONSTRAINT });
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid classification response');
    }
    const value = parsed as { primary?: unknown; secondary?: unknown };
    const valid = Object.keys(value).every((key) => key === 'primary' || key === 'secondary')
      && typeof value.primary === 'string' && focusIds.includes(value.primary as BroadFocusId)
      && (value.secondary === null || (typeof value.secondary === 'string' && focusIds.includes(value.secondary as BroadFocusId)));
    if (!valid) {
      throw new Error('Invalid classification response');
    }
    const primary = value.primary as BroadFocusId;
    const secondary = value.secondary === primary ? null : value.secondary as BroadFocusId | null;
    return { raw, primary, secondary, classified: [primary, ...(secondary ? [secondary] : [])] };
  } catch (error: unknown) {
    if (raw !== null && error && typeof error === 'object') {
      (error as { raw?: string }).raw = raw;
    }
    throw error;
  } finally {
    session?.destroy();
  }
}

async function resolveClassification(model: BrowserModel, intent: string, manualFocuses: readonly Focus[], trace: LocalNoteDebugTrace, signal: AbortSignal | undefined) {
  if (!intent) {
    return { classified: [] as BroadFocusId[], failed: false };
  }
  try {
    const result = await classifyIntent(model, intent, signal);
    trace.rawFocusClassification = result.raw;
    trace.primaryFocus = result.primary;
    trace.secondaryFocus = result.secondary;
    trace.classifiedFocuses = result.classified;
    return { classified: result.classified, failed: false };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'raw' in error && typeof error.raw === 'string') {
      trace.rawFocusClassification = error.raw;
    }
    trace.classificationError = error instanceof Error ? error.message : String(error);
    if (manualFocuses.length === 0) {
      throw new Error('Intent classification failed.');
    }
    return { classified: [] as BroadFocusId[], failed: true };
  }
}

function resolveFocuses(manualFocuses: readonly Focus[], classified: readonly BroadFocusId[]) {
  return [...new Set([...manualFocuses.map(({ id }) => id), ...classified])].slice(0, 3).map(focus);
}

type Candidate = { evidence: SelectedEvidence; id: string; focuses: BroadFocusId[]; topics: EvidenceTopic[]; representativeOrder: number; reason?: string };

function retrieveFocusEvidence(resolvedFocuses: readonly Focus[]) {
  const byTopic = new Map<EvidenceTopic, SelectedEvidence[]>();
  for (const selectedFocus of resolvedFocuses) {
    for (const topic of selectedFocus.topics) {
      if (!byTopic.has(topic)) {
        byTopic.set(topic, getEvidenceByTopic(topic).evidence);
      }
    }
  }

  const byId = new Map<string, SelectedEvidence>();
  for (const topic of evidenceTopics) {
    const evidence = byTopic.get(topic) ?? getEvidenceByTopic(topic).evidence;
    for (const item of evidence) {
      byId.set(idOf(item), item);
    }
  }

  return { byTopic, byId };
}

function selectEvidence(resolvedFocuses: readonly Focus[]) {
  const retrieved = retrieveFocusEvidence(resolvedFocuses);
  const candidates = new Map<string, Candidate>();
  let representativeOrder = 0;
  const add = (evidence: SelectedEvidence, selectedFocus: BroadFocusId, topic?: EvidenceTopic, representative = false) => {
    const id = idOf(evidence);
    let candidate = candidates.get(id);
    if (!candidate) {
      candidate = { evidence, id, focuses: [], topics: [], representativeOrder: Number.MAX_SAFE_INTEGER };
      candidates.set(id, candidate);
    }
    if (!candidate.focuses.includes(selectedFocus)) {
      candidate.focuses.push(selectedFocus);
    }
    if (topic && !candidate.topics.includes(topic)) {
      candidate.topics.push(topic);
    }
    if (representative && candidate.representativeOrder === Number.MAX_SAFE_INTEGER) {
      candidate.representativeOrder = representativeOrder;
      representativeOrder += 1;
    }
  };

  // Curated representatives may extend beyond a focus's topic mappings.
  for (const selectedFocus of resolvedFocuses) {
    for (const reference of BROAD_FOCUS_REPRESENTATIVES[selectedFocus.id]) {
      const evidence = retrieved.byId.get(reference);
      if (evidence) {
        add(evidence, selectedFocus.id, undefined, true);
      }
    }
  }
  for (const selectedFocus of resolvedFocuses) {
    for (const topic of selectedFocus.topics) {
      for (const evidence of retrieved.byTopic.get(topic) ?? []) {
        add(evidence, selectedFocus.id, topic);
      }
    }
  }

  const all = [...candidates.values()];
  const chosen: Candidate[] = [];
  const choose = (candidate: Candidate, reason: string) => {
    if (chosen.length >= 6 || chosen.includes(candidate)) {
      return;
    }
    chosen.push(candidate);
    candidate.reason = reason;
  };
  const representatives = all.filter(({ representativeOrder: rank }) => rank !== Number.MAX_SAFE_INTEGER);
  if (resolvedFocuses.length === 1) {
    for (const candidate of representatives) {
      choose(candidate, 'ordered representative for focus');
    }
  } else {
    const sharedRepresentatives = representatives
      .filter(({ focuses }) => focuses.length > 1)
      .sort((a, b) => a.representativeOrder - b.representativeOrder);
    for (const candidate of sharedRepresentatives) {
      choose(candidate, 'representative of multiple focuses');
    }
    for (const selectedFocus of resolvedFocuses) {
      const focusRepresentatives = representatives
        .filter(({ focuses }) => focuses.includes(selectedFocus.id))
        .sort((a, b) => a.representativeOrder - b.representativeOrder);
      for (const candidate of focusRepresentatives) {
        choose(candidate, 'ordered representative for focus');
      }
    }
  }
  const selectedIds = new Set(chosen.map(({ id }) => id));
  return {
    selectedEvidence: chosen.map(({ evidence }) => evidence),
    evidenceCandidates: all.map(({ id, focuses, topics, reason }) => ({ id, focuses, topics, selected: selectedIds.has(id), selectionReason: reason ?? 'not selected; no representative slot' })),
  };
}

function orderChronologically(evidence: readonly SelectedEvidence[], focuses: readonly Focus[]) {
  const stageOrder = new Map(careerExperiences.map((stage, index) => [stage.id, index]));
  const editorialOrder = new Map<string, number>();
  let rank = 0;
  for (const selectedFocus of focuses) {
    for (const reference of BROAD_FOCUS_REPRESENTATIVES[selectedFocus.id]) {
      if (!editorialOrder.has(reference)) {
        editorialOrder.set(reference, rank);
        rank += 1;
      }
    }
  }
  const stageOf = (item: SelectedEvidence) => stageOrder.get(item.experienceId) ?? Number.MAX_SAFE_INTEGER;
  return [...evidence].sort((a, b) => stageOf(b) - stageOf(a) || (editorialOrder.get(idOf(a)) ?? Number.MAX_SAFE_INTEGER) - (editorialOrder.get(idOf(b)) ?? Number.MAX_SAFE_INTEGER));
}

function projectSynthesisEvidence(selectedEvidence: readonly SelectedEvidence[]) {
  return selectedEvidence.map((evidence) => {
    if (evidence.sourceType === 'experience') {
      return evidence;
    }
    const project = getProject(evidence.projectId);
    return {
      id: project.id, name: project.name, role: project.experience.role, company: project.experience.company,
      period: project.experience.period, summary: project.summary,
      technologies: project.technologies,
      ...(project.architecture.length ? { architecture: project.architecture } : {}),
      ...(project.engineeringQuality?.length ? { engineeringQuality: project.engineeringQuality } : {}),
      ...(project.impact?.length ? { impact: project.impact } : {}),
    };
  });
}

async function executeSynthesis(model: BrowserModel, intent: string, focuses: readonly Focus[], selectedEvidence: readonly SelectedEvidence[], options: LocalNoteOptions, intentClassificationFailed: boolean, debugTrace: LocalNoteDebugTrace): Promise<LocalNoteResult> {
  let session;
  try {
    session = await model.createSession({ debugName: 'Local notes synthesis', initialPrompts: [{ role: 'system', content: LOCAL_NOTES_SYSTEM_PROMPT }], signal: options.signal });
    const synthesisFocuses = focuses.map(({ id, label }) => ({ id, label }));
    const evidenceIds = selectedEvidence.map(idOf);
    debugTrace.synthesisInput = { intent, focuses: synthesisFocuses, evidenceIds };
    const projection = projectSynthesisEvidence(selectedEvidence);
    const synthesisPrompt = `VISITOR INTENT:\n${intent}\nFOCUS:\n${JSON.stringify(synthesisFocuses)}\nEVIDENCE:\n${JSON.stringify(projection)}\nExplain the strongest directly supported relevance to the visitor's request using only the supplied facts.`;
    const interpretation = await session.prompt(synthesisPrompt, { signal: options.signal });
    debugTrace.synthesisOutput = interpretation;
    return { intent, selectedFocus: focuses, selectedEvidence: [...selectedEvidence], interpretation, intentClassificationFailed, debugTrace };
  } finally {
    session?.destroy();
  }
}

export async function createLocalNote(model: BrowserModel, input: LocalNoteInput): Promise<LocalNoteResult> {
  const intent = input.intent.trim();
  validateInput(input, intent);

  const manualFocuses = [...new Set(input.focusIds)].map(focus);
  const trace = initializeTrace(intent, manualFocuses);
  const classification = await resolveClassification(model, intent, manualFocuses, trace, input.signal);

  const resolvedFocuses = resolveFocuses(manualFocuses, classification.classified);
  const expandedInternalTopics = [...new Set(resolvedFocuses.flatMap(({ topics }) => topics))];
  trace.resolvedFocuses = resolvedFocuses;
  trace.expandedInternalTopics = expandedInternalTopics;

  const selection = selectEvidence(resolvedFocuses);
  trace.evidenceCandidates = selection.evidenceCandidates;
  const orderedEvidence = orderChronologically(selection.selectedEvidence, resolvedFocuses);

  return executeSynthesis(model, intent, resolvedFocuses, orderedEvidence, input, classification.failed, trace);
}

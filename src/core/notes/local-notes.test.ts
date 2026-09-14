import { describe, expect, test } from 'bun:test';
import { TestBrowserModel } from '../agent/test-browser-model.js';
import {
  BROAD_FOCUS_CHOICES,
  BROAD_FOCUS_TOPICS,
  BROAD_FOCUS_REPRESENTATIVES,
  INTENT_RESPONSE_CONSTRAINT,
  LOCAL_NOTES_SYSTEM_PROMPT,
  createLocalNote,
} from './local-notes.js';

const id = (record: { sourceType: string; experienceId?: string; projectId?: string }) =>
  record.sourceType === 'experience' ? `experience:${record.experienceId}` : `project:${record.projectId}`;

describe('createLocalNote', () => {
  test('shares the seven Focus choices and maps Search and Legacy broadly', () => {
    expect(BROAD_FOCUS_CHOICES).toHaveLength(7);
    expect(BROAD_FOCUS_CHOICES.at(-1)).toEqual({ id: 'legacy-modernization', label: 'Legacy Modernization' });
    expect(BROAD_FOCUS_TOPICS['search-discovery']).toEqual(expect.arrayContaining(['search-infrastructure', 'content-intelligence', 'conversational-agents']));
    expect(BROAD_FOCUS_TOPICS['legacy-modernization']).toEqual(expect.arrayContaining(['identity-migration', 'platform-consolidation', 'inventory-systems', 'zero-downtime-migration']));
  });

  test('uses a minimal constrained classifier schema and prompt', async () => {
    const model = new TestBrowserModel(({ input: prompt }) => prompt.includes('Classify')
      ? '{"primary":"search-discovery","secondary":"search-discovery"}' : 'Connected evidence.');
    const result = await createLocalNote(model, { intent: 'find things', focusIds: [] });
    expect(result.debugTrace.primaryFocus).toBe('search-discovery');
    expect(result.debugTrace.secondaryFocus).toBeNull();
    expect(result.debugTrace.classifiedFocuses).toEqual(['search-discovery']);
    expect(INTENT_RESPONSE_CONSTRAINT.properties.primary.enum).toEqual(BROAD_FOCUS_CHOICES.map(({ id }) => id));
    expect(model.created[0].messages[0].content).toContain('single best main intent');
    expect(model.created[0].messages[0].content).toContain('independently requested distinct dimension');
    expect(model.created[0].messages[0].content).toContain('never merely related support');
    expect(INTENT_RESPONSE_CONSTRAINT.properties.secondary.enum).toContain(null);
  });

  test('uses stable prefixed representative references and preserves classified order', async () => {
    for (const representatives of Object.values(BROAD_FOCUS_REPRESENTATIVES)) {
      expect(representatives.every((reference) => /^(experience|project):[a-z0-9-]+$/.test(reference))).toBe(true);
    }
    const model = new TestBrowserModel(({ input: prompt }) => prompt.includes('Classify')
      ? '{"primary":"architecture","secondary":"search-discovery"}' : 'Synthesis.');
    const result = await createLocalNote(model, { intent: 'architecture and search', focusIds: [] });
    expect(result.debugTrace.classifiedFocuses).toEqual(['architecture', 'search-discovery']);
    expect(result.debugTrace.synthesisInput.evidenceIds).toEqual(result.selectedEvidence.map(id));
  });

  test('merges manual focuses first and caps resolved focuses at three', async () => {
    const model = new TestBrowserModel(({ input: prompt }) => prompt.includes('Classify')
      ? '{"primary":"leadership","secondary":"legacy-modernization"}' : 'Synthesis.');
    const result = await createLocalNote(model, { intent: 'modern systems', focusIds: ['applied-ai', 'leadership'] });
    expect(result.debugTrace.resolvedFocuses.map(({ id }) => id)).toEqual(['applied-ai', 'leadership', 'legacy-modernization']);
    expect(result.debugTrace.expandedInternalTopics).toEqual([...new Set(result.debugTrace.resolvedFocuses.flatMap(({ topics }) => topics))]);
  });

  test.each([
    ['search-discovery', [
      'project:realtime-nickname-autocomplete', 'project:geospatial-proximity-search',
      'project:content-intelligence-workflow', 'project:conversational-booking-agent',
    ]],
    ['legacy-modernization', [
      'project:zero-downtime-elasticsearch-migration', 'project:cross-brand-identity-migration',
      'project:dual-track-inventory-engine', 'experience:funnow-backend-lead',
    ]],
  ] as const)('keeps curated single-focus %s progression and evidence', async (focusId, expected) => {
    const result = await createLocalNote(new TestBrowserModel(() => 'Synthesis.'), { intent: '', focusIds: [focusId] });
    expect(result.selectedEvidence.map(id)).toEqual([...expected]);
  });

  test('selects Distributed evidence without filling the cap', async () => {
    const result = await createLocalNote(new TestBrowserModel(() => 'Synthesis.'), { intent: '', focusIds: ['distributed-systems'] });
    expect(result.selectedEvidence.map(id)).toEqual([
      'project:distributed-read-write-lock', 'project:geospatial-proximity-search',
      'experience:funnow-backend-engineer',
    ]);
    expect(result.debugTrace.evidenceCandidates.every(({ selected }) => selected)).toBe(true);
  });

  test('conjoins Leadership and Architecture and excludes generic project management', async () => {
    const model = new TestBrowserModel(() => 'Synthesis.');
    const result = await createLocalNote(model, { intent: '', focusIds: ['leadership', 'architecture'] });
    expect(result.selectedEvidence.map(id)).toEqual([
      'experience:funnow-backend-lead', 'project:ddd-architecture-adoption', 'project:dual-track-inventory-engine', 'experience:funnow-ai-team-lead',
    ]);
    expect(result.selectedEvidence.map(id)).not.toContain('experience:gigafast-associate-project-manager');
    expect(result.debugTrace.evidenceCandidates.find(({ id }) => id === 'experience:funnow-backend-lead')).toMatchObject({ focuses: ['leadership', 'architecture'], selected: true });
    expect(result.debugTrace.evidenceCandidates.find(({ id }) => id === 'experience:gigafast-associate-project-manager')).toMatchObject({
      selected: false,
      selectionReason: 'not selected; no representative slot',
    });
  });

  test('retains manual fallback and trace cleanup', async () => {
    const model = new TestBrowserModel(({ input: prompt }) => prompt.includes('Classify')
      ? Promise.reject(new Error('offline')) : 'Manual connection.');
    const result = await createLocalNote(model, { intent: 'x', focusIds: ['legacy-modernization'] });
    expect(result.intentClassificationFailed).toBe(true);
    expect(result.debugTrace.classificationError).toBe('offline');
    expect(result.debugTrace.rawFocusClassification).toBeNull();
    expect(result.debugTrace.originalIntent).toBe('x');
    expect(result.debugTrace.synthesisInput).toEqual({ intent: 'x', focuses: [{ id: 'legacy-modernization', label: 'Legacy Modernization' }], evidenceIds: result.selectedEvidence.map(id) });
    expect(result.debugTrace).not.toHaveProperty('retrievedEvidence');
    expect(result.debugTrace).not.toHaveProperty('synthesisPrompt');
    expect(model.created.every((session) => session.destroyed)).toBe(true);
  });

  test('asks synthesis to interpret complete canonical project details', async () => {
    const model = new TestBrowserModel(() => 'Synthesis.');
    await createLocalNote(model, { intent: '', focusIds: ['applied-ai'] });
    const prompt = model.calls[0].input;

    expect(prompt).toContain('conversational-booking-agent');
    expect(prompt).toContain('engineeringQuality');
    expect(prompt).toContain('role');
    expect(prompt).toContain('company');
    expect(prompt).toContain('VISITOR INTENT:');
    expect(prompt).toContain("Explain the strongest directly supported relevance to the visitor's request using only the supplied facts");
    expect(LOCAL_NOTES_SYSTEM_PROMPT).toContain("Explain the strongest directly supported relevance between the visitor's request and the selected evidence");
    expect(LOCAL_NOTES_SYSTEM_PROMPT).toContain('connect evidence only when that connection is directly supported and useful');
    expect(LOCAL_NOTES_SYSTEM_PROMPT).toContain('Do not search for or invent a deeper career narrative');
    expect(LOCAL_NOTES_SYSTEM_PROMPT).toContain('Chronology does not imply causality');
    expect(LOCAL_NOTES_SYSTEM_PROMPT).toContain("person's aptitude, capability, suitability, effectiveness, or potential");
    expect(LOCAL_NOTES_SYSTEM_PROMPT).toContain('Start with the evidence that most directly answers the request');
    expect(LOCAL_NOTES_SYSTEM_PROMPT).toContain('do not try to cover every supplied item');
    expect(LOCAL_NOTES_SYSTEM_PROMPT).toContain('Prefer explaining one or two strong pieces precisely');
    expect(LOCAL_NOTES_SYSTEM_PROMPT).toContain('without introductory framing');
    expect(LOCAL_NOTES_SYSTEM_PROMPT).toContain('Write 1–3 concise sentences');
    expect(LOCAL_NOTES_SYSTEM_PROMPT).toContain("Stop immediately once the concrete evidence has answered the visitor's request");
    expect(LOCAL_NOTES_SYSTEM_PROMPT).toContain('Do not add a concluding interpretation, summary, or broader implication');

    const distributedModel = new TestBrowserModel(() => 'Synthesis.');
    await createLocalNote(distributedModel, { intent: '', focusIds: ['distributed-systems'] });
    expect(distributedModel.calls[0].input).toContain(
      'Integrated distributed single-flight cache population to protect Elasticsearch during concurrent cache misses.'
    );
  });

  test('rejects empty input and invalid focus count', async () => {
    const model = new TestBrowserModel(() => 'Synthesis.');
    await expect(createLocalNote(model, { intent: '', focusIds: [] })).rejects.toThrow('intent or at least one focus');
    await expect(createLocalNote(model, { intent: '', focusIds: ['applied-ai', 'backend-systems', 'architecture', 'leadership'] })).rejects.toThrow('3');
  });
});

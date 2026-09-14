import './styles/site.css';
import { siteContent, type Experience, type SiteLink } from './content/site-content.js';
import { LanguageModelAdapter } from './core/agent/language-model-adapter.js';
import {
  BROAD_FOCUS_CHOICES,
  createLocalNote,
  type BroadFocusId,
  type SelectedEvidence,
} from './core/notes/local-notes.js';
import { setupWebMcp } from './core/web-mcp/register.js';


function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: #${id}`);
  }
  return element as T;
}

function renderLink(link: SiteLink): HTMLAnchorElement {
  const anchor = document.createElement('a');
  anchor.textContent = link.label;
  anchor.href = link.href;

  if (link.download) {
    anchor.download = '';
  } else if (link.href.startsWith('http')) {
    anchor.target = '_blank';
    anchor.rel = 'noopener';
  }

  return anchor;
}

function renderExperience(experience: Experience): HTMLElement {
  const article = document.createElement('article');
  const career = experience.career;
  const isStage = Boolean(career) && career!.stage !== career!.totalStages;
  article.className = isStage ? 'job-panel career-stage' : 'job-panel';
  if (career?.stage === 1) {
    article.classList.add('career-stage-last');
  }
  if (career && career.stage === career.totalStages) {
    article.classList.add('career-root');
  }

  const time = document.createElement('div');
  time.className = 'job-time';
  time.append(createSpan(experience.start), createSpan(experience.end));

  const body = document.createElement('div');
  body.className = 'job-body';

  const heading = document.createElement('h3');
  heading.append(`${experience.role} `);
  if (!isStage) {
    const company = document.createElement('span');
    company.className = 'at';
    company.textContent = `@ ${experience.company}`;
    heading.append(company);
  }

  const summary = document.createElement('p');
  summary.textContent = experience.summary;

  const tags = document.createElement('div');
  tags.className = 'job-tags';
  tags.setAttribute('aria-label', 'Technologies');
  tags.append(...experience.tags.map(createSpan));

  body.append(heading, summary, tags);
  article.append(time, body);
  return article;
}

function createSpan(text: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.textContent = text;
  return span;
}

function renderContent() {
  requireElement('profile-handle').textContent = siteContent.profile.handle;
  requireElement('profile-role').textContent = siteContent.profile.role;
  requireElement('about-content').textContent = siteContent.about;
  requireElement('footer-content').textContent = siteContent.footer;
  const links = requireElement('profile-links');
  links.replaceChildren(...siteContent.links.map(renderLink));

  const experienceList = requireElement('experience-list');
  experienceList.replaceChildren(...siteContent.experience.map(renderExperience));
}

function normalizeGeneratedText(text: string): string {
  return text.trim().replace(/\n(?:[ \t]*\n){2,}/g, '\n\n');
}

function renderEvidence(evidence: SelectedEvidence): HTMLElement {
  const item = document.createElement('article');
  item.className = 'evidence-item';

  const heading = document.createElement('strong');
  heading.textContent = evidence.sourceType === 'project'
    ? evidence.projectName
    : `${evidence.role} @ ${evidence.company}`;

  const context = document.createElement('p');
  context.textContent = evidence.sourceType === 'project'
    ? `${evidence.role} @ ${evidence.company} · ${evidence.period}`
    : evidence.period;

  const summary = document.createElement('p');
  summary.textContent = evidence.summary;
  item.append(heading, context, summary);
  return item;
}

function removeRedundantExperience(evidence: readonly SelectedEvidence[]): SelectedEvidence[] {
  const projectOwners = new Set(
    evidence
      .filter((item) => item.sourceType === 'project')
      .map((item) => item.experienceId)
  );

  return evidence.filter((item) =>
    item.sourceType === 'project' || !projectOwners.has(item.experienceId)
  );
}

function selectedFocusIds(container: HTMLElement): BroadFocusId[] {
  return [...container.querySelectorAll<HTMLInputElement>('input:checked')]
    .map((input) => input.value as BroadFocusId);
}

async function setupLocalNotes(): Promise<void> {
  const editor = requireElement<HTMLFormElement>('notes-editor');
  const intent = requireElement<HTMLTextAreaElement>('notes-intent');
  const focusOptions = requireElement('notes-focus-options');
  const generate = requireElement<HTMLButtonElement>('notes-generate');
  const documentView = requireElement('notes-document');
  const indicator = requireElement('notes-indicator');
  const status = requireElement('notes-status');
  const checkboxes = BROAD_FOCUS_CHOICES.map((focus) => {
    const label = document.createElement('label');
    label.className = 'focus-option';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = focus.id;
    input.disabled = true;
    const text = document.createElement('span');
    text.textContent = focus.label;
    label.append(input, text);
    return input;
  });
  focusOptions.replaceChildren(...checkboxes.map((input) => input.parentElement!));
  const updateFocusLimit = () => {
    const selected = checkboxes.filter((input) => input.checked).length;
    for (const checkbox of checkboxes) {
      checkbox.disabled = selected >= 2 && !checkbox.checked;
    }
  };
  checkboxes.forEach((checkbox) => checkbox.addEventListener('change', updateFocusLimit));

  if (typeof LanguageModel === 'undefined') {
    indicator.className = 'unavailable';
    status.textContent = 'Unavailable · LanguageModel API not found.';
    return;
  }

  let availability: string;
  try {
    availability = await LanguageModel.availability();
  } catch {
    indicator.className = 'unavailable';
    status.textContent = 'Unavailable · capability detection failed.';
    return;
  }

  if (availability === 'unavailable') {
    indicator.className = 'unavailable';
    status.textContent = 'Unavailable · not available on this device.';
    return;
  }
  if (availability === 'downloading') {
    indicator.className = 'unavailable';
    status.textContent = 'Downloading · reload when ready.';
    return;
  }

  indicator.className = 'enabled';
  intent.disabled = false;
  generate.disabled = false;
  checkboxes.forEach((checkbox) => { checkbox.disabled = false; });
  status.textContent = availability === 'downloadable'
    ? 'Download available · starts when you ask.'
    : 'Ready · private, experimental answers on this device.';
  const readyStatus = status.textContent;
  const model = new LanguageModelAdapter(LanguageModel);

  editor.addEventListener('submit', async (event) => {
    event.preventDefault();
    const focusIds = selectedFocusIds(focusOptions);
    if (!intent.value.trim() && focusIds.length === 0) {
      status.textContent = 'Describe what matters to you or choose at least one focus.';
      intent.focus();
      return;
    }

    generate.disabled = true;
    checkboxes.forEach((checkbox) => { checkbox.disabled = true; });
    intent.disabled = true;
    status.textContent = 'Assembling canonical evidence and interpreting locally…';

    try {
      const note = await createLocalNote(model, { intent: intent.value, focusIds });
      const visibleEvidence = removeRedundantExperience(note.selectedEvidence);
      const focusLabel = note.selectedFocus.length > 0
        ? note.selectedFocus.map((focus) => focus.label).join(' · ')
        : 'Matched from your request';
      requireElement('notes-focus').textContent = focusLabel;
      requireElement('notes-interpretation').textContent = normalizeGeneratedText(note.interpretation);
      requireElement('notes-evidence').replaceChildren(...visibleEvidence.map(renderEvidence));
      const intentDocument = requireElement('notes-intent-document');
      intentDocument.hidden = !note.intent;
      requireElement('notes-intent-quote').textContent = note.intent;
      requireElement('notes-warning').hidden = false;
      requireElement('notes-debug-output').textContent = JSON.stringify(note.debugTrace, null, 2);
      requireElement<HTMLDetailsElement>('notes-debug').open = false;
      editor.hidden = true;
      documentView.hidden = false;
      status.textContent = note.intentClassificationFailed
        ? 'Answered from your selected focuses; the question could not be classified.'
        : 'Answer generated on this device.';
    } catch (error) {
      status.textContent = 'The local note could not be generated. Your selections are unchanged; try again.';
      console.error('[Explore] answer generation failed:', error);
    } finally {
      generate.disabled = false;
      intent.disabled = false;
      updateFocusLimit();
    }
  });

  requireElement<HTMLButtonElement>('notes-edit').addEventListener('click', () => {
    documentView.hidden = true;
    editor.hidden = false;
    status.textContent = readyStatus;
    intent.focus();
  });
  requireElement<HTMLButtonElement>('notes-clear').addEventListener('click', () => {
    editor.reset();
    checkboxes.forEach((checkbox) => { checkbox.disabled = false; });
    documentView.hidden = true;
    editor.hidden = false;
    requireElement('notes-debug-output').textContent = '';
    requireElement<HTMLDetailsElement>('notes-debug').open = false;
    status.textContent = readyStatus;
    intent.focus();
  });
}

async function setupWebMcpView(): Promise<void> {
  const indicator = requireElement('webmcp-indicator');
  const status = requireElement('webmcp-status');
  const hasInterface = Boolean((document as Document & { modelContext?: unknown }).modelContext);
  indicator.className = hasInterface ? 'enabled' : 'unavailable';
  status.textContent = hasInterface
    ? 'Ready · structured career data for compatible agents.'
    : 'Unavailable · interface not available in this browser.';

  try {
    await setupWebMcp();
  } catch (error) {
    indicator.className = 'unavailable';
    status.textContent = 'Unavailable · registration failed.';
    console.error('[WebMCP] registration failed:', error);
  }
}

renderContent();
void setupLocalNotes();
void setupWebMcpView();

import { careerExperiences } from '../../content/resume.js';
import {
  evidenceTopics,
  getCareerTimeline,
  getEducation,
  getEvidenceByTopic,
  getExperience,
  getProfile,
  getProject,
} from './career-data.js';

interface WebMcpResult {
  content: Array<{ type: 'text'; text: string }>;
}

interface WebMcpTool {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
  };
  execute(input: Record<string, unknown>): Promise<WebMcpResult>;
}

interface WebMcpContext {
  registerTool(tool: WebMcpTool): Promise<undefined>;
}

const experienceIds = careerExperiences.map(({ id }) => id);
const projectIds = careerExperiences.flatMap(({ projects }) => projects.map(({ id }) => id));

const noInputSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
};

export const careerTools: WebMcpTool[] = [
  createTool(
    'get_profile',
    'Get profile',
    "Get Neal's concise professional profile, current role, and public links. Use for introductions and initial orientation. Career stages and projects provide supporting evidence for deeper assessment.",
    noInputSchema,
    () => getProfile()
  ),
  createTool(
    'get_career_timeline',
    'Get career timeline',
    "Get Neal's career progression, newest first, and stable experience IDs. Use to understand role transitions or select experiences for deeper inspection.",
    noInputSchema,
    () => getCareerTimeline()
  ),
  createTool(
    'get_experience',
    'Get experience',
    'Inspect one career stage, its summary, technologies, and lightweight project index. Use an experience ID from get_career_timeline to explore a role. Individual projects provide detailed technical evidence through get_project.',
    idSchema('experienceId', 'Stable experience ID from get_career_timeline.', experienceIds),
    (input) => getExperience(readString(input, 'experienceId'))
  ),
  createTool(
    'get_project',
    'Get project evidence',
    "Get detailed canonical evidence for one project, including architecture, technologies, and engineering quality or impact where documented. Use to support claims about Neal's technical depth, judgment, ownership, or role fit.",
    idSchema('projectId', 'Stable project ID from an experience project index.', projectIds),
    (input) => getProject(readString(input, 'projectId'))
  ),
  createTool(
    'get_evidence_by_topic',
    'Get evidence by topic',
    'Find concise, canonical experience and project evidence for one predefined topic. Use for competency assessment, job-fit analysis, or targeted technical questions. This is deterministic lookup, not free-text search.',
    idSchema('topic', 'Predefined professional competency or technology topic.', evidenceTopics),
    (input) => getEvidenceByTopic(readTopic(input))
  ),
  createTool(
    'get_education',
    'Get education',
    "Get Neal's canonical education records. Use for questions about academic background, degree, or study period.",
    noInputSchema,
    () => getEducation()
  ),
];

export async function registerCareerTools(context: WebMcpContext): Promise<void> {
  await Promise.all(careerTools.map((tool) => context.registerTool(tool)));
}

export async function setupWebMcp(): Promise<void> {
  const context = (document as Document & { modelContext?: WebMcpContext }).modelContext;
  if (!context) return;

  await registerCareerTools(context);
}

function createTool(
  name: string,
  title: string,
  description: string,
  inputSchema: Record<string, unknown>,
  project: (input: Record<string, unknown>) => unknown
): WebMcpTool {
  return {
    name,
    title,
    description,
    inputSchema,
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: false,
    },
    async execute(input) {
      return {
        content: [{ type: 'text', text: JSON.stringify(project(input)) }],
      };
    },
  };
}

function idSchema(property: string, description: string, values: readonly string[]) {
  return {
    type: 'object',
    properties: {
      [property]: {
        type: 'string',
        description,
        enum: values,
      },
    },
    required: [property],
    additionalProperties: false,
  };
}

function readString(input: Record<string, unknown>, property: string): string {
  const value = input[property];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${property} must be a non-empty string`);
  }

  return value;
}

function readTopic(input: Record<string, unknown>) {
  const topic = readString(input, 'topic');
  if (!evidenceTopics.includes(topic as (typeof evidenceTopics)[number])) {
    throw new Error(`Unknown evidence topic: ${topic}`);
  }

  return topic as (typeof evidenceTopics)[number];
}

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
    "Get Neal's concise professional profile, current role, and public links.",
    noInputSchema,
    () => getProfile()
  ),
  createTool(
    'get_career_timeline',
    'Get career timeline',
    'Get a lightweight chronological career overview. Use an experience ID from this result with get_experience.',
    noInputSchema,
    () => getCareerTimeline()
  ),
  createTool(
    'get_experience',
    'Get experience',
    'Inspect one career stage and its lightweight project index. Use get_project for full project evidence.',
    idSchema('experienceId', 'Stable experience ID from get_career_timeline.', experienceIds),
    (input) => getExperience(readString(input, 'experienceId'))
  ),
  createTool(
    'get_project',
    'Get project',
    'Get detailed canonical architecture, impact, engineering quality, and technologies for one project.',
    idSchema('projectId', 'Stable project ID from an experience project index.', projectIds),
    (input) => getProject(readString(input, 'projectId'))
  ),
  createTool(
    'get_evidence_by_topic',
    'Get evidence by topic',
    'Get concise experience and project evidence for one predefined professional topic. This is deterministic lookup, not free-text search.',
    idSchema('topic', 'Predefined professional competency or technology topic.', evidenceTopics),
    (input) => getEvidenceByTopic(readTopic(input))
  ),
  createTool(
    'get_education',
    'Get education',
    "Get Neal's canonical education records.",
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

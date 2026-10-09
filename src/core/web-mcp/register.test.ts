import { describe, expect, mock, test } from 'bun:test';
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
import { careerTools, registerCareerTools } from './register.js';

const toolNames = [
  'get_profile',
  'get_career_timeline',
  'get_experience',
  'get_project',
  'get_evidence_by_topic',
  'get_education',
];

function tool(name: string) {
  const definition = careerTools.find((candidate) => candidate.name === name);
  if (!definition) throw new Error(`Missing tool definition: ${name}`);
  return definition;
}

describe('WebMCP career tools', () => {
  test('defines exactly the six public tool names', () => {
    expect(careerTools.map(({ name }) => name)).toEqual(toolNames);
  });

  test.each(careerTools)('$name provides concise discovery metadata', (definition) => {
    expect(definition.name.length).toBeLessThanOrEqual(30);
    expect(definition.title.length).toBeGreaterThan(0);
    expect(definition.description).toContain('Use ');
    expect(definition.description.length).toBeLessThanOrEqual(500);

    const properties = definition.inputSchema.properties as Record<string, { description: string }>;
    for (const [name, parameter] of Object.entries(properties)) {
      expect(name.length).toBeLessThanOrEqual(30);
      expect(parameter.description.length).toBeGreaterThan(0);
      expect(parameter.description.length).toBeLessThanOrEqual(150);
    }
  });

  test.each(careerTools)('$name declares read-only and trusted-content hints', (definition) => {
    expect(definition.annotations).toEqual({
      readOnlyHint: true,
      untrustedContentHint: false,
    });
  });

  test('uses closed schemas with controlled identifier enums', () => {
    const experienceIds = careerExperiences.map(({ id }) => id);
    const projectIds = careerExperiences.flatMap(({ projects }) =>
      projects.map(({ id }) => id)
    );

    expect(tool('get_experience').inputSchema).toMatchObject({
      type: 'object',
      properties: { experienceId: { type: 'string', enum: experienceIds } },
      required: ['experienceId'],
      additionalProperties: false,
    });
    expect(tool('get_project').inputSchema).toMatchObject({
      type: 'object',
      properties: { projectId: { type: 'string', enum: projectIds } },
      required: ['projectId'],
      additionalProperties: false,
    });
    expect(tool('get_evidence_by_topic').inputSchema).toMatchObject({
      type: 'object',
      properties: { topic: { type: 'string', enum: evidenceTopics } },
      required: ['topic'],
      additionalProperties: false,
    });

    for (const name of ['get_profile', 'get_career_timeline', 'get_education']) {
      expect(tool(name).inputSchema).toEqual({
        type: 'object',
        properties: {},
        additionalProperties: false,
      });
    }
  });

  test('executes every tool as deterministic JSON text', async () => {
    const experienceId = careerExperiences[0]!.id;
    const projectId = careerExperiences[0]!.projects[0]!.id;
    const topic = evidenceTopics[0]!;
    const cases = [
      ['get_profile', {}, getProfile()],
      ['get_career_timeline', {}, getCareerTimeline()],
      ['get_experience', { experienceId }, getExperience(experienceId)],
      ['get_project', { projectId }, getProject(projectId)],
      ['get_evidence_by_topic', { topic }, getEvidenceByTopic(topic)],
      ['get_education', {}, getEducation()],
    ] as const;

    for (const [name, input, expected] of cases) {
      const first = await tool(name).execute(input);
      const second = await tool(name).execute(input);
      const result = {
        content: [{ type: 'text' as const, text: JSON.stringify(expected) }],
      };

      expect(first).toEqual(result);
      expect(second).toEqual(first);
      expect(JSON.parse(first.content[0]!.text)).toEqual(expected);
    }
  });

  test.each([
    {
      name: 'missing experience ID',
      toolName: 'get_experience',
      input: {},
      error: 'experienceId must be a non-empty string',
    },
    {
      name: 'empty project ID',
      toolName: 'get_project',
      input: { projectId: '' },
      error: 'projectId must be a non-empty string',
    },
    {
      name: 'unknown experience ID',
      toolName: 'get_experience',
      input: { experienceId: 'unknown' },
      error: 'Unknown experience ID: unknown',
    },
    {
      name: 'unknown project ID',
      toolName: 'get_project',
      input: { projectId: 'unknown' },
      error: 'Unknown project ID: unknown',
    },
    {
      name: 'unknown topic',
      toolName: 'get_evidence_by_topic',
      input: { topic: 'unknown' },
      error: 'Unknown evidence topic: unknown',
    },
  ])('rejects $name', async ({ toolName, input, error }) => {
    const definition = tool(toolName);

    await expect(definition.execute(input)).rejects.toThrow(error);
  });

  test('registers every definition on the injected context', async () => {
    const registerTool = mock(async (_definition: (typeof careerTools)[number]) => undefined);

    await registerCareerTools({ registerTool });

    expect(registerTool).toHaveBeenCalledTimes(6);
    expect(registerTool.mock.calls.map(([definition]) => definition)).toEqual(careerTools);
  });
});

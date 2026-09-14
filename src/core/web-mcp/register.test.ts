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

  test('rejects missing, empty, and unknown controlled inputs', async () => {
    await expect(tool('get_experience').execute({})).rejects.toThrow(
      'experienceId must be a non-empty string'
    );
    await expect(tool('get_project').execute({ projectId: '' })).rejects.toThrow(
      'projectId must be a non-empty string'
    );
    await expect(tool('get_experience').execute({ experienceId: 'unknown' })).rejects.toThrow(
      'Unknown experience ID: unknown'
    );
    await expect(tool('get_project').execute({ projectId: 'unknown' })).rejects.toThrow(
      'Unknown project ID: unknown'
    );
    await expect(tool('get_evidence_by_topic').execute({ topic: 'unknown' })).rejects.toThrow(
      'Unknown evidence topic: unknown'
    );
  });

  test('registers every definition on the injected context', async () => {
    const registerTool = mock(async (_definition: (typeof careerTools)[number]) => undefined);

    await registerCareerTools({ registerTool });

    expect(registerTool).toHaveBeenCalledTimes(6);
    expect(registerTool.mock.calls.map(([definition]) => definition)).toEqual(careerTools);
  });
});

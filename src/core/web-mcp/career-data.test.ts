import { describe, expect, test } from 'bun:test';
import { careerExperiences, education, type Education } from '../../content/resume.js';
import { siteContent, type SiteContent } from '../../content/site-content.js';
import {
  getCareerTimeline,
  getEducation,
  getEvidenceByTopic,
  getExperience,
  getProfile,
  getProject,
} from './career-data.js';

describe('career data progressive disclosure', () => {
  test('timeline exposes role summaries without project or technology details', () => {
    const timeline = getCareerTimeline();
    const first = careerExperiences[0];

    expect(timeline[0]).toEqual({
      id: first.id,
      period: first.period,
      role: first.role,
      company: first.company,
      summary: first.summary,
    });
    expect(timeline[0]).not.toHaveProperty('technologies');
    expect(timeline[0]).not.toHaveProperty('projects');
  });

  test('experience exposes project summaries but defers project details', () => {
    const source = careerExperiences[0];
    const result = getExperience(source.id);

    expect(result.projects).toEqual(
      source.projects.map((project) => ({
        id: project.id,
        name: project.name,
        summary: project.summary,
        evidenceAvailable: [
          ...(project.architecture.length > 0 ? ['architecture'] : []),
          ...(project.engineeringQuality?.length ? ['engineeringQuality'] : []),
          ...(project.impact?.length ? ['impact'] : []),
        ],
      }))
    );
    for (const project of result.projects) {
      expect(project).not.toHaveProperty('architecture');
      expect(project).not.toHaveProperty('engineeringQuality');
      expect(project).not.toHaveProperty('impact');
      expect(project).not.toHaveProperty('technologies');
    }
  });

  test.each([
    {
      name: 'present evidence',
      architecture: ['Architecture evidence'],
      engineeringQuality: ['Engineering evidence'],
      impact: ['Impact evidence'],
      expected: ['architecture', 'engineeringQuality', 'impact'],
    },
    {
      name: 'absent optional evidence',
      architecture: ['Architecture evidence'],
      expected: ['architecture'],
    },
    {
      name: 'empty optional evidence',
      architecture: ['Architecture evidence'],
      engineeringQuality: [],
      impact: [],
      expected: ['architecture'],
    },
  ])('marks only nonempty evidence in the lightweight project index ($name)', (item) => {
    const sourceExperience = careerExperiences[0];
    const sourceProject = sourceExperience.projects[0];
    const {
      engineeringQuality: _engineeringQuality,
      impact: _impact,
      ...projectWithoutOptionalEvidence
    } = sourceProject;
    const project = {
      ...projectWithoutOptionalEvidence,
      architecture: item.architecture,
      ...(item.engineeringQuality === undefined ? {} : { engineeringQuality: item.engineeringQuality }),
      ...(item.impact === undefined ? {} : { impact: item.impact }),
    };
    const result = getExperience(sourceExperience.id, [{
      ...sourceExperience,
      projects: [project],
    }]);

    expect(result.projects).toEqual([{
      id: sourceProject.id,
      name: sourceProject.name,
      summary: sourceProject.summary,
      evidenceAvailable: item.expected,
    }]);
    expect(result.projects[0]).not.toHaveProperty('architecture');
    expect(result.projects[0]).not.toHaveProperty('engineeringQuality');
    expect(result.projects[0]).not.toHaveProperty('impact');
    expect(result.projects[0]).not.toHaveProperty('technologies');
  });

  test('project exposes full details and its parent experience context', () => {
    const sourceExperience = careerExperiences[0];
    const sourceProject = sourceExperience.projects[0];

    expect(getProject(sourceProject.id)).toEqual({
      ...sourceProject,
      experience: {
        id: sourceExperience.id,
        role: sourceExperience.role,
        company: sourceExperience.company,
        period: sourceExperience.period,
      },
    });
  });
});

describe('canonical project projections', () => {
  test.each([
    {
      name: 'engineering quality when present',
      projectId: 'conversational-booking-agent',
      field: 'engineeringQuality' as const,
    },
    {
      name: 'impact when present',
      projectId: 'content-intelligence-workflow',
      field: 'impact' as const,
    },
  ])('preserves $name', ({ projectId, field }) => {
    const source = careerExperiences.flatMap(({ projects }) => projects)
      .find(({ id }) => id === projectId)!;

    expect(getProject(projectId)[field]).toEqual(source[field]);
  });

  test.each([
    { projectId: 'conversational-booking-agent', field: 'impact' as const },
    { projectId: 'content-intelligence-workflow', field: 'engineeringQuality' as const },
    { projectId: 'platform-mcp-server', field: 'impact' as const },
    { projectId: 'platform-mcp-server', field: 'engineeringQuality' as const },
  ])('does not invent absent $field for $projectId', ({ projectId, field }) => {
    expect(getProject(projectId)).not.toHaveProperty(field);
  });
});

describe('topic evidence projection', () => {
  test('resolves mixed experience and project references in canonical order', () => {
    const result = getEvidenceByTopic('distributed-systems');

    expect(result.topic).toBe('distributed-systems');
    expect(result.evidence.map((item) => ({
      sourceType: item.sourceType,
      sourceId: item.sourceType === 'experience' ? item.experienceId : item.projectId,
      experienceId: item.experienceId,
    }))).toEqual([
      {
        sourceType: 'experience',
        sourceId: 'funnow-backend-engineer',
        experienceId: 'funnow-backend-engineer',
      },
      {
        sourceType: 'project',
        sourceId: 'distributed-read-write-lock',
        experienceId: 'funnow-backend-engineer',
      },
      {
        sourceType: 'project',
        sourceId: 'geospatial-proximity-search',
        experienceId: 'funnow-backend-engineer',
      },
    ]);
    expect(result.evidence[1]).toMatchObject({
      projectName: 'Redis-Based Distributed Read-Write Lock',
      role: 'Backend Engineer',
      company: 'FunNow',
      period: 'Sep 2020 - Dec 2023',
    });
  });
});

describe('focused internal evidence mappings', () => {
  test('exposes the canonical zero-downtime migration mapping without duplicating records', () => {
    const search = getEvidenceByTopic('search-infrastructure').evidence;
    const migration = getEvidenceByTopic('zero-downtime-migration').evidence;
    expect(migration).toHaveLength(1);
    expect(migration[0]).toEqual(expect.objectContaining({ projectId: 'zero-downtime-elasticsearch-migration' }));
    expect(search).toContainEqual(migration[0]);
  });
});

describe('profile and education projections', () => {
  test('profile uses the first career stage as current role and only public links', () => {
    const content: SiteContent = {
      ...siteContent,
      links: [
        { label: 'Portfolio', href: 'https://example.com', download: true },
        { label: 'Private', href: '#' },
      ],
    };
    const current = careerExperiences[1];

    expect(getProfile(content, [current])).toEqual({
      ...content.profile,
      about: content.about,
      currentRole: {
        experienceId: current.id,
        role: current.role,
        company: current.company,
        period: current.period,
      },
      links: [{ label: 'Portfolio', href: 'https://example.com' }],
    });
    expect(getProfile(content, []).currentRole).toBeUndefined();
  });

  test('returns canonical and supplied education records', () => {
    const custom: Education[] = [{
      institution: 'Example University',
      degree: 'B.S.',
      period: '2020 - 2024',
      location: 'Remote',
    }];

    expect(getEducation()).toEqual(education);
    expect(getEducation(custom)).toEqual(custom);
  });
});

describe('unknown career data identifiers', () => {
  test.each([
    {
      name: 'experience ID',
      call: () => getExperience('missing-experience'),
      message: 'Unknown experience ID: missing-experience',
    },
    {
      name: 'project ID',
      call: () => getProject('missing-project'),
      message: 'Unknown project ID: missing-project',
    },
    {
      name: 'evidence topic',
      call: () => getEvidenceByTopic('missing-topic' as never),
      message: 'Unknown evidence topic: missing-topic',
    },
  ])('rejects an unknown $name', ({ call, message }) => {
    expect(call).toThrow(message);
  });
});

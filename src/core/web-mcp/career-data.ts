import {
  careerExperiences,
  education,
  type CareerStage,
  type Education,
} from '../../content/resume.js';
import { siteContent, type SiteContent } from '../../content/site-content.js';

const evidenceIndex = {
  'agentic-systems': [
    { type: 'experience', id: 'funnow-ai-team-lead' },
    { type: 'project', id: 'conversational-booking-agent' },
    { type: 'project', id: 'platform-mcp-server' },
  ],
  'conversational-agents': [
    { type: 'project', id: 'conversational-booking-agent' },
  ],
  'llm-evaluation': [
    { type: 'project', id: 'conversational-booking-agent' },
  ],
  'model-routing': [
    { type: 'project', id: 'conversational-booking-agent' },
  ],
  'prompt-caching': [
    { type: 'project', id: 'conversational-booking-agent' },
  ],
  'content-intelligence': [
    { type: 'project', id: 'content-intelligence-workflow' },
  ],
  mcp: [
    { type: 'project', id: 'platform-mcp-server' },
  ],
  'distributed-systems': [
    { type: 'experience', id: 'funnow-backend-engineer' },
    { type: 'project', id: 'distributed-read-write-lock' },
    { type: 'project', id: 'geospatial-proximity-search' },
  ],
  concurrency: [
    { type: 'project', id: 'distributed-read-write-lock' },
    { type: 'project', id: 'open-graph-crawler' },
  ],
  'distributed-locking': [
    { type: 'project', id: 'distributed-read-write-lock' },
  ],
  'search-infrastructure': [
    { type: 'experience', id: 'funnow-backend-engineer' },
    { type: 'project', id: 'geospatial-proximity-search' },
    { type: 'project', id: 'zero-downtime-elasticsearch-migration' },
    { type: 'project', id: 'realtime-nickname-autocomplete' },
  ],
  'zero-downtime-migration': [
    { type: 'project', id: 'zero-downtime-elasticsearch-migration' },
  ],
  'geospatial-search': [
    { type: 'project', id: 'geospatial-proximity-search' },
  ],
  'system-architecture': [
    { type: 'experience', id: 'funnow-backend-lead' },
    { type: 'project', id: 'ddd-architecture-adoption' },
    { type: 'project', id: 'dual-track-inventory-engine' },
  ],
  'domain-driven-design': [
    { type: 'project', id: 'ddd-architecture-adoption' },
  ],
  'clean-architecture': [
    { type: 'project', id: 'ddd-architecture-adoption' },
  ],
  'platform-consolidation': [
    { type: 'experience', id: 'funnow-backend-lead' },
    { type: 'project', id: 'cross-brand-identity-migration' },
  ],
  'identity-migration': [
    { type: 'project', id: 'cross-brand-identity-migration' },
  ],
  'inventory-systems': [
    { type: 'project', id: 'dual-track-inventory-engine' },
  ],
  'engineering-leadership': [
    { type: 'experience', id: 'funnow-ai-team-lead' },
    { type: 'experience', id: 'funnow-backend-lead' },
  ],
  mentoring: [
    { type: 'experience', id: 'pixnet-advanced-backend-engineer' },
  ],
  'cross-functional-delivery': [
    { type: 'experience', id: 'funnow-backend-lead' },
    { type: 'experience', id: 'gigafast-associate-project-manager' },
  ],
  'stakeholder-management': [
    { type: 'experience', id: 'gigafast-associate-project-manager' },
  ],
  'project-delivery': [
    { type: 'experience', id: 'gigafast-associate-project-manager' },
  ],
} as const;

export type EvidenceTopic = keyof typeof evidenceIndex;
export const evidenceTopics = Object.keys(evidenceIndex) as EvidenceTopic[];

export function getProfile(
  content: SiteContent = siteContent,
  experiences: CareerStage[] = careerExperiences
) {
  const current = experiences[0];

  return {
    ...content.profile,
    about: content.about,
    currentRole: current ? {
      experienceId: current.id,
      role: current.role,
      company: current.company,
      period: current.period,
    } : undefined,
    links: content.links.filter((link) => link.href !== '#').map(({ label, href }) => ({ label, href })),
  };
}

export function getCareerTimeline(experiences: CareerStage[] = careerExperiences) {
  return experiences.map(({ id, period, role, company, summary }) => ({
    id,
    period,
    role,
    company,
    summary,
  }));
}

export function getExperience(
  experienceId: string,
  experiences: CareerStage[] = careerExperiences
) {
  const experience = findExperience(experienceId, experiences);

  return {
    id: experience.id,
    period: experience.period,
    role: experience.role,
    company: experience.company,
    summary: experience.summary,
    technologies: experience.technologies,
    projects: experience.projects.map(({ id, name, summary }) => ({ id, name, summary })),
  };
}

export function getProject(
  projectId: string,
  experiences: CareerStage[] = careerExperiences
) {
  for (const experience of experiences) {
    const project = experience.projects.find(({ id }) => id === projectId);
    if (!project) continue;

    return {
      ...project,
      experience: {
        id: experience.id,
        role: experience.role,
        company: experience.company,
        period: experience.period,
      },
    };
  }

  throw new Error(`Unknown project ID: ${projectId}`);
}

export function getEvidenceByTopic(
  topic: EvidenceTopic,
  experiences: CareerStage[] = careerExperiences
) {
  const references = evidenceIndex[topic];
  if (!references) throw new Error(`Unknown evidence topic: ${topic}`);

  return {
    topic,
    evidence: references.map((reference) => {
      if (reference.type === 'experience') {
        const experience = findExperience(reference.id, experiences);
        return {
          sourceType: 'experience' as const,
          experienceId: experience.id,
          role: experience.role,
          company: experience.company,
          period: experience.period,
          summary: experience.summary,
        };
      }

      const project = getProject(reference.id, experiences);
      return {
        sourceType: 'project' as const,
        projectId: project.id,
        projectName: project.name,
        experienceId: project.experience.id,
        role: project.experience.role,
        company: project.experience.company,
        period: project.experience.period,
        summary: project.summary,
      };
    }),
  };
}

export function getEducation(records: Education[] = education) {
  return records;
}

function findExperience(experienceId: string, experiences: CareerStage[]) {
  const experience = experiences.find(({ id }) => id === experienceId);
  if (!experience) throw new Error(`Unknown experience ID: ${experienceId}`);

  return experience;
}

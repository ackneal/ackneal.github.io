import { siteContent, type SiteContent } from './site-content.js';

export interface ProjectExperience {
  id: string;
  name: string;
  summary: string;
  architecture: string[];
  engineeringQuality?: string[];
  impact?: string[];
  technologies: string[];
}

export interface CareerStage {
  id: string;
  period: string;
  role: string;
  company: string;
  summary: string;
  technologies: string[];
  projects: ProjectExperience[];
}

export interface Education {
  institution: string;
  degree: string;
  period: string;
  location: string;
  details?: string[];
}

export interface SkillCategory {
  category: string;
  skills: string[];
}

export const education: Education[] = [
  {
    institution:
      'National Taipei University of Technology (國立台北科技大學)',
    degree: 'B.S. in Industrial Engineering',
    period: 'Sep 2009 - May 2013',
    location: 'Taipei, Taiwan',
    details: [
      'Focus: Human Factors Engineering',
      'Research: Analyzing Communication App Usage Through Human Factors Methods',
    ],
  },
];

export const skillCategories: SkillCategory[] = [
  {
    category: 'Applied AI & Agent Systems',
    skills: [
      'LangGraph',
      'ReAct',
      'Model Context Protocol (MCP)',
      'LLM Evaluation (Promptfoo)',
      'Model Routing',
      'Prompt Caching',
    ],
  },
  {
    category: 'Backend & Distributed Systems',
    skills: [
      'Go',
      'Python',
      'PHP',
      'Distributed Systems',
      'Domain-Driven Design (DDD)',
      'Clean Architecture',
      'Distributed Locks',
      'Concurrency Primitives',
    ],
  },
  {
    category: 'Datastores & Search Infrastructure',
    skills: [
      'Elasticsearch',
      'GeoHash',
      'Redis',
      'MySQL',
      'MongoDB',
      'Geospatial Search',
    ],
  },
  {
    category: 'Platform & Cloud',
    skills: [
      'Argo Workflows',
      'Docker',
      'Kubernetes',
      'AWS',
      'GCP',
      'Serverless',
    ],
  },
];

export const careerExperiences: CareerStage[] = [
  {
    id: 'funnow-ai-team-lead',
    period: 'Jul 2025 - Present',
    role: 'AI Team Lead',
    company: 'FunNow',
    summary:
      'Lead an applied AI team building multi-brand conversational agents, content intelligence pipelines, and production AI infrastructure for venue discovery, personalized recommendations, booking, and partner integrations.',
    technologies: [
      'Python',
      'LangGraph',
      'ReAct',
      'LLM Evaluation',
      'Promptfoo',
      'Model Routing',
      'Prompt Caching',
      'Argo Workflows',
      'Model Context Protocol (MCP)',
      'MongoDB',
    ],
    projects: [
      {
        id: 'conversational-booking-agent',
        name: 'Multi-brand Conversational Discovery & Booking Agent',
        summary:
          'Built a production conversational agent using Python and LangGraph for venue discovery, personalized recommendations, and end-to-end booking across multiple brand platforms.',
        architecture: [
          'Built a stateful ReAct agent with LangGraph to manage multi-turn conversations, tool execution, and recommendation context.',
          'Designed an intent-classification stage using structured model output to route requests across FAQs, venue discovery, product retrieval, and other execution paths.',
          'Designed a model-routing architecture with prompt caching to direct lower-complexity tasks to lower-latency models while reserving frontier models for composite reasoning, reducing inference latency and cost.',
        ],
        engineeringQuality: [
          'Established an LLM evaluation harness with Promptfoo to detect regressions across prompt and model changes before release.',
        ],
        technologies: [
          'Python',
          'LangGraph',
          'ReAct',
          'LLM Evaluation',
          'Promptfoo',
          'Model Routing',
          'Prompt Caching',
        ],
      },
      {
        id: 'content-intelligence-workflow',
        name: 'Content Intelligence Workflow',
        summary:
          'Built distributed content intelligence pipelines with Argo Workflows to transform venue metadata and public reviews into structured attributes for semantic search, automated tagging, and recommendations.',
        architecture: [
          'Orchestrated distributed processing with Argo Workflows, including retries, rate limiting, and fault-tolerant scheduling.',
          'Normalized venue metadata and public review content into structured attributes that could be consumed by search and recommendation systems.',
        ],
        impact: [
          'Generated structured venue attributes and amenities for automated tagging.',
          'Provided extracted attributes and signals for semantic search enrichment.',
          'Produced structured content that could be reused by recommendation, marketing, SEO, and advertising workflows.',
        ],
        technologies: [
          'Python',
          'Argo Workflows',
          'Content Intelligence',
          'Semantic Search',
          'Elasticsearch',
        ],
      },
      {
        id: 'platform-mcp-server',
        name: 'Platform Model Context Protocol (MCP) Server',
        summary:
          'Built an MCP server exposing venue discovery, booking, and order-management capabilities as typed tools for partner agents and customer-support integrations.',
        architecture: [
          'Wrapped platform capabilities including venue discovery, availability queries, booking operations, and order management as typed MCP tools.',
          'Integrated authentication and permission boundaries for external partner agents and internal customer-support systems.',
        ],
        technologies: [
          'Model Context Protocol (MCP)',
          'Typed Tools',
          'API Integration',
          'Agent Tooling',
        ],
      },
    ],
  },

  {
    id: 'funnow-backend-lead',
    period: 'Jan 2024 - Jun 2025',
    role: 'Backend Lead',
    company: 'FunNow',
    summary:
      'Led a seven-person backend engineering team with ownership of core system architecture, cross-functional delivery, and multi-brand platform consolidation.',
    technologies: [
      'Go',
      'Domain-Driven Design (DDD)',
      'Clean Architecture',
      'MySQL',
      'Redis',
      'Elasticsearch',
      'Serverless',
    ],
    projects: [
      {
        id: 'ddd-architecture-adoption',
        name: 'Backend Domain Architecture & Modularization',
        summary:
          'Restructured core backend domains around explicit bounded contexts and service contracts using Domain-Driven Design and Clean Architecture.',
        architecture: [
          'Introduced bounded contexts to separate business domains and reduce coupling across backend repositories.',
          'Defined explicit service contracts and interface boundaries between domains.',
          'Established a consistent Clean Architecture module structure across core backend repositories.',
        ],
        technologies: [
          'Go',
          'Domain-Driven Design (DDD)',
          'Clean Architecture',
          'System Modularization',
        ],
      },
      {
        id: 'dual-track-inventory-engine',
        name: 'Parallel Discount Inventory & Reservation Engine',
        summary:
          'Architected a parallel inventory and reservation engine supporting tiered-discount dining bookings without modifying legacy inventory state machines.',
        architecture: [
          'Designed a parallel persistence and calculation model allowing native inventory and discount-based inventory to operate alongside each other.',
          'Built a dedicated Elasticsearch indexing pipeline and serverless recalculation workflow for availability search across headcount and discount constraints.',
          'Adjusted stock-cache lifecycle and TTL behavior to align with active sales windows and prevent stale inventory state.',
        ],
        technologies: [
          'Go',
          'MySQL',
          'Redis',
          'Elasticsearch',
          'Serverless',
          'Distributed Caching',
        ],
      },
      {
        id: 'cross-brand-identity-migration',
        name: 'Cross-Brand Identity Consolidation & Authentication Migration',
        summary:
          'Designed a progressive migration from Firebase Auth to native platform identity while preserving active user sessions.',
        architecture: [
          'Designed a dual-authentication strategy that accepted legacy Firebase credentials while progressively issuing native platform sessions.',
          'Built identity deduplication workflows for duplicate emails and accounts created through multiple authentication providers.',
          'Used constant-time comparison primitives in password verification paths to avoid timing-based information leakage.',
        ],
        technologies: [
          'Go',
          'Authentication Architecture',
          'Identity Migration',
          'Firebase Auth',
          'MySQL',
        ],
      },
    ],
  },

  {
    id: 'funnow-backend-engineer',
    period: 'Sep 2020 - Dec 2023',
    role: 'Backend Engineer',
    company: 'FunNow',
    summary:
      'Owned backend engineering for the Growth domain, with a focus on venue discovery, distributed systems, and performance-critical search infrastructure.',
    technologies: [
      'Go',
      'Elasticsearch',
      'Redis',
      'Lua',
      'MySQL',
      'Distributed Systems',
      'Geospatial Search',
      'Concurrency Control',
    ],
    projects: [
      {
        id: 'distributed-read-write-lock',
        name: 'Redis-Based Distributed Read-Write Lock',
        summary:
          'Built a write-preferring distributed read-write lock in Go using Redis hashes and atomic Lua scripts for shared concurrency control across backend workflows.',
        architecture: [
          'Designed a write-preferring read-write lock using Redis Hash structures and atomic Lua scripts.',
          'Implemented token-based ownership validation to prevent one lock holder from releasing another holder\'s lease.',
          'Implemented automatic lease renewal tied to Go context cancellation for long-running operations.',
          'Exposed an idiomatic Go API returning a deferrable unlock function to hide distributed-lock implementation details from callers.',
        ],
        impact: [
          'Used across payment, order, notification, and invoicing workflows.',
        ],
        technologies: [
          'Go',
          'Redis',
          'Lua',
          'Distributed Systems',
          'Concurrency Primitives',
          'Distributed Locks',
        ],
      },
      {
        id: 'geospatial-proximity-search',
        name: 'Geospatial Discovery & Two-Layer Caching',
        summary:
          'Designed a two-layer geospatial discovery system using multi-precision GeoHash indexing in Elasticsearch and Redis GEO caching.',
        architecture: [
          'Indexed coordinates at multiple GeoHash precision levels in Elasticsearch to support different geographic search ranges.',
          'Queried neighboring GeoHash cells to avoid losing results near spatial-cell boundaries.',
          'Used Redis GEO as a caching layer for repeated geographic discovery queries.',
          'Integrated distributed single-flight cache population to protect Elasticsearch during concurrent cache misses.',
        ],
        technologies: [
          'Go',
          'Elasticsearch',
          'Redis GEO',
          'GeoHash',
          'Spatial Indexing',
          'Caching Architecture',
        ],
      },
      {
        id: 'zero-downtime-elasticsearch-migration',
        name: 'Zero-Downtime Elasticsearch 6-to-7 Migration',
        summary:
          'Executed a zero-downtime Elasticsearch 6-to-7 migration using asynchronous dual writes, shadow validation, and controlled query cutover.',
        architecture: [
          'Built an asynchronous dual-write path to synchronize document changes between Elasticsearch 6 and Elasticsearch 7 during migration.',
          'Used shadow validation before progressively moving production queries to the new cluster.',
          'Automated index rotation and force-merge maintenance for Elasticsearch cluster operations.',
          'Updated mappings and analyzers for Elasticsearch 7 compatibility and clearer field typing.',
        ],
        technologies: [
          'Elasticsearch',
          'Zero-Downtime Migration',
          'Dual Writes',
          'Shadow Validation',
          'Cluster Operations',
        ],
      },
    ],
  },

  {
    id: 'pixnet-advanced-backend-engineer',
    period: 'Jul 2016 - Aug 2020',
    role: 'Advanced Backend Engineer',
    company: 'PIXNET',
    summary:
      'Built backend systems for social media, content discovery, and payments, including real-time member autocomplete and a concurrent Open Graph crawler. Mentored three engineers on backend engineering practices.',
    technologies: [
      'PHP',
      'Go',
      'MySQL',
      'Elasticsearch',
      'Edge N-gram',
      'GCP',
      'Web Crawling',
    ],
    projects: [
      {
        id: 'realtime-nickname-autocomplete',
        name: 'Real-Time Member Nickname Autocomplete',
        summary:
          'Built a real-time member nickname autocomplete service using Elasticsearch Edge N-gram indexing for platform-wide tagging and mention discovery.',
        architecture: [
          'Used Edge N-gram analyzers to precompute prefix matching at index time instead of relying on wildcard searches at query time.',
          'Tuned gram-length boundaries to balance autocomplete behavior with index size.',
          'Adjusted relevance scoring to improve member ordering for interactive autocomplete.',
        ],
        technologies: [
          'Elasticsearch',
          'Edge N-gram',
          'Search Infrastructure',
          'PHP',
          'MySQL',
        ],
      },
      {
        id: 'open-graph-crawler',
        name: 'Open Graph Crawler & Link Preview Service',
        summary:
          'Built a concurrent Open Graph crawler in Go and deployed it on GCP with horizontal autoscaling to power rich link previews.',
        architecture: [
          'Built concurrent crawling workers in Go for HTML retrieval and Open Graph metadata extraction.',
          'Deployed the crawler on GCP with horizontal autoscaling based on workload.',
          'Extracted and cached Open Graph metadata including titles, descriptions, and preview images.',
        ],
        technologies: [
          'Go',
          'GCP',
          'Autoscaling',
          'Web Crawling',
          'Open Graph',
        ],
      },
    ],
  },

  {
    id: 'gigafast-associate-project-manager',
    period: 'Jul 2014 - Apr 2016',
    role: 'Associate Project Manager',
    company: 'GigaFast',
    summary:
      'Managed project delivery, client communication, and cross-functional coordination before transitioning into backend engineering.',
    technologies: [
      'Project Delivery',
      'Stakeholder Management',
      'Cross-functional Coordination',
    ],
    projects: [],
  },
];

export function buildUnifiedDossierText(
  content: SiteContent = siteContent,
  experiences: CareerStage[] = careerExperiences,
  edu: Education[] = education,
  skills: SkillCategory[] = skillCategories
): string {
  const sections: string[] = [
    '=== NEAL HUANG (@ackneal) - VERIFIED ENGINEERING DOSSIER ===',
    `Role: ${content.profile.role}`,
    `About: ${content.about}`,
    '',
    '[LINKS & CONTACT]',
    ...content.links.map((l) => `- ${l.label}: ${l.href}`),
    '',
    '[EDUCATION]',
    ...edu.map((e) => {
      const details = e.details && e.details.length > 0 ? e.details.map((d) => `  * ${d}`).join('\n') : '';
      return `- ${e.degree} | ${e.institution} (${e.period}, ${e.location})${details ? '\n' + details : ''}`;
    }),
    '',
    '[TECHNICAL SKILLS MATRIX]',
    ...skills.map((cat) => `- ${cat.category}: ${cat.skills.join(', ')}`),
    '',
    '[CHRONOLOGICAL CAREER ROLES & FLAGSHIP PROJECTS]',
  ];

  for (const stage of experiences) {
    sections.push(`## ${stage.role} @ ${stage.company} (${stage.period})`);
    sections.push(`Scope: ${stage.summary}`);
    sections.push(`Core Technologies: ${stage.technologies.join(', ')}`);

    for (const proj of stage.projects) {
      sections.push(`### Project: ${proj.name}`);
      sections.push(`Summary: ${proj.summary}`);
      if (proj.architecture.length > 0) {
        sections.push('Architecture & Technical Mechanisms:');
        proj.architecture.forEach((a) => sections.push(`  * ${a}`));
      }
      if (proj.engineeringQuality && proj.engineeringQuality.length > 0) {
        sections.push('Engineering Quality & Evals:');
        proj.engineeringQuality.forEach((eq) => sections.push(`  * ${eq}`));
      }
      if (proj.impact && proj.impact.length > 0) {
        sections.push('Production Impact:');
        proj.impact.forEach((i) => sections.push(`  * ${i}`));
      }
      sections.push(`Technologies: ${proj.technologies.join(', ')}`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

export interface ResumeEntity {
  id: string;
  title: string;
}

export function getResumeEntities(): ResumeEntity[] {
  const entities: ResumeEntity[] = [];

  for (const stage of careerExperiences) {
    entities.push({
      id: stage.id,
      title: `${stage.role} @ ${stage.company}`,
    });

    for (const proj of stage.projects) {
      entities.push({
        id: proj.id,
        title: proj.name,
      });
    }
  }

  for (const edu of education) {
    entities.push({
      id: 'edu-ntut',
      title: `${edu.degree} @ ${edu.institution}`,
    });
  }

  for (const cat of skillCategories) {
    for (const skill of cat.skills) {
      const slug = skill.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      entities.push({
        id: `skill-${slug}`,
        title: `${skill} (${cat.category})`,
      });
    }
  }

  return entities;
}

export const RESUME_ENTITIES: ResumeEntity[] = getResumeEntities();

export interface SiteLink {
  label: string;
  href: string;
  download?: boolean;
}

export interface Experience {
  start: string;
  end: string;
  role: string;
  company: string;
  summary: string;
  tags: string[];
  career?: {
    id: string;
    label: string;
    start: string;
    end: string;
    stage: number;
    totalStages: number;
  };
}

export interface SiteContent {
  profile: {
    handle: string;
    role: string;
  };
  about: string;
  experience: Experience[];
  links: SiteLink[];
  footer: string;
}

export const siteContent: SiteContent = {
  profile: {
    handle: '@ackneal',
    role: 'Applied AI & backend engineer',
  },

  about:
    'I’m an applied AI and backend engineer with 10+ years of experience building distributed systems, search infrastructure, and production AI systems. I’ve led backend and applied AI teams while staying hands-on with architecture and implementation. Originally self-taught, I’m still driven by the same curiosity that got me into building software in the first place.',

  experience: [
    {
      start: 'Jul 2025',
      end: 'Present',
      role: 'AI Team Lead',
      company: 'FunNow',
      summary:
        'Lead an applied AI team building multi-brand conversational agents for venue discovery, personalized recommendations, and booking. Built content intelligence pipelines that turn unstructured venue data into structured knowledge for semantic search and recommendations, alongside model routing, prompt caching, and LLM evaluation for reliable production services.',
      tags: [
        'Python',
        'LangGraph',
        'Agentic AI',
        'LLM Evaluation',
        'Model Routing',
      ],
      career: {
        id: 'funnow',
        label: 'FunNow career progression',
        start: 'Sep 2020',
        end: 'Present',
        stage: 3,
        totalStages: 3,
      },
    },
    {
      start: 'Jan 2024',
      end: 'Jun 2025',
      role: 'Backend Lead',
      company: 'FunNow',
      summary:
        'Led a 7-person backend team across system architecture, cross-functional delivery, and multi-brand platform consolidation. Designed core initiatives including a progressive identity migration and parallel inventory model, while restructuring backend domains around clearer boundaries and service contracts.',
      tags: [
        'Tech Leadership',
        'System Design',
        'Domain-Driven Design',
        'Platform Architecture',
        'Inventory Systems',
      ],
      career: {
        id: 'funnow',
        label: 'FunNow career progression',
        start: 'Sep 2020',
        end: 'Present',
        stage: 2,
        totalStages: 3,
      },
    },
    {
      start: 'Sep 2020',
      end: 'Dec 2023',
      role: 'Backend Engineer',
      company: 'FunNow',
      summary:
        'Owned backend engineering for venue discovery and performance-critical search infrastructure. Built geospatial discovery systems with Elasticsearch and Redis, alongside distributed concurrency primitives supporting critical payment, order, notification, and invoicing workflows.',
      tags: [
        'Go',
        'MySQL',
        'Elasticsearch',
        'Redis',
        'Distributed Systems',
        'Geospatial Search',
      ],
      career: {
        id: 'funnow',
        label: 'FunNow career progression',
        start: 'Sep 2020',
        end: 'Present',
        stage: 1,
        totalStages: 3,
      },
    },
    {
      start: 'Jul 2016',
      end: 'Aug 2020',
      role: 'Advanced Backend Engineer',
      company: 'PIXNET',
      summary:
        'Built backend systems for social media, content discovery, and payments, including real-time nickname autocomplete and a concurrent crawler for rich link previews. Mentored three engineers on backend engineering practices.',
      tags: ['PHP', 'Go', 'MySQL', 'Elasticsearch', 'Web Crawling'],
    },
    {
      start: 'Jul 2014',
      end: 'Apr 2016',
      role: 'Associate Project Manager',
      company: 'GigaFast',
      summary:
        'Managed project delivery, client communication, and cross-functional coordination before transitioning into backend engineering.',
      tags: [
        'Project Delivery',
        'Stakeholder Management',
        'Cross-functional Alignment',
      ],
    },
  ],

  links: [
    { label: 'GitHub', href: 'https://github.com/ackneal' },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/ackneal/',
    },
    { label: 'Resume', href: './resume.pdf', download: true },
  ],

  footer:
    'Static site, no tracking. On-device AI when available.',
};

export function formatDossier(content: SiteContent = siteContent): string {
  const lines = [
    `Handle: ${content.profile.handle}`,
    `Role: ${content.profile.role}`,
    `About: ${content.about}`,
    'Experience:',
  ];

  for (const exp of content.experience) {
    lines.push(`- ${exp.start} - ${exp.end} | ${exp.role} @ ${exp.company}`);
    lines.push(`  Summary: ${exp.summary}`);
    lines.push(`  Tech: ${exp.tags.join(', ')}`);
  }

  return lines.join('\n');
}

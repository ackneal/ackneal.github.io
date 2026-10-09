import { describe, expect, it } from 'bun:test';
import { formatDossier, siteContent } from './site-content.js';

describe('formatDossier', () => {
  it('formats default siteContent into clean text format', () => {
    const text = formatDossier();
    expect(text).toContain('Handle: @ackneal');
    expect(text).toContain(`Role: ${siteContent.profile.role}`);
    expect(text).toContain(`About: ${siteContent.about}`);
    expect(text).toContain('Experience:');
    const first = siteContent.experience[0];
    expect(text).toContain(
      `- ${first.start} - ${first.end} | ${first.role} @ ${first.company}\n` +
      `  Summary: ${first.summary}\n` +
      `  Tech: ${first.tags.join(', ')}`
    );
  });

  it('accepts custom SiteContent', () => {
    const custom = {
      profile: { handle: '@test', role: 'Engineer' },
      about: 'Test about',
      experience: [
        {
          start: '2020',
          end: '2021',
          role: 'Dev',
          company: 'Acme',
          summary: 'Built things',
          tags: ['TypeScript', 'Bun'],
        },
      ],
      links: [],
      footer: 'footer',
    };
    const text = formatDossier(custom);
    expect(text).toBe(
      'Handle: @test\nRole: Engineer\nAbout: Test about\nExperience:\n- 2020 - 2021 | Dev @ Acme\n  Summary: Built things\n  Tech: TypeScript, Bun'
    );
  });
});

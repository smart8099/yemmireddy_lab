/**
 * Simple line icons (24×24 viewBox, drawn with stroke="currentColor").
 * Keys are referenced from content (home.yml → discovery.stages[].icon).
 */
export const icons: Record<string, string> = {
  // Stages
  understand: 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.4 15.4 21 21M8.2 9.3c1.2-1 3.4-.9 4.3.4.8 1.2.2 2.8-1.2 3.3-1.6.6-3.6-.1-3.9-1.4-.1-.8.2-1.6.8-2.3z',
  control: 'M12 3l7 3v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6zM9 12l2.2 2.2L15.5 10',
  inform: 'M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8 20h8M12 16v4M8 12.5V10M12 12.5V7.5M16 12.5V9',
  empower: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5M18 14.2c1.8.6 3 2.4 3 4.8',
  impact: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.5 9h17M3.5 15h17M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3z',

  // Explore the lab
  research: 'M9 3h4l-.8 8h-2.4zM6 21h12M8 21v-2a4 4 0 0 1 4-4h0M14 11a5 5 0 0 1 2 9M9.5 11h3',
  people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5M18 14.2c1.8.6 3 2.4 3 4.8',
  publications: 'M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3zM21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z',
  teaching: 'M2 9l10-5 10 5-10 5zM6 11v5c3.5 2.3 8.5 2.3 12 0v-5M22 9v5',
  outreach: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.5 9h17M3.5 15h17M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3z',
  news: 'M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 12.5h7M7 16h4',
  contact: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 7l9 6 9-6',
};

export const stageIcons = ['understand', 'control', 'inform', 'empower', 'impact'] as const;

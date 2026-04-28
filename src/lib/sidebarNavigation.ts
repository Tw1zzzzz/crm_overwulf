export type SidebarRole = 'player' | 'staff' | null;
export type SidebarPlayerType = 'solo' | 'team' | null;

export type SidebarIconKey =
  | 'home'
  | 'calendar'
  | 'planner'
  | 'guide'
  | 'tests'
  | 'stats'
  | 'correlation'
  | 'gameStats'
  | 'balanceWheel'
  | 'playerState'
  | 'topPlayers'
  | 'players'
  | 'staff'
  | 'teams'
  | 'superadmin'
  | 'playerCard'
  | 'profile'
  | 'pricing';

export interface SidebarNavItem {
  title: string;
  href: string;
  icon: SidebarIconKey;
}

export interface SidebarNavSection {
  title: string;
  items: SidebarNavItem[];
}

const PATHS = {
  dashboard: '/',
  calendar: '/calendar',
  guide: '/guide',
  dailyQuestionnaire: '/daily-questionnaire',
  mood: '/mood',
  tests: '/tests',
  stats: '/stats',
  correlationAnalysis: '/correlation-analysis',
  gameStats: '/game-stats',
  balanceWheel: '/balance-wheel',
  staffBalanceWheel: '/staff-balance-wheel',
  playerState: '/state',
  topPlayers: '/top-players',
  playersManagement: '/players',
  staffRoster: '/staff-roster',
  teamManagement: '/teams',
  superadmin: '/superadmin',
  playerCard: '/player-card',
  profile: '/profile',
  pricing: '/pricing',
} as const;

export function getSidebarNavItems(
  role: SidebarRole,
  playerType: SidebarPlayerType,
  isSuperAdmin = false
): SidebarNavSection[] {
  const isSoloPlayer = role === 'player' && playerType === 'solo';
  const isTeamStaff = role === 'staff' && playerType === 'team';

  if (role === 'staff') {
    if (isTeamStaff) {
      const sections: SidebarNavSection[] = [
        {
          title: 'Team',
          items: [
            { title: 'Team overview', href: PATHS.dashboard, icon: 'home' },
            { title: 'Top players', href: PATHS.topPlayers, icon: 'topPlayers' },
            { title: 'Players roster', href: PATHS.playersManagement, icon: 'players' },
            { title: 'Staff roster', href: PATHS.staffRoster, icon: 'staff' },
            { title: 'Player cards', href: PATHS.playerCard, icon: 'playerCard' },
          ],
        },
        {
          title: 'Performance',
          items: [
            { title: 'Statistics', href: PATHS.stats, icon: 'stats' },
            { title: 'Correlation analysis', href: PATHS.correlationAnalysis, icon: 'correlation' },
            { title: 'Game statistics', href: PATHS.gameStats, icon: 'gameStats' },
            { title: 'Balance wheel', href: PATHS.staffBalanceWheel, icon: 'balanceWheel' },
          ],
        },
        {
          title: 'Account',
          items: [
            { title: 'Plans', href: PATHS.pricing, icon: 'pricing' },
            { title: 'Profile', href: PATHS.profile, icon: 'profile' },
            { title: 'CRM guide', href: PATHS.guide, icon: 'guide' },
          ],
        },
      ];

      if (isSuperAdmin) {
        sections.push({
          title: 'System',
          items: [{ title: 'CRM admin', href: PATHS.superadmin, icon: 'superadmin' }],
        });
      }

      return sections;
    }

    const sections: SidebarNavSection[] = [
      {
        title: 'Team',
        items: [
          { title: 'Team overview', href: PATHS.dashboard, icon: 'home' },
          { title: 'Calendar', href: PATHS.calendar, icon: 'planner' },
          { title: 'Top players', href: PATHS.topPlayers, icon: 'topPlayers' },
          { title: 'Players roster', href: PATHS.playersManagement, icon: 'players' },
          { title: 'Staff roster', href: PATHS.staffRoster, icon: 'staff' },
          { title: 'Player cards', href: PATHS.playerCard, icon: 'playerCard' },
        ],
      },
      {
        title: 'Performance',
        items: [
          { title: 'Statistics', href: PATHS.stats, icon: 'stats' },
          { title: 'Correlation analysis', href: PATHS.correlationAnalysis, icon: 'correlation' },
          { title: 'Game statistics', href: PATHS.gameStats, icon: 'gameStats' },
          { title: 'Balance wheel', href: PATHS.staffBalanceWheel, icon: 'balanceWheel' },
        ],
      },
      {
        title: 'Account',
        items: [
          { title: 'Plans', href: PATHS.pricing, icon: 'pricing' },
          { title: 'Profile', href: PATHS.profile, icon: 'profile' },
        ],
      },
      {
        title: 'Help',
        items: [{ title: 'CRM guide', href: PATHS.guide, icon: 'guide' }],
      },
    ];

    if (isSuperAdmin) {
      sections.push({
        title: 'System',
        items: [{ title: 'CRM admin', href: PATHS.superadmin, icon: 'superadmin' }],
      });
    }

    return sections;
  }

  if (role === 'player') {
    const teamItems: SidebarNavItem[] = [];

    if (!isSoloPlayer) {
      teamItems.push({ title: 'Top players', href: PATHS.topPlayers, icon: 'topPlayers' });
    }

    teamItems.push({
      title: isSoloPlayer ? 'My card' : 'Player card',
      href: PATHS.playerCard,
      icon: 'playerCard',
    });

    const sections: SidebarNavSection[] = [
      {
        title: 'My state',
        items: [
          { title: 'Overview', href: PATHS.dashboard, icon: 'home' },
          { title: 'Calendar', href: PATHS.calendar, icon: 'planner' },
          { title: 'Daily check-in', href: PATHS.dailyQuestionnaire, icon: 'calendar' },
          { title: 'Mood and energy', href: PATHS.mood, icon: 'calendar' },
          // Временно скрыто из прод-навигации до доработки экрана.
        ],
      },
      {
        title: 'Performance',
        items: [
          { title: 'Tests', href: PATHS.tests, icon: 'tests' },
          { title: 'Statistics', href: PATHS.stats, icon: 'stats' },
          { title: 'Correlation analysis', href: PATHS.correlationAnalysis, icon: 'correlation' },
          { title: 'Game statistics', href: PATHS.gameStats, icon: 'gameStats' },
          { title: 'Balance wheel', href: PATHS.balanceWheel, icon: 'balanceWheel' },
        ],
      },
      ...(teamItems.length
        ? [
            {
              title: 'Team',
              items: teamItems,
            },
          ]
        : []),
      {
        title: 'Account',
        items: [
          { title: 'Plans', href: PATHS.pricing, icon: 'pricing' },
          { title: 'Profile', href: PATHS.profile, icon: 'profile' },
        ],
      },
      {
        title: 'Help',
        items: [{ title: 'CRM guide', href: PATHS.guide, icon: 'guide' }],
      },
    ];

    if (isSuperAdmin) {
      sections.push({
        title: 'System',
        items: [{ title: 'CRM admin', href: PATHS.superadmin, icon: 'superadmin' }],
      });
    }

    return sections;
  }

  return [];
}

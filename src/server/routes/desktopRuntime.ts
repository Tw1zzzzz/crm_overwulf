import { Router } from 'express';

const router = Router();

router.get('/runtime', (_req, res) => {
  res.json({
    success: true,
    platform: {
      client: 'overwolf-native',
      backendRole: 'external-crm-api',
      desktopReady: true
    },
    api: {
      basePath: '/api',
      healthPath: '/health',
      authPath: '/api/auth'
    },
    productRules: {
      gameplayCycle: ['pre-match', 'session-tracking', 'post-match'],
      allowedValue: ['analytics', 'tracking', 'post-match-insights', 'self-improvement'],
      disallowedValue: ['real-time-gameplay-assistance', 'hidden-opponent-data', 'competitive-advantage']
    }
  });
});

export default router;

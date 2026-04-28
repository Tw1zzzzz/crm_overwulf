export type OverwolfProfile = {
  username: string;
  userId?: string;
  displayName?: string;
  avatar?: string;
};

type OverwolfProfileResponse = {
  success?: boolean;
  status?: string;
  username?: string;
  userId?: string;
  displayName?: string;
  nickname?: string;
  avatar?: string;
  avatarUrl?: string;
  error?: string;
};

declare global {
  interface Window {
    overwolf?: {
      profile?: {
        getCurrentUser?: (callback: (result: OverwolfProfileResponse) => void) => void;
        openLoginDialog?: (callback?: (result: OverwolfProfileResponse) => void) => void;
      };
    };
  }
}

export const isOverwolfProfileAvailable = () => {
  return typeof window !== 'undefined' && typeof window.overwolf?.profile?.getCurrentUser === 'function';
};

const readCurrentUser = () =>
  new Promise<OverwolfProfileResponse>((resolve) => {
    window.overwolf?.profile?.getCurrentUser?.((result) => resolve(result || {}));
  });

const openLoginDialog = () =>
  new Promise<void>((resolve) => {
    if (typeof window.overwolf?.profile?.openLoginDialog !== 'function') {
      resolve();
      return;
    }

    window.overwolf.profile.openLoginDialog(() => resolve());
  });

const normalizeProfile = (result: OverwolfProfileResponse): OverwolfProfile | null => {
  const username = typeof result.username === 'string' ? result.username.trim() : '';

  if (!username) {
    return null;
  }

  return {
    username,
    userId: typeof result.userId === 'string' ? result.userId : undefined,
    displayName:
      typeof result.displayName === 'string'
        ? result.displayName
        : typeof result.nickname === 'string'
          ? result.nickname
          : username,
    avatar:
      typeof result.avatar === 'string'
        ? result.avatar
        : typeof result.avatarUrl === 'string'
          ? result.avatarUrl
          : undefined,
  };
};

export const resolveOverwolfProfile = async (): Promise<OverwolfProfile | null> => {
  if (!isOverwolfProfileAvailable()) {
    return null;
  }

  const currentUser = normalizeProfile(await readCurrentUser());
  if (currentUser) {
    return currentUser;
  }

  await openLoginDialog();
  return normalizeProfile(await readCurrentUser());
};

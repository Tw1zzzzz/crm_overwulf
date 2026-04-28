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

type OverwolfWindowInfo = {
  id?: string;
  name?: string;
};

type OverwolfWindowResponse = {
  success?: boolean;
  status?: string;
  window?: OverwolfWindowInfo;
  window_state?: string;
};

type OverwolfHotkeyEvent = {
  name?: string;
};

declare global {
  interface Window {
    overwolf?: {
      profile?: {
        getCurrentUser?: (callback: (result: OverwolfProfileResponse) => void) => void;
        openLoginDialog?: (callback?: (result: OverwolfProfileResponse) => void) => void;
      };
      windows?: {
        obtainDeclaredWindow?: (
          name: string,
          callback: (result: OverwolfWindowResponse) => void
        ) => void;
        restore?: (windowId: string, callback?: (result: OverwolfWindowResponse) => void) => void;
        hide?: (windowId: string, callback?: (result: OverwolfWindowResponse) => void) => void;
        getWindowState?: (
          windowId: string,
          callback: (result: OverwolfWindowResponse) => void
        ) => void;
        getCurrentWindow?: (callback: (result: OverwolfWindowResponse) => void) => void;
      };
      settings?: {
        hotkeys?: {
          onPressed?: {
            addListener?: (listener: (event: OverwolfHotkeyEvent) => void) => void;
          };
        };
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

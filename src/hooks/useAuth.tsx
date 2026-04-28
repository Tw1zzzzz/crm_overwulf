/**
 * Хук для управления аутентификацией
 */

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  ReactNode,
  useMemo
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, LoginDto, CreatePlayerProfileDto, CreateUserDto, AsyncState, LinkTeamProfileDto } from "@/types";
import { authService, AuthResult, TeamLinkResult } from "@/services/auth.service";
import ROUTES from "@/lib/routes";
import { BASELINE_REGISTER_MODAL_FLAG, POST_REGISTER_WELCOME_FLAG } from "@/lib/onboarding";
import { isOverwolfProfileAvailable, resolveOverwolfProfile } from "@/lib/overwolfProfile";

/**
 * Тип контекста аутентификации
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginDto) => Promise<AuthResult>;
  register: (userData: CreateUserDto) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  createPlayerProfile: (payload: CreatePlayerProfileDto) => Promise<AuthResult>;
  linkTeamProfile: (payload: LinkTeamProfileDto) => Promise<TeamLinkResult>;
  switchProfile: (profileKey: string) => Promise<AuthResult>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
  updateAvatar: (file: File) => Promise<AuthResult>;
  refreshUser: () => Promise<void>;
}

/**
 * Значение контекста по умолчанию
 */
const defaultContextValue: AuthContextType = {
  user: null,
  loading: true,
  error: null,
  login: async () => ({ success: false, error: 'Context not initialized' }),
  register: async () => ({ success: false, error: 'Context not initialized' }),
  requestPasswordReset: async () => ({ success: false, error: 'Context not initialized' }),
  resetPassword: async () => ({ success: false, error: 'Context not initialized' }),
  resendVerificationEmail: async () => ({ success: false, error: 'Context not initialized' }),
  verifyEmail: async () => ({ success: false, error: 'Context not initialized' }),
  changePassword: async () => ({ success: false, error: 'Context not initialized' }),
  createPlayerProfile: async () => ({ success: false, error: 'Context not initialized' }),
  linkTeamProfile: async () => ({ success: false, error: 'Context not initialized' }),
  switchProfile: async () => ({ success: false, error: 'Context not initialized' }),
  logout: () => {},
  deleteAccount: async () => {},
  updateAvatar: async () => ({ success: false, error: 'Context not initialized' }),
  refreshUser: async () => {}
};

// Создание контекста
const AuthContext = createContext<AuthContextType>(defaultContextValue);

/**
 * Провайдер аутентификации
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  
  // Состояние аутентификации
  const [authState, setAuthState] = useState<AsyncState<User>>({
    data: null,
    loading: true,
    error: null
  });

  /**
   * Инициализация сессии пользователя при загрузке
   */
  const initializeAuth = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      if (!user && isOverwolfProfileAvailable()) {
        const overwolfProfile = await resolveOverwolfProfile();

        if (overwolfProfile) {
          const result = await authService.loginWithOverwolf(overwolfProfile);

          if (result.success && result.user) {
            sessionStorage.removeItem(BASELINE_REGISTER_MODAL_FLAG);
            sessionStorage.removeItem(POST_REGISTER_WELCOME_FLAG);
            setAuthState({
              data: result.user,
              loading: false,
              error: null
            });
            navigate(ROUTES.DASHBOARD);
            return;
          }

          console.warn('[Auth] Overwolf auto-login failed:', result.error);
        }
      }

      setAuthState({
        data: user,
        loading: false,
        error: null
      });
    } catch (error) {
      setAuthState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Initialization error'
      });
    }
  }, [navigate]);

  /**
   * Обновление данных пользователя
   */
  const refreshUser = useCallback(async () => {
    if (!authState.data) return;
    
    try {
      const user = await authService.getCurrentUser();
      setAuthState(prev => ({
        ...prev,
        data: user
      }));
    } catch (error) {
      console.error('Error обновления данных пользователя:', error);
    }
  }, [authState.data]);

  /**
   * Вход в систему
   */
  const login = useCallback(async (credentials: LoginDto): Promise<AuthResult> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await authService.login(credentials);
      
      if (result.success && result.user) {
        sessionStorage.removeItem(BASELINE_REGISTER_MODAL_FLAG);
        sessionStorage.removeItem(POST_REGISTER_WELCOME_FLAG);
        setAuthState({
          data: result.user,
          loading: false,
          error: null
        });
        
        toast.success(`Welcome, ${result.user.name}!`);
        
        // Navigation на главную страницу после успешного входа
        navigate(ROUTES.DASHBOARD);
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Sign-in error'
        }));
        
        toast.error(result.error || 'Sign-in error');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [navigate]);

  /**
   * Регистрация нового пользователя
   */
  const register = useCallback(async (userData: CreateUserDto): Promise<AuthResult> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await authService.register(userData);
      
      if (result.success && result.user) {
        sessionStorage.setItem(POST_REGISTER_WELCOME_FLAG, "1");
        if (result.user.role === "player") {
          sessionStorage.setItem(BASELINE_REGISTER_MODAL_FLAG, "1");
        } else {
          sessionStorage.removeItem(BASELINE_REGISTER_MODAL_FLAG);
        }
        setAuthState({
          data: result.user,
          loading: false,
          error: null
        });
        
        toast.success(`Account created successfully! Welcome, ${result.user.name}!`);
        
        // Navigation на главную страницу после успешной регистрации
        navigate(ROUTES.DASHBOARD);
      } else if (result.success) {
        sessionStorage.removeItem(BASELINE_REGISTER_MODAL_FLAG);
        sessionStorage.removeItem(POST_REGISTER_WELCOME_FLAG);
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: null
        }));

        toast.success(result.message || 'Account created. Confirm your email, then sign in.');
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Registration error'
        }));
        
        toast.error(result.error || 'Registration error');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [navigate]);

  const requestPasswordReset = useCallback(async (email: string) => {
    const result = await authService.requestPasswordReset({ email });

    if (result.success) {
      toast.success('If the account exists, the reset email has already been sent');
    } else {
      toast.error(result.error || 'Failed to send reset email');
    }

    return result;
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    const result = await authService.resetPassword({ token, password });

    if (result.success) {
      toast.success('Password updated. You can sign in now.');
    } else {
      toast.error(result.error || 'Failed to update password');
    }

    return result;
  }, []);

  const resendVerificationEmail = useCallback(async (email: string) => {
    const result = await authService.resendVerificationEmail({ email });

    if (result.success) {
      toast.success(result.message || 'Confirmation email sent');
    } else {
      toast.error(result.error || 'Failed to send confirmation email');
    }

    return {
      success: result.success,
      error: result.error
    };
  }, []);

  const verifyEmail = useCallback(async (token: string) => {
    const result = await authService.verifyEmail({ token });

    return {
      success: result.success,
      error: result.error
    };
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const result = await authService.changePassword({ currentPassword, newPassword });

    if (result.success) {
      sessionStorage.removeItem(BASELINE_REGISTER_MODAL_FLAG);
      sessionStorage.removeItem(POST_REGISTER_WELCOME_FLAG);
      authService.logout();
      setAuthState({
        data: null,
        loading: false,
        error: null
      });
      toast.success(result.message || 'Password updated. Sign in again.');
      navigate(ROUTES.WELCOME);
    } else {
      toast.error(result.error || 'Failed to change password');
    }

    return {
      success: result.success,
      error: result.error
    };
  }, [navigate]);

  const createPlayerProfile = useCallback(async (payload: CreatePlayerProfileDto): Promise<AuthResult> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await authService.createPlayerProfile(payload);

      if (result.success && result.user) {
        setAuthState({
          data: result.user,
          loading: false,
          error: null
        });
        toast.success(result.message || 'Player profile added');
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to add player profile'
        }));
        toast.error(result.error || 'Failed to add player profile');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const linkTeamProfile = useCallback(async (payload: LinkTeamProfileDto): Promise<TeamLinkResult> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await authService.linkTeamProfile(payload);

      if (result.success && result.status === 'linked' && result.user) {
        setAuthState({
          data: result.user,
          loading: false,
          error: null
        });
      } else if (result.success && result.status === 'confirmation_required') {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: null
        }));
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to link profile to team'
        }));
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const switchProfile = useCallback(async (profileKey: string): Promise<AuthResult> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await authService.switchProfile(profileKey);

      if (result.success && result.user) {
        setAuthState({
          data: result.user,
          loading: false,
          error: null
        });
        toast.success(result.message || 'Profile switched');
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to switch profile'
        }));
        toast.error(result.error || 'Failed to switch profile');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Выход из системы
   */
  const logout = useCallback(() => {
    sessionStorage.removeItem(BASELINE_REGISTER_MODAL_FLAG);
    sessionStorage.removeItem(POST_REGISTER_WELCOME_FLAG);
    authService.logout();
    setAuthState({
      data: null,
      loading: false,
      error: null
    });
    
    toast.success("You have signed out");
    navigate(ROUTES.WELCOME);
  }, [navigate]);

  /**
   * Удаление аккаунта
   */
  const deleteAccount = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      await authService.deleteAccount();
      setAuthState({
        data: null,
        loading: false,
        error: null
      });
      
      toast.success("Account deleted successfully");
      navigate(ROUTES.WELCOME);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Account deletion error';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      toast.error(errorMessage);
      throw error;
    }
  }, [navigate]);

  /**
   * Обновление аватара пользователя
   */
  const updateAvatar = useCallback(async (file: File): Promise<AuthResult> => {
    if (!authState.data) {
      return { success: false, error: 'User is not authorized' };
    }
    
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await authService.updateAvatar(file);
      
      if (result.success) {
        // Обновляем данные пользователя
        if (result.user) {
          setAuthState({
            data: {
              ...result.user,
              _updateTimestamp: Date.now() // Для инвалидации кэша изображений
            },
            loading: false,
            error: null
          });
        } else {
          // Если сервер не вернул обновленного пользователя, запрашиваем его
          await refreshUser();
        }
        
        toast.success('Avatar updated successfully');
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false
        }));
        
        toast.error(result.error || 'Error обновления аватара');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setAuthState(prev => ({
        ...prev,
        loading: false
      }));
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [authState.data, refreshUser]);

  // Инициализация при монтировании
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Обработка изменений в localStorage (синхронизация между вкладками)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'token') {
        if (!event.newValue) {
          // Токен был удален в другой вкладке
          setAuthState({
            data: null,
            loading: false,
            error: null
          });
        } else {
          // Токен был обновлен в другой вкладке
          initializeAuth();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initializeAuth]);

  // Мемоизация значения контекста
  const contextValue = useMemo<AuthContextType>(() => ({
    user: authState.data,
    loading: authState.loading,
    error: authState.error,
    login,
    register,
    requestPasswordReset,
    resetPassword,
    resendVerificationEmail,
    verifyEmail,
    changePassword,
    createPlayerProfile,
    linkTeamProfile,
    switchProfile,
    logout,
    deleteAccount,
    updateAvatar,
    refreshUser
  }), [authState, login, register, requestPasswordReset, resetPassword, resendVerificationEmail, verifyEmail, changePassword, createPlayerProfile, linkTeamProfile, switchProfile, logout, deleteAccount, updateAvatar, refreshUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Хук для использования контекста аутентификации
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === defaultContextValue) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  
  return context;
};

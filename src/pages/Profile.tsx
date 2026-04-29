import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Camera, Upload, Pencil, X, Check, ArrowRightLeft, Link2, ShieldCheck, UserPlus2 } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import StaffPrivilegeUpgrade from "@/components/StaffPrivilegeUpgrade";
import TeamManagement from "@/pages/TeamManagement";
import { toast } from "sonner";
import { getImageUrl } from "@/utils/imageUtils";
import { TeamLinkSummary } from "@/types";
import { cn } from "@/lib/utils";



/**
 * Интерфейс состояния profiles
 */
interface ProfileState {
 isDeleting: boolean;
 isDialogOpen: boolean;
 isUploadingAvatar: boolean;
 lastAvatarUpdate: number;
}

interface PendingTeamRelink {
 teamCode: string;
 targetProfileKey: string;
 currentTeam: TeamLinkSummary;
 nextTeam: TeamLinkSummary;
}

/**
 * Компонент страницы profiles пользователя
 * Отображает данные profiles и предоставляет возможность удаления аккаунта
 */
const Profile: React.FC = () => {
 const {
  user,
  deleteAccount,
  updateAvatar,
  refreshUser,
  changePassword,
  resendVerificationEmail,
  createPlayerProfile,
  linkTeamProfile,
  switchProfile
 } = useAuth();
 const navigate = useNavigate();
 const fileInputRef = useRef<HTMLInputElement>(null);

 // Объединение связанных состояний в один объект
 const [state, setState] = useState<ProfileState>({
  isDeleting: false,
  isDialogOpen: false,
  isUploadingAvatar: false,
  lastAvatarUpdate: 0
 });

 // Состояния для редактирования FACEIT ссылки
 const [isEditingFaceit, setIsEditingFaceit] = useState(false);
 const [faceitUrl, setFaceitUrl] = useState('');
 const [currentFaceitUrl, setCurrentFaceitUrl] = useState<string | null>(null);
 const [isSavingFaceit, setIsSavingFaceit] = useState(false);
 const [loadingFaceit, setLoadingFaceit] = useState(false);
 const [isChangingPassword, setIsChangingPassword] = useState(false);
 const [isSendingVerificationEmail, setIsSendingVerificationEmail] = useState(false);
 const [passwordForm, setPasswordForm] = useState({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
 });
 const [playerProfileForm, setPlayerProfileForm] = useState({
  playerType: "team" as "team" | "solo",
  faceitUrl: "",
  nickname: "",
 });
 const [isCreatingPlayerProfile, setIsCreatingPlayerProfile] = useState(false);
 const [teamCode, setTeamCode] = useState("");
 const [isLinkingTeamProfile, setIsLinkingTeamProfile] = useState(false);
 const [pendingTeamRelink, setPendingTeamRelink] = useState<PendingTeamRelink | null>(null);
 const [teamSwitchSuggestion, setTeamSwitchSuggestion] = useState<{
  profileKey: string;
  label: string;
 } | null>(null);
 const [staffProfileTab, setStaffProfileTab] = useState<"profile" | "team">("profile");

 // Загружаем текущую FACEIT ссылку при монтировании
 useEffect(() => {
  if (!user) return;
  setLoadingFaceit(true);
  const token = localStorage.getItem('token');
  fetch('/api/auth/faceit-url', {
   headers: { 'Authorization': `Bearer ${token}` }
  })
   .then(r => r.json())
   .then(data => {
    if (data.success) setCurrentFaceitUrl(data.faceitUrl);
   })
   .catch(() => {})
   .finally(() => setLoadingFaceit(false));
 }, [user]);

 /**
  * Сохранение новой FACEIT ссылки
  */
 const handleSaveFaceitUrl = async (): Promise<void> => {
  if (!faceitUrl.trim()) {
   toast.error('Enter FACEIT link');
   return;
  }

  setIsSavingFaceit(true);
  try {
   const token = localStorage.getItem('token');
   const response = await fetch('/api/auth/update-faceit', {
    method: 'PATCH',
    headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ faceitUrl: faceitUrl.trim() })
   });

   const data = await response.json();

   if (response.ok && data.success) {
    toast.success('FACEIT link updated successfully');
    setCurrentFaceitUrl(faceitUrl.trim());
    setIsEditingFaceit(false);
    await refreshUser();
   } else {
    toast.error(data.message || 'Failed to update FACEIT link');
   }
  } catch (error) {
   console.error('Error while updating FACEIT link:', error);
   toast.error('Error while saving FACEIT link');
  } finally {
   setIsSavingFaceit(false);
  }
 };

 const handlePasswordFieldChange = (
  field: "currentPassword" | "newPassword" | "confirmPassword",
  value: string
 ): void => {
  setPasswordForm((prev) => ({ ...prev, [field]: value }));
 };

 const handleChangePassword = async (): Promise<void> => {
  const { currentPassword, newPassword, confirmPassword } = passwordForm;

  if (!currentPassword || !newPassword || !confirmPassword) {
   toast.error("Fill in all password change fields");
   return;
  }

  if (newPassword.length < 8) {
   toast.error("New password must be at least 8 characters long");
   return;
  }

  if (newPassword !== confirmPassword) {
   toast.error("New password and confirmation do not match");
   return;
  }

  setIsChangingPassword(true);
  try {
   const result = await changePassword(currentPassword, newPassword);
   if (result.success) {
    setPasswordForm({
     currentPassword: "",
     newPassword: "",
     confirmPassword: "",
    });
   }
  } finally {
   setIsChangingPassword(false);
  }
 };

 const handleResendVerificationEmail = async (): Promise<void> => {
  if (!user?.email) {
   return;
  }

  setIsSendingVerificationEmail(true);
  try {
   await resendVerificationEmail(user.email);
  } finally {
   setIsSendingVerificationEmail(false);
  }
 };

 const handleCreatePlayerProfile = async (): Promise<void> => {
  if (!playerProfileForm.faceitUrl.trim()) {
   toast.error("Enter a FACEIT link for the player profile");
   return;
  }

  setIsCreatingPlayerProfile(true);
  try {
   const result = await createPlayerProfile({
    playerType: playerProfileForm.playerType,
    faceitUrl: playerProfileForm.faceitUrl.trim(),
    nickname: playerProfileForm.nickname.trim() || undefined,
   });

   if (result.success) {
    setPlayerProfileForm({
     playerType: "team",
     faceitUrl: "",
     nickname: "",
    });
   }
  } finally {
   setIsCreatingPlayerProfile(false);
  }
 };

 const handleTeamLinkSubmit = async (
  confirmRelink = false,
  overrideCode?: string
 ): Promise<void> => {
  const normalizedTeamCode = (overrideCode || teamCode).trim();

  if (!normalizedTeamCode) {
   toast.error("Enter team code");
   return;
  }

  setIsLinkingTeamProfile(true);
  try {
   const result = await linkTeamProfile({
    teamCode: normalizedTeamCode,
    confirmRelink,
   });

   if (!result.success) {
    toast.error(result.error || "Failed to link profile to team");
    return;
   }

   if (
    result.status === "confirmation_required" &&
    result.currentTeam &&
    result.nextTeam &&
    result.targetProfileKey
   ) {
    setPendingTeamRelink({
     teamCode: normalizedTeamCode,
     targetProfileKey: result.targetProfileKey,
     currentTeam: result.currentTeam,
     nextTeam: result.nextTeam,
    });
    return;
   }

   setPendingTeamRelink(null);
   setTeamCode("");

   const targetProfileKey = result.targetProfileKey || null;
   const activeProfileKey = result.user?.activeProfileKey || user?.activeProfileKey || null;
   if (targetProfileKey && activeProfileKey && targetProfileKey !== activeProfileKey) {
    setTeamSwitchSuggestion({
     profileKey: targetProfileKey,
     label: targetProfileKey === "staff_team" ? "Switch to Staff / Team" : "Switch to Player / Team",
    });
   } else {
    setTeamSwitchSuggestion(null);
   }

   toast.success(result.message || "Team profile linked successfully");
  } finally {
   setIsLinkingTeamProfile(false);
  }
 };

 const handleConfirmTeamRelink = async (): Promise<void> => {
  if (!pendingTeamRelink) {
   return;
  }

  await handleTeamLinkSubmit(true, pendingTeamRelink.teamCode);
 };



 /**
  * Обработчик для changes состояния диалога
  */
 const handleDialogChange = (open: boolean): void => {
  setState(prevState => ({ ...prevState, isDialogOpen: open }));
 };

 /**
  * Обработчик удаления аккаунта пользователя
  */
 const handleDeleteAccount = async (): Promise<void> => {
  // Устанавливаем состояние удаления
  setState(prevState => ({ ...prevState, isDeleting: true }));
  
  try {
   await deleteAccount();
   // После успешного удаления перенаправляем на страницу входа
   navigate("/login");
  } catch (error) {
   console.error("Error while deleting account:", error);
  } finally {
   // Satрасываем состояния независимо от результата
   setState(prevState => ({ 
    ...prevState, 
    isDeleting: false, 
    isDialogOpen: false 
   }));
  }
 };

 /**
  * Открывает диалог выбора файла
  */
 const handleAvatarClick = (): void => {
  if (fileInputRef.current) {
   fileInputRef.current.click();
  }
 };

 /**
  * Обработчик загрузки аватара
  */
 const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Проверка типа файла
  if (!file.type.startsWith('image/')) {
   alert('Please choose an image');
   return;
  }

  // Проверка размера файла (макс. 5MB)
  if (file.size > 5 * 1024 * 1024) {
   alert('File is too large. Maximum size is 5 MB');
   return;
  }

  setState(prevState => ({ ...prevState, isUploadingAvatar: true }));
  
  try {
   console.log('Sending avatar upload request...');
   const result = await updateAvatar(file);
   
   if (result.success) {
    console.log('Avatar uploaded successfully:', result.avatar);
    
    // Принудительно обновляем состояние компонента
    setState(prevState => ({ 
     ...prevState, 
     isUploadingAvatar: false,
     // Добавляем временную метку, чтобы принудительно обновить UI
     lastAvatarUpdate: Date.now() 
    }));
    
    // Добавляем небольшую задержку перед проверкой 
    setTimeout(() => {
     // Делаем GET-запрос для проверки статуса аватара
     fetch('/api/auth/avatar/check')
      .then(res => res.json())
      .then(data => {
       console.log('Avatar check:', data);
      })
      .catch(err => {
       console.error('Error while checking avatar:', err);
      });
    }, 500);
   } else {
    console.error('Error while uploading avatar:', result.error);
    setState(prevState => ({ ...prevState, isUploadingAvatar: false }));
   }
  } catch (error) {
   console.error("Error while uploading avatar:", error);
   setState(prevState => ({ ...prevState, isUploadingAvatar: false }));
  } finally {
   // Очищаем поле ввода для возможности повторной загрузки того же файла
   if (fileInputRef.current) {
    fileInputRef.current.value = '';
   }
  }
 };

 useEffect(() => {
  if (!user) {
   return;
  }

  const canCreateTeamPlayerProfileNext = (user.availableProfiles || []).some(
   (profile) => profile.role === "staff" && profile.playerType === "team" && profile.teamId
  );

  if (!canCreateTeamPlayerProfileNext && playerProfileForm.playerType === "team") {
   setPlayerProfileForm((prev) => ({ ...prev, playerType: "solo" }));
  }
 }, [playerProfileForm.playerType, user]);

 useEffect(() => {
  if (!user || !teamSwitchSuggestion?.profileKey) {
   return;
  }

  if (user.activeProfileKey === teamSwitchSuggestion.profileKey) {
   setTeamSwitchSuggestion(null);
  }
 }, [teamSwitchSuggestion, user]);



 /**
  * Компонент для неавторofованных пользователей
  */
 const UnauthenticatedView = () => (
  <div className="flex items-center justify-center h-full performance-page">
   <Card className="w-full max-w-md performance-hero">
    <CardHeader>
     <CardTitle>Authorization required</CardTitle>
     <CardDescription>
      Sign in to access the profile
     </CardDescription>
    </CardHeader>
    <CardFooter>
     <Button className="w-full" onClick={() => navigate("/login")}>
      Sign in
     </Button>
    </CardFooter>
   </Card>
  </div>
 );

 // Если пользователь не авторofован, показываем соответствующий компонент
 if (!user) {
  return <UnauthenticatedView />;
 }

 const { isDeleting, isDialogOpen, isUploadingAvatar, lastAvatarUpdate } = state;
 const isTeamStaff = user.role === "staff" && user.playerType === "team";
 const teamName = user.teamName?.trim() || "";
 const teamLogo = user.teamLogo?.trim() || "";
 const teamLogoUrl = getImageUrl(teamLogo) || teamLogo;
 const availableProfiles = user.availableProfiles || [];
 const hasPlayerProfile = availableProfiles.some((profile) => profile.role === "player");
 const canCreateTeamPlayerProfile = availableProfiles.some(
  (profile) => profile.role === "staff" && profile.playerType === "team" && profile.teamId
 );
 const hasLinkedTeamProfileForActiveRole = availableProfiles.some(
  (profile) => profile.role === user.role && profile.playerType === "team" && Boolean(profile.teamId)
 );
 const teamLinkTargetLabel = user.role === "staff" ? "staff code" : "player code";
 const teamLinkTitle = user.role === "staff" ? "Staff / Team link" : "Player / Team linking";
 const teamLinkDescription =
  user.playerType === "team" && teamName
   ? `Now активный team profile привязан к команде «${teamName}». You can relink it here with a new ${teamLinkTargetLabel}.`
   : hasLinkedTeamProfileForActiveRole
    ? `You already have a Team profile for role «${user.role === "staff" ? "staff" : "player"}». Enter a new ${teamLinkTargetLabel}, чтобы обновить привязку team.`
    : user.role === "staff"
     ? "Enter a staff code to add a separate Staff / Team profile and switch between contexts."
     : "Enter a player code to add a separate Player / Team profile and switch between Solo and Team.";
 const currentActiveProfile = availableProfiles.find((profile) => profile.key === user.activeProfileKey) || null;
 const hasMultipleProfiles = availableProfiles.length > 1;

 return (
  <div className="container mx-auto py-6 performance-page">
   <span className="performance-eyebrow">Identity Center</span>
   <h1 className="text-3xl font-bold mb-2 performance-title">User profile</h1>
   <p className="text-muted-foreground performance-subtitle mb-6">
    Manage personal data, permissions, and account settings.
   </p>
   
   <div
    className={cn(
     "grid grid-cols-1 gap-8",
     isTeamStaff ? "xl:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]" : "lg:grid-cols-2"
    )}
   >
    {/* Card с информацией о профиле */}
    <Card className="performance-hero">
     <CardHeader>
      <CardTitle>Profile information</CardTitle>
      <CardDescription>
       Your personal data
      </CardDescription>
     </CardHeader>
     <CardContent className="space-y-6">
      {/* Avatar пользователя */}
      <div className="flex flex-col items-center mb-6">
       <div className="relative group">
        <UserAvatar 
         user={user} 
         size="xl" 
         className="cursor-pointer"
         onClick={handleAvatarClick}
         key={`profile-avatar-${lastAvatarUpdate}`}
         forceUpdate={true}
        />
        <div 
         className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
         onClick={handleAvatarClick}
        >
         <Camera className="text-white" size={24} />
        </div>
        {isUploadingAvatar && (
         <div className="absolute inset-0 bg-black bg-opacity-70 rounded-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
         </div>
        )}
       </div>
       <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleAvatarChange}
       />
       <Button 
        variant="ghost" 
        size="sm" 
        className="mt-2 text-xs flex items-center gap-1"
        onClick={handleAvatarClick}
        disabled={isUploadingAvatar}
       >
        <Upload size={14} />
        Edit аватар
       </Button>
      </div>

      <div className="space-y-2">
       <Label>Name</Label>
       <div className="p-2 bg-muted rounded">{user.name}</div>
      </div>
      <div className="space-y-2">
       <Label>Email</Label>
       <div className="p-2 bg-muted rounded space-y-2">
        <div>{user.email}</div>
        <div className="text-xs text-muted-foreground">
         {user.emailVerified ? "Email confirmed" : "Email not confirmed yet"}
        </div>
       </div>
      </div>
      <div className="space-y-2">
       <Label>Role</Label>
       <div className="p-2 bg-muted rounded">
        {user.role === "player" ? "Player" : "Staff"}
       </div>
      </div>
      {user.playerType === "team" && (
       <div className="rounded-2xl border border-sky-400/25 bg-[linear-gradient(135deg,rgba(56,189,248,0.14),rgba(15,23,42,0.92))] p-5 shadow-[0_18px_40px_rgba(14,165,233,0.12)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
         <div className="flex items-start gap-4">
          {teamLogo ? (
           <img
            src={teamLogoUrl}
            alt={teamName}
            className="h-16 w-16 rounded-2xl border object-cover"
            style={{ borderColor: "rgba(125,211,252,0.18)" }}
           />
          ) : null}
          <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200/80">
           Current team
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">
           {teamName || "Team has not been assigned yet"}
          </p>
          <p className="mt-2 text-sm text-slate-300">
           {teamName
            ? user.role === "staff"
             ? "You work inside this team and manage its roster."
             : "Your profile is linked to this team."
            : user.role === "staff"
             ? "Create a team or join with a staff code to get started."
            : "The team will appear here after linking with a team code."}
          </p>
          </div>
         </div>
         <div className="inline-flex items-center rounded-full border border-sky-300/25 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-100">
          {user.role === "staff" ? "Staff / Team" : "Player / Team"}
         </div>
        </div>
       </div>
      )}
      <div className="space-y-2">
       <Label>Profile type</Label>
       <div className="p-2 bg-muted rounded">
        {user.playerType === "team" ? "Team" : "Solo"}
       </div>
      </div>

      <div className="space-y-2">
       <div className="flex items-center justify-between">
        <Label>FACEIT profile</Label>
        {!isEditingFaceit && (
         <Button
          variant="ghost"
          size="sm"
          onClick={() => {
           setFaceitUrl(currentFaceitUrl || '');
           setIsEditingFaceit(true);
          }}
         >
          <Pencil className="h-4 w-4 mr-1" />
          Edit
         </Button>
        )}
       </div>

       {isEditingFaceit ? (
        <div className="space-y-2">
         <Input
          placeholder="https://www.faceit.com/en/players/your-nickname"
          value={faceitUrl}
          onChange={(e) => setFaceitUrl(e.target.value)}
          disabled={isSavingFaceit}
          autoFocus
         />
         <div className="flex gap-2">
          <Button
           size="sm"
           onClick={handleSaveFaceitUrl}
           disabled={isSavingFaceit}
          >
           {isSavingFaceit ? (
            <span className="flex items-center gap-1">
             <span className="animate-spin rounded-full h-3 w-3 border-t-2 border-white" />
             Saving...
            </span>
           ) : (
            <span className="flex items-center gap-1">
             <Check className="h-4 w-4" />
             Save
            </span>
           )}
          </Button>
          <Button
           variant="outline"
           size="sm"
           onClick={() => setIsEditingFaceit(false)}
           disabled={isSavingFaceit}
          >
           <X className="h-4 w-4 mr-1" />
           Cancel
          </Button>
         </div>
        </div>
       ) : (
        <div className="p-2 bg-muted rounded text-sm break-all">
         {loadingFaceit ? (
          <span className="text-muted-foreground">Loading...</span>
         ) : currentFaceitUrl ? (
          <a
           href={currentFaceitUrl}
           target="_blank"
           rel="noopener noreferrer"
           className="text-primary hover:underline"
          >
           {currentFaceitUrl}
          </a>
         ) : (
          <span className="text-muted-foreground">Not connected yet</span>
         )}
        </div>
       )}
      </div>

      <div className="border-t pt-6">
       <div className="mb-4">
        <h2 className="text-lg font-semibold">Security</h2>
        <p className="text-sm text-muted-foreground">
         Email verification and account password settings.
        </p>
       </div>

       <div className="space-y-6">
        <div className="space-y-3">
         <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
          <div>
           <p className="font-medium">Status email</p>
           <p className="text-sm text-muted-foreground">
            {user.emailVerified
             ? "Email is confirmed and the account is active."
             : "Email is not confirmed yet. Sign in may be limited until then."}
           </p>
          </div>
          {!user.emailVerified && (
           <Button
            variant="outline"
            onClick={handleResendVerificationEmail}
            disabled={isSendingVerificationEmail}
           >
            {isSendingVerificationEmail ? "Sending..." : "Send email"}
           </Button>
          )}
         </div>
        </div>

        <div className="space-y-4">
         <div>
          <p className="font-medium">Change password</p>
          <p className="text-sm text-muted-foreground">
           After changing the password, you will need to sign in again.
          </p>
         </div>

         <div className="space-y-2">
          <Label htmlFor="current-password">Current password</Label>
          <Input
           id="current-password"
           type="password"
           value={passwordForm.currentPassword}
           onChange={(event) => handlePasswordFieldChange("currentPassword", event.target.value)}
           autoComplete="current-password"
           disabled={isChangingPassword}
          />
         </div>

         <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
           id="new-password"
           type="password"
           value={passwordForm.newPassword}
           onChange={(event) => handlePasswordFieldChange("newPassword", event.target.value)}
           autoComplete="new-password"
           disabled={isChangingPassword}
          />
         </div>

         <div className="space-y-2">
          <Label htmlFor="confirm-new-password">Repeat new password</Label>
          <Input
           id="confirm-new-password"
           type="password"
           value={passwordForm.confirmPassword}
           onChange={(event) => handlePasswordFieldChange("confirmPassword", event.target.value)}
           autoComplete="new-password"
           disabled={isChangingPassword}
          />
         </div>

         <Button onClick={handleChangePassword} disabled={isChangingPassword}>
          {isChangingPassword ? "Saving..." : "Update password"}
         </Button>
        </div>
       </div>
      </div>

     </CardContent>
     <CardFooter>
      {/* Диалог подтверждения удаления аккаунта */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
       <DialogTrigger asChild>
        <Button variant="destructive">Delete account</Button>
       </DialogTrigger>
       <DialogContent>
        <DialogHeader>
         <DialogTitle>Are you sure?</DialogTitle>
         <DialogDescription>
          This operation will permanently delete your account and all related data.
         </DialogDescription>
        </DialogHeader>
        <DialogFooter>
         <Button
          variant="outline"
          onClick={() => handleDialogChange(false)}
         >
          Cancel
         </Button>
         <Button
          variant="destructive"
          onClick={handleDeleteAccount}
          disabled={isDeleting}
         >
          {isDeleting ? "Deleting..." : "Delete"}
         </Button>
        </DialogFooter>
       </DialogContent>
      </Dialog>
     </CardFooter>
    </Card>

    <div className="space-y-8">
     {isTeamStaff && (
      <Tabs
       value={staffProfileTab}
       onValueChange={(value) => setStaffProfileTab(value as "profile" | "team")}
       className="space-y-4"
      >
       <TabsList className="grid w-full grid-cols-2 bg-muted/40">
        <TabsTrigger value="profile">Profile and access</TabsTrigger>
        <TabsTrigger value="team">My team and invite codes</TabsTrigger>
       </TabsList>
      </Tabs>
     )}

     {(!isTeamStaff || staffProfileTab === "profile") && (
      <>
       <Card>
        <CardHeader>
         <CardTitle>Active profile</CardTitle>
         <CardDescription>
          {hasMultipleProfiles
           ? "One account can work in multiple contexts. Switching immediately changes available sections and permissions."
           : "This account currently has one available context. When additional profiles appear, switching will be available here."}
         </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
         {hasMultipleProfiles && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
           <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
             <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
              Now активен
             </p>
             <p className="mt-2 text-lg font-semibold">
              {currentActiveProfile?.label || "Current profile"}
             </p>
             <p className="mt-1 text-sm text-muted-foreground">
              {currentActiveProfile?.teamName
               ? `${currentActiveProfile.teamName} • ${currentActiveProfile.role === "staff" ? "staff" : "player"} / ${currentActiveProfile.playerType}`
               : "Switching below immediately changes visible sections, access, and work context."}
             </p>
            </div>
            <Badge className="w-fit">{availableProfiles.length} profiles</Badge>
           </div>
          </div>
         )}
         {availableProfiles.map((profile) => {
          const isActive = profile.key === user.activeProfileKey;
          return (
           <div
            key={profile.key}
            className={cn(
             "flex flex-col gap-3 rounded-2xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between",
             isActive
              ? "border-primary/35 bg-primary/5 shadow-[0_12px_30px_rgba(53,144,255,0.08)]"
              : "border-border/80 bg-background/40 hover:border-primary/20"
            )}
           >
            <div className="space-y-2">
             <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{profile.label}</p>
              {isActive && <Badge>Active</Badge>}
              {profile.teamId && <Badge variant="secondary">Team connected</Badge>}
             </div>
             <p className="text-sm text-muted-foreground">
              {profile.teamName ? `${profile.teamName} • ` : ""}
              {profile.role === "staff" ? "staff" : "player"} / {profile.playerType}
             </p>
             <p className="text-sm text-muted-foreground">
              {isActive
               ? "This context currently defines the available sections and actions in the system."
               : "You can switch safely without signing out."}
             </p>
            </div>
            {hasMultipleProfiles ? (
             <Button
              variant={isActive ? "secondary" : "outline"}
              className="sm:min-w-[140px]"
              onClick={() => {
               if (!isActive) {
                void switchProfile(profile.key);
               }
              }}
              disabled={isActive}
             >
              {isActive ? "Active" : "Switch"}
             </Button>
            ) : (
             <Badge className="w-fit">Current profile</Badge>
            )}
           </div>
          );
         })}
        </CardContent>
       </Card>

     <Card>
      <CardHeader>
       <CardTitle>{teamLinkTitle}</CardTitle>
       <CardDescription>
        {teamLinkDescription}
       </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
       <Alert className="border-border/80 bg-muted/20">
        <Link2 className="h-4 w-4" />
        <AlertTitle>
         {user.playerType === "team" && teamName ? "Profile already linked to a team" : "A valid team code is required"}
        </AlertTitle>
        <AlertDescription>
         {user.playerType === "team" && teamName
          ? `Now активна команда «${teamName}». The new code will update the link only after validation and confirmation if needed.`
          : `Используйте ${teamLinkTargetLabel}, issued by the team owner. The account workflow will not change; only a new team context will be added.`}
        </AlertDescription>
       </Alert>
       <form
        className="space-y-4"
        onSubmit={(event) => {
         event.preventDefault();
         void handleTeamLinkSubmit();
        }}
       >
        <div className="space-y-2">
         <Label htmlFor="team-profile-code">Team code</Label>
         <div className="flex flex-col gap-3 sm:flex-row">
          <Input
           id="team-profile-code"
           placeholder={user.role === "staff" ? "Enter team staff code" : "Enter team player code"}
           value={teamCode}
           onChange={(event) => setTeamCode(event.target.value)}
           disabled={isLinkingTeamProfile}
           aria-describedby="team-profile-code-hint"
          />
          <Button type="submit" disabled={isLinkingTeamProfile} className="sm:min-w-[240px]">
           {isLinkingTeamProfile ? "Checking code..." : user.playerType === "team" ? "Update Team profile link" : "Add Team profile"}
          </Button>
         </div>
         <p id="team-profile-code-hint" className="text-sm text-muted-foreground">
          After validation, the system will either add the team profile immediately or ask you to confirm relinking.
         </p>
        </div>
       </form>
       {teamSwitchSuggestion && teamSwitchSuggestion.profileKey !== user.activeProfileKey && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4" aria-live="polite">
         <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-400" />
          <div>
           <p className="font-medium text-emerald-100">Team profile ready</p>
           <p className="mt-1 text-sm text-emerald-50/80">
            You can switch to the new context immediately and open team sections without signing in again.
           </p>
          </div>
         </div>
         <Button
          className="mt-4"
          variant="outline"
          onClick={() => {
           void switchProfile(teamSwitchSuggestion.profileKey);
           setTeamSwitchSuggestion(null);
          }}
         >
          {teamSwitchSuggestion.label}
         </Button>
        </div>
       )}
      </CardContent>
     </Card>

     {!hasPlayerProfile && (
      <Card>
       <CardHeader>
        <CardTitle>Add player profile</CardTitle>
        <CardDescription>
         You can keep one login and add a second player context. For the Team profile, the team will be taken from the current staff/team account.
        </CardDescription>
       </CardHeader>
       <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
         <button
          type="button"
          className={cn(
           "rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
           playerProfileForm.playerType === "team"
            ? "border-primary/35 bg-primary/5"
            : "border-border/80 bg-background/40 hover:border-primary/20",
           !canCreateTeamPlayerProfile && "cursor-not-allowed opacity-60"
          )}
          onClick={() => setPlayerProfileForm((prev) => ({ ...prev, playerType: "team" }))}
          disabled={!canCreateTeamPlayerProfile}
         >
          <p className="font-medium">Player / Team</p>
          <p className="mt-1 text-sm text-muted-foreground">
           Team game context linked to the current staff/team group.
          </p>
         </button>
         <button
          type="button"
          className={cn(
           "rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
           playerProfileForm.playerType === "solo"
            ? "border-primary/35 bg-primary/5"
            : "border-border/80 bg-background/40 hover:border-primary/20"
          )}
          onClick={() => setPlayerProfileForm((prev) => ({ ...prev, playerType: "solo" }))}
         >
          <p className="font-medium">Player / Solo</p>
          <p className="mt-1 text-sm text-muted-foreground">
           Separate personal game context without a team link.
          </p>
         </button>
        </div>
        <form
         className="space-y-4"
         onSubmit={(event) => {
          event.preventDefault();
          void handleCreatePlayerProfile();
         }}
        >
         <div className="space-y-2">
          <Label htmlFor="player-profile-faceit">FACEIT link</Label>
          <Input
           id="player-profile-faceit"
           placeholder="https://www.faceit.com/..."
           value={playerProfileForm.faceitUrl}
           onChange={(event) => setPlayerProfileForm((prev) => ({ ...prev, faceitUrl: event.target.value }))}
           disabled={isCreatingPlayerProfile}
          />
         </div>
         <div className="space-y-2">
          <Label htmlFor="player-profile-nickname">Nickname</Label>
          <Input
           id="player-profile-nickname"
           placeholder="Optional"
           value={playerProfileForm.nickname}
           onChange={(event) => setPlayerProfileForm((prev) => ({ ...prev, nickname: event.target.value }))}
           disabled={isCreatingPlayerProfile}
          />
         </div>
         <Button type="submit" disabled={isCreatingPlayerProfile} className="sm:min-w-[220px]">
          {isCreatingPlayerProfile ? "Adding..." : "Add player profile"}
         </Button>
        </form>
        {!canCreateTeamPlayerProfile && (
         <Alert className="border-border/80 bg-muted/20">
          <UserPlus2 className="h-4 w-4" />
          <AlertTitle>Connect a team first</AlertTitle>
          <AlertDescription>
           Team profile игрока станет доступен после привязки staff/team к конкретной команде.
          </AlertDescription>
         </Alert>
        )}
       </CardContent>
      </Card>
     )}

     <Dialog
      open={Boolean(pendingTeamRelink)}
      onOpenChange={(open) => {
       if (!open) {
        setPendingTeamRelink(null);
       }
      }}
     >
      <DialogContent>
       <DialogHeader>
        <DialogTitle>Confirm Team profile relinking</DialogTitle>
        <DialogDescription>
         {pendingTeamRelink
          ? `The profile is currently linked to team «${pendingTeamRelink.currentTeam.name || "Untitled"}». After confirmation, it will be relinked to «${pendingTeamRelink.nextTeam.name}».`
          : "Confirm the action."}
        </DialogDescription>
       </DialogHeader>
       {pendingTeamRelink && (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
         <div className="rounded-2xl border border-border/80 bg-muted/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
           Now
          </p>
          <p className="mt-2 font-medium">{pendingTeamRelink.currentTeam.name || "Untitled"}</p>
         </div>
         <div className="flex items-center justify-center text-muted-foreground">
          <ArrowRightLeft className="h-5 w-5" />
         </div>
         <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
           Will be connected
          </p>
          <p className="mt-2 font-medium">{pendingTeamRelink.nextTeam.name}</p>
         </div>
        </div>
       )}
       <DialogFooter>
        <Button
         variant="outline"
         onClick={() => setPendingTeamRelink(null)}
         disabled={isLinkingTeamProfile}
        >
         Cancel
        </Button>
        <Button onClick={() => void handleConfirmTeamRelink()} disabled={isLinkingTeamProfile}>
         {isLinkingTeamProfile ? "Relinking..." : "Confirm relink"}
        </Button>
       </DialogFooter>
      </DialogContent>
     </Dialog>

     {user.role !== "staff" && (
      <Card>
       <CardHeader>
        <CardTitle>Statistics</CardTitle>
        <CardDescription>
         Your activity summary
        </CardDescription>
       </CardHeader>
       <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded">
         <p className="text-sm">Подробная статистика доступна в разделах Statistics, Mood and Energy, and Tests.</p>
        </div>
       </CardContent>
      </Card>
     )}

     {user.role === "staff" && !isTeamStaff && (
      <Card>
       <CardHeader>
        <CardTitle>Permissions and access</CardTitle>
        <CardDescription>
         Manage staff privileges
        </CardDescription>
       </CardHeader>
       <CardContent>
        <StaffPrivilegeUpgrade
         onUpgradeSuccess={refreshUser}
        />
       </CardContent>
      </Card>
     )}
      </>
     )}

     {isTeamStaff && staffProfileTab === "team" && <TeamManagement />}
    </div>
   </div>
  </div>
 );
};

export default Profile;

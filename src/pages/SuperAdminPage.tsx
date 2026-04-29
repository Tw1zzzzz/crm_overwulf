import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
 getAdminAuditLog,
 getAdminDashboard,
 getAdminTeams,
 getAdminUsers,
 getPlans,
 grantAdminTeamSubscription,
 grantAdminUserSubscription,
 sendAdminPasswordReset,
 updateAdminUserStatus,
 type AdminAuditLogEntry,
 type AdminDashboardResponse,
 type AdminTeamRow,
 type AdminUserRow,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import type { Plan } from "@/types";

type DashboardWindow = 7 | 30 | 90;

interface GrantTargetState {
 type: "user" | "team";
 id: string;
 name: string;
}

const getErrorMessage = (error: unknown, fallback: string) =>
 error instanceof Error ? error.message : fallback;

const formatDateTime = (value?: string | Date | null) => {
 if (!value) {
  return "—";
 }

 return new Date(value).toLocaleString("en-US", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
 });
};

const formatDate = (value?: string | Date | null) => {
 if (!value) {
  return "—";
 }

 return new Date(value).toLocaleDateString("en-US");
};

const actionLabels: Record<string, string> = {
 grant_superadmin: "Superadmin grant",
 grant_user_subscription: "Grant plan to user",
 grant_team_subscription: "Grant plan to team",
 send_password_reset: "Password reset",
 block_user: "User blocked",
 unblock_user: "User unblocked",
};

const OverviewCard = ({ title, value, hint }: { title: string; value: number; hint?: string }) => (
 <Card>
  <CardHeader className="pb-2">
   <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
  </CardHeader>
  <CardContent>
   <div className="text-3xl font-semibold">{value}</div>
   {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
  </CardContent>
 </Card>
);

const SuperAdminPage = () => {
 const [dashboardWindow, setDashboardWindow] = useState<DashboardWindow>(30);
 const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
 const [users, setUsers] = useState<AdminUserRow[]>([]);
 const [teams, setTeams] = useState<AdminTeamRow[]>([]);
 const [auditEntries, setAuditEntries] = useState<AdminAuditLogEntry[]>([]);
 const [plans, setPlans] = useState<Plan[]>([]);
 const [loading, setLoading] = useState(true);
 const [usersLoading, setUsersLoading] = useState(true);
 const [teamsLoading, setTeamsLoading] = useState(true);
 const [auditLoading, setAuditLoading] = useState(true);
 const [actionLoading, setActionLoading] = useState(false);
 const [grantTarget, setGrantTarget] = useState<GrantTargetState | null>(null);
 const [selectedPlanId, setSelectedPlanId] = useState("");
 const [statusReason, setStatusReason] = useState("");
 const [filters, setFilters] = useState({
  search: "",
  role: "all",
  isActive: "all",
 });

 const loadDashboard = async (days: DashboardWindow) => {
  const response = await getAdminDashboard(days);
  setDashboard(response.data);
 };

 const loadUsers = async () => {
  setUsersLoading(true);
  try {
   const response = await getAdminUsers({
    search: filters.search || undefined,
    role: filters.role === "all" ? "" : (filters.role as "player" | "staff"),
    isActive:
     filters.isActive === "all" ? "" : (filters.isActive as "true" | "false"),
   });
   setUsers(response.data.users);
  } finally {
   setUsersLoading(false);
  }
 };

 const loadTeams = async () => {
  setTeamsLoading(true);
  try {
   const response = await getAdminTeams();
   setTeams(response.data.teams);
  } finally {
   setTeamsLoading(false);
  }
 };

 const loadAudit = async () => {
  setAuditLoading(true);
  try {
   const response = await getAdminAuditLog(40);
   setAuditEntries(response.data.entries);
  } finally {
   setAuditLoading(false);
  }
 };

 const loadPlans = async () => {
  const nextPlans = await getPlans();
  setPlans(nextPlans);
  if (!selectedPlanId && nextPlans[0]?.id) {
   setSelectedPlanId(nextPlans[0].id);
  }
 };

 const loadInitialData = async () => {
  setLoading(true);
  try {
   await Promise.all([
    loadDashboard(dashboardWindow),
    loadUsers(),
    loadTeams(),
    loadAudit(),
    loadPlans(),
   ]);
  } catch (error: unknown) {
   toast.error(getErrorMessage(error, "Failed to load CRM admin"));
  } finally {
   setLoading(false);
  }
 };

 useEffect(() => {
  void (async () => {
   setLoading(true);
   try {
    const [dashboardResponse, usersResponse, teamsResponse, auditResponse, nextPlans] =
     await Promise.all([
      getAdminDashboard(30),
      getAdminUsers(),
      getAdminTeams(),
      getAdminAuditLog(40),
      getPlans(),
     ]);

    setDashboard(dashboardResponse.data);
    setUsers(usersResponse.data.users);
    setTeams(teamsResponse.data.teams);
    setAuditEntries(auditResponse.data.entries);
    setPlans(nextPlans);

    if (nextPlans[0]?.id) {
     setSelectedPlanId(nextPlans[0].id);
    }
   } catch (error: unknown) {
    toast.error(getErrorMessage(error, "Failed to load CRM admin"));
   } finally {
    setLoading(false);
    setUsersLoading(false);
    setTeamsLoading(false);
    setAuditLoading(false);
   }
  })();
 }, []);

 useEffect(() => {
  void loadDashboard(dashboardWindow).catch((error: unknown) => {
   toast.error(getErrorMessage(error, "Failed to update registration chart"));
  });
 }, [dashboardWindow]);

 const refreshAll = async () => {
  await loadInitialData();
  toast.success("Admin data updated");
 };

 const openGrantDialog = (target: GrantTargetState) => {
  setGrantTarget(target);
  if (!selectedPlanId && plans[0]?.id) {
   setSelectedPlanId(plans[0].id);
  }
 };

 const closeGrantDialog = () => {
  setGrantTarget(null);
 };

 const handleGrant = async () => {
  if (!grantTarget || !selectedPlanId) {
   toast.error("Choose a plan to grant");
   return;
  }

  setActionLoading(true);
  try {
   if (grantTarget.type === "user") {
    await grantAdminUserSubscription(grantTarget.id, selectedPlanId);
   } else {
    await grantAdminTeamSubscription(grantTarget.id, selectedPlanId);
   }

   toast.success(`Plan granted: ${grantTarget.name}`);
   closeGrantDialog();
   await Promise.all([loadUsers(), loadTeams(), loadAudit()]);
  } catch (error: unknown) {
   toast.error(getErrorMessage(error, "Failed to grant plan"));
  } finally {
   setActionLoading(false);
  }
 };

 const handlePasswordReset = async (user: AdminUserRow) => {
  setActionLoading(true);
  try {
   await sendAdminPasswordReset(user.id);
   toast.success(`Reset email sent: ${user.email}`);
   await loadAudit();
  } catch (error: unknown) {
   toast.error(getErrorMessage(error, "Failed to send email"));
  } finally {
   setActionLoading(false);
  }
 };

 const handleStatusChange = async (user: AdminUserRow, nextIsActive: boolean) => {
  const confirmation = window.confirm(
   nextIsActive
    ? `Unblock пользователя ${user.name}?`
    : `Block пользователя ${user.name}?`
  );

  if (!confirmation) {
   return;
  }

  setActionLoading(true);
  try {
   await updateAdminUserStatus(user.id, {
    isActive: nextIsActive,
    reason: nextIsActive ? undefined : statusReason || "Blocked by superadmin",
   });
   setStatusReason("");
   toast.success(nextIsActive ? "User unblocked" : "User blocked");
   await Promise.all([loadUsers(), loadDashboard(dashboardWindow), loadAudit()]);
  } catch (error: unknown) {
   toast.error(getErrorMessage(error, "Failed to update user status"));
  } finally {
   setActionLoading(false);
  }
 };

 const maxRegistrations = dashboard?.registrationSeries.reduce(
  (max, item) => Math.max(max, item.registrations),
  0
 ) || 1;

 if (loading && !dashboard) {
  return <div className="py-10 text-sm text-muted-foreground">Loading CRM admin...</div>;
 }

 return (
  <div className="space-y-6">
   <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
    <div>
     <h1 className="text-3xl font-semibold tracking-tight">CRM admin</h1>
     <p className="text-sm text-muted-foreground">
      Manage access, accounts, and registration analytics.
     </p>
    </div>
    <div className="flex gap-3">
     <Input
      value={statusReason}
      onChange={(event) => setStatusReason(event.target.value)}
      placeholder="Default lock reason"
      className="w-full md:w-80"
     />
     <Button onClick={() => void refreshAll()} disabled={loading || actionLoading}>
      Update
     </Button>
    </div>
   </div>

   <Tabs defaultValue="overview" className="space-y-4">
    <TabsList className="grid w-full grid-cols-4">
     <TabsTrigger value="overview">Overview</TabsTrigger>
     <TabsTrigger value="users">Users</TabsTrigger>
     <TabsTrigger value="teams">Teams</TabsTrigger>
     <TabsTrigger value="audit">Action log</TabsTrigger>
    </TabsList>

    <TabsContent value="overview" className="space-y-4">
     <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <OverviewCard title="Total users" value={dashboard?.totals.users || 0} />
      <OverviewCard title="Playerи" value={dashboard?.totals.players || 0} />
      <OverviewCard title="Staff" value={dashboard?.totals.staff || 0} />
      <OverviewCard title="Active аккаунты" value={dashboard?.totals.active || 0} hint={`Blockedо: ${dashboard?.totals.blocked || 0}`} />
      <OverviewCard title="New in 7 days" value={dashboard?.totals.newUsers7d || 0} />
      <OverviewCard title="New in 30 days" value={dashboard?.totals.newUsers30d || 0} />
      <OverviewCard title="Player / Solo" value={dashboard?.playerTypeBreakdown.solo || 0} />
      <OverviewCard title="Player / Team" value={dashboard?.playerTypeBreakdown.team || 0} />
     </div>

     <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
       <CardTitle>Registration analytics</CardTitle>
       <Select
        value={String(dashboardWindow)}
        onValueChange={(value) => setDashboardWindow(Number(value) as DashboardWindow)}
       >
        <SelectTrigger className="w-[180px]">
         <SelectValue placeholder="Period" />
        </SelectTrigger>
        <SelectContent>
         <SelectItem value="7">Last 7 days</SelectItem>
         <SelectItem value="30">Last 30 days</SelectItem>
         <SelectItem value="90">Last 90 days</SelectItem>
        </SelectContent>
       </Select>
      </CardHeader>
      <CardContent className="space-y-3">
       {dashboard?.registrationSeries.map((point) => (
        <div key={point.date} className="space-y-1">
         <div className="flex items-center justify-between text-sm">
          <span>{formatDate(point.date)}</span>
          <span className="text-muted-foreground">{point.registrations}</span>
         </div>
         <div className="h-2 rounded-full bg-muted">
          <div
           className="h-2 rounded-full bg-primary transition-all"
           style={{ width: `${(point.registrations / maxRegistrations) * 100}%` }}
          />
         </div>
        </div>
       ))}
      </CardContent>
     </Card>

     <Card>
      <CardHeader>
       <CardTitle>Recent registrations</CardTitle>
      </CardHeader>
      <CardContent>
       <Table>
        <TableHeader>
         <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
         </TableRow>
        </TableHeader>
        <TableBody>
         {dashboard?.recentRegistrations.map((user) => (
          <TableRow key={user.id}>
           <TableCell>
            <div className="font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
           </TableCell>
           <TableCell>
            {user.role}
            {user.playerType ? ` / ${user.playerType}` : ""}
           </TableCell>
           <TableCell>
            <Badge variant={user.isActive ? "default" : "secondary"}>
             {user.isActive ? "Active" : "Blocked"}
            </Badge>
           </TableCell>
           <TableCell>{formatDateTime(user.createdAt)}</TableCell>
          </TableRow>
         ))}
        </TableBody>
       </Table>
      </CardContent>
     </Card>
    </TabsContent>

    <TabsContent value="users" className="space-y-4">
     <Card>
      <CardHeader className="gap-4">
       <CardTitle>User filters</CardTitle>
       <div className="grid gap-3 md:grid-cols-4">
        <Input
         value={filters.search}
         onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
         placeholder="Search by name or email"
        />
        <Select value={filters.role} onValueChange={(value) => setFilters((prev) => ({ ...prev, role: value }))}>
         <SelectTrigger>
          <SelectValue placeholder="Role" />
         </SelectTrigger>
         <SelectContent>
          <SelectItem value="all">All roles</SelectItem>
          <SelectItem value="player">player</SelectItem>
          <SelectItem value="staff">staff</SelectItem>
         </SelectContent>
        </Select>
        <Select value={filters.isActive} onValueChange={(value) => setFilters((prev) => ({ ...prev, isActive: value }))}>
         <SelectTrigger>
          <SelectValue placeholder="Status" />
         </SelectTrigger>
         <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="true">Active</SelectItem>
          <SelectItem value="false">Blockedные</SelectItem>
         </SelectContent>
        </Select>
        <Button onClick={() => void loadUsers()} disabled={usersLoading}>
         Apply
        </Button>
       </div>
      </CardHeader>
      <CardContent>
       {usersLoading ? (
        <div className="py-6 text-sm text-muted-foreground">Loading users...</div>
       ) : (
        <Table>
         <TableHeader>
          <TableRow>
           <TableHead>User</TableHead>
           <TableHead>Role</TableHead>
           <TableHead>Plan</TableHead>
           <TableHead>Status</TableHead>
           <TableHead>Actions</TableHead>
          </TableRow>
         </TableHeader>
         <TableBody>
          {users.map((user) => (
           <TableRow key={user.id}>
            <TableCell>
             <div className="font-medium">{user.name}</div>
             <div className="text-xs text-muted-foreground">{user.email}</div>
             <div className="text-xs text-muted-foreground">
              Created: {formatDateTime(user.createdAt)}
             </div>
            </TableCell>
            <TableCell>
             <div>{user.role}{user.playerType ? ` / ${user.playerType}` : ""}</div>
             {user.teamName ? <div className="text-xs text-muted-foreground">{user.teamName}</div> : null}
             {user.isSuperAdmin ? <Badge className="mt-2">superadmin</Badge> : null}
            </TableCell>
            <TableCell>
             <div className="font-medium">{user.subscription?.planName || "No plan"}</div>
             <div className="text-xs text-muted-foreground">
              To: {formatDate(user.subscription?.expiresAt)}
             </div>
            </TableCell>
            <TableCell>
             <Badge variant={user.isActive ? "default" : "secondary"}>
              {user.isActive ? "Active" : "Blocked"}
             </Badge>
             {!user.isActive && user.deactivatedReason ? (
              <div className="mt-2 max-w-xs text-xs text-muted-foreground">{user.deactivatedReason}</div>
             ) : null}
            </TableCell>
            <TableCell>
             <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => openGrantDialog({ type: "user", id: user.id, name: user.name })}>
               Grant plan
              </Button>
              <Button size="sm" variant="outline" onClick={() => void handlePasswordReset(user)} disabled={actionLoading}>
               Reset пароль
              </Button>
              <Button
               size="sm"
               variant={user.isActive ? "destructive" : "default"}
               onClick={() => void handleStatusChange(user, !user.isActive)}
               disabled={actionLoading}
              >
               {user.isActive ? "Block" : "Unblock"}
              </Button>
             </div>
            </TableCell>
           </TableRow>
          ))}
         </TableBody>
        </Table>
       )}
      </CardContent>
     </Card>
    </TabsContent>

    <TabsContent value="teams" className="space-y-4">
     <Card>
      <CardHeader>
       <CardTitle>Teams</CardTitle>
      </CardHeader>
      <CardContent>
       {teamsLoading ? (
        <div className="py-6 text-sm text-muted-foreground">Loading teams...</div>
       ) : (
        <Table>
         <TableHeader>
          <TableRow>
           <TableHead>Team</TableHead>
           <TableHead>Owner</TableHead>
           <TableHead>Roster</TableHead>
           <TableHead>Actions</TableHead>
          </TableRow>
         </TableHeader>
         <TableBody>
          {teams.map((team) => (
           <TableRow key={team.id}>
            <TableCell>
             <div className="font-medium">{team.name}</div>
             <div className="text-xs text-muted-foreground">
              Created: {formatDateTime(team.createdAt)}
             </div>
            </TableCell>
            <TableCell>
             {team.owner ? (
              <>
               <div className="font-medium">{team.owner.name}</div>
               <div className="text-xs text-muted-foreground">{team.owner.email}</div>
              </>
             ) : (
              "—"
             )}
            </TableCell>
            <TableCell>
             <div>Players: {team.playerCount}/{team.playerLimit}</div>
             <div className="text-xs text-muted-foreground">Staff: {team.staffCount}</div>
            </TableCell>
            <TableCell>
             <Button size="sm" variant="outline" onClick={() => openGrantDialog({ type: "team", id: team.id, name: team.name })}>
              Grant plan команде
             </Button>
            </TableCell>
           </TableRow>
          ))}
         </TableBody>
        </Table>
       )}
      </CardContent>
     </Card>
    </TabsContent>

    <TabsContent value="audit" className="space-y-4">
     <Card>
      <CardHeader className="flex flex-row items-center justify-between">
       <CardTitle>Action log</CardTitle>
       <Button variant="outline" onClick={() => void loadAudit()} disabled={auditLoading}>
        Update журнал
       </Button>
      </CardHeader>
      <CardContent>
       {auditLoading ? (
        <div className="py-6 text-sm text-muted-foreground">Loading log...</div>
       ) : (
        <Table>
         <TableHeader>
          <TableRow>
           <TableHead>Action</TableHead>
           <TableHead>Actor</TableHead>
           <TableHead>Target</TableHead>
           <TableHead>Date</TableHead>
          </TableRow>
         </TableHeader>
         <TableBody>
          {auditEntries.map((entry) => (
           <TableRow key={entry.id}>
            <TableCell>
             <div className="font-medium">{actionLabels[entry.action] || entry.action}</div>
             {Object.keys(entry.meta || {}).length > 0 ? (
              <div className="mt-1 text-xs text-muted-foreground">
               {Object.entries(entry.meta)
                .map(([key, value]) => `${key}: ${String(value)}`)
                .join(" · ")}
              </div>
             ) : null}
            </TableCell>
            <TableCell>
             {entry.actor ? (
              <>
               <div className="font-medium">{entry.actor.name}</div>
               <div className="text-xs text-muted-foreground">{entry.actor.email}</div>
              </>
             ) : (
              "CLI / system"
             )}
            </TableCell>
            <TableCell>
             {entry.targetUser ? (
              <>
               <div className="font-medium">{entry.targetUser.name}</div>
               <div className="text-xs text-muted-foreground">{entry.targetUser.email}</div>
              </>
             ) : entry.targetTeam ? (
              <div className="font-medium">{entry.targetTeam.name}</div>
             ) : (
              "—"
             )}
            </TableCell>
            <TableCell>{formatDateTime(entry.createdAt)}</TableCell>
           </TableRow>
          ))}
         </TableBody>
        </Table>
       )}
      </CardContent>
     </Card>
    </TabsContent>
   </Tabs>

   <Dialog open={Boolean(grantTarget)} onOpenChange={(open) => (!open ? closeGrantDialog() : null)}>
    <DialogContent>
     <DialogHeader>
      <DialogTitle>Plan grant</DialogTitle>
      <DialogDescription>
       {grantTarget
        ? `Choose plan для ${grantTarget.type === "user" ? "пользователя" : "team"} ${grantTarget.name}.`
        : "Choose plan."}
      </DialogDescription>
     </DialogHeader>
     <div className="space-y-3">
      <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
       <SelectTrigger>
        <SelectValue placeholder="Choose plan" />
       </SelectTrigger>
       <SelectContent>
        {plans.map((plan) => (
         <SelectItem key={plan.id} value={plan.id}>
          {plan.name} · {plan.periodDays} дн.
         </SelectItem>
        ))}
       </SelectContent>
      </Select>
     </div>
     <DialogFooter>
      <Button variant="outline" onClick={closeGrantDialog}>
       Cancel
      </Button>
      <Button onClick={() => void handleGrant()} disabled={actionLoading || !selectedPlanId}>
       Grant plan
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </div>
 );
};

export default SuperAdminPage;

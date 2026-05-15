"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Archive,
  Copy,
  Edit3,
  MailPlus,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  UserCog,
  Users
} from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { ErrorState } from "@/components/data-display/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { SideDrawer } from "@/components/ui/side-drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useCurrentTenant } from "@/hooks/use-current-tenant";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import {
  useArchiveRoleMutation,
  useCancelTenantInvitationMutation,
  useCreateRoleMutation,
  useCreateTenantInvitationMutation,
  useDisableTenantUserMutation,
  useGetRoleQuery,
  useListPermissionsQuery,
  useListRolesQuery,
  useListTenantInvitationsQuery,
  useListTenantUsersQuery,
  useReactivateRoleMutation,
  useReactivateTenantUserMutation,
  useResendTenantInvitationMutation,
  useUpdateRoleMutation,
  useUpdateRolePermissionsMutation,
  useUpdateTenantUserRolesMutation
} from "../access-api";
import { accessPermissions, hasAnyAccessPermission } from "../access-permissions";
import { invitationFormSchema, roleFormSchema, userRolesFormSchema } from "../access-schema";
import type {
  AccessPermission,
  AccessRoleSummary,
  TenantInvitation,
  TenantUser
} from "../access-types";
import {
  canCancelInvitation,
  canResendInvitation,
  formatAccessDate,
  getInvitationDisplayStatus,
  groupPermissionsByModule,
  maxInvitationResends,
  roleKeyFromName
} from "../access-utils";

type AccessTab = "users" | "roles" | "invitations";

const tabs: readonly { id: AccessTab; label: string; permissions: readonly string[] }[] = [
  { id: "users", label: "Users", permissions: accessPermissions.viewUsers },
  { id: "roles", label: "Roles", permissions: accessPermissions.viewRoles },
  { id: "invitations", label: "Invitations", permissions: accessPermissions.viewInvitations }
];

export function AccessSettingsPage() {
  const tenant = useCurrentTenant();
  const visibleTabs = tabs.filter((tab) => hasAnyAccessPermission(tenant.permissions, tab.permissions));
  const [activeTab, setActiveTab] = useState<AccessTab>(visibleTabs[0]?.id ?? "users");

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id ?? "users");
    }
  }, [activeTab, visibleTabs]);

  if (!hasAnyAccessPermission(tenant.permissions, accessPermissions.viewAccess)) {
    return (
      <>
        <PageHeader
          breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Access" }]}
          title="Access"
          description="Manage tenant users, roles, permissions, and invitations."
        />
        <ErrorState
          title="Access is not available"
          description="Your current tenant permissions do not allow viewing access settings."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Settings", href: "/settings" }, { label: "Access" }]}
        title="Access"
        description="Manage tenant users, roles, permissions, and invitations."
      />

      <div className="flex flex-wrap gap-2 border-b border-border">
        {visibleTabs.map((tab) => (
          <button
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {activeTab === "users" ? <UsersPanel /> : null}
        {activeTab === "roles" ? <RolesPanel /> : null}
        {activeTab === "invitations" ? <InvitationsPanel /> : null}
      </div>
    </>
  );
}

function UsersPanel() {
  const tenant = useCurrentTenant();
  const canManage = hasAnyAccessPermission(tenant.permissions, accessPermissions.manageUsers);
  const {
    data: users,
    isError,
    isFetching
  } = useListTenantUsersQuery(tenant.tenantSlug, {
    skip: !tenant.tenantSlug || !hasAnyAccessPermission(tenant.permissions, accessPermissions.viewUsers)
  });
  const { data: roles, isFetching: rolesFetching } = useListRolesQuery(tenant.tenantSlug, {
    skip: !tenant.tenantSlug || !hasAnyAccessPermission(tenant.permissions, accessPermissions.viewRoles)
  });
  const [drawerUser, setDrawerUser] = useState<TenantUser | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    action: "disable" | "reactivate";
    user: TenantUser;
  } | null>(null);
  const [disableUser, disableState] = useDisableTenantUserMutation();
  const [reactivateUser, reactivateState] = useReactivateTenantUserMutation();
  const { showToast } = useToast();
  const userRows = users ?? [];
  const showInitialSkeleton = isFetching && !users;

  const onConfirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    try {
      if (pendingAction.action === "disable") {
        await disableUser({ tenantSlug: tenant.tenantSlug, membershipId: pendingAction.user.membershipId }).unwrap();
        showToast({ title: "User disabled", tone: "success" });
      } else {
        await reactivateUser({ tenantSlug: tenant.tenantSlug, membershipId: pendingAction.user.membershipId }).unwrap();
        showToast({ title: "User reactivated", tone: "success" });
      }
      setPendingAction(null);
    } catch {
      showToast({ title: "Action failed", description: "The user access could not be updated.", tone: "error" });
    }
  };

  return (
    <section className="rounded-lg border border-border bg-surface">
      <PanelHeader
        description="Review tenant memberships and update assigned roles."
        icon={<Users className="h-4 w-4" aria-hidden="true" />}
        title="Users"
      />
      {isError ? <ErrorState title="Users could not load" /> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-semibold">User</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Roles</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Joined</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {showInitialSkeleton ? <TableRowsSkeleton columns={6} /> : null}
            {!showInitialSkeleton && userRows.map((user) => (
              <tr key={user.membershipId}>
                <td className="px-5 py-4 font-medium">{user.name ?? "Unnamed user"}</td>
                <td className="px-5 py-4 text-muted-foreground">{user.email}</td>
                <td className="px-5 py-4">
                  <RoleBadges roles={user.roles} />
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={user.membershipStatus} />
                </td>
                <td className="px-5 py-4 text-muted-foreground">{formatAccessDate(user.joinedAt)}</td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    {canManage ? (
                      <>
                        <Button
                          aria-label={`Edit roles for ${user.email}`}
                          className="h-8 w-8 px-0"
                          onClick={() => setDrawerUser(user)}
                          type="button"
                          variant="secondary"
                        >
                          <UserCog className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        {user.membershipStatus === "DISABLED" ? (
                          <Button
                            aria-label={`Reactivate ${user.email}`}
                            className="h-8 w-8 px-0"
                            onClick={() => setPendingAction({ action: "reactivate", user })}
                            type="button"
                            variant="secondary"
                          >
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        ) : (
                          <Button
                            aria-label={`Disable ${user.email}`}
                            className="h-8 w-8 px-0"
                            onClick={() => setPendingAction({ action: "disable", user })}
                            type="button"
                            variant="secondary"
                          >
                            <Archive className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Read only</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isFetching && userRows.length === 0 ? <EmptyPanel title="No tenant users exist." /> : null}
      <UserRolesDrawer
        activeRoles={(roles ?? []).filter((role) => role.status === "ACTIVE")}
        isLoadingRoles={rolesFetching && !roles}
        onClose={() => setDrawerUser(null)}
        tenantSlug={tenant.tenantSlug}
        user={drawerUser}
      />
      <ConfirmDialog
        confirmLabel={pendingAction?.action === "disable" ? "Disable" : "Reactivate"}
        description={
          pendingAction?.action === "disable"
            ? `This will block ${pendingAction.user.email} from resolving this tenant until reactivated.`
            : `This will allow ${pendingAction?.user.email} to use this tenant again.`
        }
        isOpen={Boolean(pendingAction)}
        isWorking={disableState.isLoading || reactivateState.isLoading}
        onCancel={() => setPendingAction(null)}
        onConfirm={onConfirmAction}
        title={pendingAction?.action === "disable" ? "Disable user" : "Reactivate user"}
      />
    </section>
  );
}

function RolesPanel() {
  const tenant = useCurrentTenant();
  const {
    data: roles,
    isError,
    isFetching
  } = useListRolesQuery(tenant.tenantSlug, {
    skip: !tenant.tenantSlug || !hasAnyAccessPermission(tenant.permissions, accessPermissions.viewRoles)
  });
  const { data: permissions = [] } = useListPermissionsQuery(tenant.tenantSlug, {
    skip: !tenant.tenantSlug || !hasAnyAccessPermission(tenant.permissions, accessPermissions.viewRoles)
  });
  const [drawer, setDrawer] = useState<RoleDrawerState | null>(null);
  const [pendingRole, setPendingRole] = useState<{
    action: "archive" | "reactivate";
    role: AccessRoleSummary;
  } | null>(null);
  const [archiveRole, archiveState] = useArchiveRoleMutation();
  const [reactivateRole, reactivateState] = useReactivateRoleMutation();
  const { showToast } = useToast();
  const roleRows = roles ?? [];
  const showInitialSkeleton = isFetching && !roles;

  const onConfirmRoleAction = async () => {
    if (!pendingRole) {
      return;
    }

    try {
      if (pendingRole.action === "archive") {
        await archiveRole({ tenantSlug: tenant.tenantSlug, roleId: pendingRole.role.id }).unwrap();
        showToast({ title: "Role archived", tone: "success" });
      } else {
        await reactivateRole({ tenantSlug: tenant.tenantSlug, roleId: pendingRole.role.id }).unwrap();
        showToast({ title: "Role reactivated", tone: "success" });
      }
      setPendingRole(null);
    } catch {
      showToast({ title: "Action failed", description: "The role could not be updated.", tone: "error" });
    }
  };

  return (
    <section className="rounded-lg border border-border bg-surface">
      <PanelHeader
        action={
          <Button onClick={() => setDrawer({ mode: "create" })} type="button">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create role
          </Button>
        }
        description="Create tenant roles and control their permission sets."
        icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
        title="Roles"
      />
      {isError ? <ErrorState title="Roles could not load" /> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Permissions</th>
              <th className="px-5 py-3 font-semibold">Users</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {showInitialSkeleton ? <TableRowsSkeleton columns={6} /> : null}
            {!showInitialSkeleton && roleRows.map((role) => (
              <tr key={role.id}>
                <td className="px-5 py-4">
                  <p className="font-medium">{role.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{role.key}</p>
                </td>
                <td className="px-5 py-4">
                  <Badge tone={role.isSystemRole ? "blue" : "gray"}>{role.isSystemRole ? "System" : "Custom"}</Badge>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{role.permissionCount}</td>
                <td className="px-5 py-4 text-muted-foreground">{role.memberCount}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={role.status} />
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      aria-label={`Clone ${role.name}`}
                      className="h-8 w-8 px-0"
                      onClick={() => setDrawer({ mode: "clone", role })}
                      type="button"
                      variant="secondary"
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      aria-label={`Edit ${role.name}`}
                      className="h-8 w-8 px-0"
                      disabled={role.key === "owner" || role.isSystemRole}
                      onClick={() => setDrawer({ mode: "edit", role })}
                      type="button"
                      variant="secondary"
                    >
                      <Edit3 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    {role.status === "ARCHIVED" ? (
                      <Button
                        aria-label={`Reactivate ${role.name}`}
                        className="h-8 w-8 px-0"
                        disabled={role.isSystemRole}
                        onClick={() => setPendingRole({ action: "reactivate", role })}
                        type="button"
                        variant="secondary"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    ) : (
                      <Button
                        aria-label={`Archive ${role.name}`}
                        className="h-8 w-8 px-0"
                        disabled={role.key === "owner" || role.isSystemRole}
                        onClick={() => setPendingRole({ action: "archive", role })}
                        type="button"
                        variant="secondary"
                      >
                        <Archive className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isFetching && roleRows.length === 0 ? <EmptyPanel title="No roles exist." /> : null}
      <RoleDrawer
        drawer={drawer}
        onClose={() => setDrawer(null)}
        permissions={permissions}
        tenantSlug={tenant.tenantSlug}
      />
      <ConfirmDialog
        confirmLabel={pendingRole?.action === "archive" ? "Archive" : "Reactivate"}
        description={
          pendingRole?.action === "archive"
            ? `This will hide "${pendingRole.role.name}" from role selectors.`
            : `This will make "${pendingRole?.role.name}" available for assignments again.`
        }
        isOpen={Boolean(pendingRole)}
        isWorking={archiveState.isLoading || reactivateState.isLoading}
        onCancel={() => setPendingRole(null)}
        onConfirm={onConfirmRoleAction}
        title={pendingRole?.action === "archive" ? "Archive role" : "Reactivate role"}
      />
    </section>
  );
}

function InvitationsPanel() {
  const tenant = useCurrentTenant();
  const canManage = hasAnyAccessPermission(tenant.permissions, accessPermissions.manageInvitations);
  const {
    data: invitations,
    isError,
    isFetching
  } = useListTenantInvitationsQuery(tenant.tenantSlug, {
    skip: !tenant.tenantSlug || !hasAnyAccessPermission(tenant.permissions, accessPermissions.viewInvitations)
  });
  const { data: roles = [] } = useListRolesQuery(tenant.tenantSlug, {
    skip: !tenant.tenantSlug || !hasAnyAccessPermission(tenant.permissions, accessPermissions.viewRoles)
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    action: "resend" | "cancel";
    invitation: TenantInvitation;
  } | null>(null);
  const [resendInvitation, resendState] = useResendTenantInvitationMutation();
  const [cancelInvitation, cancelState] = useCancelTenantInvitationMutation();
  const { showToast } = useToast();
  const invitationRows = invitations ?? [];
  const showInitialSkeleton = isFetching && !invitations;

  const onConfirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    try {
      if (pendingAction.action === "resend") {
        await resendInvitation({
          tenantSlug: tenant.tenantSlug,
          invitationId: pendingAction.invitation.id
        }).unwrap();
        showToast({ title: "Invitation resent", tone: "success" });
      } else {
        await cancelInvitation({
          tenantSlug: tenant.tenantSlug,
          invitationId: pendingAction.invitation.id
        }).unwrap();
        showToast({ title: "Invitation cancelled", tone: "success" });
      }
      setPendingAction(null);
    } catch {
      showToast({ title: "Action failed", description: "The invitation could not be updated.", tone: "error" });
    }
  };

  return (
    <section className="rounded-lg border border-border bg-surface">
      <PanelHeader
        action={
          canManage ? (
            <Button onClick={() => setDrawerOpen(true)} type="button">
              <MailPlus className="h-4 w-4" aria-hidden="true" />
              Invite user
            </Button>
          ) : null
        }
        description="Invite new users and manage pending invitation lifecycle."
        icon={<MailPlus className="h-4 w-4" aria-hidden="true" />}
        title="Invitations"
      />
      {isError ? <ErrorState title="Invitations could not load" /> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Roles</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Expires</th>
              <th className="px-5 py-3 font-semibold">Resends</th>
              <th className="px-5 py-3 font-semibold">Last sent</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {showInitialSkeleton ? <TableRowsSkeleton columns={7} /> : null}
            {!showInitialSkeleton && invitationRows.map((invitation) => {
              const displayStatus = getInvitationDisplayStatus(invitation);

              return (
                <tr key={invitation.id}>
                  <td className="px-5 py-4 font-medium">{invitation.email}</td>
                  <td className="px-5 py-4">
                    <RoleBadges roles={invitation.roles} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={displayStatus} />
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{formatAccessDate(invitation.expiresAt)}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {invitation.resendCount}/{maxInvitationResends}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{formatAccessDate(invitation.lastSentAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      {canManage ? (
                        <>
                          <Button
                            aria-label={`Resend invitation to ${invitation.email}`}
                            className="h-8 w-8 px-0"
                            disabled={!canResendInvitation(invitation)}
                            onClick={() => setPendingAction({ action: "resend", invitation })}
                            type="button"
                            variant="secondary"
                          >
                            <Send className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            aria-label={`Cancel invitation for ${invitation.email}`}
                            className="h-8 w-8 px-0"
                            disabled={!canCancelInvitation(invitation)}
                            onClick={() => setPendingAction({ action: "cancel", invitation })}
                            type="button"
                            variant="secondary"
                          >
                            <Archive className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Read only</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!isFetching && invitationRows.length === 0 ? <EmptyPanel title="No invitations exist." /> : null}
      <InvitationDrawer
        activeRoles={roles.filter((role) => role.status === "ACTIVE")}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tenantSlug={tenant.tenantSlug}
      />
      <ConfirmDialog
        confirmLabel={pendingAction?.action === "resend" ? "Resend" : "Cancel"}
        description={
          pendingAction?.action === "resend"
            ? `This will rotate the invitation token and extend the expiration for ${pendingAction.invitation.email}.`
            : `This will cancel the pending invitation for ${pendingAction?.invitation.email}.`
        }
        isOpen={Boolean(pendingAction)}
        isWorking={resendState.isLoading || cancelState.isLoading}
        onCancel={() => setPendingAction(null)}
        onConfirm={onConfirmAction}
        title={pendingAction?.action === "resend" ? "Resend invitation" : "Cancel invitation"}
      />
    </section>
  );
}

type RoleDrawerState =
  | { readonly mode: "create"; readonly role?: undefined }
  | { readonly mode: "edit"; readonly role: AccessRoleSummary }
  | { readonly mode: "clone"; readonly role: AccessRoleSummary };

function RoleDrawer({
  drawer,
  onClose,
  permissions,
  tenantSlug
}: Readonly<{
  drawer: RoleDrawerState | null;
  onClose: () => void;
  permissions: readonly AccessPermission[];
  tenantSlug: string;
}>) {
  const roleId = drawer?.role?.id;
  const { data: roleDetail, isFetching: isRoleDetailFetching } = useGetRoleQuery(
    { tenantSlug, roleId: roleId ?? "" },
    { skip: !roleId || !tenantSlug }
  );
  const [createRole, createState] = useCreateRoleMutation();
  const [updateRole, updateState] = useUpdateRoleMutation();
  const [updateRolePermissions, updatePermissionsState] = useUpdateRolePermissionsMutation();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!drawer) {
      setName("");
      setKey("");
      setDescription("");
      setPermissionIds([]);
      setError(null);
      return;
    }

    if (drawer.mode === "create") {
      setName("");
      setKey("");
      setDescription("");
      setPermissionIds([]);
    } else {
      const suffix = drawer.mode === "clone" ? " Copy" : "";
      setName(`${drawer.role.name}${suffix}`);
      setKey(drawer.mode === "clone" ? roleKeyFromName(`${drawer.role.key}_copy`) : drawer.role.key);
      setDescription(drawer.role.description ?? "");
      setPermissionIds((roleDetail?.permissions ?? []).map((permission) => permission.id));
    }
    setError(null);
  }, [drawer, roleDetail]);

  const isSaving = createState.isLoading || updateState.isLoading || updatePermissionsState.isLoading;
  const title =
    drawer?.mode === "clone" ? "Clone role" : drawer?.mode === "edit" ? "Edit role" : "Create role";
  const showInitialSkeleton =
    Boolean(drawer && drawer.mode !== "create" && !roleDetail && isRoleDetailFetching);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = roleFormSchema.safeParse({
      name: name.trim(),
      key: key.trim() || undefined,
      description: description.trim() || undefined,
      permissionIds
    });

    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Review the role values.");
      return;
    }

    try {
      if (drawer?.mode === "edit") {
        await updateRole({
          tenantSlug,
          roleId: drawer.role.id,
          name: parsed.data.name,
          description: parsed.data.description
        }).unwrap();
        await updateRolePermissions({
          tenantSlug,
          roleId: drawer.role.id,
          permissionIds: parsed.data.permissionIds
        }).unwrap();
        showToast({ title: "Role updated", tone: "success" });
      } else {
        await createRole({
          tenantSlug,
          key: parsed.data.key,
          name: parsed.data.name,
          description: parsed.data.description,
          permissionIds: parsed.data.permissionIds
        }).unwrap();
        showToast({ title: drawer?.mode === "clone" ? "Role cloned" : "Role created", tone: "success" });
      }
      onClose();
    } catch {
      showToast({ title: "Save failed", description: "The role could not be saved.", tone: "error" });
    }
  };

  return (
    <SideDrawer
      description="Permissions apply tenant-wide and are combined with other assigned roles."
      footer={
        <>
          <Button disabled={isSaving} onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button disabled={isSaving || showInitialSkeleton} form="access-role-form" type="submit">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </>
      }
      isOpen={Boolean(drawer)}
      onClose={onClose}
      title={title}
    >
      {showInitialSkeleton ? (
        <RoleFormSkeleton />
      ) : (
        <form className="space-y-4" id="access-role-form" onSubmit={submit}>
          <label className="block">
            <span className="text-sm font-medium">Name</span>
            <Input className="mt-1" onChange={(event) => setName(event.target.value)} required value={name} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Key</span>
            <Input
              className="mt-1"
              disabled={drawer?.mode === "edit"}
              onChange={(event) => setKey(event.target.value)}
              placeholder="custom_role"
              value={key}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Description</span>
            <Input className="mt-1" onChange={(event) => setDescription(event.target.value)} value={description} />
          </label>

          <PermissionMatrix
            permissions={permissions}
            selectedPermissionIds={permissionIds}
            onChange={setPermissionIds}
          />

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </form>
      )}
    </SideDrawer>
  );
}

function UserRolesDrawer({
  activeRoles,
  isLoadingRoles,
  onClose,
  tenantSlug,
  user
}: Readonly<{
  activeRoles: readonly AccessRoleSummary[];
  isLoadingRoles: boolean;
  onClose: () => void;
  tenantSlug: string;
  user: TenantUser | null;
}>) {
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updateRoles, updateState] = useUpdateTenantUserRolesMutation();
  const { showToast } = useToast();
  const currentUser = useCurrentUser();
  const isSelf = Boolean(user && currentUser?.id === user.userId);

  useEffect(() => {
    setRoleIds(user?.roles.map((role) => role.id) ?? []);
    setError(null);
  }, [user]);

  const effectivePermissionKeys = useMemo(() => {
    const keys = new Set<string>();
    const selectedRoles = activeRoles.filter((role) => roleIds.includes(role.id));

    if (user && selectedRoles.length === 0) {
      for (const permission of user.effectivePermissions) {
        keys.add(permission);
      }
    }

    return [...keys].sort();
  }, [activeRoles, roleIds, user]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      return;
    }

    const parsed = userRolesFormSchema.safeParse({ roleIds });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Select at least one role.");
      return;
    }

    try {
      await updateRoles({ tenantSlug, membershipId: user.membershipId, roleIds: parsed.data.roleIds }).unwrap();
      showToast({ title: "User roles updated", tone: "success" });
      onClose();
    } catch {
      showToast({ title: "Save failed", description: "The user roles could not be updated.", tone: "error" });
    }
  };

  return (
    <SideDrawer
      description="A user's effective permissions are the union of every assigned role."
      footer={
        user ? (
          <>
            <Button disabled={updateState.isLoading} onClick={onClose} type="button" variant="secondary">
              Cancel
            </Button>
            <Button
              disabled={updateState.isLoading || isSelf}
              form="access-user-roles-form"
              type="submit"
            >
              {updateState.isLoading ? "Saving..." : "Save"}
            </Button>
          </>
        ) : null
      }
      isOpen={Boolean(user)}
      onClose={onClose}
      title="Edit user roles"
    >
      {user ? (
        <form className="space-y-4" id="access-user-roles-form" onSubmit={submit}>
          <div className="rounded-md border border-border p-3 text-sm">
            <p className="font-medium">{user.name ?? "Unnamed user"}</p>
            <p className="mt-1 text-muted-foreground">{user.email}</p>
            <div className="mt-2">
              <StatusBadge status={user.membershipStatus} />
            </div>
          </div>
          {isSelf ? (
            <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              Self access changes are blocked by the backend.
            </p>
          ) : null}
          {isLoadingRoles ? (
            <RoleCheckboxListSkeleton />
          ) : (
            <RoleCheckboxList activeRoles={activeRoles} selectedRoleIds={roleIds} onChange={setRoleIds} />
          )}
          <div>
            <h3 className="text-sm font-semibold">Current effective permissions</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {(effectivePermissionKeys.length > 0 ? effectivePermissionKeys : user.effectivePermissions).map((permission) => (
                <Badge key={permission} tone="gray">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </form>
      ) : null}
    </SideDrawer>
  );
}

function InvitationDrawer({
  activeRoles,
  isOpen,
  onClose,
  tenantSlug
}: Readonly<{
  activeRoles: readonly AccessRoleSummary[];
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
}>) {
  const [email, setEmail] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [createInvitation, createState] = useCreateTenantInvitationMutation();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setRoleIds([]);
      setError(null);
      setGeneratedToken(null);
    }
  }, [isOpen]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = invitationFormSchema.safeParse({ email: email.trim(), roleIds });

    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Review the invitation values.");
      return;
    }

    try {
      const invitation = await createInvitation({
        tenantSlug,
        email: parsed.data.email,
        roleIds: parsed.data.roleIds
      }).unwrap();
      setGeneratedToken(invitation.acceptanceToken ?? null);
      showToast({ title: "Invitation created", tone: "success" });
      if (!invitation.acceptanceToken) {
        onClose();
      }
    } catch {
      showToast({ title: "Invitation failed", description: "The invitation could not be created.", tone: "error" });
    }
  };

  return (
    <SideDrawer
      description="The invitee receives the selected roles when the invitation is accepted."
      footer={
        <>
          <Button disabled={createState.isLoading} onClick={onClose} type="button" variant="secondary">
            Close
          </Button>
          <Button disabled={createState.isLoading} form="access-invitation-form" type="submit">
            {createState.isLoading ? "Sending..." : "Send invitation"}
          </Button>
        </>
      }
      isOpen={isOpen}
      onClose={onClose}
      title="Invite user"
    >
      <form className="space-y-4" id="access-invitation-form" onSubmit={submit}>
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <Input
            autoComplete="email"
            className="mt-1"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <RoleCheckboxList activeRoles={activeRoles} selectedRoleIds={roleIds} onChange={setRoleIds} />
        {generatedToken ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Development invitation link</p>
            <p className="mt-2 break-all">
              {typeof window === "undefined"
                ? `/invitations/accept?token=${generatedToken}`
                : `${window.location.origin}/invitations/accept?token=${generatedToken}`}
            </p>
          </div>
        ) : null}
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>
    </SideDrawer>
  );
}

function PermissionMatrix({
  onChange,
  permissions,
  selectedPermissionIds
}: Readonly<{
  onChange: (permissionIds: string[]) => void;
  permissions: readonly AccessPermission[];
  selectedPermissionIds: readonly string[];
}>) {
  const groups = groupPermissionsByModule(permissions);

  const togglePermission = (permissionId: string) => {
    onChange(
      selectedPermissionIds.includes(permissionId)
        ? selectedPermissionIds.filter((id) => id !== permissionId)
        : [...selectedPermissionIds, permissionId]
    );
  };

  return (
    <div>
      <h3 className="text-sm font-semibold">Permissions</h3>
      <div className="mt-2 space-y-3">
        {groups.map((group) => (
          <fieldset className="rounded-md border border-border p-3" key={group.moduleName}>
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.moduleName}
            </legend>
            <div className="mt-2 space-y-2">
              {group.permissions.map((permission) => (
                <label className="flex items-start gap-2 text-sm" key={permission.id}>
                  <input
                    checked={selectedPermissionIds.includes(permission.id)}
                    className="mt-1 h-4 w-4"
                    onChange={() => togglePermission(permission.id)}
                    type="checkbox"
                  />
                  <span>
                    <span className="font-medium">{permission.key}</span>
                    {permission.isCritical ? (
                      <Badge className="ml-2" tone="amber">
                        Critical
                      </Badge>
                    ) : null}
                    <span className="block text-xs text-muted-foreground">{permission.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}

function RoleCheckboxList({
  activeRoles,
  onChange,
  selectedRoleIds
}: Readonly<{
  activeRoles: readonly AccessRoleSummary[];
  onChange: (roleIds: string[]) => void;
  selectedRoleIds: readonly string[];
}>) {
  const toggleRole = (roleId: string) => {
    onChange(
      selectedRoleIds.includes(roleId)
        ? selectedRoleIds.filter((id) => id !== roleId)
        : [...selectedRoleIds, roleId]
    );
  };

  return (
    <fieldset>
      <legend className="text-sm font-medium">Roles</legend>
      <div className="mt-2 space-y-2">
        {activeRoles.map((role) => (
          <label className="flex items-center gap-2 rounded-md border border-border p-2 text-sm" key={role.id}>
            <input
              checked={selectedRoleIds.includes(role.id)}
              className="h-4 w-4"
              onChange={() => toggleRole(role.id)}
              type="checkbox"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{role.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{role.key}</span>
            </span>
            {role.isSystemRole ? <Badge tone="blue">System</Badge> : null}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function RoleFormSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading role details">
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton />
      <div>
        <Skeleton className="h-4 w-28" />
        <div className="mt-2 space-y-3">
          {Array.from({ length: 3 }).map((_, groupIndex) => (
            <div className="rounded-md border border-border p-3" key={groupIndex}>
              <Skeleton className="h-3 w-20" />
              <div className="mt-3 space-y-3">
                {Array.from({ length: 3 }).map((__, permissionIndex) => (
                  <div className="flex items-start gap-2" key={permissionIndex}>
                    <Skeleton className="mt-0.5 h-4 w-4" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="mt-2 h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoleCheckboxListSkeleton() {
  return (
    <div aria-label="Loading roles">
      <Skeleton className="h-4 w-14" />
      <div className="mt-2 space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="flex items-center gap-2 rounded-md border border-border p-2" key={index}>
            <Skeleton className="h-4 w-4" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FieldSkeleton() {
  return (
    <div>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-2 h-9 w-full" />
    </div>
  );
}

function RoleBadges({ roles }: Readonly<{ roles: readonly { name: string; key?: string }[] }>) {
  const visibleRoles = roles.slice(0, 3);
  const hiddenCount = roles.length - visibleRoles.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleRoles.map((role) => (
        <Badge key={role.key ?? role.name} tone="blue">
          {role.name}
        </Badge>
      ))}
      {hiddenCount > 0 ? <Badge tone="gray">+{hiddenCount}</Badge> : null}
    </div>
  );
}

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const tone = status === "ACTIVE" || status === "ACCEPTED" ? "green" : status === "PENDING" ? "blue" : status === "EXPIRED" ? "amber" : "gray";

  return <Badge tone={tone}>{status}</Badge>;
}

function PanelHeader({
  action,
  description,
  icon,
  title
}: Readonly<{
  action?: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}>) {
  return (
    <header className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          {icon}
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </header>
  );
}

function EmptyPanel({ title }: Readonly<{ title: string }>) {
  return (
    <div className="border-t border-border px-5 py-10 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">Records will appear here when available.</p>
    </div>
  );
}

function TableRowsSkeleton({
  columns,
  rows = 3
}: Readonly<{
  columns: number;
  rows?: number;
}>) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td className="px-5 py-4" key={columnIndex}>
              <Skeleton
                className={cn(
                  "h-4",
                  columnIndex === columns - 1 ? "ml-auto w-20" : columnIndex === 0 ? "w-44" : "w-28"
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

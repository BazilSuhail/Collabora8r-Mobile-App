// feat(screens/projectSettings/ProjectMembersPage): add, invite, re-role and remove the people in a project.
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import PageHead from '@/components/layout/PageHead';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable from '@/components/ui/DataTable';
import FormModal from '@/components/ui/FormModal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import SegmentedControl from '@/components/ui/SegmentedControl';
import SecretRevealModal from '@/components/shared/SecretRevealModal';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { emptyCopy } from '@/metadata/empty';
import {
  createProjectInvite,
  listProjectInvites,
  listProjectMembers,
  listRoles,
  addProjectMember,
  removeProjectMember,
  revokeProjectInvite,
  updateProjectMember,
} from '@/libs/api/projects';
import { searchUsers } from '@/libs/api/users';
import { formatDate } from '@/utils/format';
import { usePaged } from '@/utils/usePaged';
import { useResource } from '@/utils/useResource';
import { paths } from '@/routes/paths';
import ProjectSettingsNav from '@/components/projectSettings/ProjectSettingsNav';

const SYSTEM_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'lead', label: 'Lead' },
  { value: 'developer', label: 'Developer' },
  { value: 'reporter', label: 'Reporter' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'guest', label: 'Guest' },
];

// Invite links open the web app, so they are built on its origin, not the app's.
const WEB_ORIGIN = (process.env.EXPO_PUBLIC_WEB_URL ?? '').replace(/\/+$/, '');
const inviteLink = (token) => `${WEB_ORIGIN}${paths.projectInvite(token)}`;

// Role values carry their kind: "role:<system role>" or "id:<custom role id>".
const roleBody = (value) => (value.startsWith('id:') ? { roleId: value.slice(3) } : { role: value.slice(5) });

export default function ProjectMembersPage() {
  const { projectId, project, can } = useProject();
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const canMembers = can('member.manage');
  const canInvites = can('invite.manage');

  const [tab, setTab] = useState('members');
  const [addOpen, setAddOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [reveal, setReveal] = useState(null);

  const members = usePaged((p) => listProjectMembers(projectId, p), {});
  const invites = usePaged((p) => listProjectInvites(projectId, p), { status: 'pending' });
  const roles = useResource(() => listRoles(projectId, { limit: 100 }), [projectId]);

  const customRoles = (roles.data ?? []).filter((r) => !r.isSystem);
  const roleOptions = [
    ...SYSTEM_ROLES.map((r) => ({ value: `role:${r.value}`, label: r.label })),
    ...customRoles.map((r) => ({ value: `id:${r._id}`, label: r.name })),
  ];
  const roleLabel = (value) => roleOptions.find((o) => o.value === value)?.label ?? value;
  const memberRoleValue = (m) => (m.roleId ? `id:${m.roleId}` : `role:${m.role}`);

  const changeRole = async (row, value) => {
    try {
      await updateProjectMember(projectId, row.userId, roleBody(value));
      toast.success('Role updated');
      members.reload();
    } catch (err) {
      if (err?.status === 409 || err?.status === 422) toast.error(err.message);
    }
  };

  // The server keeps only a hash of each invite token, so a link cannot be shown again.
  // Resend revokes the pending invite and creates a fresh one, then shows its new link.
  const resendInvite = async (row) => {
    try {
      await revokeProjectInvite(projectId, row._id);
      const { data } = await createProjectInvite(projectId, { email: row.email, role: row.role });
      toast.success('New invite link created');
      invites.reload();
      setReveal(inviteLink(data.token));
    } catch (err) {
      toast.error(err.message || 'Could not create a new link');
      invites.reload();
    }
  };

  const runConfirm = async () => {
    const { kind, row } = confirm;
    try {
      if (kind === 'revoke') {
        await revokeProjectInvite(projectId, row._id);
        toast.success('Invite revoked');
        invites.reload();
        return;
      }
      await removeProjectMember(projectId, row.userId);
      if (kind === 'leave') {
        toast.success('You left the project');
        router.replace(paths.projects());
        return;
      }
      toast.success('Member removed');
      members.reload();
    } catch (err) {
      if (err?.status === 409 || err?.status === 422) toast.error(err.message);
      throw err;
    }
  };

  const memberColumns = [
    {
      key: 'person',
      label: 'Person',
      render: (row) => (
        <View className="min-w-0 flex-row items-center gap-2.5">
          <Avatar name={row.userName || 'Member'} src={row.userAvatar || undefined} size="sm" />
          <View className="min-w-0 flex-1">
            <Text className="font-semibold text-foreground" numberOfLines={1}>
              {row.userName || 'Member'}
            </Text>
            {row.userTitle ? (
              <Text className="text-[12.5px] text-muted" numberOfLines={1}>
                {row.userTitle}
              </Text>
            ) : null}
          </View>
        </View>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) =>
        canMembers ? (
          <View className="min-w-[160px]">
            <Select
              hideLabel
              label={`Role for ${row.userName || 'member'}`}
              value={memberRoleValue(row)}
              options={roleOptions}
              onChange={(value) => changeRole(row, value)}
            />
          </View>
        ) : (
          <Badge>{roleLabel(memberRoleValue(row))}</Badge>
        ),
    },
    {
      key: 'joined',
      label: 'Joined',
      render: (row) => <Text className="text-muted">{row.joinedAt ? formatDate(row.joinedAt) : ''}</Text>,
    },
  ];

  const memberMenu = (row) => {
    const self = row.userId === user?.id;
    if (!self && !canMembers) return [];
    return [
      {
        id: 'remove',
        label: self ? 'Leave project' : 'Remove from project',
        icon: self ? 'logout' : 'userMinus',
        danger: true,
        onSelect: () => setConfirm({ kind: self ? 'leave' : 'remove', row }),
      },
    ];
  };

  const inviteColumns = [
    { key: 'email', label: 'Email', render: (row) => <Text className="font-semibold text-foreground">{row.email}</Text> },
    { key: 'role', label: 'Role', render: (row) => <Badge>{roleLabel(`role:${row.role}`)}</Badge> },
    {
      key: 'expires',
      label: 'Expires',
      render: (row) => <Text className="text-muted">{row.expiresAt ? formatDate(row.expiresAt) : ''}</Text>,
    },
  ];

  const inviteMenu = canInvites
    ? (row) => [
        { id: 'resend', label: 'Resend link', icon: 'mail', onSelect: () => resendInvite(row) },
        { id: 'revoke', label: 'Revoke invite', icon: 'userMinus', danger: true, onSelect: () => setConfirm({ kind: 'revoke', row }) },
      ]
    : undefined;

  const confirmText =
    confirm?.kind === 'leave'
      ? 'You will lose access to this project until someone adds you again.'
      : confirm?.kind === 'revoke'
        ? `${confirm.row.email} will not be able to use this invite.`
        : `${confirm?.row?.userName || 'This member'} will lose access to this project.`;

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <PageHead
        title="People"
        sub={project?.name ?? ''}
        actions={
          <View className="flex-row flex-wrap gap-2">
            {canInvites ? (
              <Button variant="soft" icon="mail" onPress={() => setInviteOpen(true)}>
                Invite by email
              </Button>
            ) : null}
            {canMembers ? (
              <Button variant="ember" icon="plus" onPress={() => setAddOpen(true)}>
                Add member
              </Button>
            ) : null}
          </View>
        }
      />
      <ProjectSettingsNav active="people" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-grow-0">
        <SegmentedControl
          as="tabs"
          label="People sections"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'members', label: 'Members' },
            { value: 'invites', label: 'Invites' },
          ]}
        />
      </ScrollView>

      <View className="mb-4 flex-1 rounded-card border border-border bg-surface p-2" accessibilityLabel={tab === 'members' ? 'Members' : 'Invites'}>
        {tab === 'members' ? (
          <DataTable
            label="Project members"
            rowKey="_id"
            columns={memberColumns}
            rows={members.items}
            status={members.status}
            error={members.error}
            onRetry={members.reload}
            hasMore={members.hasMore}
            onLoadMore={members.loadMore}
            loadingMore={members.loadingMore}
            rowMenu={memberMenu}
            empty={emptyCopy('project-members')}
          />
        ) : (
          <DataTable
            label="Pending invites"
            rowKey="_id"
            columns={inviteColumns}
            rows={invites.items}
            status={invites.status}
            error={invites.error}
            onRetry={invites.reload}
            hasMore={invites.hasMore}
            onLoadMore={invites.loadMore}
            loadingMore={invites.loadingMore}
            rowMenu={inviteMenu}
            empty={{ icon: 'mail', title: 'No pending invites', text: 'Invites you send by email appear here until they are accepted.' }}
          />
        )}
      </View>

      <FormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add member"
        description="Only people in the organization can join an organization project."
        submitLabel="Add"
        initialValues={{ userId: '', role: 'role:developer' }}
        onSubmit={async (v) => {
          await addProjectMember(projectId, { userId: v.userId, ...roleBody(v.role) });
          toast.success('Member added');
          members.reload();
        }}
        fields={({ values, set, errors }) => (
          <>
            <Select
              label="Person"
              value={values.userId}
              searchable
              placeholder="Search people"
              loadOptions={(q) =>
                searchUsers(q)
                  .then((res) => res.data.map((u) => ({ value: u.id, label: u.displayName, description: u.email })))
                  .catch(() => [])
              }
              onChange={(v) => set('userId', v)}
              error={errors.userId}
              hint="Only people in your organization"
            />
            <Select
              label="Role"
              value={values.role}
              options={roleOptions}
              onChange={(v) => set('role', v)}
              error={errors.role}
              hint="Sets what they can do in this project"
            />
          </>
        )}
      />

      <FormModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite by email"
        description="They join the project with this role once they accept."
        submitLabel="Send invite"
        initialValues={{ email: '', role: 'developer' }}
        onSubmit={async (v) => {
          const { data } = await createProjectInvite(projectId, { email: v.email.trim(), role: v.role });
          toast.success('Invite sent');
          invites.reload();
          setReveal(inviteLink(data.token));
        }}
        fields={({ values, set, errors }) => (
          <>
            <Input
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={values.email}
              onChangeText={(t) => set('email', t)}
              error={errors.email}
              hint="We send the invite link to this address"
            />
            <Select
              label="Role"
              value={values.role}
              options={SYSTEM_ROLES}
              onChange={(v) => set('role', v)}
              error={errors.role}
              hint="Applied when they accept"
            />
          </>
        )}
      />

      <SecretRevealModal
        open={Boolean(reveal)}
        onClose={() => setReveal(null)}
        title="Invite link"
        description="Copy this link now. It is shown once and cannot be opened from here again."
        value={reveal ?? ''}
        label="Invite link"
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={confirm?.kind === 'leave' ? 'Leave this project?' : confirm?.kind === 'revoke' ? 'Revoke this invite?' : 'Remove this member?'}
        text={confirmText}
        confirmLabel={confirm?.kind === 'leave' ? 'Leave' : confirm?.kind === 'revoke' ? 'Revoke' : 'Remove'}
        tone="danger"
        onConfirm={runConfirm}
      />
    </View>
  );
}

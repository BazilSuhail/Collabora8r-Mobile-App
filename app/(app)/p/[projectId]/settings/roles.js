// feat(screens/projectSettings/RolesPage): view the project permission matrix and create, edit or delete custom roles.
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import PageHead from '@/components/layout/PageHead';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import SideModal from '@/components/ui/SideModal';
import Skeleton from '@/components/ui/Skeleton';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { emptyCopy } from '@/metadata/empty';
import { createRole, deleteRole, listRoles, updateRole } from '@/libs/api/projects';
import { toFieldErrors } from '@/utils/formErrors';
import { useResource } from '@/utils/useResource';
import { cn } from '@/utils/cn';
import ProjectSettingsNav from '@/components/projectSettings/ProjectSettingsNav';
import RoleMatrix from '@/components/projectSettings/RoleMatrix';

const blankDraft = { name: '', description: '', permissions: [] };

function PermissionCheck({ permission, checked, disabled, onToggle }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={permission}
      disabled={disabled}
      onPress={onToggle}
      className={cn('min-w-0 flex-row items-center gap-2.5 py-1.5', disabled && 'opacity-60')}
    >
      <View
        className={cn(
          'h-4 w-4 items-center justify-center rounded border',
          checked ? 'border-accent bg-accent' : 'border-border bg-surface',
        )}
      >
        {checked ? <Icon name="check" size={12} className="text-on-accent" strokeWidth={3} /> : null}
      </View>
      <Text className="flex-1 text-sm font-semibold text-foreground" numberOfLines={1}>
        {permission}
      </Text>
    </Pressable>
  );
}

export default function RolesPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const canManage = can('role.manage');

  const roles = useResource(() => listRoles(projectId, { limit: 100 }), [projectId]);
  const rows = roles.data ?? [];
  const permissionUnion = [...new Set(rows.flatMap((r) => r.permissions ?? []))].sort();

  // editor: null when closed, otherwise { mode: "create" | "edit", role? }.
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState(blankDraft);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openEditor = (next) => {
    setFieldErrors({});
    setFormError(null);
    setDraft(
      next.mode === 'edit'
        ? { name: next.role.name, description: next.role.description ?? '', permissions: [...(next.role.permissions ?? [])] }
        : blankDraft,
    );
    setEditor(next);
  };

  const togglePermission = (permission) => {
    setDraft((d) => ({
      ...d,
      permissions: d.permissions.includes(permission)
        ? d.permissions.filter((p) => p !== permission)
        : [...d.permissions, permission],
    }));
  };

  const save = async () => {
    setSaving(true);
    setFieldErrors({});
    setFormError(null);
    try {
      if (editor.mode === 'create') {
        await createRole(projectId, { name: draft.name.trim(), description: draft.description, permissions: draft.permissions });
      } else {
        await updateRole(projectId, editor.role._id, { description: draft.description, permissions: draft.permissions });
      }
      setEditor(null);
      toast.success('Role saved');
      roles.reload();
    } catch (err) {
      if (err?.status === 422) {
        setFieldErrors(toFieldErrors(err.errors));
        setFormError(err.message);
      } else {
        setFormError(err?.message ?? 'Could not save the role.');
      }
    } finally {
      setSaving(false);
    }
  };

  const removeRole = async () => {
    try {
      await deleteRole(projectId, deleteTarget._id);
      toast.success('Role deleted');
      roles.reload();
    } catch (err) {
      if (err?.status === 409) toast.error(err.message);
      throw err;
    }
  };

  const editingSystem = editor?.mode === 'edit' && editor.role.isSystem;

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="p-4 pb-8">
        <PageHead
          title="Roles"
          sub="Project permissions"
          actions={
            canManage ? (
              <Button variant="ember" icon="plus" onPress={() => openEditor({ mode: 'create' })}>
                New role
              </Button>
            ) : null
          }
        />
        <ProjectSettingsNav active="roles" />

        <View className="rounded-card border border-border bg-surface p-[22px]" accessibilityLabel="Permission matrix">
          {roles.status === 'loading' ? (
            <Skeleton variant="rows" count={6} cols={4} />
          ) : roles.status === 'error' ? (
            <EmptyState tone="error" icon="shield" title="Roles could not load" text={roles.error?.message} onRetry={roles.reload} />
          ) : rows.length === 0 ? (
            <EmptyState icon="shield" title={emptyCopy('roles').title} text={emptyCopy('roles').text} />
          ) : (
            <RoleMatrix
              roles={rows}
              canManage={canManage}
              onEdit={(role) => openEditor({ mode: 'edit', role })}
              onDelete={(role) => setDeleteTarget(role)}
            />
          )}
        </View>
      </ScrollView>

      <SideModal
        open={Boolean(editor)}
        onClose={() => setEditor(null)}
        title={editor?.mode === 'create' ? 'New role' : `Edit ${editor?.role?.name ?? 'role'}`}
        subtitle={editingSystem ? 'System roles are read only.' : 'Pick what members with this role can do.'}
        footer={
          <View className="w-full gap-2.5">
            {formError ? (
              <Text accessibilityLiveRegion="polite" className="text-[13px] font-semibold text-danger">
                {formError}
              </Text>
            ) : null}
            <View className="flex-row gap-2.5">
              <Button variant="ghost" onPress={() => setEditor(null)} className="flex-1">
                {editingSystem ? 'Close' : 'Cancel'}
              </Button>
              {editingSystem ? null : (
                <Button variant="ember" onPress={save} loading={saving} disabled={saving} className="flex-1">
                  Save role
                </Button>
              )}
            </View>
          </View>
        }
      >
        <View className="gap-[18px]">
          {editor?.mode === 'create' ? (
            <Input
              label="Name"
              value={draft.name}
              onChangeText={(t) => setDraft((d) => ({ ...d, name: t }))}
              error={fieldErrors.name}
              hint="Required. Members see this name when they pick a role."
            />
          ) : (
            <View className="min-w-0 flex-row flex-wrap items-center gap-2">
              <Text className="text-sm text-muted">Name: </Text>
              <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                {editor?.role?.name}
              </Text>
              {editingSystem ? <Badge tone="plain">System</Badge> : null}
            </View>
          )}
          <Input
            label="Description"
            as="textarea"
            multiline
            value={draft.description}
            disabled={editingSystem}
            editable={!editingSystem}
            onChangeText={(t) => setDraft((d) => ({ ...d, description: t }))}
            error={fieldErrors.description}
            hint="Optional. Explain what this role is for."
          />
          <View className="gap-1">
            <View className="mb-1.5 flex-row items-center gap-2">
              <Icon name="shield" size={14} className="text-muted" />
              <Text className="text-[13px] font-semibold text-foreground">Permissions</Text>
            </View>
            {permissionUnion.length === 0 ? <Text className="text-[13.5px] text-muted">No permissions to choose from yet.</Text> : null}
            {permissionUnion.map((permission) => (
              <PermissionCheck
                key={permission}
                permission={permission}
                checked={draft.permissions.includes(permission)}
                disabled={editingSystem}
                onToggle={() => togglePermission(permission)}
              />
            ))}
          </View>
          {fieldErrors.permissions ? (
            <Text accessibilityLiveRegion="polite" className="text-[13px] font-semibold text-danger">
              {fieldErrors.permissions}
            </Text>
          ) : null}
        </View>
      </SideModal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? 'role'}?`}
        text="Members who still have this role must be moved to another role first."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={removeRole}
      />
    </View>
  );
}

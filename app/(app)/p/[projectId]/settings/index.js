// feat(screens/projectSettings/ProjectSettingsPage): edit a project's details, schedule and theme, handle join requests and archive the project.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import PageHead from '@/components/layout/PageHead';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import FormModal from '@/components/ui/FormModal';
import { Icon } from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Skeleton from '@/components/ui/Skeleton';
import ThemePicker from '@/components/projects/ThemePicker';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { archiveProject, decideProjectJoin, listProjectJoinRequests, updateProject } from '@/libs/api/projects';
import { listBoards, updateBoard } from '@/libs/api/boards';
import { useResource } from '@/utils/useResource';
import { toFieldErrors } from '@/utils/formErrors';
import { paths } from '@/routes/paths';
import ProjectSettingsNav from '@/components/projectSettings/ProjectSettingsNav';

// Matches the server's updateProjectSchema. Fields the server does not accept are not shown.
const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'request', label: 'Request to join' },
  { value: 'open', label: 'Open to org' },
];

const DEFAULT_VIEW_OPTIONS = [
  { value: 'board', label: 'Board' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'list', label: 'List' },
  { value: 'timeline', label: 'Timeline' },
];

const HEALTH_OPTIONS = [
  { value: 'on_track', label: 'On track', tone: 'spruce' },
  { value: 'at_risk', label: 'At risk', tone: 'saffron' },
  { value: 'off_track', label: 'Off track', tone: 'ember' },
  { value: 'not_set', label: 'Not set', tone: 'plain' },
];

const toDateInput = (value) => (value ? String(value).slice(0, 10) : '');

const toForm = (project) => ({
  name: project.name ?? '',
  description: project.description ?? '',
  headline: project.headline ?? '',
  leadId: project.leadId ?? '',
  visibility: project.visibility ?? 'private',
  defaultView: project.defaultView ?? 'board',
  startDate: toDateInput(project.startDate),
  targetDate: toDateInput(project.targetDate),
  health: project.health ?? 'not_set',
  healthNote: project.healthNote ?? '',
  themeKey: project.themeKey ?? null,
});

function SectionTitle({ icon, children }) {
  return (
    <View className="min-w-0 flex-row items-center gap-2">
      <Icon name={icon} size={18} className="text-muted" />
      <Text accessibilityRole="header" className="flex-1 text-[17px] font-semibold text-foreground" numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

function Card({ children, className = '' }) {
  return <View className={`gap-4 rounded-card border border-border bg-surface p-5 ${className}`}>{children}</View>;
}

function Sub({ children }) {
  return <Text className="text-[13.5px] text-muted">{children}</Text>;
}

// Plain list replaces the web DataTable so no virtualized list nests inside the page ScrollView.
function JoinRequests({ joins, onPick }) {
  if (joins.status === 'loading') return <Skeleton variant="rows" count={2} cols={1} />;
  if (joins.status === 'error') {
    return <EmptyState tone="error" icon="users" title="Join requests could not load" text={joins.error?.message} onRetry={joins.reload} />;
  }
  const rows = joins.data ?? [];
  if (rows.length === 0) {
    return <EmptyState icon="users" title="No join requests" text="People who ask to join this project appear here." />;
  }
  return (
    <View accessibilityLabel="Join requests">
      {rows.map((row) => (
        <Pressable
          key={row._id}
          accessibilityRole="button"
          onPress={() => onPick(row)}
          className="gap-1.5 border-b border-border py-3 active:opacity-70"
        >
          <View className="min-w-0 flex-row items-center gap-2.5">
            <Avatar name={row.userName || 'Member'} src={row.userAvatar || undefined} size="sm" />
            <Text className="flex-1 font-semibold text-foreground" numberOfLines={1}>
              {row.userName || 'Member'}
            </Text>
            <Badge tone="iris">{row.requestedRole}</Badge>
          </View>
          {row.message ? (
            <Text className="text-muted" numberOfLines={2}>
              {row.message}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

export default function ProjectSettingsPage() {
  const { projectId, project, status, error, reload, can, members } = useProject();
  const toast = useToast();
  const router = useRouter();
  const isAdmin = can('project.admin');
  const archived = project?.status === 'archived';
  const editable = isAdmin && !archived;

  const boards = useResource(() => listBoards(projectId, { limit: 100 }), [projectId]);
  const joins = useResource(
    () => (isAdmin ? listProjectJoinRequests(projectId, { status: 'pending', limit: 100 }) : Promise.resolve({ data: [], meta: null })),
    [projectId, isAdmin],
  );

  const [form, setForm] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [decideRow, setDecideRow] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const base = project ? toForm(project) : null;
  const values = form ?? base ?? toForm({});
  const dirty = form !== null;
  const set = (key, value) => setForm((prev) => ({ ...(prev ?? base ?? toForm({})), [key]: value }));

  const discard = () => {
    setForm(null);
    setFieldErrors({});
    setFormError(null);
  };

  const save = async () => {
    if (values.startDate && values.targetDate && values.targetDate < values.startDate) {
      setFieldErrors({ targetDate: 'Target date must be on or after the start date' });
      return;
    }
    setSaving(true);
    setFieldErrors({});
    setFormError(null);
    try {
      await updateProject(projectId, {
        name: values.name.trim(),
        description: values.description,
        headline: values.headline,
        leadId: values.leadId || null,
        visibility: values.visibility,
        defaultView: values.defaultView,
        themeKey: values.themeKey,
        startDate: values.startDate || null,
        targetDate: values.targetDate || null,
        health: values.health,
        healthNote: values.healthNote,
      });
      setForm(null);
      toast.success('Saved');
      reload();
    } catch (err) {
      const message = err?.message ?? 'Could not save the project.';
      if (err?.status === 422) setFieldErrors(toFieldErrors(err.errors));
      else setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const boardRows = boards.data ?? [];
  const boardOptions = boardRows.map((b) => ({ value: b._id, label: b.name }));
  const defaultBoard = boardRows.find((b) => b.isDefault)?._id ?? '';

  const chooseDefaultBoard = async (id) => {
    try {
      await updateBoard(projectId, id, { isDefault: true });
      toast.success('Saved');
      boards.reload();
    } catch (err) {
      if (err?.status === 422 || err?.status === 409) toast.error(err.message);
    }
  };

  const memberOptions = [{ value: '', label: 'No lead' }, ...members.map((m) => ({ value: m.userId, label: m.userName || 'Member' }))];

  if (status === 'error') {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4">
        <PageHead title="Project settings" sub={project?.name ?? ''} />
        <ProjectSettingsNav active="general" />
        <Card>
          <EmptyState tone="error" icon="project" title="Project settings could not load" text={error?.message} onRetry={reload} />
        </Card>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView className="flex-1" contentContainerClassName="gap-4 p-4 pb-8" keyboardShouldPersistTaps="handled">
        <PageHead title="Project settings" sub={project?.name ?? ''} />
        <ProjectSettingsNav active="general" />

        {status === 'loading' ? (
          <Skeleton variant="cards" count={2} />
        ) : (
          <>
            <Card>
              <View className="min-w-0 flex-row items-center justify-between gap-2.5">
                <View className="flex-1">
                  <SectionTitle icon="gear">General</SectionTitle>
                </View>
                {archived ? <Badge tone="saffron">Archived</Badge> : null}
              </View>
              <Text className="text-[13.5px] text-muted" numberOfLines={1}>
                {`Editing ${project?.name ?? 'this project'}`}
              </Text>
              <Input
                label="Project name"
                value={values.name}
                disabled={!editable}
                editable={editable}
                onChangeText={(t) => set('name', t)}
                error={fieldErrors.name}
                hint="Shown across lists and boards"
              />
              <Input label="Key" value={project?.key ?? ''} disabled editable={false} hint="Set when the project is created" />
              <Input
                label="Headline"
                value={values.headline}
                disabled={!editable}
                editable={editable}
                onChangeText={(t) => set('headline', t)}
                error={fieldErrors.headline}
                hint="A one-line summary shown under the name"
              />
              <Input
                label="Description"
                as="textarea"
                multiline
                value={values.description}
                disabled={!editable}
                editable={editable}
                onChangeText={(t) => set('description', t)}
                error={fieldErrors.description}
                hint="Optional. A short summary for the team"
              />
              <Select
                label="Lead"
                value={values.leadId}
                options={memberOptions}
                disabled={!editable}
                onChange={(v) => set('leadId', v)}
                error={fieldErrors.leadId}
                hint="The person who owns this project"
              />
              <View className={`gap-1.5 ${editable ? '' : 'opacity-60'}`} pointerEvents={editable ? 'auto' : 'none'}>
                <Text className="text-[13px] font-semibold text-foreground">Who can join</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <SegmentedControl
                    label="Who can join"
                    value={values.visibility}
                    options={VISIBILITY_OPTIONS}
                    onChange={(v) => set('visibility', v)}
                  />
                </ScrollView>
                <Text className="text-xs text-muted">Controls who can find and join this project</Text>
                {fieldErrors.visibility ? (
                  <Text accessibilityLiveRegion="polite" className="text-[13px] font-semibold text-danger">
                    {fieldErrors.visibility}
                  </Text>
                ) : null}
              </View>
            </Card>

            <Card>
              <SectionTitle icon="calendar">Schedule</SectionTitle>
              <Input
                label="Start date"
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
                value={values.startDate}
                disabled={!editable}
                editable={editable}
                onChangeText={(t) => set('startDate', t)}
                error={fieldErrors.startDate}
                hint="When work begins"
              />
              <Input
                label="Target date"
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
                value={values.targetDate}
                disabled={!editable}
                editable={editable}
                onChangeText={(t) => set('targetDate', t)}
                error={fieldErrors.targetDate}
                hint="When the project should finish"
              />
              <Select
                label="Health"
                value={values.health}
                options={HEALTH_OPTIONS}
                disabled={!editable}
                onChange={(v) => set('health', v)}
                error={fieldErrors.health}
                hint="Shown on the project overview"
              />
              <Input
                label="Health note"
                as="textarea"
                multiline
                value={values.healthNote}
                disabled={!editable}
                editable={editable}
                onChangeText={(t) => set('healthNote', t)}
                error={fieldErrors.healthNote}
                hint="Optional. Why the project has this health"
              />
            </Card>

            <Card className="gap-3">
              <SectionTitle icon="kanban">Board defaults</SectionTitle>
              {boards.status === 'error' ? (
                <EmptyState tone="error" icon="kanban" title="Boards could not load" onRetry={boards.reload} />
              ) : boards.status === 'loading' ? (
                <Skeleton variant="rows" count={1} cols={1} />
              ) : (
                <Select
                  label="Default board"
                  value={defaultBoard}
                  options={boardOptions}
                  placeholder="Pick a board"
                  disabled={!can('board.manage') || archived}
                  hint={boardOptions.length ? 'Saves as soon as you pick it' : 'Create a board first'}
                  onChange={chooseDefaultBoard}
                />
              )}
              <Select
                label="Default view"
                value={values.defaultView}
                options={DEFAULT_VIEW_OPTIONS}
                disabled={!editable}
                onChange={(v) => set('defaultView', v)}
                error={fieldErrors.defaultView}
                hint="The view that opens first in this project"
              />
            </Card>

            <Card className="gap-3">
              <SectionTitle icon="sparkle">Banner</SectionTitle>
              <Sub>Choose the banner shown at the top of the project.</Sub>
              <ThemePicker value={values.themeKey} disabled={!editable} onChange={(key) => set('themeKey', key)} />
            </Card>

            {isAdmin ? (
              <Card className="gap-3">
                <SectionTitle icon="users">Join requests</SectionTitle>
                <Sub>People who asked to join this project. Tap a request to decide.</Sub>
                <JoinRequests joins={joins} onPick={setDecideRow} />
              </Card>
            ) : null}

            {isAdmin ? (
              <Card className="gap-3">
                <SectionTitle icon="archive">Archive project</SectionTitle>
                <Sub>Archiving hides this project from the project list.</Sub>
                <View className="items-start">
                  <Button variant="danger" disabled={archived} onPress={() => setArchiveOpen(true)}>
                    Archive project
                  </Button>
                </View>
              </Card>
            ) : null}
          </>
        )}
      </ScrollView>

      {isAdmin && status !== 'loading' ? (
        <View className="gap-2.5 border-t border-border bg-surface p-3">
          {formError ? (
            <Text accessibilityLiveRegion="polite" className="text-[13px] font-semibold text-danger">
              {formError}
            </Text>
          ) : null}
          <View className="flex-row items-center gap-2.5">
            <View className="flex-1">{dirty ? <Badge tone="saffron">Unsaved changes</Badge> : null}</View>
            <Button variant="ghost" disabled={!dirty || saving} onPress={discard}>
              Discard
            </Button>
            <Button variant="ember" loading={saving} disabled={!dirty || saving} onPress={save}>
              Save
            </Button>
          </View>
        </View>
      ) : null}

      <FormModal
        open={Boolean(decideRow)}
        onClose={() => setDecideRow(null)}
        title="Decide join request"
        description={decideRow ? `${decideRow.userName || 'This person'} asked to join as ${decideRow.requestedRole}.` : undefined}
        submitLabel="Confirm"
        initialValues={{ decision: 'approve', declineReason: '' }}
        onSubmit={async (v) => {
          await decideProjectJoin(projectId, decideRow._id, {
            decision: v.decision,
            ...(v.decision === 'decline' && v.declineReason ? { declineReason: v.declineReason } : {}),
          });
          toast.success(v.decision === 'approve' ? 'Approved' : 'Declined');
          joins.reload();
        }}
        fields={({ values: dv, set: setDecision, errors }) => (
          <>
            <Select
              label="Decision"
              value={dv.decision}
              options={[
                { value: 'approve', label: 'Approve' },
                { value: 'decline', label: 'Decline' },
              ]}
              onChange={(d) => setDecision('decision', d)}
              error={errors.decision}
            />
            {dv.decision === 'decline' ? (
              <Input
                label="Reason (optional)"
                value={dv.declineReason}
                onChangeText={(t) => setDecision('declineReason', t)}
                error={errors.declineReason}
              />
            ) : null}
          </>
        )}
      />

      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Archive project?"
        text={`Archiving hides ${project?.name ?? 'this project'} from every list.`}
        confirmLabel="Archive"
        tone="danger"
        onConfirm={async () => {
          try {
            await archiveProject(projectId);
          } catch (err) {
            if (err?.status === 409 || err?.status === 422) toast.error(err.message);
            throw err;
          }
          toast.success('Project archived');
          router.replace(paths.projects());
        }}
      />
    </KeyboardAvoidingView>
  );
}

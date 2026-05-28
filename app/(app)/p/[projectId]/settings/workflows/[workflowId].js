// feat(screens/projectSettings/WorkflowEditorPage): edit a workflow's statuses and transitions and publish it.
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import PageHead from '@/components/layout/PageHead';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import Illustration from '@/components/ui/Illustration';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { getWorkflow, publishWorkflow, updateWorkflow } from '@/libs/api/config';
import { useResource } from '@/utils/useResource';
import ProjectSettingsNav from '@/components/projectSettings/ProjectSettingsNav';
import StatusList, { CATEGORY_OPTIONS, cleanStatuses, newId } from '@/components/projectSettings/StatusList';
import TransitionEditor, { cleanTransitions } from '@/components/projectSettings/TransitionEditor';

const CATEGORY_TONE = { todo: 'plain', inprogress: 'iris', done: 'spruce' };
const NO_ERRORS = { message: null, name: null, statuses: {}, transitions: {}, list: [] };

// Turns a stored workflow into the editable draft. Ids are strings, rules keep their saved shape.
const fromWorkflow = (w) => ({
  name: w.name ?? '',
  description: w.description ?? '',
  statuses: [...(w.statuses ?? [])]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((s) => ({
      id: String(s.id),
      name: s.name ?? '',
      category: s.category ?? 'todo',
      color: s.color ?? '',
      icon: s.icon ?? '',
      description: s.description ?? '',
    })),
  transitions: (w.transitions ?? []).map((t) => ({
    id: String(t.id),
    name: t.name ?? '',
    from: (t.from ?? []).map(String),
    to: t.to ? String(t.to) : '',
    requiredFields: t.requiredFields ?? [],
    screenFields: t.screenFields ?? [],
    conditions: t.conditions ?? [],
    validators: t.validators ?? [],
    postActions: t.postActions ?? [],
  })),
});

// Splits a 422 into field, status, transition and footer messages. Paths look like statuses.0.name.
const mapErrors = (err) => {
  const out = { ...NO_ERRORS, statuses: {}, transitions: {}, list: [], message: err?.message ?? 'Could not save the workflow.' };
  (err?.errors ?? []).forEach(({ path = '', message }) => {
    const status = /(?:^|\.)statuses\.(\d+)/.exec(path);
    const transition = /(?:^|\.)transitions\.(\d+)/.exec(path);
    if (path === 'name') out.name = message;
    else if (status) {
      if (out.statuses[Number(status[1])] === undefined) out.statuses[Number(status[1])] = message;
    } else if (transition) {
      if (out.transitions[Number(transition[1])] === undefined) out.transitions[Number(transition[1])] = message;
    } else out.list.push(message);
  });
  return out;
};

function Card({ children, className = '', ...rest }) {
  return (
    <View className={`gap-4 rounded-card border border-border bg-surface p-5 ${className}`} {...rest}>
      {children}
    </View>
  );
}

function CardTitle({ icon, children }) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon name={icon} size={18} className="text-muted" />
      <Text accessibilityRole="header" className="text-[17px] font-semibold text-foreground">
        {children}
      </Text>
    </View>
  );
}

function Shell({ title, sub, children }) {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 p-4 pb-10" keyboardShouldPersistTaps="handled">
      <PageHead title={title} sub={sub} />
      <ProjectSettingsNav active="workflows" />
      {children}
    </ScrollView>
  );
}

export default function WorkflowEditorPage() {
  const { workflowId } = useLocalSearchParams();
  const navigation = useNavigation();
  const { projectId, resolutions, can } = useProject();
  const toast = useToast();
  const canEdit = can('workflow.manage');

  const wf = useResource(() => getWorkflow(projectId, workflowId), [projectId, workflowId]);
  const [draft, setDraft] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [errors, setErrors] = useState(NO_ERRORS);
  const [saving, setSaving] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!wf.data) return;
    const next = fromWorkflow(wf.data);
    setDraft(next);
    setBaseline(JSON.stringify(next));
    setErrors(NO_ERRORS);
  }, [wf.data]);

  const dirty = draft !== null && JSON.stringify(draft) !== baseline;
  const readOnly = !canEdit || wf.data?.status !== 'draft';

  // Mobile stand-in for the web beforeunload warning: confirm before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return undefined;
    return navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      Alert.alert('Discard unsaved changes?', 'Your changes to this workflow have not been saved.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
  }, [dirty, navigation]);

  // Removing a status also drops it from transitions, so no transition points at a missing status.
  const setStatuses = (next) =>
    setDraft((d) => {
      const keep = new Set(next.map((s) => s.id));
      return {
        ...d,
        statuses: next,
        transitions: d.transitions.map((t) => ({
          ...t,
          from: t.from.filter((id) => keep.has(id)),
          to: keep.has(t.to) ? t.to : '',
        })),
      };
    });

  const setTransitions = (transitions) => setDraft((d) => ({ ...d, transitions }));
  const patchTransition = (index, patch) =>
    setDraft((d) => ({ ...d, transitions: d.transitions.map((t, i) => (i === index ? { ...t, ...patch } : t)) }));

  const addTransition = () =>
    setTransitions([
      ...draft.transitions,
      { id: newId(), name: '', from: [], to: '', requiredFields: [], screenFields: [], conditions: [], validators: [], postActions: [] },
    ]);

  const save = async () => {
    setSaving(true);
    setErrors(NO_ERRORS);
    try {
      await updateWorkflow(projectId, workflowId, {
        name: draft.name.trim(),
        description: draft.description,
        statuses: cleanStatuses(draft.statuses),
        transitions: cleanTransitions(draft.transitions),
      });
      toast.success('Draft saved');
      wf.reload();
      return true;
    } catch (err) {
      setErrors(mapErrors(err));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (dirty) {
      const saved = await save();
      if (!saved) throw new Error('Save failed');
    }
    try {
      await publishWorkflow(projectId, workflowId);
    } catch (err) {
      setErrors(mapErrors(err));
      throw err;
    }
    toast.success('Workflow published');
    wf.reload();
  };

  const resolutionCount = resolutions?.length ?? 0;
  const statusOptions = (draft?.statuses ?? []).map((s) => ({
    value: s.id,
    label: s.name || 'Untitled status',
    tone: CATEGORY_TONE[s.category] ?? 'plain',
  }));
  const isLive = wf.data?.status === 'live';
  const stateLabel = isLive ? 'Live' : 'Draft';

  if (wf.status === 'error') {
    return (
      <Shell title="Workflow" sub="Statuses and transitions">
        <Card>
          <EmptyState tone="error" icon="workflow" title="This workflow could not load" text={wf.error?.message} onRetry={wf.reload} />
        </Card>
      </Shell>
    );
  }

  if (!draft) {
    return (
      <Shell title="Workflow" sub="Statuses and transitions">
        <Skeleton variant="cards" count={3} />
      </Shell>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Shell title={draft.name || 'Workflow'} sub={`${stateLabel} · version ${wf.data?.version ?? 0}`}>
        {readOnly ? (
          <Card className="flex-row flex-wrap items-center gap-2.5 p-[18px]" accessibilityRole="summary">
            <Badge tone={isLive ? 'spruce' : 'plain'}>{stateLabel}</Badge>
            <Text className="flex-1 text-[13.5px] text-muted">
              {isLive
                ? 'This workflow is live and read only. Create a draft from the workflows list to change it.'
                : 'You can view this workflow. Only admins can change it.'}
            </Text>
          </Card>
        ) : null}

        <Card>
          <CardTitle icon="workflow">Details</CardTitle>
          <Input
            label="Workflow name"
            value={draft.name}
            disabled={readOnly}
            editable={!readOnly}
            onChangeText={(t) => setDraft((d) => ({ ...d, name: t }))}
            error={errors.name}
            hint="Shown when a project picks this workflow."
          />
          <Input
            label="Description"
            value={draft.description}
            disabled={readOnly}
            editable={!readOnly}
            onChangeText={(t) => setDraft((d) => ({ ...d, description: t }))}
            hint="Optional. A short note for the team."
          />
        </Card>

        <Card>
          <CardTitle icon="stProgress">Statuses</CardTitle>
          <StatusList statuses={draft.statuses} onChange={setStatuses} readOnly={readOnly} errors={errors.statuses} />
          <View className="gap-3" accessibilityLabel="Status categories">
            {CATEGORY_OPTIONS.map((category) => {
              const items = draft.statuses.filter((s) => s.category === category.value);
              return (
                <View key={category.value} className="gap-2 rounded-xl border border-border p-3">
                  <Text className="text-xs font-bold uppercase tracking-wider text-muted">{category.label}</Text>
                  {items.length === 0 ? <Text className="text-[13px] text-muted">No statuses</Text> : null}
                  <View className="flex-row flex-wrap gap-1.5">
                    {items.map((s) => (
                      <View key={s.id} className="max-w-full rounded-full border border-border bg-background px-2.5 py-1">
                        <Text className="text-[13px] text-foreground" numberOfLines={1}>
                          {s.name || 'Untitled status'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        <Card className="gap-3.5">
          <View className="flex-row flex-wrap items-center justify-between gap-2.5">
            <CardTitle icon="arrow">Transitions</CardTitle>
            {readOnly ? null : (
              <Button variant="soft" size="sm" icon="plus" onPress={addTransition} disabled={draft.statuses.length === 0}>
                Add transition
              </Button>
            )}
          </View>
          {draft.transitions.length === 0 ? (
            <View className="items-center gap-4">
              <Text className="text-[13.5px] text-muted">
                {draft.statuses.length === 0 ? 'Add statuses first, then connect them with transitions.' : 'No transitions yet.'}
              </Text>
              <Illustration name="automation" className="h-[120px] w-[180px]" />
            </View>
          ) : null}
          {draft.transitions.map((t, index) => (
            <View key={t.id} className="gap-2 rounded-xl border border-border p-3">
              <Input
                label="Transition name"
                hideLabel
                placeholder="Transition name"
                value={t.name}
                disabled={readOnly}
                editable={!readOnly}
                onChangeText={(text) => patchTransition(index, { name: text })}
              />
              <Select
                label="From"
                multiple
                value={t.from}
                options={statusOptions}
                disabled={readOnly}
                onChange={(from) => patchTransition(index, { from })}
              />
              <Select
                label="To"
                value={t.to}
                options={statusOptions}
                placeholder="Pick a status"
                disabled={readOnly}
                onChange={(to) => patchTransition(index, { to })}
              />
              <View className="flex-row items-center justify-end gap-1">
                <Button variant="ghost" size="sm" icon="settings" onPress={() => setEditing(index)}>
                  Rules
                </Button>
                {readOnly ? null : (
                  <Button
                    iconOnly
                    variant="ghost"
                    size="sm"
                    icon="trash"
                    accessibilityLabel={`Remove ${t.name || 'transition'}`}
                    onPress={() => setTransitions(draft.transitions.filter((_, i) => i !== index))}
                  />
                )}
              </View>
              {errors.transitions[index] ? (
                <Text accessibilityLiveRegion="polite" className="text-[13px] font-semibold text-danger">
                  {errors.transitions[index]}
                </Text>
              ) : null}
            </View>
          ))}
        </Card>

        {readOnly ? null : (
          <Card className="gap-3 p-[18px]" accessibilityLabel="Save or publish">
            {errors.message || errors.list.length ? (
              <View accessibilityLiveRegion="assertive" className="gap-1">
                {errors.message && !errors.list.length ? (
                  <Text className="text-[13.5px] font-semibold text-danger">{errors.message}</Text>
                ) : null}
                {errors.list.map((m, i) => (
                  <Text key={`${m}-${i}`} className="text-[13.5px] font-semibold text-danger">
                    {m}
                  </Text>
                ))}
              </View>
            ) : null}
            <View className="flex-row items-center gap-2">
              <Badge tone={dirty ? 'iris' : 'spruce'}>{dirty ? 'Unsaved' : 'Saved'}</Badge>
              <Text className="text-[13px] text-muted">{dirty ? 'Unsaved changes' : 'All changes saved'}</Text>
            </View>
            <View className="flex-row gap-2.5">
              <Button variant="soft" onPress={save} loading={saving} disabled={!dirty || saving} className="flex-1">
                Save draft
              </Button>
              <Button variant="ember" onPress={() => setPublishOpen(true)} disabled={saving} className="flex-1">
                Publish
              </Button>
            </View>
          </Card>
        )}
      </Shell>

      <TransitionEditor
        key={editing ?? 'none'}
        open={editing !== null}
        transition={editing !== null ? draft.transitions[editing] : null}
        resolutions={resolutions ?? []}
        readOnly={readOnly}
        onClose={() => setEditing(null)}
        onSave={(rules) => patchTransition(editing, rules)}
      />

      <ConfirmDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        title="Publish this workflow?"
        text={`Issues move under the published workflow. ${resolutionCount ? '' : 'No resolutions are set up yet. '}Statuses that issues use cannot be removed.`}
        confirmLabel="Publish"
        tone="default"
        onConfirm={publish}
      />
    </View>
  );
}

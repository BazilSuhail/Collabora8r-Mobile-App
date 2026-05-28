// feat(screens/automation/AutomationRulePage): build or edit an automation rule from a trigger, conditions and actions.
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import PageHead from '@/components/layout/PageHead';
import Button from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import Switch from '@/components/ui/Switch';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { createRule, getRule, listRuleRuns, updateRule } from '@/libs/api/automation';
import { paths } from '@/routes/paths';
import { useResource } from '@/utils/useResource';
import RuleSection, { ACTION_TYPES, CONDITION_OPS, TRIGGER_TYPES } from '@/components/automation/RuleSection';
import RunDetailDrawer from '@/components/automation/RunDetailDrawer';
import RunsTable from '@/components/automation/RunsTable';

const withId = (row) => ({ ...row, id: String(row.id ?? row._id) });
const LIST_LIMITS = { conditions: 10, actions: 10 };
const LIST_OPS = new Set(['in', 'notIn']);

const toParams = (config) =>
  Object.entries(config ?? {}).map(([k, v]) => ({
    k,
    v: typeof v === 'string' ? v : v == null ? '' : JSON.stringify(v),
  }));

const fromParams = (params) =>
  Object.fromEntries(params.filter((p) => p.k.trim()).map((p) => [p.k.trim(), p.v]));

const emptyDraft = () => ({
  name: '',
  description: '',
  enabled: false,
  trigger: { type: 'itemCreated', params: [] },
  conditions: [],
  actions: [{ type: 'setField', params: [] }],
});

// Server rule to the editable draft. Lists are kept as rows so each can carry its own errors.
const fromRule = (rule) => {
  const actions = (rule.actions ?? []).map((a) => ({ type: a.type, params: toParams(a.config) }));
  return {
    name: rule.name ?? '',
    description: rule.description ?? '',
    enabled: Boolean(rule.enabled),
    trigger: { type: rule.trigger?.type ?? 'itemCreated', params: toParams(rule.trigger?.config) },
    conditions: (rule.conditions ?? []).map((c) => ({
      field: c.field ?? '',
      op: c.op ?? 'equals',
      value: Array.isArray(c.value) ? c.value.join(', ') : c.value == null ? '' : String(c.value),
    })),
    actions: actions.length ? actions : emptyDraft().actions,
  };
};

const toBody = (d) => ({
  name: d.name.trim(),
  description: d.description.trim() || undefined,
  enabled: d.enabled,
  trigger: { type: d.trigger.type, config: fromParams(d.trigger.params) },
  conditions: d.conditions
    .filter((c) => c.field.trim())
    .map((c) => ({
      field: c.field.trim(),
      op: c.op,
      value: LIST_OPS.has(c.op) ? c.value.split(',').map((s) => s.trim()).filter(Boolean) : c.value,
    })),
  actions: d.actions.map((a) => ({ type: a.type, config: fromParams(a.params) })),
});

// 422 paths look like body.conditions.0.field. Keep the part after "body.".
const mapErrors = (list = []) => {
  const map = {};
  list.forEach((item) => {
    const key = String(item.path ?? '').replace(/^body\./, '');
    if (key && !map[key]) map[key] = item.message;
  });
  return map;
};

function ParamRows({ label, params, disabled, onChange }) {
  const update = (index, change) => onChange(params.map((p, i) => (i === index ? { ...p, ...change } : p)));
  return (
    <View className="gap-[8px]">
      {params.length > 0 ? <Text className="text-[13px] font-semibold text-foreground">{label}</Text> : null}
      {params.map((p, i) => (
        <View key={i} className="flex-row gap-[8px] items-end">
          <View className="flex-1 min-w-0">
            <Input
              label={`${label} ${i + 1} name`}
              hideLabel
              placeholder="Name"
              value={p.k}
              editable={!disabled}
              disabled={disabled}
              autoCapitalize="none"
              onChangeText={(text) => update(i, { k: text })}
            />
          </View>
          <View className="flex-1 min-w-0">
            <Input
              label={`${label} ${i + 1} value`}
              hideLabel
              placeholder="Value"
              value={p.v}
              editable={!disabled}
              disabled={disabled}
              autoCapitalize="none"
              onChangeText={(text) => update(i, { v: text })}
            />
          </View>
          <Button
            iconOnly
            variant="ghost"
            size="sm"
            icon="trash"
            accessibilityLabel={`Remove ${label.toLowerCase()} ${i + 1}`}
            disabled={disabled}
            onPress={() => onChange(params.filter((_, j) => j !== i))}
          />
        </View>
      ))}
      <View className="flex-row">
        <Button
          variant="soft"
          size="sm"
          icon="plus"
          disabled={disabled}
          onPress={() => onChange([...params, { k: '', v: '' }])}
        >
          {`Add ${label.toLowerCase()}`}
        </Button>
      </View>
    </View>
  );
}

export default function AutomationRulePage() {
  const { ruleId } = useLocalSearchParams();
  const isNew = !ruleId;
  const { projectId, can } = useProject();
  const toast = useToast();
  const router = useRouter();
  const navigation = useNavigation();
  const confirm = useConfirm();
  const canManage = can('automation.manage');

  const ruleRes = useResource(
    () => (isNew ? Promise.resolve({ data: null, meta: null }) : getRule(projectId, ruleId)),
    [ruleId, projectId],
  );
  const runsRes = useResource(
    () => (isNew ? Promise.resolve({ data: [], meta: null }) : listRuleRuns(projectId, ruleId, { limit: 10 })),
    [ruleId, projectId],
  );

  const [draft, setDraft] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [openRun, setOpenRun] = useState(null);
  // Set when leaving on purpose, so the unsaved-changes guard lets the screen go.
  const skipGuard = useRef(false);

  // Load the draft once per fetched rule. Saves update the baseline without resetting the draft.
  useEffect(() => {
    if (ruleRes.status !== 'success') return;
    const next = ruleRes.data ? fromRule(withId(ruleRes.data)) : emptyDraft();
    setDraft(next);
    setBaseline(JSON.stringify(next));
    setErrors({});
    setFormError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleRes.status, ruleId]);

  const dirty = draft !== null && JSON.stringify(draft) !== baseline;
  const rule = ruleRes.data ? withId(ruleRes.data) : null;
  const locked = !canManage || saving;

  const askDiscard = () =>
    confirm({
      title: 'Discard changes?',
      text: 'Your edits to this rule have not been saved.',
      confirmLabel: 'Discard',
      tone: 'danger',
    });

  // Every way off this screen (header back, swipe, hardware back) runs the dirty check.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!dirty || skipGuard.current) return;
      e.preventDefault();
      askDiscard().then((discard) => {
        if (!discard) return;
        skipGuard.current = true;
        navigation.dispatch(e.data.action);
      });
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, dirty]);

  const goToList = () => {
    skipGuard.current = true;
    if (router.canGoBack()) router.back();
    else router.replace(paths.automation(projectId));
  };

  const setField = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const setTrigger = (change) => setDraft((d) => ({ ...d, trigger: { ...d.trigger, ...change } }));
  const setList = (key, rows) => setDraft((d) => ({ ...d, [key]: rows }));
  const setCondition = (index, change) =>
    setDraft((d) => ({ ...d, conditions: d.conditions.map((c, i) => (i === index ? { ...c, ...change } : c)) }));
  const setAction = (index, change) =>
    setDraft((d) => ({ ...d, actions: d.actions.map((a, i) => (i === index ? { ...a, ...change } : a)) }));

  const save = async () => {
    if (!draft || saving || !canManage) return;
    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      const body = toBody(draft);
      const res = isNew ? await createRule(projectId, body) : await updateRule(projectId, ruleId, body);
      toast.success('Rule saved');
      setBaseline(JSON.stringify(draft));
      if (isNew) {
        const created = withId(res.data ?? {});
        if (created.id && created.id !== 'undefined') {
          skipGuard.current = true;
          router.replace(paths.automationRule(projectId, created.id));
        }
      } else {
        ruleRes.setData(res.data ?? ruleRes.data);
      }
    } catch (err) {
      if (err?.status === 422) {
        const map = mapErrors(err.errors);
        setErrors(map);
        if (!Object.keys(map).length) setFormError(err.message ?? 'Check the highlighted fields.');
      } else {
        setFormError(err?.message ?? 'Could not save the rule. Try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const leave = async () => {
    if (dirty) {
      const discard = await askDiscard();
      if (!discard) return;
    }
    goToList();
  };

  const back = { to: paths.automation(projectId), label: 'Automation', onPress: leave };

  if (ruleRes.status === 'error') {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 gap-4">
        <PageHead title="Automation rule" back={back} />
        <View className="p-4 rounded-card border border-border bg-surface">
          <EmptyState tone="error" title={ruleRes.error?.message ?? 'Could not load this rule.'} onRetry={ruleRes.reload} />
        </View>
      </ScrollView>
    );
  }

  const title = isNew ? 'New automation rule' : draft?.name || rule?.name || 'Automation rule';

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4" keyboardShouldPersistTaps="handled">
        <PageHead title={title} sub="When something happens, check the conditions, then take the actions." back={back} />

        {!draft ? (
          <Skeleton variant="cards" count={3} />
        ) : (
          <View className="gap-4">
            {!canManage ? (
              <View className="flex-row items-center gap-[8px]">
                <Icon name="lock" />
                <Text className="text-[13px] text-muted">Only project admins can change automation rules.</Text>
              </View>
            ) : null}

            <View className="p-5 gap-[16px] rounded-card border border-border bg-surface">
              <View className="flex-row items-center gap-[12px]">
                <View className="items-center justify-center w-[34px] h-[34px] rounded-ctl bg-well">
                  <Icon name="settings" className="text-muted" />
                </View>
                <Text accessibilityRole="header" className="text-[15px] font-bold text-foreground">
                  Rule details
                </Text>
              </View>
              <Input
                label="Rule name"
                value={draft.name}
                onChangeText={(text) => setField('name', text)}
                error={errors.name}
                editable={!locked}
                disabled={locked}
                hint="Shown in the rule list and run history."
                required
                maxLength={120}
              />
              <View className="gap-[6px]">
                <Text className="text-[13px] font-semibold text-foreground">Status</Text>
                <Switch
                  checked={draft.enabled}
                  onChange={(v) => setField('enabled', v)}
                  label="Turn on when saved"
                  disabled={locked}
                />
                <Text className="text-[12.5px] text-muted">Rules that are off never run.</Text>
              </View>
              <Input
                label="Description"
                as="textarea"
                multiline
                value={draft.description}
                onChangeText={(text) => setField('description', text)}
                error={errors.description}
                editable={!locked}
                disabled={locked}
                hint="Optional. Shown to people who manage this project."
              />
            </View>

            <RuleSection id="rule-when" icon="bolt" title="When" text="The event that starts this rule.">
              <Select
                label="Trigger"
                options={TRIGGER_TYPES}
                value={draft.trigger.type}
                onChange={(value) => setTrigger({ type: value })}
                error={errors['trigger.type']}
                hint="Starts the rule each time this happens."
                disabled={locked}
              />
              <ParamRows
                label="Trigger setting"
                params={draft.trigger.params}
                disabled={locked}
                onChange={(params) => setTrigger({ params })}
              />
            </RuleSection>

            <RuleSection id="rule-if" icon="filter" title="If" text="Every condition must match. Leave empty to match always.">
              {draft.conditions.length === 0 ? (
                <EmptyState icon="filter" title="No conditions" text="The rule runs for every matching event." />
              ) : null}
              {draft.conditions.map((c, i) => (
                <View key={i} className="gap-[8px] rounded-ctl border border-border p-[14px]">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[13px] font-semibold text-muted">{`Condition ${i + 1}`}</Text>
                    <Button
                      iconOnly
                      variant="ghost"
                      size="sm"
                      icon="trash"
                      accessibilityLabel={`Remove condition ${i + 1}`}
                      disabled={locked}
                      onPress={() => setList('conditions', draft.conditions.filter((_, j) => j !== i))}
                    />
                  </View>
                  <Input
                    label="Field"
                    placeholder="Field name"
                    value={c.field}
                    autoCapitalize="none"
                    onChangeText={(text) => setCondition(i, { field: text })}
                    error={errors[`conditions.${i}.field`]}
                    editable={!locked}
                    disabled={locked}
                  />
                  <Select
                    label="Operator"
                    options={CONDITION_OPS}
                    value={c.op}
                    onChange={(value) => setCondition(i, { op: value })}
                    error={errors[`conditions.${i}.op`]}
                    disabled={locked}
                  />
                  <Input
                    label="Value"
                    placeholder={LIST_OPS.has(c.op) ? 'Comma separated' : 'Value'}
                    value={c.value}
                    autoCapitalize="none"
                    onChangeText={(text) => setCondition(i, { value: text })}
                    hint={LIST_OPS.has(c.op) ? 'Separate several values with commas.' : undefined}
                    editable={!(locked || c.op === 'isEmpty' || c.op === 'isNotEmpty')}
                    disabled={locked || c.op === 'isEmpty' || c.op === 'isNotEmpty'}
                  />
                </View>
              ))}
              <View className="flex-row">
                <Button
                  variant="soft"
                  size="sm"
                  icon="plus"
                  disabled={locked || draft.conditions.length >= LIST_LIMITS.conditions}
                  onPress={() => setList('conditions', [...draft.conditions, { field: '', op: 'equals', value: '' }])}
                >
                  Add condition
                </Button>
              </View>
            </RuleSection>

            <RuleSection id="rule-then" icon="play" title="Then" text="Actions run in order when the conditions match.">
              {draft.actions.map((a, i) => (
                <View key={i} className="gap-[10px] rounded-ctl border border-border p-[14px]">
                  <View className="flex-row gap-[8px] items-end">
                    <View className="flex-1 min-w-0">
                      <Select
                        label={`Action ${i + 1}`}
                        options={ACTION_TYPES}
                        value={a.type}
                        onChange={(value) => setAction(i, { type: value })}
                        error={errors[`actions.${i}.type`]}
                        disabled={locked}
                      />
                    </View>
                    <Button
                      iconOnly
                      variant="ghost"
                      icon="trash"
                      accessibilityLabel={`Remove action ${i + 1}`}
                      disabled={locked || draft.actions.length <= 1}
                      onPress={() => setList('actions', draft.actions.filter((_, j) => j !== i))}
                    />
                  </View>
                  <ParamRows
                    label="Action setting"
                    params={a.params}
                    disabled={locked}
                    onChange={(params) => setAction(i, { params })}
                  />
                </View>
              ))}
              <View className="flex-row">
                <Button
                  variant="soft"
                  size="sm"
                  icon="plus"
                  disabled={locked || draft.actions.length >= LIST_LIMITS.actions}
                  onPress={() => setList('actions', [...draft.actions, { type: 'setField', params: [] }])}
                >
                  Add action
                </Button>
              </View>
            </RuleSection>

            {canManage ? (
              <View className="gap-[10px] pt-[4px]">
                {formError ? (
                  <Text accessibilityRole="alert" className="text-danger text-[13px] font-semibold">
                    {formError}
                  </Text>
                ) : null}
                <View className="flex-row items-center justify-end gap-[10px]">
                  <Button variant="ghost" onPress={leave} disabled={saving}>
                    Cancel
                  </Button>
                  <Button variant="ember" onPress={save} loading={saving} disabled={saving}>
                    Save rule
                  </Button>
                </View>
              </View>
            ) : null}

            {!isNew ? (
              <RuleSection id="rule-runs" icon="runs" title="Recent runs" text="The last runs of this rule.">
                <RunsTable
                  rows={runsRes.data ?? []}
                  status={runsRes.status}
                  error={runsRes.error}
                  onRetry={runsRes.reload}
                  onOpen={setOpenRun}
                  showRule={false}
                  label="Recent runs"
                  scrollEnabled={false}
                />
              </RuleSection>
            ) : null}
          </View>
        )}
      </ScrollView>

      <RunDetailDrawer
        open={Boolean(openRun)}
        onClose={() => setOpenRun(null)}
        run={openRun}
        ruleName={draft?.name || rule?.name}
      />
    </KeyboardAvoidingView>
  );
}

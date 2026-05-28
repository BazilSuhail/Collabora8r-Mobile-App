// feat(screens/projectSettings/components/TransitionEditor): edit a transition's required fields, validators and post-actions in a sheet.
import { useState } from 'react';
import { Text, View } from 'react-native';
import SideModal from '@/components/ui/SideModal';
import Button from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export const VALIDATOR_TYPES = [
  { value: 'requiredField', label: 'Field is required' },
  { value: 'assigneeRequired', label: 'Assignee is required' },
  { value: 'resolutionRequired', label: 'Resolution is required' },
  { value: 'onlyRoles', label: 'Only some roles' },
  { value: 'subtasksDone', label: 'Subtasks are done' },
];

export const POST_ACTION_TYPES = [
  { value: 'setResolution', label: 'Set resolution' },
  { value: 'clearResolution', label: 'Clear resolution' },
  { value: 'assignToReporter', label: 'Assign to reporter' },
];

export const PROJECT_ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'lead', label: 'Lead' },
  { value: 'developer', label: 'Developer' },
  { value: 'reporter', label: 'Reporter' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'guest', label: 'Guest' },
];

// Keeps only the keys the server accepts. Null and empty extras are dropped.
export const cleanRule = (rule) => ({
  type: rule.type,
  ...(rule.field ? { field: rule.field } : {}),
  ...(rule.roles?.length ? { roles: rule.roles } : {}),
  ...(rule.resolutionId ? { resolutionId: rule.resolutionId } : {}),
});

export const cleanTransitions = (transitions) =>
  transitions.map((t) => ({
    id: t.id,
    name: String(t.name ?? '').trim(),
    from: t.from ?? [],
    to: t.to,
    requiredFields: t.requiredFields ?? [],
    screenFields: t.screenFields ?? [],
    conditions: (t.conditions ?? []).map(cleanRule),
    validators: (t.validators ?? []).map(cleanRule),
    postActions: (t.postActions ?? []).map(cleanRule),
  }));

function RuleList({ title, icon, rules, onChange, types, readOnly, resolutions }) {
  const patch = (index, next) => onChange(rules.map((r, i) => (i === index ? next : r)));

  return (
    <View className="gap-2.5">
      <View className="flex-row items-center gap-2">
        <Icon name={icon} size={16} className="text-muted" />
        <Text accessibilityRole="header" className="text-sm font-bold text-foreground">
          {title}
        </Text>
      </View>
      <View className="gap-2.5">
        {rules.length === 0 ? <Text className="text-[13px] text-muted">None.</Text> : null}
        {rules.map((rule, index) => (
          <View key={index} className="gap-2 rounded-xl border border-border p-3">
            <View className="flex-row items-end gap-2">
              <View className="min-w-0 flex-1">
                <Select
                  label={`${title} type`}
                  value={rule.type}
                  options={types}
                  disabled={readOnly}
                  onChange={(type) => patch(index, { type })}
                />
              </View>
              {readOnly ? null : (
                <Button
                  iconOnly
                  variant="ghost"
                  size="sm"
                  icon="trash"
                  accessibilityLabel={`Remove ${title.toLowerCase()} ${index + 1}`}
                  onPress={() => onChange(rules.filter((_, i) => i !== index))}
                />
              )}
            </View>
            {rule.type === 'requiredField' ? (
              <Input
                label="Field name"
                value={rule.field ?? ''}
                disabled={readOnly}
                editable={!readOnly}
                autoCapitalize="none"
                onChangeText={(text) => patch(index, { ...rule, field: text })}
                hint="The issue field key, for example dueDate."
              />
            ) : null}
            {rule.type === 'onlyRoles' ? (
              <Select
                label="Roles"
                multiple
                value={rule.roles ?? []}
                options={PROJECT_ROLE_OPTIONS}
                disabled={readOnly}
                onChange={(roles) => patch(index, { ...rule, roles })}
              />
            ) : null}
            {rule.type === 'setResolution' ? (
              <Select
                label="Resolution"
                value={rule.resolutionId ?? ''}
                options={resolutions}
                placeholder="Pick a resolution"
                disabled={readOnly}
                onChange={(resolutionId) => patch(index, { ...rule, resolutionId })}
              />
            ) : null}
          </View>
        ))}
        {readOnly ? null : (
          <View className="items-start">
            <Button variant="soft" size="sm" icon="plus" onPress={() => onChange([...rules, { type: types[0].value }])}>
              {`Add ${title.toLowerCase().replace(/s$/, '')}`}
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}

// Mounted once per transition. The parent passes a key so the local draft starts from the saved rules.
export default function TransitionEditor({ open, onClose, transition, resolutions = [], readOnly = false, onSave }) {
  const [requiredText, setRequiredText] = useState(() => (transition?.requiredFields ?? []).join(', '));
  const [validators, setValidators] = useState(() => (transition?.validators ?? []).map(cleanRule));
  const [postActions, setPostActions] = useState(() => (transition?.postActions ?? []).map(cleanRule));

  const save = () => {
    const requiredFields = requiredText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onSave?.({ requiredFields, validators, postActions });
    onClose?.();
  };

  const resolutionOptions = resolutions.map((r) => ({ value: r._id, label: r.name }));

  return (
    <SideModal
      open={open}
      onClose={() => onClose?.()}
      title={transition?.name ? `Rules for ${transition.name}` : 'Transition rules'}
      subtitle="Checks run before the move. Actions run after it."
      footer={
        readOnly ? (
          <View className="flex-row gap-2.5">
            <Button variant="ghost" onPress={() => onClose?.()} className="flex-1">
              Close
            </Button>
          </View>
        ) : (
          <View className="flex-row gap-2.5">
            <Button variant="ghost" onPress={() => onClose?.()} className="flex-1">
              Cancel
            </Button>
            <Button variant="ember" onPress={save} className="flex-1">
              Apply rules
            </Button>
          </View>
        )
      }
    >
      <View className="gap-[18px]">
        <Input
          label="Required fields"
          hint="Comma separated issue fields, for example dueDate, estimate"
          value={requiredText}
          disabled={readOnly}
          editable={!readOnly}
          autoCapitalize="none"
          onChangeText={setRequiredText}
        />
        <RuleList
          title="Validators"
          icon="check"
          rules={validators}
          onChange={setValidators}
          types={VALIDATOR_TYPES}
          readOnly={readOnly}
          resolutions={resolutionOptions}
        />
        <RuleList
          title="Post-actions"
          icon="bolt"
          rules={postActions}
          onChange={setPostActions}
          types={POST_ACTION_TYPES}
          readOnly={readOnly}
          resolutions={resolutionOptions}
        />
      </View>
    </SideModal>
  );
}

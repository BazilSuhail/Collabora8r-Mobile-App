// feat(screens/integrations/components/WebhookFormModal): create or edit a webhook's URL, events and active state.
import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useToast } from '@/context/ToastContext';
import { createWebhook, updateWebhook } from '@/libs/api/automation';
import { SelectField, Sheet, SheetButton, TextField } from '@/components/issues/sheets';

// Mirrors the server EVENT_TYPES list. Creating a webhook needs at least one event.
export const WEBHOOK_EVENTS = [
  { value: 'issue.created', label: 'Issue created' },
  { value: 'issue.updated', label: 'Issue updated' },
  { value: 'issue.transitioned', label: 'Issue status changed' },
  { value: 'issue.deleted', label: 'Issue deleted' },
  { value: 'comment.added', label: 'Comment added' },
  { value: 'sprint.started', label: 'Sprint started' },
  { value: 'sprint.completed', label: 'Sprint completed' },
  { value: 'member.added', label: 'Member added' },
  { value: 'member.removed', label: 'Member removed' },
  { value: 'release.shipped', label: 'Release shipped' },
  { value: 'page.updated', label: 'Wiki page updated' },
  { value: 'form.submitted', label: 'Form submitted' },
  { value: 'approval.decided', label: 'Approval decided' },
];

const idOf = (row) => String(row?.id ?? row?._id ?? '');

// onCreated receives the new webhook, which carries its signing secret once.
export default function WebhookFormModal({ open, onClose, pid, webhook, onSaved, onCreated }) {
  const toast = useToast();
  const editing = Boolean(webhook);
  const [values, setValues] = useState({
    name: webhook?.name ?? '',
    url: webhook?.url ?? '',
    events: webhook?.events ?? [],
    active: webhook ? Boolean(webhook.active) : true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setValues((prev) => ({ ...prev, [k]: v }));

  const submit = async () => {
    const body = {
      name: values.name.trim(),
      url: values.url.trim(),
      events: values.events,
      active: values.active,
    };
    const next = {};
    if (!body.name) next.name = 'Enter a name.';
    if (!body.url) next.url = 'Enter the endpoint URL.';
    if (!body.events.length) next.events = 'Pick at least one event.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      if (editing) {
        const res = await updateWebhook(pid, idOf(webhook), body);
        toast.success('Webhook saved');
        onSaved?.(res.data);
      } else {
        const res = await createWebhook(pid, body);
        toast.success('Webhook saved');
        onCreated?.(res.data);
      }
      onClose?.();
    } catch (err) {
      setErrors(Object.fromEntries((err?.errors ?? []).filter((e) => e.field).map((e) => [e.field, e.message])));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? 'Edit webhook' : 'New webhook'}
      subtitle="Events are sent as signed JSON posts to the URL."
      footer={
        <>
          <SheetButton label="Cancel" onPress={onClose} />
          <SheetButton variant="ember" label={editing ? 'Save' : 'Create webhook'} loading={saving} onPress={submit} />
        </>
      }
    >
      <TextField
        label="Name"
        value={values.name}
        onChangeText={(v) => set('name', v)}
        error={errors.name}
        hint="Shown in the webhook list."
        maxLength={120}
      />
      <View className="flex-row items-center justify-between gap-[10px]">
        <View className="flex-1">
          <Text className="text-foreground font-semibold text-[14px]">Active</Text>
          <Text className="text-muted text-[12px]">Inactive webhooks send nothing.</Text>
        </View>
        <Switch value={values.active} onValueChange={(v) => set('active', v)} accessibilityLabel="Active" />
      </View>
      <TextField
        label="Endpoint URL"
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="https://example.com/hooks/collabor8r"
        value={values.url}
        onChangeText={(v) => set('url', v)}
        error={errors.url}
        hint="Use an https address that accepts POST requests."
      />
      <SelectField
        label="Events"
        multiple
        options={WEBHOOK_EVENTS}
        value={values.events}
        onChange={(v) => set('events', v)}
        placeholder="Choose events"
        hint="Pick at least one event to send."
      />
      {errors.events ? <Text className="text-danger text-[12px]">{errors.events}</Text> : null}
    </Sheet>
  );
}

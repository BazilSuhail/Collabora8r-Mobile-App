// feat(screens/integrations/components/IntegrationFormModal): configure a code, chat or import integration and connect it.
import { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { connectIntegration, createIntegration, updateIntegration } from '@/libs/api/automation';
import { Sheet, SheetButton, TextField } from '@/components/issues/sheets';
import { PROVIDER_BY_KEY } from '@/components/integrations/IntegrationCard';

// Config keys per provider. Keys that look secret are masked by the server on read.
const CONFIG_FIELDS = {
  github: [
    { key: 'repo', label: 'Repository', placeholder: 'owner/name', hint: 'The owner and repository name, as in the URL.' },
    { key: 'token', label: 'Access token', secret: true, hint: 'Needs read access to the repository.' },
  ],
  gitlab: [
    { key: 'project', label: 'Project path', placeholder: 'group/project', hint: 'The group and project path, as in the URL.' },
    { key: 'token', label: 'Access token', secret: true, hint: 'Needs read access to the project.' },
  ],
  bitbucket: [
    { key: 'workspace', label: 'Workspace', placeholder: 'workspace-slug', hint: 'The workspace slug from the URL.' },
    { key: 'token', label: 'App password', secret: true, hint: 'An app password with repository read access.' },
  ],
  slack: [
    { key: 'channel', label: 'Channel', placeholder: '#releases', hint: 'Where updates are posted.' },
    { key: 'webhookUrl', label: 'Incoming webhook URL', type: 'url', hint: 'Created in your Slack app settings.' },
  ],
  teams: [{ key: 'webhookUrl', label: 'Incoming webhook URL', type: 'url', hint: 'Created in your Teams channel connectors.' }],
  google: [{ key: 'space', label: 'Chat space or folder ID', hint: 'Found at the end of the space or folder URL.' }],
  jira_import: [
    { key: 'site', label: 'Jira site URL', type: 'url', placeholder: 'https://example.atlassian.net', hint: 'The base address of your Jira site.' },
  ],
};

const idOf = (row) => String(row?.id ?? row?._id ?? '');

export default function IntegrationFormModal({ open, onClose, pid, provider, integration, onSaved }) {
  const toast = useToast();
  const meta = PROVIDER_BY_KEY[provider] ?? { name: provider, desc: '' };
  const fields = CONFIG_FIELDS[provider] ?? [];
  const editing = Boolean(integration);

  const [values, setValues] = useState(() => ({
    displayName: integration?.displayName ?? meta.name,
    ...Object.fromEntries(fields.map((f) => [f.key, integration?.config?.[f.key] ?? ''])),
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setValues((prev) => ({ ...prev, [k]: v }));

  const submit = async () => {
    const displayName = String(values.displayName ?? '').trim();
    if (!displayName) {
      setErrors({ displayName: 'Enter a display name.' });
      return;
    }
    setErrors({});
    const config = Object.fromEntries(fields.map((f) => [f.key, values[f.key] ?? '']).filter(([, v]) => v !== ''));
    setSaving(true);
    try {
      if (editing) {
        const res = await updateIntegration(pid, idOf(integration), { displayName, config });
        toast.success('Saved');
        onSaved?.(res.data);
        onClose?.();
        return;
      }
      const created = await createIntegration(pid, { provider, displayName, config });
      try {
        const connected = await connectIntegration(pid, idOf(created.data));
        toast.success(`Connected ${meta.name}`);
        onSaved?.(connected.data);
      } catch {
        // Saved but not connected. The card offers Connect.
        onSaved?.(created.data);
      }
      onClose?.();
    } catch (err) {
      const fieldErrors = Object.fromEntries((err?.errors ?? []).filter((e) => e.field).map((e) => [e.field, e.message]));
      setErrors(fieldErrors);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? `Configure ${meta.name}` : `Connect ${meta.name}`}
      subtitle={meta.desc}
      footer={
        <>
          <SheetButton label="Cancel" onPress={onClose} />
          <SheetButton variant="ember" label={editing ? 'Save' : 'Connect'} loading={saving} onPress={submit} />
        </>
      }
    >
      <TextField
        label="Display name"
        value={values.displayName}
        onChangeText={(v) => set('displayName', v)}
        error={errors.displayName}
        hint="Shown on the integration card."
        maxLength={120}
      />
      {fields.map((f) => (
        <TextField
          key={f.key}
          label={f.label}
          secureTextEntry={Boolean(f.secret)}
          textContentType={f.secret ? 'password' : 'none'}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={f.type === 'url' ? 'url' : 'default'}
          placeholder={f.placeholder}
          hint={f.secret && editing ? 'Saved values stay hidden. Type a new value to replace it.' : f.hint}
          value={values[f.key] ?? ''}
          onChangeText={(v) => set(f.key, v)}
          error={errors[f.key]}
        />
      ))}
    </Sheet>
  );
}

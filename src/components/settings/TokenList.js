// feat(components/settings/TokenList): list personal API tokens, create one with its scopes and show it once, and revoke tokens.
import { useState } from 'react';
import { Text, View } from 'react-native';
import { createToken, listTokens, revokeToken } from '@/libs/api/users';
import { useResource } from '@/utils/useResource';
import { useToast } from '@/context/ToastContext';
import { relativeTime } from '@/utils/format';
import { TOKEN_SCOPES } from '@/metadata/settings';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import FormModal from '@/components/ui/FormModal';
import Input from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import SecretRevealModal from '@/components/shared/SecretRevealModal';

const SCOPE_OPTIONS = TOKEN_SCOPES.map((s) => ({ value: s.id, label: s.label }));

const textOf = (e) => (typeof e === 'string' ? e : (e?.target?.value ?? e?.nativeEvent?.text ?? ''));

// The expiry field takes YYYY-MM-DD (no native web date input on RN). The server wants an ISO datetime in the future.
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const toExpiry = (day) => (day ? new Date(`${day}T23:59:59Z`).toISOString() : null);

export default function TokenList() {
  const toast = useToast();
  const tokens = useResource(() => listTokens(), []);
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState(null);
  const [toRevoke, setToRevoke] = useState(null);

  const list = tokens.data ?? [];

  const create = async (values) => {
    const day = (values.expiresAt ?? '').trim();
    if (day && (!DAY_RE.test(day) || Number.isNaN(new Date(`${day}T23:59:59Z`).getTime()))) {
      const err = new Error('Use the format YYYY-MM-DD.');
      err.status = 422;
      err.errors = [{ path: 'expiresAt', message: 'Use the format YYYY-MM-DD.' }];
      throw err;
    }
    const body = {
      name: values.name.trim(),
      scopes: values.scopes ?? [],
      expiresAt: toExpiry(day),
    };
    const res = await createToken(body);
    const { token, ...view } = res.data;
    tokens.setData((prev) => [view, ...(prev ?? [])]);
    setRevealed(token);
    toast.success('Token created. Copy it now.');
  };

  const revoke = async () => {
    const t = toRevoke;
    if (!t) return;
    await revokeToken(t.id);
    tokens.setData((prev) => (prev ?? []).filter((x) => x.id !== t.id));
    toast.success('Token revoked');
  };

  return (
    <View className="bg-surface border border-border rounded-card p-5 gap-4">
      <View className="flex-row items-start gap-3">
        <View className="w-[34px] h-[34px] rounded-ctl bg-well items-center justify-center">
          <Icon name="key" />
        </View>
        <View className="flex-1 min-w-0">
          <Text className="text-[17px] font-display tracking-[-0.17px] text-foreground">API tokens</Text>
          <Text className="text-muted text-[13.5px]">Personal tokens for scripts. Each token only has the scopes you give it.</Text>
        </View>
      </View>
      <Button variant="soft" icon="plus" onClick={() => setCreating(true)}>
        New token
      </Button>

      {tokens.status === 'loading' ? (
        <View accessibilityState={{ busy: true }} className="gap-3">
          <Skeleton variant="feed" count={3} />
        </View>
      ) : null}

      {tokens.status === 'error' ? (
        <EmptyState tone="error" title="Tokens did not load" text={tokens.error?.message} onRetry={tokens.reload} />
      ) : null}

      {tokens.status === 'success' && !list.length ? (
        <EmptyState icon="key" title="No API tokens" text="Create a token to call the API from scripts." />
      ) : null}

      {tokens.status === 'success' && list.length ? (
        <View>
          {list.map((t, i) => (
            <View key={t.id} className={`flex-row flex-wrap items-center gap-3 py-[14px] ${i > 0 ? 'border-t border-border' : ''}`}>
              <View className="flex-1 min-w-0">
                <Text className="font-bold text-foreground" numberOfLines={1}>
                  {t.name}
                </Text>
                <Text className="text-muted text-[13px] mt-[2px]">
                  <Text className="font-mono">{t.tokenPrefix}…</Text>
                  {' · '}
                  {t.lastUsedAt ? `Last used ${relativeTime(t.lastUsedAt)}` : 'Never used'}
                </Text>
                <View className="mt-2 flex-row flex-wrap gap-[6px]">
                  {t.scopes?.length ? (
                    t.scopes.map((s) => (
                      <Badge key={s} tone="iris">
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <Badge tone="plain">No scopes</Badge>
                  )}
                </View>
              </View>
              <Button size="sm" variant="ghost" icon="trash" onClick={() => setToRevoke(t)}>
                Revoke
              </Button>
            </View>
          ))}
        </View>
      ) : null}

      <FormModal
        open={creating}
        onClose={() => setCreating(false)}
        title="New API token"
        description="Pick a name and the scopes this token may use."
        submitLabel="Create token"
        initialValues={{ name: '', scopes: [], expiresAt: '' }}
        onSubmit={create}
        fields={({ values, set, errors }) => (
          <View className="gap-4">
            <Input
              label="Name"
              value={values.name}
              onChange={(e) => set('name', textOf(e))}
              error={errors.name}
              hint="Helps you recognise where the token is used."
              required
            />
            <Select
              label="Scopes"
              multiple
              value={values.scopes}
              onChange={(next) => set('scopes', next)}
              options={SCOPE_OPTIONS}
              placeholder="No scopes"
              hint="Choose only what the script needs."
            />
            <Input
              label="Expires on"
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
              maxLength={10}
              value={values.expiresAt}
              onChange={(e) => set('expiresAt', textOf(e))}
              error={errors.expiresAt}
              hint="Leave empty for no expiry."
            />
          </View>
        )}
      />

      <SecretRevealModal
        open={revealed !== null}
        onClose={() => setRevealed(null)}
        title="Your new API token"
        description="Copy it now. For your security it is shown only once."
        value={revealed ?? ''}
        label="API token"
        doneLabel="Done"
      />

      <ConfirmDialog
        open={toRevoke !== null}
        onClose={() => setToRevoke(null)}
        title={toRevoke ? `Revoke ${toRevoke.name}?` : 'Revoke token?'}
        text="Scripts that use this token stop working straight away."
        confirmLabel="Revoke token"
        tone="danger"
        onConfirm={revoke}
      />
    </View>
  );
}

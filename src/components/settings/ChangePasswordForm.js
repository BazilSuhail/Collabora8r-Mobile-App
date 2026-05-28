// feat(components/settings/ChangePasswordForm): change the password, which signs every session out and sends the user to sign in again.
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useMutation } from '@/utils/useMutation';
import { paths } from '@/routes/paths';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';

const textOf = (e) => (typeof e === 'string' ? e : (e?.target?.value ?? e?.nativeEvent?.text ?? ''));

export default function ChangePasswordForm() {
  const { changePassword } = useAuth();
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [clientError, setClientError] = useState(null);
  // No toast options here: AuthContext already toasts "Password changed. Sign in again."
  // The wrapper resolves to true so a successful run is told apart from a failed one.
  const mutation = useMutation(async (body) => {
    await changePassword(body);
    return true;
  });

  const reset = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
  };

  const submit = async () => {
    if (mutation.pending) return;
    setClientError(null);
    if (next.length < 8) {
      setClientError('The new password needs at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      setClientError('The new passwords do not match.');
      return;
    }
    const res = await mutation.run({ currentPassword: current, newPassword: next });
    if (res === true) {
      reset();
      // Forced re-login: the tokens are already cleared, so replace the stack with sign in.
      router.replace(paths.login());
    }
  };

  const fieldErrors = mutation.fieldErrors ?? {};
  const serverMessage = mutation.error && !Object.keys(fieldErrors).length ? mutation.error.message : null;
  const message = clientError ?? serverMessage;

  return (
    <View className="bg-surface border border-border rounded-card p-5 gap-4">
      <View className="flex-row items-start gap-3">
        <View className="w-[34px] h-[34px] rounded-ctl bg-well items-center justify-center">
          <Icon name="lock" />
        </View>
        <View className="flex-1 min-w-0">
          <Text className="text-[17px] font-display tracking-[-0.17px] text-foreground">Password</Text>
          <Text className="text-muted text-[13.5px]">
            Changing your password signs you out everywhere. Sign in again with the new password.
          </Text>
        </View>
      </View>

      <View className="gap-[14px]">
        <Input
          label="Current password"
          secureTextEntry
          textContentType="password"
          autoComplete="current-password"
          autoCapitalize="none"
          value={current}
          onChange={(e) => setCurrent(textOf(e))}
          error={fieldErrors.currentPassword}
          hint="Needed to confirm it is you."
          required
        />
        <Input
          label="New password"
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          autoCapitalize="none"
          hint="At least 8 characters."
          value={next}
          onChange={(e) => setNext(textOf(e))}
          error={fieldErrors.newPassword}
          required
        />
        <Input
          label="Confirm new password"
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          autoCapitalize="none"
          hint="Re-enter the new password."
          value={confirm}
          onChange={(e) => setConfirm(textOf(e))}
          onSubmitEditing={submit}
          returnKeyType="done"
          required
        />

        {message ? (
          <Text accessibilityLiveRegion="assertive" className="text-danger text-[13px] font-semibold">
            {message}
          </Text>
        ) : null}

        <Button variant="ember" onClick={submit} loading={mutation.pending} disabled={!current || !next || !confirm}>
          Change password
        </Button>
      </View>
    </View>
  );
}

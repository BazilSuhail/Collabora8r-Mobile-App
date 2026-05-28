// feat(app/(public)/register): create an account and sign the new user straight in.
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Link, Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { toFieldErrors } from '@/utils/formErrors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Illustration from '@/components/ui/Illustration';
import { Icon } from '@/components/ui/Icon';

export default function RegisterPage() {
  const { status, register } = useAuth();
  const router = useRouter();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  if (status === 'authenticated') return <Redirect href="/dashboard" />;

  const submit = async () => {
    if (pending) return;
    setFormError(null);
    if (password !== confirm) {
      setFieldErrors({ confirm: 'The passwords do not match.' });
      return;
    }
    setFieldErrors({});
    setPending(true);
    try {
      await register({
        email: email.trim(),
        password,
        ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
      });
      router.replace('/dashboard');
    } catch (err) {
      if (err?.status === 409) {
        setFieldErrors({ email: 'This email is already registered.' });
      } else if (err?.status === 422) {
        const map = toFieldErrors(err.errors);
        setFieldErrors(map);
        if (!Object.keys(map).length) setFormError('Check the highlighted fields.');
      } else if (err?.status === 429) {
        setFormError(err.message || 'Too many attempts. Try again in a few minutes.');
      } else {
        setFormError(err?.message || 'Could not create your account. Try again.');
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow justify-center px-4 py-8 gap-[18px]"
        keyboardShouldPersistTaps="handled"
      >
        <Illustration name="auth" className="self-center w-[180px] h-[140px]" />

        <View className="gap-[10px]">
          <View className="items-center justify-center w-[34px] h-[34px] rounded-ctl bg-well">
            <Icon name="user" className="text-muted" />
          </View>
          <Text accessibilityRole="header" className="font-display text-[22px] tracking-[-0.33px] text-foreground">
            Create account
          </Text>
          <Text className="text-muted text-[14px]">Passwords need at least 8 characters.</Text>
        </View>

        <View className="gap-[14px]">
          <Input
            label="Display name"
            autoComplete="name"
            textContentType="name"
            hint="Optional. Shown to people you work with."
            value={displayName}
            onChangeText={setDisplayName}
            error={fieldErrors.displayName}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus?.()}
          />
          <Input
            ref={emailRef}
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            error={fieldErrors.email}
            hint="Use an address you can access."
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus?.()}
            required
          />
          <Input
            ref={passwordRef}
            label="Password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
            hint="At least 8 characters."
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus?.()}
            required
          />
          <Input
            ref={confirmRef}
            label="Confirm password"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            value={confirm}
            onChangeText={setConfirm}
            error={fieldErrors.confirm}
            hint="Re-enter the same password."
            returnKeyType="go"
            onSubmitEditing={submit}
            required
          />

          {formError ? (
            <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-danger text-[13px] font-semibold">
              {formError}
            </Text>
          ) : null}

          <Button variant="ember" loading={pending} onPress={submit} className="w-full justify-center">
            Create account
          </Button>
        </View>

        <View className="flex-row flex-wrap justify-center items-center">
          <Text className="text-muted text-[14px]">Already have an account? </Text>
          <Link href="/login" replace>
            <Text className="font-semibold text-ember-t text-[14px]">Sign in</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// feat(app/(public)/login): sign a user in with email and password and return them to the page they asked for.
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Link, Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { toFieldErrors } from '@/utils/formErrors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Illustration from '@/components/ui/Illustration';
import { Icon } from '@/components/ui/Icon';

const DEFAULT_TARGET = '/dashboard';

// The auth gate passes the original route as a `from` search param.
function targetFrom(from) {
  const path = Array.isArray(from) ? from[0] : from;
  if (!path || typeof path !== 'string') return DEFAULT_TARGET;
  return path.startsWith('/login') ? DEFAULT_TARGET : path;
}

function loginMessage(err) {
  if (err?.status === 401) return 'Invalid email or password.';
  if (err?.status === 403) return 'This account is not active.';
  if (err?.status === 429) return err.message || 'Too many attempts. Try again in a few minutes.';
  return err?.message || 'Could not sign you in. Try again.';
}

export default function LoginPage() {
  const { status, login } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const target = targetFrom(params.from);
  const passwordRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  if (status === 'authenticated') return <Redirect href={target} />;

  const submit = async () => {
    if (pending) return;
    setPending(true);
    setFormError(null);
    setFieldErrors({});
    try {
      await login(email.trim(), password);
      router.replace(target);
    } catch (err) {
      if (err?.status === 422) {
        const map = toFieldErrors(err.errors);
        setFieldErrors(map);
        if (!Object.keys(map).length) setFormError('Check your email and password.');
      } else {
        setFormError(loginMessage(err));
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
            <Icon name="lock" className="text-muted" />
          </View>
          <Text accessibilityRole="header" className="font-display text-[22px] tracking-[-0.33px] text-foreground">
            Sign in
          </Text>
          <Text className="text-muted text-[14px]">Use your Collabor8r email and password.</Text>
        </View>

        <View className="gap-[14px]">
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={fieldErrors.email}
            hint="Use the address you registered with."
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus?.()}
            required
          />

          <View className="relative">
            <Input
              ref={passwordRef}
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!reveal}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={submit}
              error={fieldErrors.password}
              hint="Enter the password you set for this account."
              required
              className="pr-[48px]"
            />
            <Button
              iconOnly
              variant="ghost"
              size="sm"
              icon={reveal ? 'eyeOff' : 'eye'}
              pressed={reveal}
              accessibilityLabel={reveal ? 'Hide password' : 'Show password'}
              onPress={() => setReveal((r) => !r)}
              className="absolute right-[8px] top-[30px]"
            />
          </View>

          {formError ? (
            <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-danger text-[13px] font-semibold">
              {formError}
            </Text>
          ) : null}

          <Button variant="ember" loading={pending} onPress={submit} className="w-full justify-center">
            Sign in
          </Button>
        </View>

        <View className="flex-row flex-wrap justify-center items-center">
          <Text className="text-muted text-[14px]">New to Collabor8r? </Text>
          <Link href="/register" replace>
            <Text className="font-semibold text-ember-t text-[14px]">Create an account</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

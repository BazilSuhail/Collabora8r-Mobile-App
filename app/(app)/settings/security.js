// feat(app/(app)/settings/security): change the password, review sessions, manage API tokens and sign out everywhere.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import PageHead from '@/components/layout/PageHead';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ChangePasswordForm from '@/components/settings/ChangePasswordForm';
import SessionList from '@/components/settings/SessionList';
import TokenList from '@/components/settings/TokenList';

export default function SecurityPage() {
  const { logoutAll } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4 pb-10" keyboardShouldPersistTaps="handled">
        <PageHead title="Security" sub="Password, signed-in devices and API tokens." />

        <ChangePasswordForm />
        <SessionList />
        <TokenList />

        <View className="bg-surface border border-danger rounded-card p-6 gap-[14px]">
          <View>
            <Text className="text-[17px] font-display tracking-[-0.17px] text-danger">Sign out everywhere</Text>
            <Text className="text-muted text-[13.5px]">
              Every device signed in to your account is signed out, including this one.
            </Text>
          </View>
          <Button variant="danger" icon="logout" onClick={() => setConfirmOpen(true)}>
            Sign out everywhere
          </Button>
        </View>
      </ScrollView>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Sign out everywhere?"
        text="Every device, including this one, will need to sign in again."
        confirmLabel="Sign out everywhere"
        tone="danger"
        onConfirm={() => logoutAll()}
      />
    </KeyboardAvoidingView>
  );
}

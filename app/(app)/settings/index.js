// feat(app/(app)/settings/index): settings root screen. On mobile the web sidebar becomes a list that pushes each section.
import { ScrollView, View } from 'react-native';
import PageHead from '@/components/layout/PageHead';
import SettingsNav from '@/components/settings/SettingsNav';

export default function SettingsLayout() {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 gap-4 pb-10">
      <PageHead title="Settings" sub="Your profile, notifications, security and appearance." />
      <View>
        <SettingsNav />
      </View>
    </ScrollView>
  );
}

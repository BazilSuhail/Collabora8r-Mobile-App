// feat(screens/integrations/components/IntegrationCard): show one provider's connection state with its connect, configure and more actions.
import { Text, View } from 'react-native';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Highlight from '@/components/ui/Highlight';
import { Icon } from '@/components/ui/Icon';
import { relativeTime } from '@/utils/format';
import { MoreButton } from '@/components/issues/sheets';

// Provider catalog. Shared by the page, the card and the form sheet.
export const PROVIDERS = [
  { key: 'github', name: 'GitHub', desc: 'Link commits and pull requests to issues.', cat: 'Code', icon: 'github' },
  { key: 'gitlab', name: 'GitLab', desc: 'Link merge requests and pipelines to issues.', cat: 'Code', icon: 'gitlab' },
  { key: 'bitbucket', name: 'Bitbucket', desc: 'Track commits and pull requests from Bitbucket.', cat: 'Code', icon: 'code' },
  { key: 'slack', name: 'Slack', desc: 'Post issue updates to a channel.', cat: 'Chat', icon: 'slack' },
  { key: 'teams', name: 'Microsoft Teams', desc: 'Send issue updates to a Teams channel.', cat: 'Chat', icon: 'chat' },
  { key: 'google', name: 'Google Workspace', desc: 'Link Drive documents and Chat spaces to issues.', cat: 'Chat', icon: 'web' },
  { key: 'jira_import', name: 'Jira import', desc: 'Bring issues across from a Jira export.', cat: 'Import', icon: 'import' },
];

export const PROVIDER_BY_KEY = Object.fromEntries(PROVIDERS.map((p) => [p.key, p]));
export const CATEGORIES = ['Code', 'Chat', 'Import'];

const STATUS = {
  connected: { tone: 'spruce', label: 'Connected', dot: 'bg-success' },
  error: { tone: 'ember', label: 'Connection error', dot: 'bg-danger' },
  disconnected: { tone: 'plain', label: 'Not connected', dot: 'bg-muted' },
};

export default function IntegrationCard({ item, integration, query = '', canManage, busy = false, onPrimary, menuItems }) {
  const status = integration?.status ?? 'disconnected';
  const meta = STATUS[status] ?? STATUS.disconnected;
  const connected = status === 'connected';
  const name = integration?.displayName || item.name;

  let detail = meta.label;
  if (connected && integration.lastSyncAt) detail = `Connected, synced ${relativeTime(integration.lastSyncAt)}`;
  if (status === 'error' && integration.lastError) detail = integration.lastError;

  return (
    <View className="bg-surface border border-border rounded-[16px] gap-[12px] pt-[16px] px-[16px] pb-[14px]">
      <View className="flex-row items-start justify-between gap-[10px]">
        <View className="items-center justify-center w-[46px] h-[46px] rounded-[15px] bg-background">
          <Icon name={item.icon} size={22} />
        </View>
        <Badge tone="plain">{item.cat}</Badge>
      </View>

      <View className="min-w-0">
        <Text className="text-foreground font-semibold text-[16.5px]">
          <Highlight text={name} query={query} />
        </Text>
        <Text className="mt-[4px] text-[13px] leading-[19px] text-muted">
          <Highlight text={item.desc} query={query} />
        </Text>
      </View>

      <View className="flex-row flex-wrap items-center justify-between gap-[10px] pt-[12px] border-t border-border">
        <View className="flex-row flex-1 min-w-0 items-center gap-[8px]">
          <View className={`w-[8px] h-[8px] rounded-full ${meta.dot}`} />
          <Text numberOfLines={1} className="flex-1 text-[12.5px] font-semibold text-muted" accessibilityRole="text">
            {detail}
          </Text>
        </View>

        {canManage ? (
          <View className="flex-row items-center gap-[6px]">
            <Button
              size="sm"
              variant={connected ? 'ghost' : 'ember'}
              icon={connected ? 'gear' : 'plug'}
              loading={busy}
              onClick={onPrimary}
              onPress={onPrimary}
            >
              {connected ? 'Configure' : 'Connect'}
            </Button>
            {menuItems ? <MoreButton label={`More actions for ${name}`} items={menuItems} /> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

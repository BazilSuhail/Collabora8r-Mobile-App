// feat(screens/automation/components/RunDetailDrawer): show one automation run's result, error and step log in a sheet.
import { Text, View } from 'react-native';
import SideModal from '@/components/ui/SideModal';
import Badge from '@/components/ui/Badge';
import { formatDateTime, formatDuration } from '@/utils/format';

const RESULT = {
  success: { tone: 'spruce', label: 'Success' },
  failed: { tone: 'ember', label: 'Failed' },
  skipped: { tone: 'plain', label: 'Skipped' },
};

// Log entries are free-form. Strings show as they are, objects show their message or JSON.
const describeStep = (entry) => {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object') {
    if (typeof entry.message === 'string') return entry.message;
    return JSON.stringify(entry);
  }
  return String(entry);
};

function Row({ label, children }) {
  return (
    <View className="flex-row gap-[16px] items-center">
      <Text className="w-[120px] text-[13.5px] text-muted">{label}</Text>
      <View className="flex-1 min-w-0">
        {typeof children === 'string' ? <Text className="text-[13.5px] text-foreground">{children}</Text> : children}
      </View>
    </View>
  );
}

export default function RunDetailDrawer({ open, onClose, run, ruleName }) {
  if (!run) return null;
  const meta = RESULT[run.status] ?? RESULT.skipped;
  const log = Array.isArray(run.log) ? run.log : [];

  return (
    <SideModal open={open} onClose={onClose} title="Run details" subtitle={ruleName ?? 'Automation rule'}>
      <View className="gap-[16px]">
        <View className="gap-[10px]">
          <Row label="Result">
            <View className="flex-row">
              <Badge tone={meta.tone} variant="status">
                {meta.label}
              </Badge>
            </View>
          </Row>
          <Row label="Started">{run.at ? formatDateTime(run.at) : '—'}</Row>
          <Row label="Duration">
            {run.durationMs != null ? formatDuration(Math.round(run.durationMs / 1000)) : '—'}
          </Row>
          <Row label="Triggered by">{run.triggeredBy ? String(run.triggeredBy) : '—'}</Row>
        </View>

        {run.error ? (
          <Text
            accessibilityRole="alert"
            className="rounded-ctl bg-ember-soft px-[14px] py-[10px] text-[13px] font-semibold text-danger"
          >
            {run.error}
          </Text>
        ) : null}

        <View accessibilityLabel="Step log" className="gap-[8px]">
          <Text className="text-[13px] font-bold uppercase tracking-[0.91px] text-muted">Steps</Text>
          {log.length === 0 ? (
            <Text className="text-[13.5px] text-faint">No steps were logged for this run.</Text>
          ) : (
            <View className="gap-[6px]">
              {log.map((entry, i) => (
                <View key={i} className="flex-row gap-[8px]">
                  <Text className="w-[20px] text-right text-[13.5px] text-muted">{i + 1}.</Text>
                  <Text className="flex-1 text-[13.5px] text-foreground">{describeStep(entry)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </SideModal>
  );
}

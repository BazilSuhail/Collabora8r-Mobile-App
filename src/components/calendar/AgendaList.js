// feat(components/calendar/AgendaList): list the month's events day by day, with a clear state when nothing is due.
import { Pressable, Text, View } from 'react-native';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/utils/format';
import { KIND, TONE_BG } from './MonthGrid';

// days: [{ key, date, events: [{ id, title, key?, kind, tone, issueRef?, done? }] }], sorted by key.
export default function AgendaList({ days, todayKey, onOpen }) {
  if (!days.length) {
    return (
      <EmptyState icon="calendar" title="Nothing due this month" text="Issues, sprints and releases in this month show up here." />
    );
  }

  return (
    <View className="gap-[18px]">
      {days.map((day) => {
        const isToday = day.key === todayKey;
        const weekday = day.date.toLocaleDateString('en-US', { weekday: 'short' });
        return (
          <View key={day.key} className="gap-2">
            <View className="flex-row items-center gap-3">
              <View
                className={`items-center w-11 py-1 rounded-xl border ${isToday ? 'bg-accent border-transparent' : 'bg-surface-2 border-border'}`}
              >
                <Text className={`text-lg font-display leading-[1.1] ${isToday ? 'text-on-accent' : 'text-foreground'}`}>{day.date.getDate()}</Text>
                <Text className={`text-[10.5px] font-bold uppercase tracking-[0.04em] ${isToday ? 'text-on-accent' : 'text-muted'}`}>{weekday}</Text>
              </View>
              <Text accessibilityRole="header" numberOfLines={1} className="flex-1 text-base font-display tracking-[-0.01em] text-foreground">
                {isToday ? 'Today' : formatDate(day.date, { dateStyle: 'full' })}
              </Text>
              <Text className="text-muted text-[12.5px] font-semibold">
                {day.events.length} event{day.events.length === 1 ? '' : 's'}
              </Text>
            </View>
            <View className="gap-1.5">
              {day.events.map((ev) => {
                const meta = KIND[ev.kind] ?? KIND.issue;
                const body = (
                  <View className="flex-row items-center gap-3 py-2.5 px-3 bg-surface-2 border border-border rounded-[14px]">
                    <View className={`w-[3px] self-stretch rounded-[3px] ${TONE_BG[ev.tone] ?? TONE_BG.iris}`} />
                    <View className="flex-1 min-w-0 gap-[3px]">
                      <Text numberOfLines={1} className={`font-bold ${ev.done ? 'text-muted line-through' : 'text-foreground'}`}>
                        {ev.title}
                      </Text>
                      <Text className="text-muted text-xs font-semibold">
                        {ev.key ? `${ev.key} · ` : ''}
                        {meta.label}
                      </Text>
                    </View>
                  </View>
                );
                return ev.issueRef ? (
                  <Pressable key={ev.id} accessibilityRole="button" onPress={() => onOpen(ev)} className="active:opacity-80">
                    {body}
                  </Pressable>
                ) : (
                  <View key={ev.id}>{body}</View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

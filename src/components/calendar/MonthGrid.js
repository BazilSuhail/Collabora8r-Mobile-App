// feat(components/calendar/MonthGrid): lay out one month as a Monday-first grid of day cells.
// Mobile: cells show coloured dots instead of chips (no room, no hover tooltips). Tapping a day lists its
// events under the grid; issue events open through onOpen.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

// Event kinds. tone names follow the client; TONE_BG maps them to theme classes.
export const KIND = {
  issue: { tone: 'iris', label: 'Due' },
  overdue: { tone: 'ember', label: 'Overdue' },
  sprint: { tone: 'spruce', label: 'Sprint' },
  release: { tone: 'saffron', label: 'Release' },
};

export const TONE_BG = { iris: 'bg-iris', ember: 'bg-ember', spruce: 'bg-spruce', saffron: 'bg-saffron' };

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CELL = { width: `${100 / 7}%` };

// Local calendar day as YYYY-MM-DD. Used as the key for every day map.
export function dayKey(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

// Six Monday-first weeks that cover the month.
export function buildGrid(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), 1 - offset + i));
}

function EventRow({ ev, onOpen }) {
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
  if (!ev.issueRef) return body;
  return (
    <Pressable accessibilityRole="button" onPress={() => onOpen(ev)} className="active:opacity-80">
      {body}
    </Pressable>
  );
}

// events: Map of dayKey -> [{ id, title, key?, tone, done?, issueRef? }]. Only issue events are clickable.
export default function MonthGrid({ month, events, todayKey, onOpen, label }) {
  const cells = buildGrid(month);
  const current = month.getMonth();
  const [picked, setPicked] = useState(null);
  const pickedKey = picked && events.has(picked) ? picked : null;
  const pickedList = pickedKey ? events.get(pickedKey) : [];

  return (
    <View className="gap-1.5">
      <View className="flex-row" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {DAY_NAMES.map((name) => (
          <Text key={name} style={CELL} className="text-center text-[11px] font-bold text-muted">
            {name}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap" accessibilityLabel={label}>
        {cells.map((day) => {
          const key = dayKey(day);
          const list = events.get(key) ?? [];
          const outside = day.getMonth() !== current;
          const isToday = key === todayKey;
          const selected = key === pickedKey;
          return (
            <View key={key} style={CELL} className="p-0.5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${day.toDateString()}, ${list.length} event${list.length === 1 ? '' : 's'}`}
                accessibilityState={{ selected }}
                disabled={!list.length}
                onPress={() => setPicked(selected ? null : key)}
                className={`h-14 items-center pt-1 gap-1 rounded-xl border ${selected || isToday ? 'border-accent' : 'border-border'} bg-surface-2 ${outside ? 'opacity-[0.55]' : ''}`}
              >
                <View className={`min-w-[26px] h-[26px] px-1 rounded-full items-center justify-center ${isToday ? 'bg-accent' : ''}`}>
                  <Text
                    className={`text-[13px] font-bold ${isToday ? 'text-on-accent' : outside ? 'text-faint' : 'text-foreground'}`}
                  >
                    {day.getDate()}
                  </Text>
                </View>
                <View className="flex-row flex-wrap justify-center gap-0.5 px-0.5">
                  {list.slice(0, 4).map((ev) => (
                    <View
                      key={ev.id}
                      className={`w-1.5 h-1.5 rounded-full ${TONE_BG[ev.tone] ?? TONE_BG.iris} ${ev.done ? 'opacity-50' : ''}`}
                    />
                  ))}
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
      {pickedKey ? (
        <View className="gap-1.5 mt-2">
          {pickedList.map((ev) => (
            <EventRow key={ev.id} ev={ev} onOpen={onOpen} />
          ))}
        </View>
      ) : (
        <Text className="text-muted text-[12.5px] mt-2">Tap a day with dots to see its events.</Text>
      )}
    </View>
  );
}

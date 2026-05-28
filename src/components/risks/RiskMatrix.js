// feat(screens/risks/components/RiskMatrix): five by five probability and impact grid that counts risks per cell and filters the register.
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

// Tones from the status tokens only: low spruce, medium saffron, high ember.
export const riskTone = (score) => (score <= 6 ? 'ok' : score <= 12 ? 'warn' : 'bad');

const CELL_TONE = {
  ok: { cell: 'bg-spruce-soft', text: 'text-good' },
  warn: { cell: 'bg-saffron-soft', text: 'text-saffron-t' },
  bad: { cell: 'bg-ember-soft', text: 'text-bad' },
};

const SCALE = [1, 2, 3, 4, 5];
const LABEL_W = 'w-[34px]';

// The matrix is a fixed 5x5 grid on every screen width: one row per impact (5 at the top), one column per probability.
export default function RiskMatrix({ risks, selected, onSelect }) {
  const counts = useMemo(() => {
    const map = new Map();
    (risks ?? []).forEach((r) => {
      const key = `${r.probability}-${r.impact}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [risks]);

  return (
    <View className="gap-2" accessibilityRole="none" accessibilityLabel="Risk matrix: probability by impact">
      {[...SCALE].reverse().map((impact) => (
        <View key={impact} className="flex-row items-center gap-1.5">
          <Text className={`${LABEL_W} text-muted text-[12px] font-semibold text-right pr-[6px]`} accessibilityLabel={`Impact ${impact}`}>
            I{impact}
          </Text>
          {SCALE.map((probability) => {
            const n = counts.get(`${probability}-${impact}`) ?? 0;
            const on = selected?.p === probability && selected?.i === impact;
            const tone = CELL_TONE[riskTone(probability * impact)];
            return (
              <Pressable
                key={probability}
                disabled={n === 0}
                accessibilityRole="button"
                accessibilityState={{ selected: on, disabled: n === 0 }}
                accessibilityLabel={`Probability ${probability}, impact ${impact}: ${n} ${n === 1 ? 'risk' : 'risks'}`}
                onPress={() => onSelect(on ? null : { p: probability, i: impact })}
                className={`flex-1 h-[52px] rounded-ctl items-center justify-center ${tone.cell} ${
                  on ? 'border-2 border-foreground' : 'border-2 border-transparent'
                } ${n === 0 ? 'opacity-[0.45]' : ''}`}
                style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
              >
                <Text className={`font-semibold text-[14px] ${tone.text}`} style={{ fontVariant: ['tabular-nums'] }}>
                  {n > 0 ? n : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
      <View className="flex-row gap-1.5">
        <View className={LABEL_W} />
        {SCALE.map((probability) => (
          <Text
            key={probability}
            className="flex-1 text-muted text-[12px] font-semibold text-center"
            accessibilityLabel={`Probability ${probability}`}
          >
            P{probability}
          </Text>
        ))}
      </View>
    </View>
  );
}

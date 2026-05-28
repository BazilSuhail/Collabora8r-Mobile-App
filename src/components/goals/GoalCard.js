import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import Badge from '@/components/ui/Badge';
import RowMenu from '@/components/shared/RowMenu';
import { useThemeColors } from '@/components/layout/useThemeColors';
import { formatDate, formatNumber } from '@/utils/format';

export const METRIC_LABEL = {
  itemCount: 'Items done',
  points: 'Points done',
  timeSpent: 'Hours logged',
  custom: 'Custom',
};

export const GOAL_STATUS = {
  on_track: { label: 'On track', tone: 'spruce' },
  at_risk: { label: 'At risk', tone: 'saffron' },
  off_track: { label: 'Off track', tone: 'ember' },
  done: { label: 'Done', tone: 'spruce' },
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const R = 15;
const C = 2 * Math.PI * R;

// Progress ring (the client's .dial), animated from 0 to the value.
function Dial({ progress, tier }) {
  const colors = useThemeColors();
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withTiming(progress, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [progress, v]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: C * (1 - v.value / 100) }));
  const stroke = tier === 'hi' ? colors.spruce ?? colors.success : tier === 'mid' ? colors.saffron ?? colors.accent : colors.accent;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`${progress} percent of target`} className="w-[52px] h-[52px] items-center justify-center">
      <Svg width={52} height={52} viewBox="0 0 36 36" style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx="18" cy="18" r={R} stroke={colors.well ?? colors.border} strokeWidth={3.2} fill="none" />
        <AnimatedCircle
          cx="18"
          cy="18"
          r={R}
          stroke={stroke}
          strokeWidth={3.2}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${C} ${C}`}
          animatedProps={animatedProps}
        />
      </Svg>
      <Text className="text-[13px] font-bold text-foreground">{progress}</Text>
    </View>
  );
}

// One goal: gauge, current against target, due date and an action menu.
export default function GoalCard({ goal, canProgress, canManage, onProgress, onEdit, onDelete }) {
  const progress = Math.max(0, Math.min(100, goal.progress ?? 0));
  const tier = progress >= 70 ? 'hi' : progress >= 40 ? 'mid' : 'lo';
  const status = GOAL_STATUS[goal.status] ?? GOAL_STATUS.on_track;
  const unit = goal.unit ? ` ${goal.unit}` : '';

  const items = [
    canProgress && { id: 'progress', label: 'Record progress', icon: 'gauge', onSelect: () => onProgress(goal) },
    canManage && { id: 'edit', label: 'Edit', icon: 'edit', onSelect: () => onEdit(goal) },
    canManage && 'separator',
    canManage && { id: 'delete', label: 'Delete', icon: 'trash', danger: true, onSelect: () => onDelete(goal) },
  ].filter(Boolean);

  return (
    <View className="rounded-[15px] bg-surface border border-border p-[18px] gap-[14px]">
      <View className="flex-row items-start gap-[12px]">
        <Dial progress={progress} tier={tier} />
        <View className="flex-1 min-w-0">
          <Text numberOfLines={2} className="text-[16px] font-semibold text-foreground">
            {goal.title}
          </Text>
          <Text className="text-[12.5px] text-muted">{METRIC_LABEL[goal.metric] ?? goal.metric}</Text>
        </View>
        {items.length > 0 ? <RowMenu label="Goal actions" items={items} /> : null}
      </View>
      <Text className="text-[24px] font-semibold text-foreground tracking-[-0.02em]" style={{ fontVariant: ['tabular-nums'] }}>
        {formatNumber(goal.current ?? 0)}
        <Text className="text-[14px] font-semibold text-muted tracking-normal">{` / ${formatNumber(goal.target ?? 0)}${unit}`}</Text>
      </Text>
      <View className="flex-row flex-wrap items-center justify-between gap-[8px] pt-[12px] border-t border-border">
        <Text className="text-[12.5px] font-semibold text-muted">{goal.dueDate ? `Due ${formatDate(goal.dueDate)}` : 'No due date'}</Text>
        <Badge variant="status" tone={status.tone}>
          {status.label}
        </Badge>
      </View>
    </View>
  );
}

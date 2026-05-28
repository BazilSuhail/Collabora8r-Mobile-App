// feat(screens/serviceDesk/components/SlaCountdown): show an SLA timer's time left and pause or resume its clock.
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDuration } from '@/utils/format';

const HOUR_MS = 60 * 60 * 1000;

// A paused timer freezes at its pause moment. A running timer counts down to dueAt.
function remainingMs(timer, now) {
  const due = new Date(timer.dueAt).getTime();
  if (timer.status === 'paused' && timer.pausedAt) return due - new Date(timer.pausedAt).getTime();
  return due - now;
}

const spanText = (ms) => formatDuration(Math.round(Math.abs(ms) / 1000));

export default function SlaCountdown({ timer, canAct = false, busy = false, onToggle }) {
  const running = timer.status === 'running';
  const [now, setNow] = useState(() => Date.now());

  // Only a running timer ticks. The interval is cleared when the timer stops or the row unmounts.
  useEffect(() => {
    if (!running) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running, timer.id, timer.dueAt]);

  if (timer.status === 'met') return <Badge tone="spruce">Met</Badge>;
  if (timer.status === 'breached') return <Badge tone="ember">Breached</Badge>;

  const paused = timer.status === 'paused';
  const left = remainingMs(timer, now);
  const overdue = left <= 0;
  const tone = overdue ? 'ember' : left < HOUR_MS ? 'saffron' : 'spruce';
  let text;
  if (overdue) text = `Overdue ${spanText(left)}`;
  else if (paused) text = `Paused, ${spanText(left)} left`;
  else text = `${spanText(left)} left`;

  // No tooltip on touch: the button carries a visible label instead.
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Badge tone={tone} variant="status">
        {text}
      </Badge>
      {canAct ? (
        <Button
          variant="ghost"
          size="sm"
          icon={paused ? 'play' : 'pause'}
          accessibilityLabel={paused ? 'Resume SLA timer' : 'Pause SLA timer'}
          hitSlop={8}
          loading={busy}
          disabled={busy}
          onPress={() => onToggle?.(timer)}
        >
          {paused ? 'Resume' : 'Pause'}
        </Button>
      ) : null}
    </View>
  );
}

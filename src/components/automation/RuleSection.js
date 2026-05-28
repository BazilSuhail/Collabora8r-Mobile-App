// feat(screens/automation/components/RuleSection): frame one When, If or Then block of the automation rule builder.
import { Text, View } from 'react-native';
import { cn } from '@/utils/cn';
import { Icon } from '@/components/ui/Icon';

// Option lists shared by the rule list, the rule builder and the run views.
export const TRIGGER_TYPES = [
  { value: 'itemCreated', label: 'Item is created' },
  { value: 'statusChanged', label: 'Status changes' },
  { value: 'fieldChanged', label: 'Field changes' },
  { value: 'commentAdded', label: 'Comment is added' },
  { value: 'prMerged', label: 'Pull request is merged' },
  { value: 'scheduled', label: 'On a schedule' },
  { value: 'dueSoon', label: 'Due date is near' },
];

export const ACTION_TYPES = [
  { value: 'setField', label: 'Set a field' },
  { value: 'transition', label: 'Move to a status' },
  { value: 'assign', label: 'Assign to someone' },
  { value: 'addComment', label: 'Add a comment' },
  { value: 'addLabel', label: 'Add a label' },
  { value: 'notify', label: 'Notify people' },
  { value: 'webhook', label: 'Send a webhook' },
];

export const CONDITION_OPS = [
  { value: 'equals', label: 'equals' },
  { value: 'notEquals', label: 'does not equal' },
  { value: 'in', label: 'is one of' },
  { value: 'notIn', label: 'is not one of' },
  { value: 'contains', label: 'contains' },
  { value: 'isEmpty', label: 'is empty' },
  { value: 'isNotEmpty', label: 'is not empty' },
];

export const triggerLabel = (type) => TRIGGER_TYPES.find((t) => t.value === type)?.label ?? 'Custom trigger';

export default function RuleSection({ id, icon, title, text, action, className, children }) {
  return (
    <View nativeID={id} className={cn('gap-[16px] p-5 rounded-card border border-border bg-surface', className)}>
      <View className="flex-row items-center gap-[12px]">
        <View className="items-center justify-center w-[34px] h-[34px] rounded-ctl bg-well">
          <Icon name={icon} className="text-muted" />
        </View>
        <View className="min-w-0 flex-1">
          <Text accessibilityRole="header" className="text-[15px] font-bold text-foreground">
            {title}
          </Text>
          {text ? <Text className="text-[13px] text-muted">{text}</Text> : null}
        </View>
        {action ? <View className="flex-none">{action}</View> : null}
      </View>
      {children}
    </View>
  );
}

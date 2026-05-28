import { ScrollView, Text, View } from 'react-native';
import Modal from './Modal';
import Button from './Button';
import { Icon } from './Icon';
import { cn } from './cn';

// Header + scrollable body + footer dialog. Shown as a bottom sheet on phones,
// matching the web layout at 760px and below. `size` and `position` are kept
// for API parity; phones have one width.
export default function CenterModal({
  open,
  onClose,
  title,
  description,
  size: _size = 'md',
  position: _position = 'center',
  footer,
  tone = 'default',
  onBeforeClose,
  initialFocus,
  dismissible = true,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      label={typeof title === 'string' ? title : undefined}
      motion="sheet"
      initialFocus={initialFocus}
      onBeforeClose={onBeforeClose}
      dismissible={dismissible}
    >
      {({ close }) => (
        <>
          <View className="flex-row items-start gap-[12px] px-[24px] pt-[22px] pb-[16px] border-b border-line">
            <View className="gap-[4px] min-w-0 flex-1">
              <View className="flex-row items-center gap-[8px]">
                {tone === 'danger' ? <Icon name="alert" size={18} cls="text-bad" /> : null}
                {typeof title === 'string' ? (
                  <Text accessibilityRole="header" className="flex-1 font-display text-[20px] text-foreground tracking-[-0.3px]">
                    {title}
                  </Text>
                ) : (
                  title
                )}
              </View>
              {description ? (
                typeof description === 'string' ? (
                  <Text className="text-muted text-[12.5px] font-sans">{description}</Text>
                ) : (
                  description
                )
              ) : null}
            </View>
            {dismissible ? (
              <Button iconOnly variant="ghost" size="sm" icon="close" aria-label="Close" onClick={() => close()} />
            ) : null}
          </View>
          <ScrollView
            style={{ flexGrow: 0, flexShrink: 1 }}
            contentContainerClassName="px-[24px] py-[20px] gap-[12px]"
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {footer ? (
            <View className={cn('flex-row flex-wrap items-center justify-end gap-[10px] px-[24px] py-[16px] border-t border-line')}>
              {typeof footer === 'function' ? footer({ close }) : footer}
            </View>
          ) : null}
        </>
      )}
    </Modal>
  );
}

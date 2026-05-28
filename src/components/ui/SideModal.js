import { ScrollView, Text, View } from 'react-native';
import Modal from './Modal';
import Button from './Button';

// Side panel on the web, a tall bottom sheet on phones (the web's w760 layout).
// footer may be a node or ({ close }) => node; close() runs the dirty guard.
export default function SideModal({
  open,
  onClose,
  title,
  subtitle,
  side = 'right',
  size = 'md',
  headerActions,
  footer,
  initialFocus,
  onBeforeClose,
  dismissible = true,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      label={typeof title === 'string' ? title : undefined}
      motion="side"
      side={side}
      fullHeight={size === 'lg'}
      initialFocus={initialFocus}
      onBeforeClose={onBeforeClose}
      dismissible={dismissible}
    >
      {({ close }) => (
        <>
          <View className="flex-row items-start gap-[12px] px-[16px] pt-[10px] pb-[12px]">
            <View className="flex-1 gap-[6px] min-w-0">
              {typeof title === 'string' ? (
                <Text accessibilityRole="header" className="font-display-bold text-[23px] tracking-[-0.46px] text-foreground">
                  {title}
                </Text>
              ) : (
                title
              )}
              {subtitle ? (
                typeof subtitle === 'string' ? (
                  <Text className="text-muted text-[12.5px] font-sans">{subtitle}</Text>
                ) : (
                  subtitle
                )
              ) : null}
              {headerActions ? <View className="flex-row flex-wrap gap-[8px]">{headerActions}</View> : null}
            </View>
            <Button iconOnly variant="ghost" size="sm" icon="close" aria-label="Close" onClick={() => close()} />
          </View>
          <ScrollView
            style={{ flexGrow: size === 'lg' ? 1 : 0, flexShrink: 1 }}
            contentContainerClassName="gap-[18px] px-[16px] pb-[16px]"
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
          {footer ? (
            <View className="flex-row flex-wrap justify-end gap-[10px] px-[16px] py-[14px] bg-float border-t border-line">
              {typeof footer === 'function' ? footer({ close }) : footer}
            </View>
          ) : null}
        </>
      )}
    </Modal>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import SideModal from './SideModal';
import Button from './Button';
import { cn } from './cn';

// Form dialog built on SideModal (a bottom sheet on phones).
// onSubmit(values) returns a promise.
// A 422 fills field errors from err.errors[].path. A 409 shows the
// "Changed by someone else" footer with a Reload action. Other errors show
// in the footer. Success calls onClose("submit").
export default function FormModal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  submitLabel = 'Save',
  onSubmit,
  initialValues,
  fields,
  dirtyGuard = true,
  onReload,
}) {
  const [values, setValues] = useState(initialValues ?? {});
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState(false);
  const baseline = useRef(JSON.stringify(initialValues ?? {}));

  useEffect(() => {
    if (!open) return;
    const next = initialValues ?? {};
    setValues(next);
    baseline.current = JSON.stringify(next);
    setErrors({});
    setFormError(null);
    setConflict(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dirty = JSON.stringify(values) !== baseline.current;

  const set = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    if (pending) return;
    setPending(true);
    setErrors({});
    setFormError(null);
    setConflict(false);
    try {
      await onSubmit(values);
      onClose?.('submit');
    } catch (err) {
      if (err?.status === 422) {
        const map = {};
        (err.errors ?? []).forEach((item) => {
          const key = String(item.path ?? '').replace(/^body\./, '');
          if (key && !map[key]) map[key] = item.message;
        });
        setErrors(map);
        if (!Object.keys(map).some((k) => k in values)) setFormError(err.message ?? 'Check the highlighted fields.');
      } else if (err?.status === 409) {
        setConflict(true);
        setFormError('Changed by someone else.');
      } else {
        setFormError(err?.message ?? 'Something went wrong. Try again.');
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <SideModal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={description}
      size={size === 'lg' ? 'lg' : 'md'}
      onBeforeClose={dirtyGuard ? () => !dirty : undefined}
      footer={({ close }) => (
        <>
          {formError ? (
            <View accessibilityLiveRegion="polite" className="basis-full flex-row flex-wrap items-center gap-[10px]">
              <Text className="text-bad text-[13px] font-sans-semibold">{formError}</Text>
              {conflict && onReload ? (
                <Button variant="ghost" size="sm" icon="refresh" onClick={onReload}>
                  Reload latest
                </Button>
              ) : null}
            </View>
          ) : null}
          <Button variant="ghost" onClick={() => close()} className="flex-1">
            Cancel
          </Button>
          <Button variant="ember" loading={pending} disabled={pending} onClick={submit} className="flex-1">
            {submitLabel}
          </Button>
        </>
      )}
    >
      <View className={cn('gap-[16px]')}>{fields({ values, set, errors, submit })}</View>
    </SideModal>
  );
}

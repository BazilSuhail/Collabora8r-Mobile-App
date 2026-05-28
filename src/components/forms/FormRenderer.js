// feat(screens/forms/components/FormRenderer): render intake form fields by type for the public page and the builder preview.
// Single column on mobile; `columns` is kept for API parity with the web client.
import { forwardRef, useImperativeHandle, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/utils/cn";

const isChoice = (type) => type === "select" || type === "multiSelect";

function CheckboxField({ field, value, error, hint, disabled, onChange, inputRef }) {
  const checked = value === true;
  return (
    <View className="gap-[6px]">
      <Pressable
        ref={inputRef}
        className={cn("flex-row items-center gap-[10px]", disabled && "opacity-60")}
        disabled={disabled}
        onPress={() => onChange?.(field.id, !checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        accessibilityLabel={field.label}
        accessibilityHint={error || undefined}
      >
        <View
          className={cn(
            "size-[24px] rounded-[8px] border-[1.5px] items-center justify-center",
            checked ? "bg-spruce border-transparent" : "bg-surface",
            error ? "border-danger" : !checked && "border-border-strong",
          )}
        >
          {checked ? <Icon name="check" size={14} className="text-on-spruce" strokeWidth={2.5} /> : null}
        </View>
        <Text className="flex-1 text-foreground font-semibold text-[14px]">{field.label}</Text>
      </Pressable>
      {hint ? <Text className="text-muted text-[13px]">{hint}</Text> : null}
      {error ? (
        <Text className="text-danger text-[13px] font-semibold" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const FormRenderer = forwardRef(function FormRenderer(
  // eslint-disable-next-line no-unused-vars
  { fields = [], values = {}, errors = {}, onChange, disabled = false, idPrefix = "ff", columns = 2 },
  ref,
) {
  // Refs per field so the parent can focus the first invalid field (replaces the web aria-invalid query).
  const refs = useRef({});
  useImperativeHandle(ref, () => ({
    focus(fieldId) {
      refs.current[fieldId]?.focus?.();
    },
  }));
  const bind = (id) => (el) => {
    refs.current[id] = el;
  };

  return (
    <View className="gap-[16px]">
      {fields.map((f) => {
        const id = `${idPrefix}-${f.id}`;
        const value = values[f.id];
        const label = f.label;
        const error = errors[f.id];
        const hint = f.helpText || undefined;

        if (f.type === "checkbox") {
          return (
            <CheckboxField
              key={f.id}
              field={f}
              value={value}
              error={error}
              hint={hint}
              disabled={disabled}
              onChange={onChange}
              inputRef={bind(f.id)}
            />
          );
        }

        if (isChoice(f.type)) {
          const options = (f.options ?? []).map((o) => ({ value: o, label: o }));
          return (
            <Select
              key={f.id}
              ref={bind(f.id)}
              label={label}
              value={f.type === "multiSelect" ? (Array.isArray(value) ? value : []) : (value ?? "")}
              onChange={(next) => onChange?.(f.id, next)}
              options={options}
              multiple={f.type === "multiSelect"}
              placeholder="Choose"
              hint={hint}
              error={error}
              disabled={disabled}
              required={f.required}
            />
          );
        }

        if (f.type === "number") {
          return (
            <Input
              key={f.id}
              ref={bind(f.id)}
              id={id}
              label={label}
              keyboardType="numeric"
              value={value === undefined || value === null ? "" : String(value)}
              onChangeText={(t) => {
                if (t === "") return onChange?.(f.id, "");
                const n = Number(t);
                onChange?.(f.id, Number.isNaN(n) ? t : n);
              }}
              hint={hint}
              error={error}
              disabled={disabled}
              required={f.required}
            />
          );
        }

        if (f.type === "date") {
          // shortcut: plain YYYY-MM-DD text entry; swap for a native date picker later.
          return (
            <Input
              key={f.id}
              ref={bind(f.id)}
              id={id}
              label={label}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              value={value ?? ""}
              onChangeText={(t) => onChange?.(f.id, t)}
              hint={hint}
              error={error}
              disabled={disabled}
              required={f.required}
            />
          );
        }

        const isEmail = f.type === "email";
        return (
          <Input
            key={f.id}
            ref={bind(f.id)}
            id={id}
            label={label}
            as={f.type === "longText" ? "textarea" : "input"}
            multiline={f.type === "longText"}
            keyboardType={isEmail ? "email-address" : "default"}
            autoCapitalize={isEmail ? "none" : "sentences"}
            autoCorrect={!isEmail}
            value={value ?? ""}
            onChangeText={(t) => onChange?.(f.id, t)}
            hint={hint}
            error={error}
            disabled={disabled}
            required={f.required}
          />
        );
      })}
    </View>
  );
});

export default FormRenderer;

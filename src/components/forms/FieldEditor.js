// feat(screens/forms/components/FieldEditor): edit one intake form field (label, type, required, options) and reorder or remove it.
import { useState } from "react";
import { Text, View } from "react-native";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Switch from "@/components/ui/Switch";
import { Icon } from "@/components/ui/Icon";

export const FIELD_TYPES = [
  { value: "text", label: "Short text" },
  { value: "longText", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "select", label: "Single choice" },
  { value: "multiSelect", label: "Multiple choice" },
  { value: "date", label: "Date" },
  { value: "checkbox", label: "Checkbox" },
];

const needsOptions = (type) => type === "select" || type === "multiSelect";

export default function FieldEditor({ field, index, count, disabled = false, onPatch, onMove, onRemove }) {
  const [optionsText, setOptionsText] = useState((field.options ?? []).join("\n"));

  const onOptionsChange = (text) => {
    setOptionsText(text);
    onPatch({ options: text.split("\n").map((s) => s.trim()).filter(Boolean) });
  };

  return (
    <View className="gap-[12px] rounded-[15px] border border-border bg-surface p-[20px]">
      <View className="flex-row items-center gap-[8px] flex-wrap">
        <Icon name="field" size={16} className="text-muted" />
        <Text className="text-muted text-[12px] font-semibold tabular-nums">Field {index + 1}</Text>
        {field.required ? <Badge tone="ember">Required</Badge> : null}
        <View className="ml-auto flex-row items-center gap-[4px]">
          <Button
            iconOnly
            variant="ghost"
            size="sm"
            icon="up"
            accessibilityLabel={`Move field ${index + 1} up`}
            disabled={disabled || index === 0}
            onPress={() => onMove("up")}
          />
          <Button
            iconOnly
            variant="ghost"
            size="sm"
            icon="down"
            accessibilityLabel={`Move field ${index + 1} down`}
            disabled={disabled || index === count - 1}
            onPress={() => onMove("down")}
          />
          <Button
            iconOnly
            variant="ghost"
            size="sm"
            icon="trash"
            accessibilityLabel={`Remove field ${index + 1}`}
            disabled={disabled}
            onPress={onRemove}
          />
        </View>
      </View>
      <Input
        label="Field label"
        hint="The question people see above the answer box."
        value={field.label}
        maxLength={200}
        onChangeText={(t) => onPatch({ label: t })}
        disabled={disabled}
      />
      <Select
        label="Type"
        hint="How people answer this question."
        value={field.type}
        options={FIELD_TYPES}
        onChange={(type) => onPatch({ type, options: needsOptions(type) ? (field.options ?? []) : undefined })}
        disabled={disabled}
      />
      <Switch checked={!!field.required} onChange={(v) => onPatch({ required: v })} label="Required" disabled={disabled} />
      {needsOptions(field.type) ? (
        <Input
          as="textarea"
          multiline
          label="Options"
          hint="One option per line."
          value={optionsText}
          onChangeText={onOptionsChange}
          disabled={disabled}
        />
      ) : null}
      <Input
        label="Help text"
        hint="Optional. Shown under the question on the public form."
        value={field.helpText ?? ""}
        maxLength={500}
        onChangeText={(t) => onPatch({ helpText: t })}
        disabled={disabled}
      />
    </View>
  );
}

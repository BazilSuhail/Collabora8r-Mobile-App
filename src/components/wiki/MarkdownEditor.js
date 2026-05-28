import { useRef, useState } from "react";
import { View, Text, TextInput, ScrollView } from "react-native";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import SegmentedControl from "@/components/ui/SegmentedControl";
import MarkdownView from "./MarkdownView";

// Each action wraps the selection (or inserts the placeholder), or prefixes the line when linePrefix is set.
const ACTIONS = [
  { id: "bold", label: "Bold", text: "B", before: "**", after: "**", placeholder: "bold text" },
  { id: "italic", label: "Italic", text: "I", before: "_", after: "_", placeholder: "italic text" },
  { id: "heading", label: "Heading", text: "H", before: "## ", placeholder: "Heading", linePrefix: true },
  { id: "list", label: "Bulleted list", text: "List", before: "- ", placeholder: "Item", linePrefix: true },
  { id: "link", label: "Link", text: "Link", before: "[", after: "](https://)", placeholder: "link text" },
  { id: "code", label: "Code", text: "Code", before: "`", after: "`", placeholder: "code" },
];

// Markdown source editor: toolbar buttons insert syntax, Preview renders it with MarkdownView.
export default function MarkdownEditor({ id, label = "Content", value = "", onChange, rows = 14, error, hint }) {
  const areaRef = useRef(null);
  // Last caret position reported by the TextInput (replaces the DOM selectionStart/End).
  const caretRef = useRef({ start: value.length, end: value.length });
  // Selection forced after a toolbar insert; cleared once the user moves the caret again.
  const [forced, setForced] = useState(null);
  const [mode, setMode] = useState("write");

  const apply = (action) => {
    const len = value.length;
    const start = Math.min(caretRef.current.start ?? len, len);
    const end = Math.min(caretRef.current.end ?? len, len);
    if (action.linePrefix) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const next = `${value.slice(0, lineStart)}${action.before}${value.slice(lineStart)}`;
      const caret = start + action.before.length;
      caretRef.current = { start: caret, end: caret };
      setForced({ start: caret, end: caret });
      onChange?.(next);
      areaRef.current?.focus();
      return;
    }
    const selected = value.slice(start, end) || action.placeholder;
    const next = `${value.slice(0, start)}${action.before}${selected}${action.after ?? ""}${value.slice(end)}`;
    const from = start + action.before.length;
    caretRef.current = { start: from, end: from + selected.length };
    setForced({ start: from, end: from + selected.length });
    onChange?.(next);
    areaRef.current?.focus();
  };

  return (
    <View className="gap-[8px]">
      <View className="flex-row flex-wrap items-center justify-between gap-[10px]">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityLabel={`${label} formatting`}
          keyboardShouldPersistTaps="always"
          contentContainerClassName="gap-[4px]"
          className="flex-grow-0"
        >
          {ACTIONS.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              size="sm"
              aria-label={action.label}
              accessibilityLabel={action.label}
              disabled={mode === "preview"}
              onClick={() => apply(action)}
            >
              {action.text}
            </Button>
          ))}
        </ScrollView>
        <SegmentedControl
          label={`${label} view`}
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: "write", label: "Write" },
            { value: "preview", label: "Preview" },
          ]}
        />
      </View>
      {mode === "write" ? (
        <View className="gap-[6px]">
          <TextInput
            ref={areaRef}
            nativeID={id}
            accessibilityLabel={label}
            multiline
            textAlignVertical="top"
            value={value}
            selection={forced ?? undefined}
            onSelectionChange={(e) => {
              caretRef.current = e.nativeEvent.selection;
              if (forced) setForced(null);
            }}
            onChangeText={(text) => onChange?.(text)}
            className={`rounded-[12px] border bg-surface px-[14px] py-[10px] text-[15px] text-foreground ${
              error ? "border-danger" : "border-border"
            }`}
            style={{ minHeight: Math.max(96, rows * 22) }}
          />
          {hint ? <Text className="text-[12.5px] text-muted">{hint}</Text> : null}
          {error ? (
            <Text accessibilityLiveRegion="polite" className="text-[12.5px] text-danger">
              {error}
            </Text>
          ) : null}
        </View>
      ) : (
        <View className="min-h-[96px] rounded-[12px] border border-border bg-surface px-[14px] py-[10px]">
          {value.trim() ? (
            <MarkdownView text={value} />
          ) : (
            <View className="flex-row items-center gap-[8px]">
              <Icon name="eye" size={16} />
              <Text className="text-muted">Nothing to preview yet.</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

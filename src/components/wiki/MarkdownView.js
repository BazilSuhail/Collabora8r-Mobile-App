import { View, Text, ScrollView, Platform } from "react-native";
import * as Linking from "expo-linking";

// Renders a small Markdown subset as React Native elements. Raw HTML is never parsed:
// every piece of text becomes a Text node, so markup in the source shows as text.
const INLINE = /`([^`\n]+)`|\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|_([^_\n]+)_/g;
const BLOCK_START = /^(#{1,3}\s|```|>|\s*[-*+]\s|\s*\d+[.)]\s|(-{3,}|\*{3,})\s*$)/;
const MONO = Platform.select({ ios: "Menlo", default: "monospace" });

// Only http, https and mailto links are allowed. Returns the URL or null.
export function safeHref(url) {
  const value = String(url ?? "").trim();
  if (!value || /\s/.test(value)) return null;
  if (/^https?:\/\/[^/\s]+/i.test(value)) return value;
  if (/^mailto:[^\s]+$/i.test(value)) return value;
  return null;
}

function openLink(href) {
  Linking.openURL(href).catch(() => {});
}

function inline(text, keyBase) {
  const out = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${n++}`;
    if (m[1] !== undefined) {
      out.push(
        <Text key={key} className="bg-background text-[13.5px]" style={{ fontFamily: MONO }}>
          {m[1]}
        </Text>,
      );
    } else if (m[2] !== undefined) {
      const href = safeHref(m[3]);
      out.push(
        href ? (
          <Text
            key={key}
            accessibilityRole="link"
            onPress={() => openLink(href)}
            className="text-accent underline"
          >
            {m[2]}
          </Text>
        ) : (
          <Text key={key}>{m[2]}</Text>
        ),
      );
    } else if (m[4] !== undefined) {
      out.push(
        <Text key={key} className="font-bold">
          {m[4]}
        </Text>,
      );
    } else {
      out.push(
        <Text key={key} className="italic">
          {m[5] ?? m[6]}
        </Text>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function parse(source) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
      i += 1;
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      i += 1;
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      blocks.push({ type: "rule" });
      i += 1;
      continue;
    }
    if (line.startsWith(">")) {
      const quoted = [];
      while (i < lines.length && lines[i].startsWith(">")) quoted.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push({ type: "quote", text: quoted.join("\n") });
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*+]\s+/, ""));
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ""));
      blocks.push({ type: "ol", items });
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !BLOCK_START.test(lines[i])) para.push(lines[i++]);
    if (!para.length) para.push(lines[i++]);
    blocks.push({ type: "p", text: para.join(" ") });
  }
  return blocks;
}

const BODY = "text-[15px] leading-[25px] text-foreground";

function renderBlock(block, index) {
  const key = `b${index}`;
  switch (block.type) {
    case "heading": {
      if (block.level === 1) {
        return (
          <Text
            key={key}
            accessibilityRole="header"
            className="mt-[18px] mb-[6px] text-[22px] font-bold text-foreground"
            style={{ letterSpacing: -0.44 }}
          >
            {inline(block.text, key)}
          </Text>
        );
      }
      if (block.level === 2) {
        return (
          <Text
            key={key}
            accessibilityRole="header"
            className="mt-[16px] mb-[5px] text-[18px] font-semibold text-foreground"
            style={{ letterSpacing: -0.27 }}
          >
            {inline(block.text, key)}
          </Text>
        );
      }
      return (
        <Text key={key} accessibilityRole="header" className="mt-[13px] mb-[4px] text-[15px] font-bold text-foreground">
          {inline(block.text, key)}
        </Text>
      );
    }
    case "code":
      return (
        <ScrollView key={key} horizontal className="my-[10px] rounded-[12px] bg-background">
          <Text selectable className="p-[12px] text-[13px] leading-[20px] text-foreground" style={{ fontFamily: MONO }}>
            {block.text}
          </Text>
        </ScrollView>
      );
    case "rule":
      return <View key={key} className="my-[16px] h-[1px] bg-border" />;
    case "quote":
      return (
        <View key={key} className="my-[10px] border-l-[3px] border-border pl-[14px]">
          <Text className="text-[15px] leading-[25px] text-muted">{inline(block.text, key)}</Text>
        </View>
      );
    case "ul":
    case "ol":
      return (
        <View key={key} className="my-[8px] gap-[2px]">
          {block.items.map((item, n) => (
            <View key={`${key}-${n}`} className="flex-row">
              <Text className={`${BODY} w-[22px]`}>{block.type === "ol" ? `${n + 1}.` : "•"}</Text>
              <Text className={`${BODY} flex-1`}>{inline(item, `${key}-${n}`)}</Text>
            </View>
          ))}
        </View>
      );
    default:
      return (
        <Text key={key} className={`my-[8px] ${BODY}`}>
          {inline(block.text, key)}
        </Text>
      );
  }
}

// Accepts a Markdown string or an object with a text field.
export default function MarkdownView({ text, className }) {
  const source = typeof text === "string" ? text : typeof text?.text === "string" ? text.text : "";
  const blocks = parse(source);
  return <View className={className}>{blocks.map((block, index) => renderBlock(block, index))}</View>;
}

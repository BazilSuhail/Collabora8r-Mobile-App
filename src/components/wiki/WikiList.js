import { useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import Button from "@/components/ui/Button";
import Highlight from "@/components/ui/Highlight";
import { Icon } from "@/components/ui/Icon";
import { paths } from "@/routes/paths";

const idOf = (item) => String(item?.id ?? item?._id);

// Builds parent to children lists. A page whose parent is not loaded yet is shown at the top level.
function buildChildren(pages) {
  const known = new Set(pages.map(idOf));
  const children = new Map();
  for (const page of pages) {
    const parent = page.parentId && known.has(String(page.parentId)) ? String(page.parentId) : "root";
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(page);
  }
  for (const list of children.values()) {
    list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || String(a.title).localeCompare(String(b.title)));
  }
  return children;
}

function Branch({ pid, parentKey, children, depth, collapsed, onToggle, activeId }) {
  const list = children.get(parentKey) ?? [];
  return (
    <View className="gap-[2px]">
      {list.map((page) => {
        const id = idOf(page);
        const kids = children.get(id) ?? [];
        const open = !collapsed.has(id);
        const active = id === activeId;
        return (
          <View key={id}>
            <View
              className={`flex-row items-center gap-[4px] rounded-[10px] pr-[6px] ${active ? "bg-background" : ""}`}
              style={{ paddingLeft: depth * 16 + 4 }}
            >
              {kids.length ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={open ? `Collapse ${page.title}` : `Expand ${page.title}`}
                  accessibilityState={{ expanded: open }}
                  onPress={() => onToggle(id)}
                  hitSlop={8}
                  className="w-[28px] h-[28px] items-center justify-center rounded-[8px] active:opacity-60"
                >
                  <Icon name={open ? "down" : "chevR"} size={16} />
                </Pressable>
              ) : (
                <View className="w-[28px]" />
              )}
              <Link href={paths.wikiPage(pid, id)} asChild>
                <Pressable
                  accessibilityRole="link"
                  accessibilityState={{ selected: active }}
                  className="min-w-0 flex-1 py-[7px] active:opacity-60"
                >
                  <Text
                    numberOfLines={1}
                    className={`text-[14px] font-semibold ${active ? "text-foreground" : "text-muted"}`}
                  >
                    {page.title}
                  </Text>
                </Pressable>
              </Link>
            </View>
            {kids.length && open ? (
              <Branch
                pid={pid}
                parentKey={id}
                children={children}
                depth={depth + 1}
                collapsed={collapsed}
                onToggle={onToggle}
                activeId={activeId}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

// Page tree (or flat search results when query is set).
export default function WikiList({ pid, pages = [], activeId, query = "", hasMore = false, loadingMore = false, onLoadMore }) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const children = useMemo(() => buildChildren(pages), [pages]);
  const q = query.trim().toLowerCase();
  const matches = q ? pages.filter((page) => String(page.title ?? "").toLowerCase().includes(q)) : null;

  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const more =
    hasMore && onLoadMore ? (
      <View className="pt-[10px] items-start">
        <Button variant="soft" size="sm" loading={loadingMore} onClick={onLoadMore}>
          Show more
        </Button>
      </View>
    ) : null;

  if (matches) {
    return (
      <View>
        {matches.length ? (
          <View accessibilityLabel="Matching pages" className="gap-[2px]">
            {matches.map((page) => {
              const id = idOf(page);
              const active = id === activeId;
              return (
                <Link key={id} href={paths.wikiPage(pid, id)} asChild>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityState={{ selected: active }}
                    className={`rounded-[10px] px-[10px] py-[7px] active:opacity-60 ${active ? "bg-background" : ""}`}
                  >
                    <Text className={`text-[14px] font-semibold ${active ? "text-foreground" : "text-muted"}`}>
                      <Highlight text={page.title} query={query} />
                    </Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        ) : (
          <Text className="px-[10px] py-[8px] text-[14px] text-muted">No pages match this search.</Text>
        )}
        {more}
      </View>
    );
  }

  return (
    <View>
      <Branch
        pid={pid}
        parentKey="root"
        children={children}
        depth={0}
        collapsed={collapsed}
        onToggle={toggle}
        activeId={activeId}
      />
      {more}
    </View>
  );
}

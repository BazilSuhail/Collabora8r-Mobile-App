// feat(app/(app)/help/index): offer searchable product guides and answers to common questions.
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { HELP_FAQ, HELP_GUIDES } from '@/metadata/help';
import { emptyCopy } from '@/metadata/empty';
import PageHead from '@/components/layout/PageHead';
import EmptyState from '@/components/ui/EmptyState';
import Highlight from '@/components/ui/Highlight';
import { Icon } from '@/components/ui/Icon';
import GuideSheet from '@/components/help/GuideSheet';

const SEARCH_DEBOUNCE_MS = 250;

function FaqItem({ item, term, first }) {
  const [open, setOpen] = useState(false);
  return (
    <View className={`py-[14px] ${first ? '' : 'border-t border-border'}`}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center gap-[10px] active:opacity-70"
      >
        <Text className="flex-1 font-bold text-foreground text-[15px]">
          <Highlight text={item.q} query={term} />
        </Text>
        <Icon name={open ? 'chevU' : 'chevD'} size={16} />
      </Pressable>
      {open ? (
        <Text className="mt-[8px] text-muted text-[14px] leading-[22px]">
          <Highlight text={item.a} query={term} />
        </Text>
      ) : null}
    </View>
  );
}

export default function HelpPage() {
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(null);

  // Debounced search.
  useEffect(() => {
    const id = setTimeout(() => setTerm(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const needle = term.toLowerCase();
  const guides = HELP_GUIDES.filter(
    (g) => !needle || [g.title, g.summary, ...g.steps].join(' ').toLowerCase().includes(needle),
  );
  const faq = HELP_FAQ.filter((f) => !needle || `${f.q} ${f.a}`.toLowerCase().includes(needle));
  const nothing = !guides.length && !faq.length;

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-[16px] pb-[40px] gap-[16px]" keyboardShouldPersistTaps="handled">
        <PageHead title="Help" sub="Guides and answers for the things people ask most." />

        <View className="flex-row items-center gap-[8px] border border-border rounded-[12px] bg-surface px-[12px]">
          <Icon name="search" size={16} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search guides and questions"
            accessibilityLabel="Search help"
            returnKeyType="search"
            autoCorrect={false}
            className="flex-1 py-[10px] text-[15px] text-foreground"
            placeholderTextColorClassName="accent-muted"
          />
        </View>

        {nothing ? <EmptyState {...emptyCopy('help')} /> : null}

        {guides.length ? (
          <View className="gap-[12px]">
            {guides.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => setActive(g)}
                accessibilityRole="button"
                className="bg-surface border border-border rounded-[16px] p-[18px] gap-[10px] active:opacity-80"
              >
                <View className="items-center justify-center w-[40px] h-[40px] rounded-[12px] bg-ember-soft">
                  <Icon name={g.icon} />
                </View>
                <Text className="font-bold text-foreground text-[15px]">
                  <Highlight text={g.title} query={term} />
                </Text>
                <Text className="text-muted text-[13.5px] leading-[20px]">
                  <Highlight text={g.summary} query={term} />
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {faq.length ? (
          <View className="bg-surface border border-border rounded-[16px] p-[18px]">
            <View className="flex-row items-center gap-[8px] mb-[8px]">
              <Icon name="help" />
              <Text className="text-foreground text-[17px] font-semibold">Common questions</Text>
            </View>
            {faq.map((f, i) => (
              <FaqItem key={f.id} item={f} term={term} first={i === 0} />
            ))}
          </View>
        ) : null}
      </ScrollView>

      <GuideSheet guide={active} open={active !== null} onClose={() => setActive(null)} />
    </View>
  );
}

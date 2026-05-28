// feat(screens/cat/components/CatEntryModal): create or edit a translation memory segment or a glossary term.
import { Text, View } from 'react-native';
import FormModal from '@/components/ui/FormModal';
import { Icon } from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Switch from '@/components/ui/Switch';
import { useToast } from '@/context/ToastContext';
import { createCatEntry, createTerm, updateCatEntry, updateTerm } from '@/libs/api/planning';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'approved', label: 'Approved' },
];

const SEGMENT_DEFAULTS = { sourceText: '', targetText: '', sourceLang: 'en', targetLang: '', status: 'draft' };
const TERM_DEFAULTS = { term: '', definition: '', language: 'en', forbidden: false };

function Section({ icon, children }) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon name={icon} size={16} />
      <Text className="text-foreground font-semibold text-sm">{children}</Text>
    </View>
  );
}

export default function CatEntryModal({ open, onClose, projectId, mode = 'segment', entry, onSaved }) {
  const toast = useToast();
  const isSegment = mode === 'segment';
  const base = isSegment ? SEGMENT_DEFAULTS : TERM_DEFAULTS;
  const initialValues = entry
    ? isSegment
      ? {
          sourceText: entry.sourceText ?? '',
          targetText: entry.targetText ?? '',
          sourceLang: entry.sourceLang ?? '',
          targetLang: entry.targetLang ?? '',
          status: entry.status ?? 'draft',
        }
      : {
          term: entry.term ?? '',
          definition: entry.definition ?? '',
          language: entry.language ?? '',
          forbidden: !!entry.forbidden,
        }
    : base;

  const onSubmit = async (values) => {
    let saved;
    if (isSegment) {
      const body = {
        sourceText: values.sourceText.trim(),
        targetText: values.targetText.trim(),
        sourceLang: values.sourceLang.trim().toLowerCase(),
        targetLang: values.targetLang.trim().toLowerCase(),
        status: values.status,
      };
      saved = entry ? await updateCatEntry(projectId, entry.id, body) : await createCatEntry(projectId, body);
    } else {
      const body = {
        term: values.term.trim(),
        definition: values.definition.trim(),
        language: values.language.trim().toLowerCase(),
        forbidden: !!values.forbidden,
      };
      saved = entry ? await updateTerm(projectId, entry.id, body) : await createTerm(projectId, body);
    }
    toast.success('Saved');
    onSaved?.(saved.data);
  };

  const title = isSegment ? (entry ? 'Edit segment' : 'New segment') : entry ? 'Edit term' : 'New term';

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={title}
      description={
        isSegment
          ? 'A source sentence and its approved translation. Language codes such as en or de.'
          : 'A glossary term. Mark it forbidden to flag wrong wording in review.'
      }
      size="md"
      submitLabel="Save"
      initialValues={initialValues}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) =>
        isSegment ? (
          <View className="gap-4">
            <Section icon="translate">Segment</Section>
            <Input
              as="textarea"
              label="Source text"
              hint="The sentence as written in the source language."
              value={values.sourceText}
              maxLength={5000}
              onChangeText={(v) => set('sourceText', v)}
              error={errors.sourceText}
            />
            <Input
              as="textarea"
              label="Target text"
              hint="The approved translation. Leave blank if not translated yet."
              value={values.targetText}
              maxLength={5000}
              onChangeText={(v) => set('targetText', v)}
              error={errors.targetText}
            />
            <Input
              label="Source language"
              hint="A language code, for example en."
              value={values.sourceLang}
              maxLength={12}
              autoCapitalize="none"
              onChangeText={(v) => set('sourceLang', v)}
              error={errors.sourceLang}
            />
            <Input
              label="Target language"
              hint="A language code, for example de."
              value={values.targetLang}
              maxLength={12}
              autoCapitalize="none"
              onChangeText={(v) => set('targetLang', v)}
              error={errors.targetLang}
            />
            <Select
              label="Status"
              hint="Only approved segments are reused as suggestions."
              value={values.status}
              options={STATUS_OPTIONS}
              onChange={(v) => set('status', v)}
              error={errors.status}
            />
          </View>
        ) : (
          <View className="gap-4">
            <Section icon="book">Term</Section>
            <Input
              label="Term"
              hint="The word or phrase as it appears in the glossary."
              value={values.term}
              maxLength={120}
              onChangeText={(v) => set('term', v)}
              error={errors.term}
            />
            <Input
              label="Language"
              hint="A language code, for example en."
              value={values.language}
              maxLength={12}
              autoCapitalize="none"
              onChangeText={(v) => set('language', v)}
              error={errors.language}
            />
            <Input
              as="textarea"
              label="Definition"
              hint="What the term means in this project. Up to 1000 characters."
              value={values.definition}
              maxLength={1000}
              onChangeText={(v) => set('definition', v)}
              error={errors.definition}
            />
            <View className="flex-row items-center justify-between gap-3 rounded-[14px] border border-border bg-surface p-3">
              <View className="flex-1 gap-0.5">
                <Text className="font-semibold text-foreground">Forbidden</Text>
                <Text className="text-muted text-[13px]">Translators should not use this wording.</Text>
              </View>
              <Switch checked={!!values.forbidden} onChange={(v) => set('forbidden', v)} label="Forbidden" hideLabel />
            </View>
          </View>
        )
      }
    />
  );
}

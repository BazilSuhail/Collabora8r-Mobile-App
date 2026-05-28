// feat(screens/tests/components/TestCaseFormModal): create or edit a test case with its precondition, priority, status and steps.
import { Text, View } from 'react-native';
import FormModal from '@/components/ui/FormModal';
import { Icon } from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { createTestCase, updateTestCase } from '@/libs/api/tests';
import { useToast } from '@/context/ToastContext';

const textOf = (e) => (typeof e === 'string' ? e : (e?.target?.value ?? e?.nativeEvent?.text ?? ''));

const PRIORITY_OPTIONS = [
  { value: 'Critical', label: 'Critical' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'deprecated', label: 'Deprecated' },
];

// One step per line. Write "action | expected result" to add the expected part.
export const stepsToText = (steps = []) =>
  steps.map((s) => (s.expected ? `${s.action} | ${s.expected}` : s.action)).join('\n');

export const textToSteps = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [action, ...rest] = line.split('|');
      const expected = rest.join('|').trim();
      return expected ? { action: action.trim(), expected } : { action: action.trim() };
    });

function Section({ icon, children }) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon name={icon} size={16} />
      <Text className="text-foreground font-semibold text-[14px]">{children}</Text>
    </View>
  );
}

export default function TestCaseFormModal({ open, onClose, projectId, testCase, onSaved }) {
  const toast = useToast();
  const initialValues = {
    title: testCase?.title ?? '',
    priority: testCase?.priority ?? 'Medium',
    status: testCase?.status ?? 'draft',
    precondition: testCase?.precondition ?? '',
    steps: stepsToText(testCase?.steps),
  };

  const onSubmit = async (values) => {
    const body = {
      title: values.title.trim(),
      priority: values.priority,
      status: values.status,
      precondition: values.precondition.trim(),
      steps: textToSteps(values.steps),
    };
    const saved = testCase ? await updateTestCase(projectId, testCase.id, body) : await createTestCase(projectId, body);
    toast.success('Test case saved');
    onSaved?.(saved.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={testCase ? 'Edit test case' : 'New test case'}
      description="Steps are read in order by whoever runs the test."
      size="lg"
      submitLabel="Save"
      initialValues={initialValues}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <View className="gap-4">
          <Section icon="file">Details</Section>
          <Input
            label="Title"
            hint="Name what the test proves, up to 300 characters."
            value={values.title}
            maxLength={300}
            onChange={(e) => set('title', textOf(e))}
            error={errors.title}
          />
          <Select
            label="Priority"
            hint="How serious a failure is."
            value={values.priority}
            options={PRIORITY_OPTIONS}
            onChange={(v) => set('priority', v)}
            error={errors.priority}
          />
          <Select
            label="Status"
            hint="Draft cases are still being written."
            value={values.status}
            options={STATUS_OPTIONS}
            onChange={(v) => set('status', v)}
            error={errors.status}
          />
          <Input
            as="textarea"
            multiline
            label="Preconditions"
            hint="What must be true before the first step. Leave blank if none."
            value={values.precondition}
            maxLength={2000}
            onChange={(e) => set('precondition', textOf(e))}
            error={errors.precondition}
          />
          <Section icon="list">Procedure</Section>
          <Input
            as="textarea"
            multiline
            autoCapitalize="sentences"
            label="Steps"
            hint="One step per line. Add the expected result after a bar, for example: Open the login page | Form shows."
            value={values.steps}
            onChange={(e) => set('steps', textOf(e))}
            error={errors.steps}
          />
        </View>
      )}
    />
  );
}

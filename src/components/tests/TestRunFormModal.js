// feat(screens/tests/components/TestRunFormModal): start a new test run with a name, environment and build version.
import { Text, View } from 'react-native';
import FormModal from '@/components/ui/FormModal';
import { Icon } from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { createTestRun } from '@/libs/api/tests';

const textOf = (e) => (typeof e === 'string' ? e : (e?.target?.value ?? e?.nativeEvent?.text ?? ''));

const initialValues = { name: '', environment: '', buildVersion: '' };

export default function TestRunFormModal({ open, onClose, projectId, onCreated }) {
  const toast = useToast();

  const onSubmit = async (values) => {
    const body = {
      name: values.name.trim(),
      environment: values.environment.trim(),
      buildVersion: values.buildVersion.trim(),
    };
    const created = await createTestRun(projectId, body);
    toast.success('Run created');
    onCreated?.(created.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="New test run"
      description="Record results for each test case inside the run."
      size="md"
      submitLabel="Create run"
      initialValues={initialValues}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <View className="gap-4">
          <View className="flex-row items-center gap-2">
            <Icon name="tasks" size={16} />
            <Text className="text-foreground font-semibold text-[14px]">Run</Text>
          </View>
          <Input
            label="Run name"
            hint="Something the team recognises, up to 200 characters."
            value={values.name}
            maxLength={200}
            onChange={(e) => set('name', textOf(e))}
            error={errors.name}
          />
          <Input
            label="Environment"
            hint="Where the run executes, for example staging."
            value={values.environment}
            maxLength={120}
            autoCapitalize="none"
            onChange={(e) => set('environment', textOf(e))}
            error={errors.environment}
          />
          <Input
            label="Build version"
            hint="The build under test, for example 1.4.2."
            value={values.buildVersion}
            maxLength={120}
            autoCapitalize="none"
            onChange={(e) => set('buildVersion', textOf(e))}
            error={errors.buildVersion}
          />
        </View>
      )}
    />
  );
}

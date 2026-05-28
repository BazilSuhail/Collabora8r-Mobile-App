import { Text, View } from 'react-native';
import FormModal from '@/components/ui/FormModal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Switch from '@/components/ui/Switch';
import ThemePicker from './ThemePicker';

const VISIBILITY = [
  { value: 'private', label: 'Private' },
  { value: 'request', label: 'Request to join' },
  { value: 'open', label: 'Open to the organization' },
];

// Create a project. allowPersonal shows the personal switch (personal projects have no org).
// onSubmit(values) belongs to the page: values.personal picks the endpoint. It throws on failure.
export default function ProjectFormModal({ open, onClose, allowPersonal = false, onSubmit }) {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="New project"
      description="Issues, boards and reports belong to a project."
      size="lg"
      submitLabel="Create project"
      initialValues={{ name: '', key: '', description: '', visibility: 'private', themeKey: null, personal: false }}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <>
          <Input label="Name" value={values.name} onChangeText={(t) => set('name', t)} error={errors.name} hint="The name people see across the workspace." />
          <Input
            label="Key"
            autoCapitalize="characters"
            autoCorrect={false}
            value={values.key}
            onChangeText={(t) => set('key', t)}
            error={errors.key}
            hint="2 to 10 letters, used in issue keys."
          />
          <Input
            wide
            as="textarea"
            multiline
            label="Description"
            value={values.description}
            onChangeText={(t) => set('description', t)}
            error={errors.description}
            hint="Optional. Shown on the project card."
          />
          <View className="gap-[4px]">
            <Select label="Visibility" value={values.visibility} onChange={(v) => set('visibility', v)} options={VISIBILITY} error={errors.visibility} />
            <Text className="text-[12.5px] text-muted">Controls who can find and join this project.</Text>
          </View>
          <ThemePicker value={values.themeKey} onChange={(key) => set('themeKey', key)} />
          {allowPersonal ? <Switch label="Personal project" checked={values.personal} onChange={(v) => set('personal', v)} /> : null}
        </>
      )}
    />
  );
}

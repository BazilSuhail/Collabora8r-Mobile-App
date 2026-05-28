// feat(screens/projectSettings/components/ProjectSettingsNav): switch between project settings sections, hiding the ones the role cannot open.
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { useProject } from '@/context/ProjectContext';
import { paths } from '@/routes/paths';

const SECTIONS = [
  { value: 'general', label: 'General', to: paths.projectSettings },
  { value: 'people', label: 'People', to: paths.projectPeople },
  { value: 'roles', label: 'Roles', to: paths.projectRoles },
  { value: 'workflows', label: 'Workflows', to: paths.workflows },
  { value: 'fields', label: 'Fields', to: paths.fields },
  { value: 'labels', label: 'Labels', to: paths.labels },
  { value: 'audit', label: 'Audit', to: paths.projectAudit, adminOnly: true },
];

export default function ProjectSettingsNav({ active }) {
  const { projectId, can } = useProject();
  const router = useRouter();
  const options = SECTIONS.filter((s) => !s.adminOnly || can('audit.view')).map(({ value, label }) => ({
    value,
    label,
  }));

  const go = (value) => {
    if (value === active) return;
    const section = SECTIONS.find((s) => s.value === value);
    // Replace keeps the settings sections as one stack entry, like tabs.
    if (section) router.replace(section.to(projectId));
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-4 flex-grow-0"
      contentContainerClassName="pr-4"
    >
      <SegmentedControl as="tabs" label="Project settings sections" value={active} options={options} onChange={go} />
    </ScrollView>
  );
}

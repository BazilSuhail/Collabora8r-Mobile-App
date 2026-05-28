import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import ActionSheet from '@/components/shared/ActionSheet';
import { listOrgProjects, listPersonalProjects } from '@/libs/api/projects';
import { paths } from '@/routes/paths';
import { SWITCH_CLASS } from './OrgSwitcher';
import { useThemeColors } from './useThemeColors';

const pidOf = (p) => String(p.id ?? p._id);

// Project switcher. The list loads the first time the sheet opens, cached per org key.
export default function ProjectSwitcher({ project, orgId, personal = false, onNavigate }) {
  const router = useRouter();
  const colors = useThemeColors();
  const [open, setOpen] = useState(false);
  const [cache, setCache] = useState({ key: null, items: null });
  const key = personal ? 'personal' : (orgId ?? 'none');

  const load = () => {
    if (cache.key === key) return;
    const request = personal || !orgId ? listPersonalProjects() : listOrgProjects(orgId, { limit: 100 });
    setCache({ key, items: null });
    request.then((res) => setCache({ key, items: res.data ?? [] })).catch(() => setCache({ key, items: [] }));
  };

  const go = (href) => {
    onNavigate?.();
    router.navigate(href);
  };

  const projects = cache.key === key ? cache.items : null;
  const items = [];
  if (projects === null) {
    items.push({ id: 'loading', label: 'Loading projects', disabled: true });
  } else if (projects.length === 0) {
    items.push({ id: 'none', label: 'No projects yet', disabled: true });
  } else {
    projects.forEach((p) =>
      items.push({
        id: pidOf(p),
        label: p.name,
        icon: 'project',
        selected: project && pidOf(project) === pidOf(p),
        onSelect: () => go(paths.project(pidOf(p))),
      }),
    );
  }
  items.push('separator');
  items.push({ id: 'all', label: 'All projects', icon: 'folder', onSelect: () => go(paths.projects()) });

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Project: ${project?.name ?? 'Choose a project'}`}
        onPress={() => {
          load();
          setOpen(true);
        }}
        className={SWITCH_CLASS}
      >
        <Icon name="project" size={16} color={colors['side-text'] ?? colors.foreground} />
        <Text numberOfLines={1} className="flex-1 min-w-0 text-[13px] font-semibold text-side-text">
          {project?.name ?? 'Choose a project'}
        </Text>
        <Icon name="upDown" size={14} color={colors['side-muted'] ?? colors.muted} />
      </Pressable>
      <ActionSheet open={open} onClose={() => setOpen(false)} title="Project" items={items} />
    </>
  );
}

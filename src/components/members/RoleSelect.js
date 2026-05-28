import Select from '@/components/ui/Select';
import { ORG_ROLES, PROJECT_ROLES } from '@/metadata/settings';

const ALL = { org: ORG_ROLES, project: PROJECT_ROLES };

// Label for any org or project role id, including ones outside the lists.
export const roleLabel = (role) => {
  const hit = [...ORG_ROLES, ...PROJECT_ROLES].find((r) => r.id === role);
  return hit?.label ?? (role ? String(role) : 'No role');
};

// Role picker over the org or project role ladder. roles limits the choices (invites never offer owner).
export default function RoleSelect({ scope = 'org', value, onChange, roles, label = 'Role', ...rest }) {
  const list = ALL[scope] ?? ORG_ROLES;
  const allowedRoles = roles ? list.filter((r) => roles.includes(r.id)) : list;
  const options = allowedRoles.map((r) => ({ value: r.id, label: r.label, description: r.desc }));
  return <Select label={label} value={value} onChange={onChange} options={options} {...rest} />;
}

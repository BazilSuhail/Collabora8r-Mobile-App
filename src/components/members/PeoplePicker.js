import { useMemo } from 'react';
import Select from '@/components/ui/Select';
import { searchUsers } from '@/libs/api/users';

// Searchable person picker. With members it picks from that list (org or project members).
// Without members it searches users through GET /users/search.
export default function PeoplePicker({ value, onChange, members, multiple = false, label = 'Person', placeholder = 'Find a person', ...rest }) {
  const options = useMemo(
    () =>
      (members ?? []).map((m) => ({
        value: m.userId ?? m.id,
        label: m.userName || 'Unnamed',
        description: m.userHeadline || undefined,
      })),
    [members],
  );

  const loadOptions = async (q) => {
    const { data } = await searchUsers(q);
    return (data ?? []).map((u) => ({
      value: u.id,
      label: u.displayName || u.email || 'Unnamed',
      description: u.email || undefined,
    }));
  };

  return (
    <Select
      label={label}
      value={value}
      onChange={onChange}
      options={members ? options : []}
      loadOptions={members ? undefined : loadOptions}
      searchable
      multiple={multiple}
      placeholder={placeholder}
      {...rest}
    />
  );
}

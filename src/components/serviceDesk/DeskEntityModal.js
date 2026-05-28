// feat(screens/serviceDesk/components/DeskEntityModal): create or edit a service desk customer, request type or SLA policy.
import { View } from 'react-native';
import FormModal from '@/components/ui/FormModal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Switch from '@/components/ui/Switch';
import { useToast } from '@/context/ToastContext';
import {
  createCustomer,
  createRequestType,
  createSlaPolicy,
  updateCustomer,
  updateRequestType,
  updateSlaPolicy,
} from '@/libs/api/servicedesk';

const idOf = (row) => String(row?.id ?? row?._id ?? '');
const NONE = '';

const ENTITY = {
  customers: { label: 'customer', create: createCustomer, update: updateCustomer },
  'request-types': { label: 'request type', create: createRequestType, update: updateRequestType },
  'sla-policies': { label: 'SLA policy', create: createSlaPolicy, update: updateSlaPolicy },
};

// Drops empty optional strings so the server keeps its defaults.
const compact = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v !== undefined));
const minutes = (v) => (v === '' || v == null ? null : Number(v));
const digits = (v) => String(v ?? '').replace(/[^0-9]/g, '');

const initialFor = (entity, record) => {
  if (entity === 'customers') {
    return {
      name: record?.name ?? '',
      email: record?.email ?? '',
      company: record?.company ?? '',
      phone: record?.phone ?? '',
      notes: record?.notes ?? '',
    };
  }
  if (entity === 'request-types') {
    return {
      name: record?.name ?? '',
      description: record?.description ?? '',
      issueTypeId: record?.issueTypeId ? idOf({ id: record.issueTypeId }) : '',
      slaPolicyId: record?.slaPolicyId ? idOf({ id: record.slaPolicyId }) : NONE,
      defaultPriorityId: record?.defaultPriorityId ? idOf({ id: record.defaultPriorityId }) : NONE,
      approverIds: (record?.approverIds ?? []).map((id) => idOf({ id })),
      approvalRequired: Boolean(record?.approvalRequired),
      isActive: record ? Boolean(record.isActive) : true,
    };
  }
  return {
    name: record?.name ?? '',
    description: record?.description ?? '',
    firstResponseMinutes: record?.targets?.firstResponseMinutes != null ? String(record.targets.firstResponseMinutes) : '',
    resolutionMinutes: record?.targets?.resolutionMinutes != null ? String(record.targets.resolutionMinutes) : '',
    isDefault: Boolean(record?.isDefault),
  };
};

const bodyFor = (entity, v) => {
  if (entity === 'customers') {
    return compact({
      name: v.name.trim(),
      email: v.email.trim(),
      company: v.company.trim(),
      phone: v.phone.trim(),
      notes: v.notes.trim(),
    });
  }
  if (entity === 'request-types') {
    return compact({
      name: v.name.trim(),
      description: v.description.trim(),
      issueTypeId: v.issueTypeId,
      slaPolicyId: v.slaPolicyId || null,
      defaultPriorityId: v.defaultPriorityId || null,
      approverIds: v.approverIds,
      approvalRequired: v.approvalRequired,
      isActive: v.isActive,
    });
  }
  return compact({
    name: v.name.trim(),
    description: v.description.trim(),
    targets: {
      firstResponseMinutes: minutes(v.firstResponseMinutes),
      resolutionMinutes: minutes(v.resolutionMinutes),
    },
    isDefault: v.isDefault,
  });
};

// lookups: { types, priorities, members, policies } from the project context and the SLA list.
export default function DeskEntityModal({ open, onClose, pid, entity, record, lookups, onSaved }) {
  const toast = useToast();
  const config = ENTITY[entity];
  if (!config) return null;
  const editing = Boolean(record);
  const { types = [], priorities = [], members = [], policies = [] } = lookups ?? {};

  const submit = async (values) => {
    const body = bodyFor(entity, values);
    const res = editing ? await config.update(pid, idOf(record), body) : await config.create(pid, body);
    toast.success('Saved');
    onSaved?.(res.data);
  };

  const typeOptions = (types ?? []).map((t) => ({ value: idOf(t), label: t.name }));
  const policyOptions = [{ value: NONE, label: 'No SLA policy' }, ...(policies ?? []).map((p) => ({ value: idOf(p), label: p.name }))];
  const priorityOptions = [
    { value: NONE, label: 'Project default' },
    ...(priorities ?? []).map((p) => ({ value: idOf(p), label: p.name })),
  ];
  const memberOptions = (members ?? []).map((m) => ({
    value: String(m.userId ?? m.id ?? ''),
    label: m.displayName ?? m.user?.displayName ?? m.name ?? m.userName ?? String(m.userId ?? m.id ?? ''),
  }));

  const fields = ({ values, set, errors }) => {
    if (entity === 'customers') {
      return (
        <View className="gap-4">
          <Input label="Name" value={values.name} onChangeText={(v) => set('name', v)} error={errors.name} required maxLength={120} />
          <Input
            label="Email"
            type="email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            hint="Required. Used to contact this customer."
            value={values.email}
            onChangeText={(v) => set('email', v)}
            error={errors.email}
            required
          />
          <Input label="Company" hint="Optional." value={values.company} onChangeText={(v) => set('company', v)} error={errors.company} />
          <Input
            label="Phone"
            type="tel"
            keyboardType="phone-pad"
            autoComplete="tel"
            hint="Optional."
            value={values.phone}
            onChangeText={(v) => set('phone', v)}
            error={errors.phone}
          />
          <Input
            as="textarea"
            multiline
            label="Notes"
            hint="Optional. Notes about this customer."
            value={values.notes}
            onChangeText={(v) => set('notes', v)}
            error={errors.notes}
          />
        </View>
      );
    }

    if (entity === 'request-types') {
      return (
        <View className="gap-4">
          <Input label="Name" value={values.name} onChangeText={(v) => set('name', v)} error={errors.name} required maxLength={120} />
          <Input
            as="textarea"
            multiline
            label="Description"
            value={values.description}
            onChangeText={(v) => set('description', v)}
            error={errors.description}
          />
          <Select
            label="Issue type"
            options={typeOptions}
            value={values.issueTypeId}
            onChange={(value) => set('issueTypeId', value)}
            error={errors.issueTypeId}
            required
            placeholder="Choose a type"
          />
          <Select
            label="SLA policy"
            hint="Sets the response and resolution targets."
            options={policyOptions}
            value={values.slaPolicyId}
            onChange={(value) => set('slaPolicyId', value)}
            error={errors.slaPolicyId}
          />
          <Select
            label="Default priority"
            hint="Optional. Used when a request has no priority."
            options={priorityOptions}
            value={values.defaultPriorityId}
            onChange={(value) => set('defaultPriorityId', value)}
            error={errors.defaultPriorityId}
          />
          <Select
            label="Approvers"
            hint="People who sign off before work starts."
            multiple
            searchable
            options={memberOptions}
            value={values.approverIds}
            onChange={(value) => set('approverIds', value)}
            error={errors.approverIds}
            placeholder="Choose approvers"
          />
          <View className="gap-3">
            <Switch checked={values.approvalRequired} onChange={(v) => set('approvalRequired', v)} label="Approval required" />
            <Switch checked={values.isActive} onChange={(v) => set('isActive', v)} label="Active" />
          </View>
        </View>
      );
    }

    return (
      <View className="gap-4">
        <Input label="Name" value={values.name} onChangeText={(v) => set('name', v)} error={errors.name} required maxLength={120} />
        <Input
          as="textarea"
          multiline
          label="Description"
          value={values.description}
          onChangeText={(v) => set('description', v)}
          error={errors.description}
        />
        <Input
          label="First response (minutes)"
          type="number"
          keyboardType="number-pad"
          hint="Blank for no target"
          value={String(values.firstResponseMinutes ?? '')}
          onChangeText={(v) => set('firstResponseMinutes', digits(v))}
          error={errors['targets.firstResponseMinutes']}
        />
        <Input
          label="Resolution (minutes)"
          type="number"
          keyboardType="number-pad"
          hint="Blank for no target"
          value={String(values.resolutionMinutes ?? '')}
          onChangeText={(v) => set('resolutionMinutes', digits(v))}
          error={errors['targets.resolutionMinutes']}
        />
        <Switch checked={values.isDefault} onChange={(v) => set('isDefault', v)} label="Default policy for new requests" />
      </View>
    );
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${config.label}` : `New ${config.label}`}
      submitLabel="Save"
      initialValues={initialFor(entity, record)}
      onSubmit={submit}
      fields={fields}
    />
  );
}

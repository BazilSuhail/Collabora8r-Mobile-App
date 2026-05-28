// feat(screens/risks/components/RiskFormModal): create or edit a risk with its probability, impact, owner, status and mitigation.
import { Pressable, Text, View } from 'react-native';
import FormModal from '@/components/ui/FormModal';
import { Icon } from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/context/ToastContext';
import { createRisk, updateRisk } from '@/libs/api/planning';

const SCALE = ['1', '2', '3', '4', '5'];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'mitigating', label: 'Mitigating' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'closed', label: 'Closed' },
];

// A 1 to 5 segmented picker. Easier to hit on touch than a dropdown.
function ScalePicker({ label, hint, value, onChange, error }) {
  return (
    <View className="gap-1.5">
      <Text className="text-foreground font-semibold text-[13px]">{label}</Text>
      <View className="flex-row gap-1.5" accessibilityRole="radiogroup" accessibilityLabel={label}>
        {SCALE.map((n) => {
          const on = value === n;
          return (
            <Pressable
              key={n}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${label} ${n}`}
              onPress={() => onChange(n)}
              className={`flex-1 h-11 rounded-lg items-center justify-center border ${
                on ? 'bg-accent border-accent' : 'bg-surface border-border'
              }`}
            >
              <Text className={`font-semibold text-[14px] ${on ? 'text-on-accent' :'text-foreground'}`}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="text-danger text-[12px]">{error}</Text> : hint ? <Text className="text-muted text-[12px]">{hint}</Text> : null}
    </View>
  );
}

function SectionTitle({ icon, children }) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon name={icon} size={16} />
      <Text className="text-foreground font-semibold text-[14px]">{children}</Text>
    </View>
  );
}

export default function RiskFormModal({ open, onClose, projectId, risk, members = [], onSaved }) {
  const toast = useToast();
  const ownerOptions = [
    { value: '', label: 'No owner' },
    ...members.map((m) => ({ value: m.userId, label: m.userName ?? 'Member' })),
  ];
  const initialValues = {
    title: risk?.title ?? '',
    category: risk?.category ?? '',
    probability: String(risk?.probability ?? 3),
    impact: String(risk?.impact ?? 3),
    status: risk?.status ?? 'open',
    ownerId: risk?.ownerId ? String(risk.ownerId) : '',
    mitigation: risk?.mitigation ?? '',
  };

  const onSubmit = async (values) => {
    const body = {
      title: values.title.trim(),
      category: values.category.trim(),
      probability: Number(values.probability),
      impact: Number(values.impact),
      status: values.status,
      ownerId: values.ownerId || null,
      mitigation: values.mitigation.trim(),
    };
    const saved = risk ? await updateRisk(projectId, risk.id, body) : await createRisk(projectId, body);
    toast.success('Risk saved');
    onSaved?.(saved.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={risk ? 'Edit risk' : 'New risk'}
      description="Score is probability times impact, from 1 to 25."
      size="md"
      submitLabel="Save"
      initialValues={initialValues}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <View className="gap-4">
          <SectionTitle icon="risk">Risk</SectionTitle>
          <Input
            label="Title"
            hint="Describe the event, not its cause."
            value={values.title}
            maxLength={200}
            onChangeText={(v) => set('title', v)}
            error={errors.title}
          />
          <Input
            label="Category"
            hint="For example Schedule, Budget or Vendor."
            value={values.category}
            maxLength={80}
            onChangeText={(v) => set('category', v)}
            error={errors.category}
          />
          <Select
            label="Status"
            hint="Accepted risks are watched but not worked."
            value={values.status}
            options={STATUS_OPTIONS}
            onChange={(v) => set('status', v)}
            error={errors.status}
          />
          <ScalePicker
            label="Probability"
            hint="1 is rare, 5 is almost certain."
            value={values.probability}
            onChange={(v) => set('probability', v)}
            error={errors.probability}
          />
          <ScalePicker
            label="Impact"
            hint="1 is minor, 5 is severe."
            value={values.impact}
            onChange={(v) => set('impact', v)}
            error={errors.impact}
          />
          <Text className="text-muted text-[12.5px]">
            Score {Number(values.probability) * Number(values.impact)} of 25
          </Text>
          <SectionTitle icon="shield">Response</SectionTitle>
          <Select
            label="Owner"
            hint="The person who watches this risk."
            value={values.ownerId}
            options={ownerOptions}
            onChange={(v) => set('ownerId', v)}
            error={errors.ownerId}
          />
          <Input
            as="textarea"
            multiline
            label="Mitigation"
            hint="The steps that reduce the probability or impact."
            value={values.mitigation}
            maxLength={5000}
            onChangeText={(v) => set('mitigation', v)}
            error={errors.mitigation}
          />
        </View>
      )}
    />
  );
}

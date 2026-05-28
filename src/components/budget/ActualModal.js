// feat(screens/budget/components/ActualModal): record one actual spend against a budget line with amount, date, vendor and note.
import { Text, View } from 'react-native';
import FormModal from '@/components/ui/FormModal';
import { Icon } from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/context/ToastContext';
import { createActual } from '@/libs/api/planning';

const todayText = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const decimal = (v) => v.replace(',', '.').replace(/[^0-9.]/g, '');

export default function ActualModal({ open, onClose, projectId, lines = [], defaultLineId = '', onSaved }) {
  const toast = useToast();
  const lineOptions = lines.map((l) => ({ value: l.lineId, label: l.name }));
  const initialValues = {
    budgetLineId: defaultLineId || lines[0]?.lineId || '',
    amount: '',
    incurredOn: todayText(),
    vendor: '',
    description: '',
  };

  const onSubmit = async (values) => {
    const body = {
      budgetLineId: values.budgetLineId,
      amount: Number(values.amount),
      incurredOn: values.incurredOn,
      vendor: values.vendor.trim(),
      description: values.description.trim(),
    };
    const saved = await createActual(projectId, body);
    toast.success('Actual recorded');
    onSaved?.(saved.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Record actual"
      description="Spend that has already happened, against one budget line."
      size="md"
      submitLabel="Record actual"
      initialValues={initialValues}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <View className="gap-4">
          <View className="flex-row items-center gap-2">
            <Icon name="coins" size={16} />
            <Text className="text-foreground font-semibold text-sm">Spend</Text>
          </View>
          <Select
            label="Budget line"
            hint="The line this spend is charged to."
            value={values.budgetLineId}
            options={lineOptions}
            placeholder="Pick a line"
            onChange={(v) => set('budgetLineId', v)}
            error={errors.budgetLineId}
          />
          <Input
            label="Amount"
            hint="Enter the amount in the line currency."
            keyboardType="decimal-pad"
            value={values.amount}
            onChangeText={(v) => set('amount', decimal(v))}
            error={errors.amount}
          />
          {/* shortcut: plain YYYY-MM-DD text field until a shared date picker exists. */}
          <Input
            label="Date"
            hint="When the cost was incurred. YYYY-MM-DD."
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            value={values.incurredOn}
            onChangeText={(v) => set('incurredOn', v)}
            error={errors.incurredOn}
          />
          <Input
            label="Vendor"
            hint="Who was paid. Optional."
            value={values.vendor}
            maxLength={200}
            onChangeText={(v) => set('vendor', v)}
            error={errors.vendor}
          />
          <Input
            as="textarea"
            label="Note"
            hint="What the spend was for. Up to 1000 characters."
            value={values.description}
            maxLength={1000}
            onChangeText={(v) => set('description', v)}
            error={errors.description}
          />
        </View>
      )}
    />
  );
}

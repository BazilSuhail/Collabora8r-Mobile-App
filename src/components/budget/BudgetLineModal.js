// feat(screens/budget/components/BudgetLineModal): create or edit a budget line with its category, planned and forecast amounts and currency.
import { Text, View } from 'react-native';
import FormModal from '@/components/ui/FormModal';
import { Icon } from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { createBudgetLine, updateBudgetLine } from '@/libs/api/planning';

const amountText = (value) => (value === undefined || value === null ? '' : String(value));

const optionalAmount = (text) => (text.trim() === '' ? undefined : Number(text));

const decimal = (v) => v.replace(',', '.').replace(/[^0-9.]/g, '');

function Section({ icon, children }) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon name={icon} size={16} />
      <Text className="text-foreground font-semibold text-sm">{children}</Text>
    </View>
  );
}

export default function BudgetLineModal({ open, onClose, projectId, line, onSaved }) {
  const toast = useToast();
  const initialValues = {
    name: line?.name ?? '',
    category: line?.category ?? '',
    planned: amountText(line?.planned ?? 0),
    forecast: amountText(line?.forecast ?? 0),
    currency: line?.currency ?? 'USD',
  };

  const onSubmit = async (values) => {
    const body = {
      name: values.name.trim(),
      category: values.category.trim(),
      planned: optionalAmount(values.planned) ?? 0,
      forecast: optionalAmount(values.forecast) ?? 0,
      currency: values.currency.trim().toUpperCase(),
    };
    const saved = line ? await updateBudgetLine(projectId, line.lineId, body) : await createBudgetLine(projectId, body);
    toast.success('Line saved');
    onSaved?.(saved.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={line ? 'Edit budget line' : 'New budget line'}
      description="Planned is the approved amount. Forecast is your current estimate."
      size="md"
      submitLabel="Save line"
      initialValues={initialValues}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <View className="gap-4">
          <Section icon="budget">Line</Section>
          <Input
            label="Name"
            hint="The name the team sees on the budget, up to 200 characters."
            value={values.name}
            maxLength={200}
            onChangeText={(v) => set('name', v)}
            error={errors.name}
          />
          <Input
            label="Category"
            hint="For example Travel or Equipment."
            value={values.category}
            maxLength={80}
            onChangeText={(v) => set('category', v)}
            error={errors.category}
          />
          <Input
            label="Currency"
            hint="Three letters, for example USD."
            value={values.currency}
            maxLength={3}
            autoCapitalize="characters"
            onChangeText={(v) => set('currency', v)}
            error={errors.currency}
          />
          <Section icon="dollar">Amounts</Section>
          <Input
            label="Planned"
            hint="The approved amount. Zero when blank."
            keyboardType="decimal-pad"
            value={values.planned}
            onChangeText={(v) => set('planned', decimal(v))}
            error={errors.planned}
          />
          <Input
            label="Forecast"
            hint="Your current estimate. Zero when blank."
            keyboardType="decimal-pad"
            value={values.forecast}
            onChangeText={(v) => set('forecast', decimal(v))}
            error={errors.forecast}
          />
        </View>
      )}
    />
  );
}

import FormModal from '@/components/ui/FormModal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { createGoal, updateGoal } from '@/libs/api/reports';
import { useToast } from '@/context/ToastContext';
import { METRIC_LABEL } from './GoalCard';

const METRIC_OPTIONS = Object.entries(METRIC_LABEL).map(([value, label]) => ({ value, label }));

// Create or edit a goal. goal is null to create. Errors are thrown so FormModal can show them.
export default function GoalFormModal({ open, onClose, projectId, goal, onSaved }) {
  const toast = useToast();
  const initialValues = {
    title: goal?.title ?? '',
    metric: goal?.metric ?? 'itemCount',
    target: goal ? String(goal.target ?? 0) : '',
    unit: goal?.unit ?? '',
    dueDate: goal?.dueDate ? String(goal.dueDate).slice(0, 10) : '',
  };

  const onSubmit = async (v) => {
    const due = v.dueDate.trim();
    const body = {
      title: v.title.trim(),
      metric: v.metric,
      target: Number(v.target),
      unit: v.unit.trim(),
      dueDate: due ? new Date(`${due}T00:00:00Z`).toISOString() : null,
    };
    const res = goal ? await updateGoal(projectId, goal.id ?? goal._id, body) : await createGoal(projectId, body);
    toast.success('Goal saved');
    onSaved?.(res.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={goal ? 'Edit goal' : 'New goal'}
      description="A number the project works toward. Linked work moves it on its own."
      submitLabel={goal ? 'Save goal' : 'Create goal'}
      initialValues={initialValues}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <>
          <Input
            label="Name"
            value={values.title}
            onChangeText={(t) => set('title', t)}
            error={errors.title}
            hint="Short and specific, up to 200 characters."
            maxLength={200}
          />
          <Select
            label="Metric"
            value={values.metric}
            onChange={(v) => set('metric', v)}
            options={METRIC_OPTIONS}
            error={errors.metric}
            hint="What the target counts. Linked work updates it."
          />
          <Input
            label="Target"
            keyboardType="decimal-pad"
            value={values.target}
            onChangeText={(t) => set('target', t)}
            error={errors.target}
            hint="Required. The number the goal works toward."
          />
          <Input
            label="Unit"
            value={values.unit}
            onChangeText={(t) => set('unit', t)}
            error={errors.unit}
            hint="Shown after the numbers, for example h or pts."
            maxLength={30}
          />
          <Input
            label="Due date"
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            value={values.dueDate}
            onChangeText={(t) => set('dueDate', t)}
            error={errors.dueDate}
            hint="Optional. Leave empty for no deadline."
          />
        </>
      )}
    />
  );
}

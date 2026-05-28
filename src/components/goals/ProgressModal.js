import FormModal from '@/components/ui/FormModal';
import Input from '@/components/ui/Input';
import { recordProgress } from '@/libs/api/reports';
import { useToast } from '@/context/ToastContext';

// Records the current value of a goal. Errors are thrown so FormModal can show them.
export default function ProgressModal({ open, onClose, projectId, goal, onSaved }) {
  const toast = useToast();

  const onSubmit = async (v) => {
    const res = await recordProgress(projectId, goal.id ?? goal._id, { current: Number(v.current) });
    toast.success('Progress recorded');
    onSaved?.(res.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Record progress"
      description={goal ? `${goal.title}: target ${goal.target ?? 0}${goal.unit ? ` ${goal.unit}` : ''}.` : undefined}
      size="sm"
      submitLabel="Record"
      initialValues={{ current: goal ? String(goal.current ?? 0) : '0' }}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <Input
          label="Current value"
          keyboardType="decimal-pad"
          value={values.current}
          onChangeText={(t) => set('current', t)}
          error={errors.current}
          hint={goal?.metric === 'custom' ? 'Enter the value you have reached.' : 'Goals with linked work show their linked total instead.'}
        />
      )}
    />
  );
}

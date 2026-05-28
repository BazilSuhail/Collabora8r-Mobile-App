import { useToast } from '@/context/ToastContext';
import { createSprint, updateSprint } from '@/libs/api/boards';
import FormModal from '@/components/ui/FormModal';
import Input from '@/components/ui/Input';

const dayOf = (value) => (value ? String(value).slice(0, 10) : '');

// Creates a sprint on boardId, or edits one when sprint is given. Dates are optional (YYYY-MM-DD)
// and may be cleared on edit (sent as null).
export default function SprintFormModal({ open, onClose, projectId, boardId, sprint = null, onSaved }) {
  const toast = useToast();
  const edit = Boolean(sprint);

  const submit = async (values) => {
    const name = values.name.trim();
    const goal = values.goal.trim();
    const startDate = values.startDate.trim();
    const endDate = values.endDate.trim();
    if (edit) {
      const res = await updateSprint(projectId, sprint.id ?? sprint._id, {
        name,
        goal,
        startDate: startDate || null,
        endDate: endDate || null,
      });
      toast.success('Saved');
      onSaved?.(res.data);
      return;
    }
    const res = await createSprint(projectId, {
      boardId,
      name,
      goal,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    });
    toast.success('Sprint created');
    onSaved?.(res.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={edit ? 'Edit sprint' : 'New sprint'}
      submitLabel={edit ? 'Save' : 'Create sprint'}
      initialValues={{
        name: sprint?.name ?? '',
        goal: sprint?.goal ?? '',
        startDate: dayOf(sprint?.startDate),
        endDate: dayOf(sprint?.endDate),
      }}
      onSubmit={submit}
      fields={({ values, set, errors }) => (
        <>
          <Input label="Name" maxLength={120} hint="Up to 120 characters." value={values.name} onChangeText={(t) => set('name', t)} error={errors.name} />
          <Input
            as="textarea"
            multiline
            label="Goal"
            hint="Optional. What the team aims to finish in this sprint."
            value={values.goal}
            onChangeText={(t) => set('goal', t)}
            error={errors.goal}
          />
          <Input
            label="Start date"
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            hint="Optional."
            value={values.startDate}
            onChangeText={(t) => set('startDate', t)}
            error={errors.startDate}
          />
          <Input
            label="End date"
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            hint="Optional. Clear it to remove the end date."
            value={values.endDate}
            onChangeText={(t) => set('endDate', t)}
            error={errors.endDate}
          />
        </>
      )}
    />
  );
}

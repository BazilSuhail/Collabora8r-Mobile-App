// feat(screens/backlog/components/CompleteSprintModal): close a sprint and choose where its unfinished issues go.
import { View } from 'react-native';
import FormModal from '@/components/ui/FormModal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/context/ToastContext';
import { completeSprint } from '@/libs/api/boards';

const BACKLOG = 'backlog';

// targets are the other planned sprints. Unfinished issues go to the backlog or to one of them.
export default function CompleteSprintModal({ open, onClose, projectId, sprint, targets, onDone }) {
  const toast = useToast();
  const options = [
    { value: BACKLOG, label: 'Backlog' },
    ...targets.map((s) => ({ value: String(s.id), label: s.name })),
  ];

  return (
    <FormModal
      open={open}
      onClose={(reason) => {
        onClose();
        if (reason === 'submit') onDone?.();
      }}
      title={`Complete ${sprint?.name ?? 'sprint'}`}
      description="Unfinished issues move to the place you choose. Done issues stay in this sprint's history."
      submitLabel="Complete sprint"
      initialValues={{ carryOver: BACKLOG, retroNote: '' }}
      onSubmit={async (values) => {
        const res = await completeSprint(projectId, String(sprint.id), {
          carryOver: values.carryOver,
          ...(values.retroNote.trim() ? { retroNote: values.retroNote.trim() } : {}),
        });
        toast.success('Sprint completed.');
        return res;
      }}
      fields={({ values, set }) => (
        <View className="gap-4">
          <Select
            label="Carry unfinished issues to"
            hint={
              targets.length === 0
                ? 'No other planned sprints, so unfinished issues go to the backlog.'
                : 'The backlog keeps them for later. A planned sprint takes them now.'
            }
            value={values.carryOver}
            options={options}
            onChange={(v) => set('carryOver', v)}
          />
          <Input
            as="textarea"
            label="Retrospective note"
            hint="Optional. Saved with the sprint."
            maxLength={2000}
            value={values.retroNote}
            onChangeText={(v) => set('retroNote', v)}
          />
        </View>
      )}
    />
  );
}

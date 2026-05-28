// feat(screens/releases/components/ReleaseFormModal): create or edit a release with its name, description and planned dates.
import { useToast } from '@/context/ToastContext';
import { createRelease, updateRelease } from '@/libs/api/boards';
import FormModal from '@/components/ui/FormModal';
import Input from '@/components/ui/Input';

const idOf = (item) => item?.id ?? item?._id ?? null;
const dateValue = (value) => (value ? String(value).slice(0, 10) : '');
// Dates are typed as YYYY-MM-DD. Only digits and dashes are kept.
const cleanDate = (text) => String(text ?? '').replace(/[^0-9-]/g, '').slice(0, 10);

// Mounted only while open, so every opening starts from the release's current values.
export default function ReleaseFormModal({ open, onClose, projectId, release = null, onSaved }) {
  const toast = useToast();
  const edit = Boolean(release);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={edit ? 'Edit release' : 'New release'}
      submitLabel={edit ? 'Save' : 'Create release'}
      initialValues={{
        name: release?.name ?? '',
        description: release?.description ?? '',
        startDate: dateValue(release?.startDate),
        releaseDate: dateValue(release?.releaseDate),
      }}
      onSubmit={async (values) => {
        const body = {
          name: values.name.trim(),
          description: values.description.trim(),
          ...(values.startDate ? { startDate: values.startDate } : {}),
          ...(values.releaseDate ? { releaseDate: values.releaseDate } : {}),
        };
        const res = edit
          ? await updateRelease(projectId, idOf(release), body)
          : await createRelease(projectId, body);
        toast.success('Saved');
        onSaved?.(res.data);
      }}
      fields={({ values, set, errors }) => (
        <>
          <Input
            label="Name"
            hint="Required. Shown on the releases list."
            wide
            required
            autoFocus
            value={values.name}
            onChangeText={(v) => set('name', v)}
            error={errors.name}
          />
          <Input
            as="textarea"
            multiline
            label="Description"
            hint="Optional. What this release includes."
            wide
            value={values.description}
            onChangeText={(v) => set('description', v)}
            error={errors.description}
          />
          <Input
            type="date"
            label="Start date"
            hint="Optional. When work on it begins. Format YYYY-MM-DD."
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            value={values.startDate}
            onChangeText={(v) => set('startDate', cleanDate(v))}
            error={errors.startDate}
          />
          <Input
            type="date"
            label="Release date"
            hint="Optional. The planned ship day. Format YYYY-MM-DD."
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            value={values.releaseDate}
            onChangeText={(v) => set('releaseDate', cleanDate(v))}
            error={errors.releaseDate}
          />
        </>
      )}
    />
  );
}

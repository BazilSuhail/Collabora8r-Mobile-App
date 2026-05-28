import FormModal from '@/components/ui/FormModal';
import Input from '@/components/ui/Input';

// Create an organization. The server derives the slug from the name, so no slug field is sent.
// onSubmit(values) belongs to the page and throws on failure so the modal stays open.
export default function OrgFormModal({ open, onClose, onSubmit }) {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="New organization"
      description="Members can be invited once the organization exists."
      submitLabel="Create organization"
      initialValues={{ name: '', description: '' }}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <>
          <Input wide label="Name" value={values.name} onChangeText={(t) => set('name', t)} error={errors.name} hint="2 to 80 characters." />
          <Input
            wide
            as="textarea"
            multiline
            label="Description"
            value={values.description}
            onChangeText={(t) => set('description', t)}
            error={errors.description}
            hint="Optional. Shown on the organization card."
          />
        </>
      )}
    />
  );
}

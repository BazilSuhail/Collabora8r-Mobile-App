import FormModal from "@/components/ui/FormModal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { createSpace, updateSpace } from "@/libs/api/wiki";
import { useToast } from "@/context/ToastContext";

const VISIBILITY = [
  { value: "project", label: "Project members" },
  { value: "org", label: "Whole organization" },
  { value: "private", label: "Only me" },
];

// Create or edit a wiki space. FormModal shows 422 field errors; the key is only sent on create.
export default function SpaceFormModal({ open, onClose, pid, space, onSaved }) {
  const toast = useToast();
  const editing = Boolean(space);
  const initialValues = {
    name: space?.name ?? "",
    key: "",
    description: space?.description ?? "",
    visibility: space?.visibility ?? "project",
  };

  const onSubmit = async (values) => {
    const body = {
      name: values.name.trim(),
      description: values.description.trim(),
      visibility: values.visibility,
    };
    if (editing) {
      const res = await updateSpace(pid, String(space.id ?? space._id), body);
      toast.success("Saved");
      onSaved?.(res.data);
      return;
    }
    const key = values.key.trim();
    const res = await createSpace(pid, key ? { ...body, key } : body);
    toast.success("Space created");
    onSaved?.(res.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={editing ? "Edit space" : "New space"}
      description="Spaces group related wiki pages for this project."
      submitLabel={editing ? "Save space" : "Create space"}
      initialValues={initialValues}
      onSubmit={onSubmit}
      fields={({ values, set, errors }) => (
        <>
          <Input
            label="Name"
            hint="Required. The name people see in the wiki."
            value={values.name ?? ""}
            maxLength={120}
            error={errors.name}
            onChangeText={(text) => set("name", text)}
          />
          {editing ? null : (
            <Input
              label="Key"
              hint="Optional. Two to ten letters or digits, starting with a letter."
              value={values.key ?? ""}
              maxLength={10}
              autoCapitalize="characters"
              autoCorrect={false}
              error={errors.key}
              onChangeText={(text) => set("key", text)}
            />
          )}
          <Input
            as="textarea"
            label="Description"
            hint="Optional. What belongs in this space."
            value={values.description ?? ""}
            maxLength={2000}
            error={errors.description}
            onChangeText={(text) => set("description", text)}
          />
          <Select
            label="Who can see it"
            hint="Controls who can open the pages in this space."
            value={values.visibility}
            options={VISIBILITY}
            error={errors.visibility}
            onChange={(value) => set("visibility", value)}
          />
        </>
      )}
    />
  );
}

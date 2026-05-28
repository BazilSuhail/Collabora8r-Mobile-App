// feat(screens/forms/FormBuilderPage): build an intake form field by field with a live preview of the public page.
// Single column on mobile: details and fields first, then the preview.
import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import PageHead from "@/components/layout/PageHead";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import Illustration from "@/components/ui/Illustration";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import Switch from "@/components/ui/Switch";
import { useProject } from "@/context/ProjectContext";
import { createForm, getForm, updateForm } from "@/libs/api/forms";
import { paths } from "@/routes/paths";
import { useMutation } from "@/utils/useMutation";
import { useResource } from "@/utils/useResource";
import FieldEditor from "@/components/forms/FieldEditor";
import FormRenderer from "@/components/forms/FormRenderer";

const MAX_FIELDS = 40;

const newField = () => ({
  id: `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
  label: "",
  type: "text",
  required: false,
});

const toDraft = (form) => ({
  name: form?.name ?? "",
  description: form?.description ?? "",
  issueTypeId: form?.issueTypeId ?? "",
  defaultPriorityId: form?.defaultPriorityId ?? "",
  isPublic: form?.isPublic ?? false,
  fields: (form?.fields ?? []).map((f) => ({ ...f })),
});

const toBody = (d) => ({
  name: d.name.trim(),
  description: d.description.trim(),
  issueTypeId: d.issueTypeId,
  defaultPriorityId: d.defaultPriorityId || null,
  isPublic: d.isPublic,
  fields: d.fields.map((f) => {
    const out = { id: f.id, label: f.label.trim(), type: f.type, required: !!f.required };
    if (f.helpText?.trim()) out.helpText = f.helpText.trim();
    if (f.type === "select" || f.type === "multiSelect") out.options = f.options ?? [];
    return out;
  }),
});

// Server paths arrive as "body.<key>". Accept either spelling.
const errorFor = (map, key) => map[`body.${key}`] ?? map[key];

const CARD = "bg-surface border border-border rounded-card p-[20px] gap-[16px]";

function Shell({ children }) {
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-[16px] gap-[16px] pb-[32px]" keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export default function FormBuilderPage() {
  const { formId } = useLocalSearchParams();
  const isNew = !formId || formId === "new";
  const router = useRouter();
  const navigation = useNavigation();
  const { projectId, can, types, priorities } = useProject();
  const canEdit = can("form.manage");
  const res = useResource(
    () => (isNew ? Promise.resolve({ data: null, meta: null }) : getForm(projectId, formId)),
    [projectId, formId],
  );
  const [draft, setDraft] = useState(() => toDraft(null));
  const [baseline, setBaseline] = useState(() => JSON.stringify(toDraft(null)));
  const [previewValues, setPreviewValues] = useState({});
  const [localErrors, setLocalErrors] = useState({});
  const leavingRef = useRef(false);
  const dirty = JSON.stringify(draft) !== baseline;

  const save = useMutation((body) => (isNew ? createForm(projectId, body) : updateForm(projectId, formId, body)), {
    success: "Form saved",
  });

  useEffect(() => {
    if (res.status !== "success") return;
    const next = toDraft(res.data);
    setDraft(next);
    setBaseline(JSON.stringify(next));
    setPreviewValues({});
  }, [res.status, res.data]);

  // Replaces the web beforeunload prompt: confirm before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return undefined;
    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (leavingRef.current) return;
      e.preventDefault();
      Alert.alert("Discard changes?", "This form has unsaved changes.", [
        { text: "Keep editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return unsub;
  }, [dirty, navigation]);

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const patchField = (id, p) => setDraft((d) => ({ ...d, fields: d.fields.map((f) => (f.id === id ? { ...f, ...p } : f)) }));
  const addField = () => setDraft((d) => ({ ...d, fields: [...d.fields, newField()] }));
  const removeField = (id) => setDraft((d) => ({ ...d, fields: d.fields.filter((f) => f.id !== id) }));
  const moveField = (index, dir) => {
    const to = dir === "up" ? index - 1 : index + 1;
    setDraft((d) => {
      if (to < 0 || to >= d.fields.length) return d;
      const fields = [...d.fields];
      [fields[index], fields[to]] = [fields[to], fields[index]];
      return { ...d, fields };
    });
  };

  const onSave = async () => {
    const errs = {};
    if (!draft.name.trim()) errs.name = "Give the form a name";
    if (!draft.issueTypeId) errs.issueTypeId = "Pick the issue type this form creates";
    if (draft.fields.some((f) => !f.label.trim())) errs.fields = "Every field needs a label";
    setLocalErrors(errs);
    if (Object.keys(errs).length) return;
    const body = toBody(draft);
    const saved = await save.run(body);
    if (!saved) return;
    setBaseline(JSON.stringify(draft));
    if (isNew) {
      leavingRef.current = true;
      router.replace(paths.form(projectId, saved.data?.id ?? saved.data?._id));
    }
  };

  const goBack = () => router.push(paths.forms(projectId));

  const typeOptions = (types ?? []).map((t) => ({ value: t.id ?? t._id, label: t.name }));
  const priorityOptions = [
    { value: "", label: "No default" },
    ...(priorities ?? []).map((p) => ({ value: p.id ?? p._id, label: p.name })),
  ];
  const serverErrors = save.fieldErrors ?? {};
  const nameError = localErrors.name ?? errorFor(serverErrors, "name");
  const typeError = localErrors.issueTypeId ?? errorFor(serverErrors, "issueTypeId");
  const fieldsError = localErrors.fields ?? (Object.keys(serverErrors).length ? "Check the fields and try again." : null);

  if (res.status === "loading") {
    return (
      <Shell>
        <PageHead title="Form builder" sub="Loading the form." />
        <Skeleton variant="cards" count={2} />
      </Shell>
    );
  }

  if (res.status === "error") {
    return (
      <Shell>
        <PageHead title="Form builder" sub="The form did not load." />
        <View className={CARD}>
          <EmptyState tone="error" title="This form did not load" text="Check the link and try again." onRetry={res.reload} />
        </View>
      </Shell>
    );
  }

  if (!canEdit) {
    return (
      <Shell>
        <PageHead title="Form builder" sub="Forms are read only for your role." />
        <View className={CARD}>
          <EmptyState icon="lock" title="Read only" text="Only project leads can change forms." />
        </View>
      </Shell>
    );
  }

  return (
    <Shell>
      <PageHead
        title={isNew ? "New form" : draft.name || "Form"}
        sub="Build the fields people fill in. The preview shows the public page."
        actions={
          <View className="flex-row flex-wrap items-center gap-[8px]">
            <Button variant="ghost" icon="chevL" onPress={goBack}>
              Forms
            </Button>
            {dirty ? <Badge tone="saffron">Unsaved changes</Badge> : null}
            <Button variant="ember" icon="check" loading={save.pending} disabled={save.pending} onPress={onSave}>
              Save form
            </Button>
          </View>
        }
      />

      <View className={CARD}>
        <View className="flex-row items-center gap-[8px]">
          <Icon name="form" size={16} className="text-muted" />
          <Text className="text-foreground text-[17px] font-display tracking-[-0.26px]">Details</Text>
        </View>
        <Input
          label="Name"
          hint="Required. Shown as the title of the public form."
          value={draft.name}
          maxLength={120}
          onChangeText={(t) => patch({ name: t })}
          error={nameError}
          disabled={save.pending}
        />
        <Input
          as="textarea"
          multiline
          label="Description"
          hint="Shown above the form on the public page."
          value={draft.description}
          maxLength={1000}
          onChangeText={(t) => patch({ description: t })}
          disabled={save.pending}
        />
        <Select
          label="Issue type"
          hint="Required. The kind of issue each submission creates."
          value={draft.issueTypeId}
          options={typeOptions}
          onChange={(v) => patch({ issueTypeId: v })}
          placeholder="Pick a type"
          error={typeError}
          disabled={save.pending}
        />
        <Select
          label="Default priority"
          hint="Optional. Used when a submission has no priority."
          value={draft.defaultPriorityId}
          options={priorityOptions}
          onChange={(v) => patch({ defaultPriorityId: v })}
          disabled={save.pending}
        />
        <View className="flex-row items-center justify-between gap-[12px] rounded-[14px] border border-border bg-surface-2 p-[12px]">
          <View className="flex-1 gap-[2px]">
            <Text className="font-semibold text-foreground">Accept submissions</Text>
            <Text className="text-muted text-[13px]">Off means the public link shows that the form is not available.</Text>
          </View>
          <Switch
            checked={draft.isPublic}
            onChange={(v) => patch({ isPublic: v })}
            label="Accept submissions"
            hideLabel
            disabled={save.pending}
          />
        </View>
        <View className="flex-row items-center gap-[10px] flex-wrap">
          <Icon name="list" size={16} className="text-muted" />
          <Text className="text-foreground text-[17px] font-display tracking-[-0.26px]">Fields</Text>
          <Badge tone={draft.fields.length >= MAX_FIELDS ? "saffron" : "plain"}>
            {draft.fields.length} of {MAX_FIELDS}
          </Badge>
          <View className="ml-auto">
            <Button
              variant="soft"
              size="sm"
              icon="plus"
              disabled={save.pending || draft.fields.length >= MAX_FIELDS}
              onPress={addField}
            >
              Add field
            </Button>
          </View>
        </View>
        {fieldsError ? (
          <Text className="text-danger text-[13px] font-semibold" accessibilityRole="alert">
            {fieldsError}
          </Text>
        ) : null}
        <View className="gap-[10px]">
          {draft.fields.map((f, i) => (
            <FieldEditor
              key={f.id}
              field={f}
              index={i}
              count={draft.fields.length}
              disabled={save.pending}
              onPatch={(p) => patchField(f.id, p)}
              onMove={(dir) => moveField(i, dir)}
              onRemove={() => removeField(f.id)}
            />
          ))}
          {draft.fields.length === 0 ? (
            <View className="items-center gap-[8px]">
              <Illustration name="forms" alt="" className="w-[180px]" />
              <EmptyState
                icon="form"
                title="No fields yet"
                text="Add a field to start the form."
                action={
                  <Button variant="soft" size="sm" icon="plus" disabled={save.pending} onPress={addField}>
                    Add field
                  </Button>
                }
              />
            </View>
          ) : null}
        </View>
        {save.error ? (
          <Text className="text-danger text-[13px] font-semibold" accessibilityRole="alert">
            {save.error.message ?? "The form could not be saved. Try again."}
          </Text>
        ) : null}
      </View>

      <View className={CARD} accessibilityLabel="Preview">
        <View className="flex-row items-center gap-[8px]">
          <Icon name="eye" size={16} className="text-muted" />
          <Text className="text-muted text-[12px] font-semibold uppercase tracking-[0.84px]">Preview</Text>
        </View>
        <Text className="text-foreground text-[22px] font-display-bold tracking-[-0.44px]" numberOfLines={1}>
          {draft.name || "Untitled form"}
        </Text>
        {draft.description ? <Text className="text-muted text-[12.5px]">{draft.description}</Text> : null}
        <FormRenderer
          fields={draft.fields}
          values={previewValues}
          onChange={(id, v) => setPreviewValues((prev) => ({ ...prev, [id]: v }))}
          idPrefix="prev"
          columns={1}
        />
        <Button variant="ember" disabled className="w-full">
          Submit
        </Button>
      </View>
    </Shell>
  );
}

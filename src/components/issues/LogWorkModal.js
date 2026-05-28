import { useToast } from "@/context/ToastContext";
import { addWorklog, listIssues } from "@/libs/api/issues";
import { formatDuration, parseDuration } from "@/utils/format";
import FormModal from "@/components/ui/FormModal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

// Today's date in the device's local time zone, as YYYY-MM-DD.
const todayIso = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Logs time on one issue. Time is typed as "1h 30m" and sent as seconds.
// Without an issueId (Timesheet), the user picks the issue in the form.
export default function LogWorkModal({ open, onClose, projectId, issueId, onSaved }) {
  const toast = useToast();

  const submit = async (values) => {
    const seconds = parseDuration(values.time);
    if (!seconds || seconds < 1) throw new Error("Enter a time like 1h 30m.");
    const target = issueId ?? values.issueId;
    if (!target) throw new Error("Pick an issue.");
    const res = await addWorklog(projectId, target, {
      seconds,
      date: values.date || todayIso(),
      comment: values.comment?.trim() ?? "",
    });
    toast.success(`Logged ${formatDuration(seconds)}`);
    onSaved?.(res.data);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Log work"
      description={issueId ? "Record time spent on this issue." : "Record time spent on an issue."}
      submitLabel="Log work"
      initialValues={{ issueId: "", time: "", date: todayIso(), comment: "" }}
      onSubmit={submit}
      fields={({ values, set, errors }) => (
        <>
          {!issueId ? (
            <Select
              label="Issue"
              required
              searchable
              placeholder="Search issues"
              value={values.issueId}
              onChange={(v) => set("issueId", v || "")}
              options={[]}
              loadOptions={(q) =>
                listIssues(projectId, { q, limit: 10 }).then((res) =>
                  (res.data ?? []).map((i) => ({ value: String(i.id ?? i._id), label: `${i.key} ${i.title}` })),
                )
              }
            />
          ) : null}
          <Input
            label="Time spent"
            required
            autoCapitalize="none"
            hint="For example 1h 30m. Enter a time greater than zero."
            value={values.time}
            onChangeText={(text) => set("time", text)}
            error={errors.seconds ?? errors.time}
          />
          <Input
            type="date"
            label="Date"
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
            hint="Defaults to today. Use YYYY-MM-DD."
            value={values.date}
            onChangeText={(text) => set("date", text)}
            error={errors.date}
          />
          <Input
            as="textarea"
            multiline
            label="Comment"
            hint="Optional. Describe what the time was spent on."
            value={values.comment}
            onChangeText={(text) => set("comment", text)}
            error={errors.comment}
          />
        </>
      )}
    />
  );
}

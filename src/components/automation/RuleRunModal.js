// feat(screens/automation/components/RuleRunModal): pick an issue and run an automation rule on it once.
import FormModal from '@/components/ui/FormModal';
import Select from '@/components/ui/Select';
import { useToast } from '@/context/ToastContext';
import { runRule } from '@/libs/api/automation';
import { listIssues } from '@/libs/api/issues';

const withId = (row) => ({ ...row, id: String(row.id ?? row._id) });

export default function RuleRunModal({ open, onClose, pid, rule, onRan }) {
  const toast = useToast();

  const searchIssues = async (q) => {
    const res = await listIssues(pid, { q, limit: 10 });
    return (res.data ?? []).map(withId).map((issue) => ({
      value: issue.id,
      label: `${issue.key ?? 'Issue'} ${issue.title ?? ''}`.trim(),
    }));
  };

  const submit = async (values) => {
    if (!values.issueId) {
      const err = new Error('Choose an issue to run the rule on.');
      err.status = 422;
      err.errors = [{ path: 'body.issueId', message: 'Choose an issue to run the rule on.' }];
      throw err;
    }
    await runRule(pid, rule.id, { issueId: values.issueId });
    toast.success('Run queued');
    onRan?.();
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={rule ? `Run "${rule.name}"` : 'Run rule'}
      description="Runs the rule once against the issue you choose."
      submitLabel="Run rule"
      initialValues={{ issueId: '' }}
      onSubmit={submit}
      fields={({ values, set, errors }) => (
        <Select
          label="Issue"
          placeholder="Search for an issue"
          value={values.issueId}
          onChange={(value) => set('issueId', value)}
          options={[]}
          searchable
          loadOptions={searchIssues}
          error={errors.issueId}
          hint="Type to search by issue key or title."
          required
        />
      )}
    />
  );
}

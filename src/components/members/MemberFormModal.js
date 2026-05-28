import FormModal from '@/components/ui/FormModal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import RoleSelect from './RoleSelect';
import PeoplePicker from './PeoplePicker';

const ORG_INVITE_ROLES = ['admin', 'member', 'guest', 'viewer'];
const ORG_DECIDE_ROLES = ['member', 'guest', 'viewer'];

// One form for three jobs. mode "invite" sends an email invite. mode "add" adds a known person.
// mode "decide" approves or declines a join request (org requests also take a role).
// onSubmit(values) belongs to the page: it calls the API, toasts and throws on failure so the modal stays open.
export default function MemberFormModal({ open, onClose, mode = 'invite', scope = 'org', roles, candidates, projects, decision = 'approve', onSubmit }) {
  const titles = {
    invite: scope === 'org' ? 'Invite to organization' : 'Invite by email',
    add: 'Add member',
    decide: 'Review join request',
  };
  const submitLabels = { invite: 'Send invite', add: 'Add member', decide: 'Save decision' };

  const initialValues =
    mode === 'invite'
      ? { email: '', role: scope === 'org' ? 'member' : 'developer', projectIds: [] }
      : mode === 'add'
        ? { userId: '', role: scope === 'org' ? 'member' : 'developer' }
        : { decision, role: 'member', declineReason: '' };

  const inviteRoles = roles ?? (scope === 'org' ? ORG_INVITE_ROLES : undefined);

  const fields = ({ values, set, errors }) => {
    if (mode === 'invite') {
      return (
        <>
          <Input
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            value={values.email}
            onChangeText={(t) => set('email', t)}
            error={errors.email}
            hint="We send the invite link to this address."
          />
          <RoleSelect
            scope={scope}
            roles={inviteRoles}
            label="Role"
            value={values.role}
            onChange={(v) => set('role', v)}
            error={errors.role}
            hint="Sets what they can do after joining."
          />
          {scope === 'org' && projects?.length ? (
            <Select
              multiple
              searchable
              label="Projects to join"
              hint="Optional. Invitees join these projects after accepting."
              placeholder="No projects"
              value={values.projectIds}
              onChange={(v) => set('projectIds', v)}
              options={projects.map((p) => ({ value: String(p.id ?? p._id), label: p.name }))}
              error={errors.projectIds}
            />
          ) : null}
        </>
      );
    }
    if (mode === 'add') {
      return (
        <>
          <PeoplePicker
            members={candidates}
            label="Person"
            value={values.userId}
            onChange={(v) => set('userId', v)}
            error={errors.userId}
            hint="Pick someone who already has an account."
          />
          <RoleSelect
            scope={scope}
            label="Role"
            value={values.role}
            onChange={(v) => set('role', v)}
            error={errors.role}
            hint="Sets what they can do once added."
          />
        </>
      );
    }
    const approving = values.decision === 'approve';
    return (
      <>
        <Select
          label="Decision"
          value={values.decision}
          onChange={(v) => set('decision', v)}
          options={[
            { value: 'approve', label: 'Approve' },
            { value: 'decline', label: 'Decline' },
          ]}
          error={errors.decision}
        />
        {approving && scope === 'org' ? (
          <RoleSelect
            scope={scope}
            roles={ORG_DECIDE_ROLES}
            label="Role on approval"
            value={values.role}
            onChange={(v) => set('role', v)}
            error={errors.role}
            hint="Applied when you approve the request."
          />
        ) : null}
        {!approving ? (
          <Input
            wide
            as="textarea"
            multiline
            label="Reason (optional)"
            value={values.declineReason}
            onChangeText={(t) => set('declineReason', t)}
            error={errors.declineReason}
            hint="Only used when you decline."
          />
        ) : null}
      </>
    );
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={titles[mode]}
      submitLabel={submitLabels[mode]}
      initialValues={initialValues}
      onSubmit={onSubmit}
      fields={fields}
    />
  );
}

// feat(screens/tests/TestCasesPage): maintain the test case library and start new test runs.
// The web DataTables become FlatList cards. The row menu becomes a "more" button and long-press action sheet.
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import PageHead from '@/components/layout/PageHead';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Skeleton from '@/components/ui/Skeleton';
import { Icon } from '@/components/ui/Icon';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { deleteTestCase, listTestCases, listTestRuns } from '@/libs/api/tests';
import { EMPTY } from '@/metadata/empty';
import { paths } from '@/routes/paths';
import { usePaged } from '@/utils/usePaged';
import TestCaseFormModal from '@/components/tests/TestCaseFormModal';
import TestRunFormModal from '@/components/tests/TestRunFormModal';

const withIds = (res) => ({ ...res, data: res.data.map((r) => ({ ...r, id: r.id ?? r._id })) });
const fetchCases = ({ pid, ...p }) => listTestCases(pid, p).then(withIds);
const fetchRuns = ({ pid, ...p }) => listTestRuns(pid, p).then(withIds);

const RUN_TONE = { planned: 'plain', inProgress: 'iris', completed: 'spruce' };
const RUN_LABEL = { planned: 'Planned', inProgress: 'In progress', completed: 'Completed' };

const CARD = 'bg-surface border border-border rounded-card p-4';

function ListState({ paged, empty }) {
  if (paged.status === 'loading' && !paged.items.length) {
    return (
      <View className={CARD}>
        <Skeleton variant="feed" count={6} />
      </View>
    );
  }
  if (paged.status === 'error') {
    return (
      <View className={CARD}>
        <EmptyState
          tone="error"
          title={paged.error?.message ?? 'Could not load these items.'}
          onRetry={paged.reload}
        />
      </View>
    );
  }
  return (
    <View className={CARD}>
      <EmptyState icon={empty.icon} title={empty.title ?? 'Nothing here yet'} text={empty.text} action={empty.action} />
    </View>
  );
}

function Footer({ paged }) {
  if (!paged.hasMore) return <View className="h-10" />;
  return (
    <View className="py-4 items-center">
      {paged.loadingMore ? (
        <ActivityIndicator />
      ) : (
        <Button variant="soft" size="sm" onClick={paged.loadMore}>
          Show more
        </Button>
      )}
    </View>
  );
}

function Meter({ pct }) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      className="h-[8px] rounded-full bg-well overflow-hidden"
    >
      <View className="h-full rounded-full bg-spruce" style={{ width: `${pct}%` }} />
    </View>
  );
}

function CasesTable({ projectId, canEdit, header, onNew, onEdit, onDelete }) {
  const cases = usePaged(fetchCases, { pid: projectId });

  const openMenu = (row) => {
    if (!canEdit) return;
    Alert.alert(row.title ?? 'Test case', undefined, [
      { text: 'Edit', onPress: () => onEdit(row) },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(row) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <FlatList
      className="flex-1 bg-background"
      contentContainerClassName="p-4 gap-3"
      data={cases.status === 'success' || cases.items.length ? cases.items : []}
      keyExtractor={(row) => String(row.id)}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <ListState
          paged={cases}
          empty={{
            ...EMPTY.tests,
            action: canEdit ? (
              <Button variant="ember" size="sm" icon="plus" onClick={onNew}>
                New test case
              </Button>
            ) : null,
          }}
        />
      }
      ListFooterComponent={<Footer paged={cases} />}
      onEndReached={() => cases.hasMore && !cases.loadingMore && cases.loadMore()}
      onEndReachedThreshold={0.4}
      refreshing={false}
      onRefresh={cases.reload}
      renderItem={({ item: row }) => (
        <Pressable
          onLongPress={() => openMenu(row)}
          delayLongPress={350}
          className={`${CARD} flex-row items-center gap-3 active:opacity-80`}
        >
          <View className="flex-1 min-w-0 gap-1">
            <Text className="text-muted text-[12px] font-semibold">{row.key}</Text>
            <Text className="font-semibold text-foreground" numberOfLines={2}>
              {row.title}
            </Text>
            <View className="flex-row flex-wrap items-center gap-2 mt-1">
              <Badge variant="status" tone={row.status === 'ready' ? 'spruce' : 'plain'}>
                {row.status ?? 'draft'}
              </Badge>
              <Text className="text-muted text-[12.5px]">{row.priority || 'None'}</Text>
              <Text className="text-muted text-[12.5px]">
                · {row.steps?.length ?? 0} {(row.steps?.length ?? 0) === 1 ? 'step' : 'steps'}
              </Text>
            </View>
          </View>
          {canEdit ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Actions for ${row.title}`}
              hitSlop={10}
              onPress={() => openMenu(row)}
              className="w-[44px] h-[44px] items-center justify-center rounded-xl active:opacity-60"
            >
              <Icon name="more" size={18} />
            </Pressable>
          ) : null}
        </Pressable>
      )}
    />
  );
}

function RunsTable({ projectId, header }) {
  const runs = usePaged(fetchRuns, { pid: projectId });
  const router = useRouter();

  return (
    <FlatList
      className="flex-1 bg-background"
      contentContainerClassName="p-4 gap-3"
      data={runs.status === 'success' || runs.items.length ? runs.items : []}
      keyExtractor={(row) => String(row.id)}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <ListState
          paged={runs}
          empty={{ ...EMPTY.tests, title: 'No test runs yet', text: 'Start a run to record results case by case.' }}
        />
      }
      ListFooterComponent={<Footer paged={runs} />}
      onEndReached={() => runs.hasMore && !runs.loadingMore && runs.loadMore()}
      onEndReachedThreshold={0.4}
      refreshing={false}
      onRefresh={runs.reload}
      renderItem={({ item: row }) => {
        const total = row.counts?.total ?? 0;
        const passed = row.counts?.passed ?? 0;
        const failed = row.counts?.failed ?? 0;
        const pct = total ? Math.round((passed / total) * 100) : 0;
        return (
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(paths.testRun(projectId, row.id))}
            className={`${CARD} gap-2 active:opacity-80`}
          >
            <View className="flex-row items-center gap-2">
              <Text className="flex-1 font-semibold text-foreground" numberOfLines={1}>
                {row.name}
              </Text>
              <Badge variant="status" tone={RUN_TONE[row.status] ?? 'plain'}>
                {RUN_LABEL[row.status] ?? 'Planned'}
              </Badge>
            </View>
            <Meter pct={pct} />
            <Text className="text-muted text-[12.5px]">
              {passed} passed, {failed} failed of {total}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

export default function TestCasesPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const router = useRouter();
  const canEdit = can('test.edit');
  const [tab, setTab] = useState('cases');
  const [version, setVersion] = useState(0);
  const [caseModal, setCaseModal] = useState({ open: false, target: null });
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const refresh = () => setVersion((v) => v + 1);

  const confirmDelete = async () => {
    try {
      await deleteTestCase(projectId, deleting.id);
      toast.success('Test case deleted');
      setDeleting(null);
      refresh();
    } catch {
      // The API layer shows the failure. The dialog stays open so the user can retry.
    }
  };

  const header = (
    <View className="gap-3 mb-1">
      <PageHead
        title="Test cases"
        sub="The test library and the runs that check it."
        actions={
          canEdit ? (
            <>
              <Button variant="soft" icon="plus" onClick={() => setRunModalOpen(true)}>
                New test run
              </Button>
              <Button variant="ember" icon="plus" onClick={() => setCaseModal({ open: true, target: null })}>
                New test case
              </Button>
            </>
          ) : null
        }
      />
      <SegmentedControl
        label="Test views"
        as="tabs"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'cases', label: 'Cases' },
          { value: 'runs', label: 'Runs' },
        ]}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      {tab === 'cases' ? (
        <CasesTable
          key={`cases-${version}`}
          projectId={projectId}
          canEdit={canEdit}
          header={header}
          onNew={() => setCaseModal({ open: true, target: null })}
          onEdit={(row) => setCaseModal({ open: true, target: row })}
          onDelete={(row) => setDeleting(row)}
        />
      ) : (
        <RunsTable key={`runs-${version}`} projectId={projectId} header={header} />
      )}
      <TestCaseFormModal
        open={caseModal.open}
        onClose={() => setCaseModal({ open: false, target: null })}
        projectId={projectId}
        testCase={caseModal.target}
        onSaved={() => {
          setCaseModal({ open: false, target: null });
          refresh();
        }}
      />
      <TestRunFormModal
        open={runModalOpen}
        onClose={() => setRunModalOpen(false)}
        projectId={projectId}
        onCreated={(run) => {
          setRunModalOpen(false);
          router.push(paths.testRun(projectId, run.id ?? run._id));
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete test case?"
        text={`"${deleting?.title ?? ''}" is removed from the library. This cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </View>
  );
}

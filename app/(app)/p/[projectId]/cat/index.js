// feat(screens/cat/CatPage): manage translation memory segments and the glossary for a project.
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import PageHead from '@/components/layout/PageHead';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable from '@/components/ui/DataTable';
import Highlight from '@/components/ui/Highlight';
import Input from '@/components/ui/Input';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { deleteCatEntry, deleteTerm, listCatEntries, listGlossary } from '@/libs/api/planning';
import { EMPTY } from '@/metadata/empty';
import { usePaged } from '@/utils/usePaged';
import CatEntryModal from '@/components/cat/CatEntryModal';

const withIds = (res) => ({ ...res, data: res.data.map((r) => ({ ...r, id: r.id ?? r._id })) });
const fetchEntries = ({ pid, ...p }) => listCatEntries(pid, p).then(withIds);
const fetchTerms = ({ pid, ...p }) => listGlossary(pid, p).then(withIds);

const STATUS_TONE = { approved: 'spruce', reviewed: 'iris', draft: 'plain' };

function useDebounced(value, ms = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

// Shared toolbar for both views: search, a language filter built from the loaded rows, and the new action.
function Toolbar({ label, query, onQuery, filterLabel, filterValue, onFilter, filterOptions, newLabel, onNew }) {
  return (
    <View className="gap-2">
      <Input variant="search" label={label} hideLabel placeholder={`${label}…`} value={query} onChangeText={onQuery} />
      <View className="flex-row items-center gap-2">
        <View className="flex-1 min-w-0">
          <Select
            label={filterLabel}
            hideLabel
            value={filterValue}
            options={[{ value: 'all', label: 'All languages' }, ...filterOptions]}
            onChange={onFilter}
          />
        </View>
        {onNew ? (
          <Button variant="ember" icon="plus" onClick={onNew}>
            {newLabel}
          </Button>
        ) : null}
      </View>
    </View>
  );
}

function SegmentsView({ projectId, canEdit }) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const q = useDebounced(query.trim());
  const [pair, setPair] = useState('all');
  const entries = usePaged(fetchEntries, { pid: projectId, q });
  const [modal, setModal] = useState({ open: false, target: null });
  const [deleting, setDeleting] = useState(null);

  const pairOf = (e) => `${e.sourceLang} → ${e.targetLang}`;
  const pairOptions = useMemo(
    () => [...new Set(entries.items.map(pairOf))].map((p) => ({ value: p, label: p })),
    [entries.items],
  );
  const visible = pair === 'all' ? entries.items : entries.items.filter((e) => pairOf(e) === pair);

  const columns = [
    { key: 'sourceText', label: 'Source', render: (row) => <Highlight text={row.sourceText} query={q} /> },
    { key: 'targetText', label: 'Target', render: (row) => <Text className="text-muted">{row.targetText || 'Not translated'}</Text> },
    { key: 'pair', label: 'Languages', render: (row) => <Text className="text-foreground">{pairOf(row)}</Text> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant="status" tone={STATUS_TONE[row.status] ?? 'plain'}>
          {row.status ?? 'draft'}
        </Badge>
      ),
    },
  ];

  const rowMenu = canEdit
    ? (row) => [
        { id: 'edit', label: 'Edit', icon: 'edit', onSelect: () => setModal({ open: true, target: row }) },
        'separator',
        { id: 'delete', label: 'Delete', icon: 'trash', danger: true, onSelect: () => setDeleting(row) },
      ]
    : undefined;

  const confirmDelete = async () => {
    try {
      await deleteCatEntry(projectId, deleting.id);
      toast.success('Deleted');
      setDeleting(null);
      entries.reload();
    } catch {
      // The API layer shows the failure. The dialog stays open so the user can retry.
    }
  };

  return (
    <>
      <Toolbar
        label="Search segments"
        query={query}
        onQuery={setQuery}
        filterLabel="Language pair"
        filterValue={pair}
        onFilter={setPair}
        filterOptions={pairOptions}
        newLabel="New segment"
        onNew={canEdit ? () => setModal({ open: true, target: null }) : null}
      />
      <DataTable
        label="Translation memory"
        columns={columns}
        rows={visible}
        status={entries.status}
        error={entries.error}
        onRetry={entries.reload}
        empty={{
          ...EMPTY.cat,
          action: canEdit ? (
            <Button variant="ember" size="sm" icon="plus" onClick={() => setModal({ open: true, target: null })}>
              New segment
            </Button>
          ) : null,
        }}
        rowMenu={rowMenu}
        hasMore={entries.hasMore}
        onLoadMore={entries.loadMore}
        loadingMore={entries.loadingMore}
      />
      <CatEntryModal
        open={modal.open}
        onClose={() => setModal({ open: false, target: null })}
        projectId={projectId}
        mode="segment"
        entry={modal.target}
        onSaved={() => {
          setModal({ open: false, target: null });
          entries.reload();
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete segment?"
        text="This segment is removed from the memory. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </>
  );
}

function GlossaryView({ projectId, canEdit }) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const q = useDebounced(query.trim());
  const [language, setLanguage] = useState('all');
  const terms = usePaged(fetchTerms, { pid: projectId, q });
  const [modal, setModal] = useState({ open: false, target: null });
  const [deleting, setDeleting] = useState(null);

  const languageOptions = useMemo(
    () => [...new Set(terms.items.map((t) => t.language).filter(Boolean))].map((l) => ({ value: l, label: l })),
    [terms.items],
  );
  const visible = language === 'all' ? terms.items : terms.items.filter((t) => t.language === language);

  const columns = [
    { key: 'term', label: 'Term', render: (row) => <Highlight text={row.term} query={q} /> },
    { key: 'definition', label: 'Definition', render: (row) => <Text className="text-muted">{row.definition || 'No definition'}</Text> },
    { key: 'language', label: 'Language', render: (row) => <Text className="text-foreground">{row.language}</Text> },
    {
      key: 'forbidden',
      label: 'Usage',
      render: (row) => (
        <Badge variant="status" tone={row.forbidden ? 'ember' : 'spruce'}>
          {row.forbidden ? 'Forbidden' : 'Preferred'}
        </Badge>
      ),
    },
  ];

  const rowMenu = canEdit
    ? (row) => [
        { id: 'edit', label: 'Edit', icon: 'edit', onSelect: () => setModal({ open: true, target: row }) },
        'separator',
        { id: 'delete', label: 'Delete', icon: 'trash', danger: true, onSelect: () => setDeleting(row) },
      ]
    : undefined;

  const confirmDelete = async () => {
    try {
      await deleteTerm(projectId, deleting.id);
      toast.success('Deleted');
      setDeleting(null);
      terms.reload();
    } catch {
      // The API layer shows the failure. The dialog stays open so the user can retry.
    }
  };

  return (
    <>
      <Toolbar
        label="Search terms"
        query={query}
        onQuery={setQuery}
        filterLabel="Language"
        filterValue={language}
        onFilter={setLanguage}
        filterOptions={languageOptions}
        newLabel="New term"
        onNew={canEdit ? () => setModal({ open: true, target: null }) : null}
      />
      <DataTable
        label="Glossary"
        columns={columns}
        rows={visible}
        status={terms.status}
        error={terms.error}
        onRetry={terms.reload}
        empty={{
          ...EMPTY.cat,
          title: 'No glossary terms yet',
          text: 'Add terms the translators must use, or must avoid.',
          action: canEdit ? (
            <Button variant="ember" size="sm" icon="plus" onClick={() => setModal({ open: true, target: null })}>
              New term
            </Button>
          ) : null,
        }}
        rowMenu={rowMenu}
        hasMore={terms.hasMore}
        onLoadMore={terms.loadMore}
        loadingMore={terms.loadingMore}
      />
      <CatEntryModal
        open={modal.open}
        onClose={() => setModal({ open: false, target: null })}
        projectId={projectId}
        mode="term"
        entry={modal.target}
        onSaved={() => {
          setModal({ open: false, target: null });
          terms.reload();
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete term?"
        text={`"${deleting?.term ?? ''}" is removed from the glossary. This cannot be undone.`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </>
  );
}

export default function CatPage() {
  const { projectId, can } = useProject();
  const canEdit = can('cat.edit');
  const [tab, setTab] = useState('segments');

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 gap-4 pb-10" keyboardShouldPersistTaps="handled">
      <PageHead title="Translation" sub="Translation memory segments and the glossary that keeps wording consistent." />
      <SegmentedControl
        label="Translation views"
        as="tabs"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'segments', label: 'Segments' },
          { value: 'glossary', label: 'Glossary' },
        ]}
      />
      {tab === 'segments' ? (
        <SegmentsView projectId={projectId} canEdit={canEdit} />
      ) : (
        <GlossaryView projectId={projectId} canEdit={canEdit} />
      )}
    </ScrollView>
  );
}

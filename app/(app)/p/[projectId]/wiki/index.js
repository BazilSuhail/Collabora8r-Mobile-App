// feat(screens/wiki/WikiPage): browse a project's wiki spaces and page tree and start new pages.
import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import PageHead from '@/components/layout/PageHead';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Illustration from '@/components/ui/Illustration';
import Input from '@/components/ui/Input';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import { Icon } from '@/components/ui/Icon';
import SpaceFormModal from '@/components/wiki/SpaceFormModal';
import WikiList from '@/components/wiki/WikiList';
import { useProject } from '@/context/ProjectContext';
import { deleteSpace, listPages, listSpaces } from '@/libs/api/wiki';
import { emptyCopy } from '@/metadata/empty';
import { paths } from '@/routes/paths';
import { useMutation } from '@/utils/useMutation';
import { usePaged } from '@/utils/usePaged';
import { useResource } from '@/utils/useResource';

const idOf = (item) => String(item?.id ?? item?._id);
const NONE = Promise.resolve({ data: [], meta: null });
const textOf = (e) => (typeof e === 'string' ? e : (e?.target?.value ?? e?.nativeEvent?.text ?? ''));

export default function WikiPage() {
  const { projectId, can } = useProject();
  const router = useRouter();
  const spaces = useResource(() => listSpaces(projectId, { limit: 100 }), [projectId]);
  const spaceItems = Array.isArray(spaces.data) ? spaces.data : [];
  const [chosen, setChosen] = useState(null);
  const activeSpaceId = chosen ?? (spaceItems[0] ? idOf(spaceItems[0]) : null);
  const pages = usePaged((params) => (params.spaceId ? listPages(projectId, params) : NONE), {
    spaceId: activeSpaceId,
  });
  const [query, setQuery] = useState('');
  const [spaceFormOpen, setSpaceFormOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canManageSpaces = can('wiki.space.manage');
  const canEdit = can('wiki.page.edit');
  const activeSpace = spaceItems.find((space) => idOf(space) === activeSpaceId) ?? null;

  const removeSpace = useMutation(
    async () => {
      await deleteSpace(projectId, activeSpaceId);
      return true;
    },
    { success: 'Space deleted', error: (err) => err.message || 'Could not delete this space' },
  );

  const confirmDeleteSpace = async () => {
    const done = await removeSpace.run();
    if (done) {
      setDeleteOpen(false);
      setChosen(null);
      spaces.reload();
    }
  };

  const openNewSpace = () => {
    setEditingSpace(null);
    setSpaceFormOpen(true);
  };

  const openSpaceMenu = () => {
    if (!activeSpace) return;
    Alert.alert(activeSpace.name ?? 'Space', undefined, [
      {
        text: 'Edit space',
        onPress: () => {
          setEditingSpace(activeSpace);
          setSpaceFormOpen(true);
        },
      },
      { text: 'Delete space', style: 'destructive', onPress: () => setDeleteOpen(true) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const goNewPage = () => router.push(paths.wikiNew(projectId));

  const spaceOptions = spaceItems.map((space) => ({ value: idOf(space), label: space.name }));

  let body;
  if (spaces.status === 'error' || pages.status === 'error') {
    body = (
      <EmptyState
        tone="error"
        title="Wiki pages did not load"
        text={(spaces.error ?? pages.error)?.message}
        onRetry={() => {
          spaces.reload();
          pages.reload();
        }}
      />
    );
  } else if (spaces.status === 'loading' || (activeSpaceId && pages.status === 'loading' && !pages.items.length)) {
    body = <Skeleton variant="feed" count={5} />;
  } else if (!spaceItems.length) {
    body = (
      <View className="items-center gap-2">
        <Illustration name="wiki" alt="" className="w-[160px]" />
        <EmptyState
          icon="wiki"
          title="No wiki spaces yet"
          text="Create a space to group the pages of this project."
          action={
            canManageSpaces ? (
              <Button variant="soft" icon="space" onClick={openNewSpace}>
                New space
              </Button>
            ) : null
          }
        />
      </View>
    );
  } else if (!pages.items.length && !query.trim()) {
    body = (
      <EmptyState
        {...emptyCopy('wiki')}
        action={
          canEdit ? (
            <Button variant="ember" icon="plus" onClick={goNewPage}>
              New page
            </Button>
          ) : null
        }
      />
    );
  } else {
    body = (
      <WikiList
        pid={projectId}
        pages={pages.items}
        query={query}
        hasMore={pages.hasMore}
        loadingMore={pages.loadingMore}
        onLoadMore={pages.loadMore}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4 pb-10"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              spaces.reload();
              pages.reload();
            }}
          />
        }
      >
        <PageHead
          title="Wiki"
          sub="Project pages, grouped by space."
          actions={
            <>
              {canManageSpaces ? (
                <Button variant="soft" icon="space" onClick={openNewSpace}>
                  New space
                </Button>
              ) : null}
              {canEdit ? (
                <Button variant="ember" icon="plus" onClick={goNewPage}>
                  New page
                </Button>
              ) : null}
            </>
          }
        />

        <View className="gap-3">
          <Input
            variant="search"
            label="Search pages"
            hideLabel
            placeholder="Search pages"
            returnKeyType="search"
            value={query}
            onChange={(e) => setQuery(textOf(e))}
          />
          {spaceItems.length ? (
            <View className="flex-row items-center gap-2">
              <View className="flex-1 min-w-0">
                {spaceItems.length > 4 ? (
                  <Select label="Space" hideLabel value={activeSpaceId ?? ''} options={spaceOptions} onChange={setChosen} />
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <SegmentedControl
                      label="Space"
                      size="sm"
                      value={activeSpaceId ?? ''}
                      options={spaceOptions}
                      onChange={setChosen}
                    />
                  </ScrollView>
                )}
              </View>
              {canManageSpaces && activeSpace ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Space actions"
                  onPress={openSpaceMenu}
                  hitSlop={8}
                  className="w-[44px] h-[44px] items-center justify-center rounded-xl border border-border bg-surface active:opacity-60"
                >
                  <Icon name="more" size={18} />
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        <View className="bg-surface border border-border rounded-card p-4">{body}</View>
      </ScrollView>

      <SpaceFormModal
        open={spaceFormOpen}
        onClose={() => setSpaceFormOpen(false)}
        pid={projectId}
        space={editingSpace}
        onSaved={(saved) => {
          setSpaceFormOpen(false);
          spaces.reload();
          if (!editingSpace && saved) setChosen(idOf(saved));
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this space?"
        text="The space and every page in it are removed for everyone in this project."
        confirmLabel="Delete space"
        tone="danger"
        onConfirm={confirmDeleteSpace}
      />
    </View>
  );
}

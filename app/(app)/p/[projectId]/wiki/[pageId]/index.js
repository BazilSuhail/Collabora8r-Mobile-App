// feat(screens/wiki/WikiDetailPage): read a wiki page with its place in the tree and its version history.
// The web sidebar (hidden below 900px) becomes a "Pages" sheet opened from the header actions.
import { useCallback, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PageHead from '@/components/layout/PageHead';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { Icon } from '@/components/ui/Icon';
import MarkdownView from '@/components/wiki/MarkdownView';
import WikiHistoryDrawer from '@/components/wiki/WikiHistoryDrawer';
import WikiList from '@/components/wiki/WikiList';
import { useProject } from '@/context/ProjectContext';
import { deletePage, getPage, listPages } from '@/libs/api/wiki';
import { paths } from '@/routes/paths';
import { relativeTime } from '@/utils/format';
import { useMutation } from '@/utils/useMutation';
import { usePaged } from '@/utils/usePaged';
import { useResource } from '@/utils/useResource';

const NONE = Promise.resolve({ data: [], meta: null });

export default function WikiDetailPage() {
  const { projectId, can } = useProject();
  const { pageId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const page = useResource(() => getPage(projectId, pageId), [projectId, pageId]);
  const doc = page.data;
  const siblings = usePaged((params) => (params.spaceId ? listPages(projectId, params) : NONE), {
    spaceId: doc ? String(doc.spaceId) : null,
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);

  // A Modal stays on top of the next screen, so close the pages sheet when this screen loses focus
  // or the page id changes (WikiList links have no select callback).
  useFocusEffect(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useCallback(() => () => setPagesOpen(false), [pageId]),
  );

  const remove = useMutation(
    async () => {
      await deletePage(projectId, pageId);
      return true;
    },
    { success: 'Page deleted', error: (err) => err.message || 'Could not delete this page' },
  );

  const confirmDelete = async () => {
    const done = await remove.run();
    if (done) router.replace(paths.wiki(projectId));
  };

  const backToWiki = () => (router.canGoBack() ? router.back() : router.replace(paths.wiki(projectId)));

  const canEdit = can('wiki.page.edit');
  const canDelete = can('wiki.page.delete');
  const bodyText = doc ? (typeof doc.body === 'string' ? doc.body : (doc.body?.text ?? '')) : '';

  let article;
  if (page.status === 'loading') {
    article = <Skeleton variant="cards" count={1} />;
  } else if (page.status === 'error') {
    const notFound = page.error?.status === 404;
    article = (
      <EmptyState
        tone="error"
        title={notFound ? 'Page not found' : 'This page did not load'}
        text={notFound ? 'It may have been deleted or moved.' : page.error?.message}
        onRetry={notFound ? undefined : page.reload}
      />
    );
  } else {
    article = (
      <>
        <Text className="text-[26px] font-bold text-foreground tracking-tight">{doc.title}</Text>
        {doc.summary ? <Text className="mt-[6px] text-muted">{doc.summary}</Text> : null}
        {bodyText.trim() ? (
          <View className="mt-[18px]">
            <MarkdownView text={bodyText} />
          </View>
        ) : (
          <EmptyState
            icon="wiki"
            title="This page is empty"
            text={canEdit ? 'Open Edit to write the first section.' : undefined}
          />
        )}
        <Text className="mt-[18px] text-[13px] text-muted" style={{ fontVariant: ['tabular-nums'] }}>
          Version {doc.currentVersion}
          {doc.updatedAt ? ` · Updated ${relativeTime(doc.updatedAt)}` : ''}
          {doc.lastEditedByName ? ` by ${doc.lastEditedByName}` : ''}
        </Text>
      </>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={false} onRefresh={page.reload} />}
      >
        <PageHead
          title={doc?.title ?? 'Wiki page'}
          sub={doc?.authorName ? `Started by ${doc.authorName}` : undefined}
          actions={
            <>
              <Button variant="ghost" size="sm" icon="chevL" onClick={backToWiki}>
                Wiki
              </Button>
              {doc ? (
                <Button variant="soft" size="sm" icon="list" onClick={() => setPagesOpen(true)}>
                  Pages
                </Button>
              ) : null}
              {doc ? (
                <Button variant="soft" size="sm" icon="history" onClick={() => setHistoryOpen(true)}>
                  History
                </Button>
              ) : null}
              {doc && canEdit ? (
                <Button variant="soft" size="sm" icon="edit" onClick={() => router.push(paths.wikiEdit(projectId, pageId))}>
                  Edit
                </Button>
              ) : null}
              {doc && canDelete ? (
                <Button variant="ghost" size="sm" icon="trash" onClick={() => setDeleteOpen(true)}>
                  Delete
                </Button>
              ) : null}
            </>
          }
        />

        <View className="bg-surface border border-border rounded-card p-5 min-w-0">{article}</View>
      </ScrollView>

      <Modal
        visible={pagesOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPagesOpen(false)}
      >
        <View className="flex-1 bg-background" style={{ paddingBottom: insets.bottom }}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Text className="text-[17px] font-semibold text-foreground">Pages in this space</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={10}
              onPress={() => setPagesOpen(false)}
              className="w-[44px] h-[44px] items-center justify-center"
            >
              <Icon name="close" size={20} />
            </Pressable>
          </View>
          <ScrollView className="flex-1" contentContainerClassName="p-3">
            {doc ? (
              <WikiList
                pid={projectId}
                pages={siblings.items}
                activeId={pageId}
                hasMore={siblings.hasMore}
                loadingMore={siblings.loadingMore}
                onLoadMore={siblings.loadMore}
              />
            ) : (
              <Skeleton variant="feed" count={4} />
            )}
          </ScrollView>
        </View>
      </Modal>

      {doc ? (
        <WikiHistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          pid={projectId}
          pageId={pageId}
          canRestore={canEdit}
          onRestored={page.reload}
        />
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this page?"
        text="The page is removed for everyone in this project."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </View>
  );
}

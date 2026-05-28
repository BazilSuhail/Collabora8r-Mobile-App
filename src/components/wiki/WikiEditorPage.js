// feat(screens/wiki/WikiEditorPage): write or edit a wiki page in Markdown with preview, AI outline drafts and conflict-safe saving.
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import PageHead from '@/components/layout/PageHead';
import AiButton from '@/components/ai/AiButton';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import MarkdownEditor from '@/components/wiki/MarkdownEditor';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/context/ToastContext';
import { createPage, getPage, listPages, listSpaces, updatePage } from '@/libs/api/wiki';
import { paths } from '@/routes/paths';
import { useMutation } from '@/utils/useMutation';
import { useResource } from '@/utils/useResource';

const idOf = (item) => String(item?.id ?? item?._id);
const NONE = Promise.resolve({ data: [], meta: null });
const textOf = (e) => (typeof e === 'string' ? e : (e?.target?.value ?? e?.nativeEvent?.text ?? ''));

const CARD = 'bg-surface border border-border rounded-card p-5';

// Turns an AI outline into Markdown headings and bullets.
const outlineToMarkdown = (output) =>
  (output?.sections ?? [])
    .map((section) => [`## ${section.heading}`, ...(section.points ?? []).map((point) => `- ${point}`)].join('\n'))
    .join('\n\n');

function Heading({ icon, children }) {
  return (
    <View className="flex-row items-center gap-2">
      <Icon name={icon} size={18} />
      <Text className="text-[18px] font-semibold text-foreground">{children}</Text>
    </View>
  );
}

export default function WikiEditorPage() {
  const { projectId, can } = useProject();
  const toast = useToast();
  const { pageId } = useLocalSearchParams();
  const editing = Boolean(pageId);
  const router = useRouter();
  const navigation = useNavigation();

  const page = useResource(() => (editing ? getPage(projectId, pageId) : NONE), [projectId, pageId, editing]);
  const spaces = useResource(() => listSpaces(projectId, { limit: 100 }), [projectId]);
  const spaceItems = Array.isArray(spaces.data) ? spaces.data : [];

  const [form, setForm] = useState({ title: '', spaceId: '', parentId: '', body: '' });
  const [serverVersion, setServerVersion] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const baselineRef = useRef(null);
  const allowLeaveRef = useRef(false);
  const pendingActionRef = useRef(null);

  const doc = page.data;
  useEffect(() => {
    if (loaded) return;
    if (!editing) {
      baselineRef.current = { title: '', spaceId: '', parentId: '', body: '' };
      setLoaded(true);
      return;
    }
    if (!doc) return;
    const next = {
      title: doc.title ?? '',
      spaceId: String(doc.spaceId),
      parentId: doc.parentId ? String(doc.parentId) : '',
      body: typeof doc.body === 'string' ? doc.body : (doc.body?.text ?? ''),
    };
    baselineRef.current = next;
    setForm(next);
    setServerVersion(doc.currentVersion);
    setLoaded(true);
  }, [editing, doc, loaded]);

  const effectiveSpaceId = form.spaceId || (spaceItems[0] ? idOf(spaceItems[0]) : '');
  const parents = useResource(
    () => (effectiveSpaceId ? listPages(projectId, { spaceId: effectiveSpaceId, limit: 100 }) : NONE),
    [projectId, effectiveSpaceId],
  );
  const parentOptions = [
    { value: '', label: 'No parent (top level)' },
    ...(Array.isArray(parents.data) ? parents.data : [])
      .filter((item) => idOf(item) !== pageId)
      .map((item) => ({ value: idOf(item), label: item.title })),
  ];

  const dirty = loaded && JSON.stringify(form) !== JSON.stringify(baselineRef.current);

  // Replaces the web beforeunload guard: block back/swipe while there are unsaved edits.
  useEffect(() => {
    if (!dirty) return undefined;
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (allowLeaveRef.current) return;
      event.preventDefault();
      pendingActionRef.current = event.data.action;
      setDiscardOpen(true);
    });
    return unsubscribe;
  }, [dirty, navigation]);

  const refreshVersion = async () => {
    const res = await getPage(projectId, pageId);
    setServerVersion(res.data.currentVersion);
  };

  // The PATCH sends the version this draft was based on. On 409 the server version is refreshed and the draft is kept.
  const save = useMutation(
    async () => {
      const title = form.title.trim();
      const parentId = form.parentId || null;
      if (editing) {
        try {
          const res = await updatePage(projectId, pageId, {
            title,
            parentId,
            body: form.body,
            version: serverVersion,
          });
          baselineRef.current = form;
          setServerVersion(res.data.currentVersion);
          return { id: pageId };
        } catch (err) {
          if (err.status === 409) {
            toast.warning('Changed by someone else. Reloaded.');
            await refreshVersion();
            return undefined;
          }
          throw err;
        }
      }
      const res = await createPage(projectId, {
        spaceId: effectiveSpaceId,
        title,
        parentId,
        body: form.body,
        status: 'published',
      });
      return { id: idOf(res.data) };
    },
    {
      success: (result) => (result ? 'Page saved' : null),
      error: (err) => err.message || 'Could not save the page',
    },
  );

  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const onSubmit = async () => {
    const result = await save.run();
    if (result) {
      allowLeaveRef.current = true;
      router.replace(paths.wikiPage(projectId, result.id));
    }
  };

  const leave = () => {
    allowLeaveRef.current = true;
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) {
      navigation.dispatch(action);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace(editing ? paths.wikiPage(projectId, pageId) : paths.wiki(projectId));
  };
  const cancel = () => (dirty ? setDiscardOpen(true) : leave());

  const canEdit = can('wiki.page.edit');
  const failed = editing && page.status === 'error';

  let content;
  if (!canEdit) {
    content = (
      <EmptyState
        icon="lock"
        title="You cannot edit wiki pages here"
        text="Ask a project lead for developer access."
        action={
          <Button variant="soft" onClick={() => router.replace(paths.wiki(projectId))}>
            Back to wiki
          </Button>
        }
      />
    );
  } else if (failed) {
    const notFound = page.error?.status === 404;
    content = (
      <EmptyState
        tone="error"
        title={notFound ? 'Page not found' : 'This page did not load'}
        text={notFound ? 'It may have been deleted or moved.' : page.error?.message}
        onRetry={notFound ? undefined : page.reload}
      />
    );
  } else if (!loaded) {
    content = <Skeleton variant="cards" count={2} />;
  } else {
    content = (
      <View className="gap-4">
        <View className={`${CARD} gap-4`}>
          <Heading icon="note">Details</Heading>
          <Input
            label="Title"
            hint="Required. The page name people see in the wiki."
            value={form.title}
            maxLength={200}
            error={save.fieldErrors?.title}
            onChange={(e) => set('title')(textOf(e))}
          />
          <Select
            label="Space"
            hint={editing ? 'A page stays in its space.' : 'The space this page belongs to.'}
            value={effectiveSpaceId}
            disabled={editing}
            options={spaceItems.map((space) => ({ value: idOf(space), label: space.name }))}
            onChange={set('spaceId')}
          />
          <Select
            label="Parent page"
            hint="Optional. Nests this page under another page."
            value={form.parentId}
            options={parentOptions}
            error={save.fieldErrors?.parentId}
            onChange={set('parentId')}
          />
        </View>
        <View className={`${CARD} gap-3`}>
          <View className="flex-row flex-wrap items-center justify-between gap-[10px]">
            <Heading icon="wiki">Content</Heading>
            <AiButton
              kind="wikiOutline"
              projectId={projectId}
              text={form.title}
              label="Draft outline"
              onInsert={(output) =>
                setForm((current) => ({
                  ...current,
                  title: current.title || output?.title || current.title,
                  body: [current.body.trimEnd(), outlineToMarkdown(output)].filter(Boolean).join('\n\n'),
                }))
              }
            />
          </View>
          <MarkdownEditor
            id="wiki-body"
            label="Content"
            value={form.body}
            rows={18}
            error={save.fieldErrors?.body}
            hint="Markdown: headings with #, lists with -, **bold**, `code`, [links](https://)."
            onChange={(v) => set('body')(textOf(v))}
          />
        </View>
        <View className="gap-3">
          {dirty ? (
            <View className="flex-row">
              <Badge tone="saffron">Unsaved changes</Badge>
            </View>
          ) : null}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button variant="ghost" onClick={cancel}>
                Cancel
              </Button>
            </View>
            <View className="flex-1">
              <Button variant="ember" onClick={onSubmit} loading={save.pending}>
                Save page
              </Button>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4 pb-10" keyboardShouldPersistTaps="handled">
        <PageHead
          title={editing ? 'Edit page' : 'New page'}
          sub="Markdown is saved as you write it. Use Preview to check the result."
        />
        {content}
      </ScrollView>
      <ConfirmDialog
        open={discardOpen}
        onClose={() => {
          pendingActionRef.current = null;
          setDiscardOpen(false);
        }}
        title="Discard your changes?"
        text="Edits you have not saved are lost."
        confirmLabel="Discard"
        tone="danger"
        onConfirm={() => {
          setDiscardOpen(false);
          leave();
          return true;
        }}
      />
    </KeyboardAvoidingView>
  );
}

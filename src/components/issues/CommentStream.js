import { useState } from "react";
import { Text, View } from "react-native";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Skeleton from "@/components/ui/Skeleton";
import Switch from "@/components/ui/Switch";
import MarkdownView from "@/components/wiki/MarkdownView";
import { addComment, deleteComment, listComments, updateComment } from "@/libs/api/issues";
import { searchUsers } from "@/libs/api/users";
import { useAuth } from "@/context/AuthContext";
import { usePaged } from "@/utils/usePaged";
import { useMutation } from "@/utils/useMutation";
import { relativeTime } from "@/utils/format";

const idOf = (item) => String(item?.id ?? item?._id);

// Comment thread for one issue. Authors edit their own comments; leads can delete any.
// Internal notes are offered only when canInternal is set (developer and above).
export default function CommentStream({ pid, issueId, canComment = false, canInternal = false, canModerate = false }) {
  const { user } = useAuth();
  const me = user ? idOf(user) : null;
  const thread = usePaged((params) => listComments(pid, issueId, { limit: params.limit, cursor: params.cursor }), {
    issueId,
  });
  const [draft, setDraft] = useState("");
  const [internal, setInternal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const add = useMutation(
    () =>
      addComment(pid, issueId, {
        body: draft.trim(),
        ...(canInternal && internal ? { internal: true } : {}),
      }),
    { success: "Comment added", error: (err) => err.message || "Could not add the comment" },
  );
  const save = useMutation((id, body) => updateComment(pid, issueId, id, { body }), {
    success: "Saved",
    error: (err) => err.message || "Could not save the comment",
  });
  const remove = useMutation(
    async (id) => {
      await deleteComment(pid, issueId, id);
      return true;
    },
    { success: "Comment deleted", error: (err) => err.message || "Could not delete the comment" },
  );

  const submit = async () => {
    if (!draft.trim()) return;
    const res = await add.run();
    if (res) {
      thread.setItems((prev) => [...prev, res.data]);
      setDraft("");
      setInternal(false);
    }
  };

  const saveEdit = async () => {
    if (!editing || !editing.body.trim()) return;
    const res = await save.run(editing.id, editing.body.trim());
    if (res) {
      thread.setItems((prev) => prev.map((item) => (idOf(item) === editing.id ? { ...item, ...res.data } : item)));
      setEditing(null);
    }
  };

  const confirmDelete = async () => {
    const id = pendingDelete;
    const done = await remove.run(id);
    if (done) {
      thread.setItems((prev) => prev.filter((item) => idOf(item) !== id));
      setPendingDelete(null);
    }
  };

  const mention = (uid) => {
    if (!uid) return;
    setDraft((text) => `${text}${text && !/\s$/.test(text) ? " " : ""}@[${uid}] `);
  };

  let list;
  if (thread.status === "loading") {
    list = <Skeleton variant="feed" count={3} />;
  } else if (thread.status === "error") {
    list = <EmptyState tone="error" title="Comments did not load" text={thread.error?.message} onRetry={thread.reload} />;
  } else if (!thread.items.length) {
    list = <EmptyState icon="chat" title="No comments yet" text={canComment ? "Start the conversation below." : undefined} />;
  } else {
    list = (
      <View className="gap-[4px]">
        {thread.items.map((comment) => {
          const id = idOf(comment);
          const mine = me !== null && String(comment.authorId) === me;
          const isEditing = editing?.id === id;
          return (
            <View key={id} className="flex-row gap-[12px] py-[12px] border-b border-border">
              <Avatar name={comment.authorName ?? "User"} src={comment.authorAvatar ?? undefined} size="sm" />
              <View className="min-w-0 flex-1 gap-[6px]">
                <View className="flex-row flex-wrap items-center gap-[8px]">
                  <Text numberOfLines={1} className="shrink text-[14px] font-semibold text-foreground">
                    {comment.authorName ?? "Unknown"}
                  </Text>
                  <Text className="text-[12.5px] text-muted">{relativeTime(comment.createdAt)}</Text>
                  {comment.internal ? (
                    <Badge variant="badge" tone="saffron">
                      Internal
                    </Badge>
                  ) : null}
                  <View className="ml-auto flex-row gap-[4px]">
                    {mine && !isEditing ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="edit"
                        aria-label="Edit comment"
                        onClick={() => setEditing({ id, body: comment.body ?? "" })}
                      >
                        Edit
                      </Button>
                    ) : null}
                    {(mine || canModerate) && !isEditing ? (
                      <Button variant="ghost" size="sm" icon="trash" aria-label="Delete comment" onClick={() => setPendingDelete(id)}>
                        Delete
                      </Button>
                    ) : null}
                  </View>
                </View>
                {isEditing ? (
                  <View className="gap-[8px]">
                    <Input
                      as="textarea"
                      multiline
                      label="Edit comment"
                      hideLabel
                      hint="Markdown works. Save applies your changes to this comment."
                      value={editing.body}
                      onChangeText={(text) => setEditing({ ...editing, body: text })}
                    />
                    <View className="flex-row justify-end gap-[8px]">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                      <Button
                        variant="ink"
                        size="sm"
                        loading={save.pending}
                        disabled={!editing.body.trim() || save.pending}
                        onClick={saveEdit}
                      >
                        Save
                      </Button>
                    </View>
                  </View>
                ) : (
                  <MarkdownView text={comment.body ?? ""} className="text-[14.5px]" />
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View className="gap-[12px]">
      {list}
      {thread.hasMore ? (
        <View className="flex-row">
          <Button variant="soft" size="sm" loading={thread.loadingMore} onClick={thread.loadMore}>
            Show more comments
          </Button>
        </View>
      ) : null}
      {canComment ? (
        <View className="gap-[10px] border-t border-border pt-[14px]">
          <Input
            as="textarea"
            multiline
            id={`comment-${issueId}`}
            label="Write a comment"
            hideLabel
            placeholder="Write a comment. Markdown works."
            hint={`${draft.length.toLocaleString()} of 20,000 characters`}
            value={draft}
            maxLength={20000}
            onChangeText={setDraft}
          />
          <View className="flex-row flex-wrap items-center justify-between gap-[10px]">
            <View className="flex-row flex-wrap items-center gap-[12px]">
              <Select
                label="Mention someone"
                hideLabel
                variant="button"
                searchable
                value={null}
                placeholder="Mention"
                options={[]}
                loadOptions={async (q) => {
                  if (!q.trim()) return [];
                  const res = await searchUsers(q.trim());
                  return (Array.isArray(res.data) ? res.data : []).map((u) => ({
                    value: idOf(u),
                    label: u.displayName ?? u.email,
                  }));
                }}
                onChange={mention}
              />
              {canInternal ? <Switch checked={internal} onChange={setInternal} label="Internal note" /> : null}
            </View>
            <Button variant="ink" size="sm" loading={add.pending} disabled={!draft.trim()} onClick={submit}>
              Comment
            </Button>
          </View>
        </View>
      ) : null}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this comment?"
        text="The comment is removed for everyone on this issue."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </View>
  );
}

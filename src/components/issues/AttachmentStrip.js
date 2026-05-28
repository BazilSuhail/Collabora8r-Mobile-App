import { useState } from "react";
import { Linking, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import {
  deleteAttachment,
  getDownloadUrl,
  getUploadUrl,
  listAttachments,
  registerAttachment,
  uploadFile,
} from "@/libs/api/issues";
import { useResource } from "@/utils/useResource";
import { useMutation } from "@/utils/useMutation";
import { useToast } from "@/context/ToastContext";
import { relativeTime } from "@/utils/format";

const MAX_BYTES = 25 * 1024 * 1024;
const idOf = (item) => String(item?.id ?? item?._id);

const formatSize = (bytes = 0) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// Reads a picked file into a Blob so it can be PUT to the signed URL.
async function toBlob(asset) {
  const res = await fetch(asset.uri);
  return res.blob();
}

// Issue attachments. Upload runs getUploadUrl, then a PUT to the signed URL, then registerAttachment.
// On mobile, files come from the system document picker instead of drag and drop.
export default function AttachmentStrip({ pid, issueId, canUpload = false, canDelete = false }) {
  const toast = useToast();
  const attachments = useResource(() => listAttachments(pid, issueId, { limit: 100 }), [pid, issueId]);
  const items = Array.isArray(attachments.data) ? attachments.data : [];
  const [pending, setPending] = useState(0);
  const [pendingDelete, setPendingDelete] = useState(null);

  const uploadOne = async (asset) => {
    const name = asset.name ?? "file";
    let size = asset.size;
    if (size != null && size > MAX_BYTES) {
      toast.error("That is too large");
      return;
    }
    try {
      const blob = await toBlob(asset);
      size = size ?? blob.size ?? 0;
      if (size > MAX_BYTES) {
        toast.error("That is too large");
        return;
      }
      const mime = asset.mimeType || blob.type || "application/octet-stream";
      const { data: target } = await getUploadUrl(pid, issueId, { name, mime, size });
      // uploadFile reads file.type for the Content-Type header.
      const body = blob.type ? blob : new Blob([blob], { type: mime });
      await uploadFile(target.uploadUrl, body);
      await registerAttachment(pid, issueId, { storageKey: target.storageKey, name, mime, size });
      toast.success(`Uploaded ${name}`);
    } catch (err) {
      toast.error(err?.status === 413 ? "That is too large" : "Upload failed");
    }
  };

  const addFiles = async (files) => {
    if (!files?.length) return;
    setPending((n) => n + files.length);
    for (const file of files) {
      await uploadOne(file);
      setPending((n) => n - 1);
    }
    attachments.reload();
  };

  const chooseFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
      if (result.canceled) return;
      addFiles(result.assets ?? []);
    } catch {
      toast.error("Could not open the file picker");
    }
  };

  const download = useMutation((att) => getDownloadUrl(pid, issueId, idOf(att)), {
    error: (err) => err.message || "Could not open this file",
  });
  const openFile = async (att) => {
    const res = await download.run(att);
    if (res?.data?.url) {
      try {
        await Linking.openURL(res.data.url);
      } catch {
        toast.error("Could not open this file");
      }
    }
  };

  const remove = useMutation(
    async (att) => {
      await deleteAttachment(pid, issueId, idOf(att));
      return true;
    },
    { success: "Attachment deleted", error: (err) => err.message || "Could not delete this attachment" },
  );
  const confirmDelete = async () => {
    const done = await remove.run(pendingDelete);
    if (done) {
      setPendingDelete(null);
      attachments.reload();
    }
  };

  let list;
  if (attachments.status === "loading") {
    list = (
      <View className="gap-[8px]" accessibilityLabel="Loading attachments" accessibilityState={{ busy: true }}>
        {[0, 1].map((n) => (
          <View key={n} className="h-[44px] rounded-[12px] bg-well" />
        ))}
      </View>
    );
  } else if (attachments.status === "error") {
    list = (
      <EmptyState
        tone="error"
        title="Attachments did not load"
        text={attachments.error?.message}
        onRetry={attachments.reload}
      />
    );
  } else if (!items.length) {
    list = (
      <EmptyState
        icon="attach"
        title="No attachments"
        text={canUpload ? "Add a file to share context on this issue." : "Nothing is attached yet."}
      />
    );
  } else {
    list = (
      <View accessibilityLabel="Attachments" className="gap-[8px]">
        {items.map((att) => (
          <View
            key={idOf(att)}
            className="flex-row items-center gap-[10px] rounded-[12px] border border-border bg-surface px-[12px] py-[8px]"
          >
            <Icon name="file" size={18} className="text-muted" />
            <View className="min-w-0 flex-1">
              <Text numberOfLines={1} className="text-[14px] font-semibold text-foreground">
                {att.name}
              </Text>
              <Text className="text-[12.5px] text-muted">
                {formatSize(att.size)}
                {att.createdAt ? ` · ${relativeTime(att.createdAt)}` : ""}
              </Text>
            </View>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              icon="download"
              aria-label={`Download ${att.name}`}
              loading={download.pending}
              onClick={() => openFile(att)}
            />
            {canDelete ? (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon="trash"
                aria-label={`Delete ${att.name}`}
                onClick={() => setPendingDelete(att)}
              />
            ) : null}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="gap-[12px]">
      {canUpload ? (
        <View className="flex-row flex-wrap items-center justify-between gap-[10px] rounded-[12px] border border-dashed border-line-2 bg-surface-2 p-[12px]">
          <Text className="flex-1 text-[14px] text-muted">
            {pending > 0 ? `Uploading ${pending} file${pending === 1 ? "" : "s"}...` : "Choose files to attach. Up to 25 MB each."}
          </Text>
          <Button
            variant="ghost"
            size="sm"
            icon="attach"
            disabled={pending > 0}
            aria-label="Choose files to attach"
            onClick={chooseFiles}
          >
            Choose files
          </Button>
        </View>
      ) : null}
      {list}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this attachment?"
        text={`${pendingDelete?.name ?? "This file"} is removed from the issue.`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
      />
    </View>
  );
}

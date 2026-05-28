import { api } from "../axios.js";

const P = (pid) => `/projects/${pid}`;
const I = (pid, issueId) => `${P(pid)}/issues/${issueId}`;

export const listIssues = (pid, params) => api.get(`${P(pid)}/issues`, { params });
export const createIssue = (pid, body) => api.post(`${P(pid)}/issues`, body);
export const getIssueByKey = (pid, key) => api.get(`${P(pid)}/issues/by-key/${key}`);
export const bulkUpdate = (pid, body) => api.post(`${P(pid)}/issues/bulk`, body);
export const getIssue = (pid, issueId) => api.get(I(pid, issueId));
export const listChildren = (pid, issueId) => api.get(`${I(pid, issueId)}/children`);
// body carries version (optimistic locking) when the caller has one.
export const updateIssue = (pid, issueId, body) => api.patch(I(pid, issueId), body);
export const transitionIssue = (pid, issueId, body) =>
  api.post(`${I(pid, issueId)}/transition`, body);
export const deleteIssue = (pid, issueId) => api.delete(I(pid, issueId));

export const listSavedFilters = (pid, params) => api.get(`${P(pid)}/saved-filters`, { params });
export const createSavedFilter = (pid, body) => api.post(`${P(pid)}/saved-filters`, body);
export const updateSavedFilter = (pid, filterId, body) =>
  api.patch(`${P(pid)}/saved-filters/${filterId}`, body);
export const deleteSavedFilter = (pid, filterId) =>
  api.delete(`${P(pid)}/saved-filters/${filterId}`);

export const listComments = (pid, issueId, params) =>
  api.get(`${I(pid, issueId)}/comments`, { params });
export const addComment = (pid, issueId, body) => api.post(`${I(pid, issueId)}/comments`, body);
export const updateComment = (pid, issueId, commentId, body) =>
  api.patch(`${I(pid, issueId)}/comments/${commentId}`, body);
export const deleteComment = (pid, issueId, commentId) =>
  api.delete(`${I(pid, issueId)}/comments/${commentId}`);

export const listAttachments = (pid, issueId, params) =>
  api.get(`${I(pid, issueId)}/attachments`, { params });
export const getUploadUrl = (pid, issueId, body) =>
  api.post(`${I(pid, issueId)}/attachments/upload-url`, body);
export const registerAttachment = (pid, issueId, body) =>
  api.post(`${I(pid, issueId)}/attachments`, body);
export const getDownloadUrl = (pid, issueId, attachmentId) =>
  api.get(`${I(pid, issueId)}/attachments/${attachmentId}/download-url`);
export const deleteAttachment = (pid, issueId, attachmentId) =>
  api.delete(`${I(pid, issueId)}/attachments/${attachmentId}`);

// Plain fetch PUT to the signed URL. No auth header: the signature is the credential.
// On mobile `file` is usually a picker asset ({ uri, mimeType, name }); its bytes are read from the uri.
export const uploadFile = async (url, file) => {
  const type = file.mimeType || file.type || "application/octet-stream";
  const body = file.uri ? await (await fetch(file.uri)).blob() : file;
  const res = await fetch(url, {
    method: "PUT",
    body,
    headers: { "Content-Type": type },
  });
  if (!res.ok) {
    const error = new Error("Upload failed");
    error.status = res.status;
    throw error;
  }
  return res;
};

export const listLinks = (pid, issueId) => api.get(`${I(pid, issueId)}/links`);
export const createLink = (pid, issueId, body) => api.post(`${I(pid, issueId)}/links`, body);
export const deleteLink = (pid, issueId, linkId) =>
  api.delete(`${I(pid, issueId)}/links/${linkId}`);

export const listWorklogs = (pid, issueId, params) =>
  api.get(`${I(pid, issueId)}/worklogs`, { params });
export const addWorklog = (pid, issueId, body) => api.post(`${I(pid, issueId)}/worklogs`, body);
export const updateWorklog = (pid, issueId, worklogId, body) =>
  api.patch(`${I(pid, issueId)}/worklogs/${worklogId}`, body);
export const deleteWorklog = (pid, issueId, worklogId) =>
  api.delete(`${I(pid, issueId)}/worklogs/${worklogId}`);
export const getTimesheet = (pid, params) => api.get(`${P(pid)}/worklogs`, { params });

export const getHistory = (pid, issueId, params) =>
  api.get(`${I(pid, issueId)}/history`, { params });

import { api } from "../axios.js";

const P = (pid) => `/projects/${pid}`;

export const listTestCases = (pid, params) => api.get(`${P(pid)}/test-cases`, { params });
export const getTestCase = (pid, caseId) => api.get(`${P(pid)}/test-cases/${caseId}`);
export const createTestCase = (pid, body) => api.post(`${P(pid)}/test-cases`, body);
export const updateTestCase = (pid, caseId, body) => api.patch(`${P(pid)}/test-cases/${caseId}`, body);
export const deleteTestCase = (pid, caseId) => api.delete(`${P(pid)}/test-cases/${caseId}`);

export const listTestRuns = (pid, params) => api.get(`${P(pid)}/test-runs`, { params });
export const getTestRun = (pid, runId) => api.get(`${P(pid)}/test-runs/${runId}`);
export const createTestRun = (pid, body) => api.post(`${P(pid)}/test-runs`, body);
export const updateTestRun = (pid, runId, body) => api.patch(`${P(pid)}/test-runs/${runId}`, body);
export const deleteTestRun = (pid, runId) => api.delete(`${P(pid)}/test-runs/${runId}`);
export const completeTestRun = (pid, runId) => api.post(`${P(pid)}/test-runs/${runId}/complete`);

export const listResults = (pid, runId, params) =>
  api.get(`${P(pid)}/test-runs/${runId}/results`, { params });
export const getResult = (pid, runId, resultId) =>
  api.get(`${P(pid)}/test-runs/${runId}/results/${resultId}`);
// Upserts one result per test case within the run.
export const upsertResult = (pid, runId, body) =>
  api.post(`${P(pid)}/test-runs/${runId}/results`, body);
export const deleteResult = (pid, runId, resultId) =>
  api.delete(`${P(pid)}/test-runs/${runId}/results/${resultId}`);

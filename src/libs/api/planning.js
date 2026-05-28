import { api } from "../axios.js";

const P = (pid) => `/projects/${pid}`;

export const listRisks = (pid, params) => api.get(`${P(pid)}/risks`, { params });
export const getRisk = (pid, riskId) => api.get(`${P(pid)}/risks/${riskId}`);
export const createRisk = (pid, body) => api.post(`${P(pid)}/risks`, body);
export const updateRisk = (pid, riskId, body) => api.patch(`${P(pid)}/risks/${riskId}`, body);
export const deleteRisk = (pid, riskId) => api.delete(`${P(pid)}/risks/${riskId}`);

export const budgetSummary = (pid) => api.get(`${P(pid)}/budget-lines/summary`);
export const listBudgetLines = (pid, params) => api.get(`${P(pid)}/budget-lines`, { params });
export const getBudgetLine = (pid, lineId) => api.get(`${P(pid)}/budget-lines/${lineId}`);
export const createBudgetLine = (pid, body) => api.post(`${P(pid)}/budget-lines`, body);
export const updateBudgetLine = (pid, lineId, body) =>
  api.patch(`${P(pid)}/budget-lines/${lineId}`, body);
export const deleteBudgetLine = (pid, lineId) => api.delete(`${P(pid)}/budget-lines/${lineId}`);

export const listActuals = (pid, params) => api.get(`${P(pid)}/budget-actuals`, { params });
export const getActual = (pid, actualId) => api.get(`${P(pid)}/budget-actuals/${actualId}`);
export const createActual = (pid, body) => api.post(`${P(pid)}/budget-actuals`, body);
export const updateActual = (pid, actualId, body) =>
  api.patch(`${P(pid)}/budget-actuals/${actualId}`, body);
export const deleteActual = (pid, actualId) => api.delete(`${P(pid)}/budget-actuals/${actualId}`);

export const listCatEntries = (pid, params) => api.get(`${P(pid)}/cat-entries`, { params });
export const getCatEntry = (pid, entryId) => api.get(`${P(pid)}/cat-entries/${entryId}`);
export const createCatEntry = (pid, body) => api.post(`${P(pid)}/cat-entries`, body);
export const updateCatEntry = (pid, entryId, body) =>
  api.patch(`${P(pid)}/cat-entries/${entryId}`, body);
export const deleteCatEntry = (pid, entryId) => api.delete(`${P(pid)}/cat-entries/${entryId}`);

export const listGlossary = (pid, params) => api.get(`${P(pid)}/cat-glossary`, { params });
export const getTerm = (pid, termId) => api.get(`${P(pid)}/cat-glossary/${termId}`);
export const createTerm = (pid, body) => api.post(`${P(pid)}/cat-glossary`, body);
export const updateTerm = (pid, termId, body) => api.patch(`${P(pid)}/cat-glossary/${termId}`, body);
export const deleteTerm = (pid, termId) => api.delete(`${P(pid)}/cat-glossary/${termId}`);

import { api } from "../axios.js";

export const myIssues = (params) => api.get("/my-work/issues", { params });
export const myWorklogs = (params) => api.get("/my-work/worklogs", { params });

import { api } from "../axios.js";

export const listBoardProjects = () => api.get("/board/projects");
export const saveBoardOrder = (projectIds) => api.put("/board/order", { projectIds });
export const getBoardIssues = (projectId) => api.get(`/board/projects/${projectId}/issues`);

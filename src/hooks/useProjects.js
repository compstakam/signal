import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/api';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/api/projects');
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (name, description, filterCriteria) => {
    const project = await apiPost('/api/projects', { name, description, filterCriteria });
    setProjects(prev => [{ ...project, lead_count: 0 }, ...prev]);
    return project;
  }, []);

  const updateProject = useCallback(async (id, updates) => {
    const updated = await apiPut(`/api/projects/${id}`, updates);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    return updated;
  }, []);

  const deleteProject = useCallback(async (id) => {
    await apiDelete(`/api/projects/${id}`);
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const addLeadsToProject = useCallback(async (projectId, leadIds) => {
    const result = await apiPost(`/api/projects/${projectId}/leads`, { leadIds });
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, lead_count: result.leadCount } : p
    ));
    return result;
  }, []);

  const removeLeadsFromProject = useCallback(async (projectId, leadIds) => {
    const result = await apiDelete(`/api/projects/${projectId}/leads`, { leadIds });
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, lead_count: result.leadCount } : p
    ));
    return result;
  }, []);

  const getProjectDetail = useCallback(async (id) => {
    return apiGet(`/api/projects/${id}`);
  }, []);

  return {
    projects, loading,
    fetchProjects, createProject, updateProject, deleteProject,
    addLeadsToProject, removeLeadsFromProject, getProjectDetail,
  };
}

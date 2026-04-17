import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiDelete } from '../utils/api';

// Extend api.js with PUT support
async function apiPut(path, body) {
  const opts = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const error = new Error(err.error || res.statusText);
    error.response = err;
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export function useAdmin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiGet('/api/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    }
  }, []);

  const fetchUsers = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (params.status) qs.set('status', params.status);
      if (params.tier) qs.set('tier', params.tier);
      if (params.search) qs.set('search', params.search);
      if (params.sort) qs.set('sort', params.sort);
      if (params.order) qs.set('order', params.order);
      const data = await apiGet(`/api/admin/users?${qs.toString()}`);
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserDetail = useCallback(async (id) => {
    try {
      const data = await apiGet(`/api/admin/users/${id}`);
      setSelectedUser(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch user detail:', err);
    }
  }, []);

  const updateUser = useCallback(async (id, updates) => {
    try {
      await apiPut(`/api/admin/users/${id}`, updates);
      await fetchUserDetail(id);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  }, [fetchUserDetail, fetchUsers]);

  const createUser = useCallback(async (userData) => {
    try {
      const result = await apiPost('/api/admin/users', userData);
      await fetchUsers();
      return result;
    } catch (err) {
      console.error('Failed to create user:', err);
      throw err;
    }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (id) => {
    try {
      await apiDelete(`/api/admin/users/${id}`);
      setSelectedUser(null);
      await fetchUsers();
      await fetchStats();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  }, [fetchUsers, fetchStats]);

  const addNote = useCallback(async (userId, note) => {
    try {
      const notes = await apiPost(`/api/admin/users/${userId}/notes`, { note });
      setSelectedUser(prev => prev ? { ...prev, notes } : prev);
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  }, []);

  const deleteNote = useCallback(async (userId, noteId) => {
    try {
      await apiDelete(`/api/admin/users/${userId}/notes/${noteId}`);
      await fetchUserDetail(userId);
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  }, [fetchUserDetail]);

  return {
    stats, users, selectedUser, loading,
    fetchStats, fetchUsers, fetchUserDetail,
    updateUser, createUser, deleteUser,
    addNote, deleteNote, setSelectedUser,
  };
}

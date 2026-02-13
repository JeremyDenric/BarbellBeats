/**
 * useWorkoutTemplates Hook
 * React hook for managing workout templates with CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import devLog from '../utils/devLog';
import {
  UserWorkoutTemplate,
  WorkoutExerciseConfig,
  WorkoutCategory,
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  incrementTimesUsed,
} from '../services/workoutTemplateStorage';

interface UseWorkoutTemplatesReturn {
  templates: UserWorkoutTemplate[];
  loading: boolean;
  error: string | null;
  refreshTemplates: () => Promise<void>;
  getTemplateById: (id: string) => Promise<UserWorkoutTemplate | null>;
  createNewTemplate: (data: CreateTemplateData) => Promise<UserWorkoutTemplate | null>;
  updateExistingTemplate: (id: string, data: UpdateTemplateData) => Promise<UserWorkoutTemplate | null>;
  removeTemplate: (id: string) => Promise<boolean>;
  duplicateExistingTemplate: (id: string, newName?: string) => Promise<UserWorkoutTemplate | null>;
  markTemplateUsed: (id: string) => Promise<void>;
}

interface CreateTemplateData {
  name: string;
  description?: string;
  category: WorkoutCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: WorkoutExerciseConfig[];
}

interface UpdateTemplateData {
  name?: string;
  description?: string;
  category?: WorkoutCategory;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  exercises?: WorkoutExerciseConfig[];
}

export function useWorkoutTemplates(): UseWorkoutTemplatesReturn {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<UserWorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTemplates = useCallback(async () => {
    if (!user?.id) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userTemplates = await getTemplates(user.id);
      // Sort by most recently updated
      userTemplates.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setTemplates(userTemplates);
    } catch (err) {
      setError('Failed to load workout templates');
      devLog.warn('useWorkoutTemplates error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load templates on mount and when user changes
  useEffect(() => {
    refreshTemplates();
  }, [refreshTemplates]);

  const getTemplateById = useCallback(async (id: string): Promise<UserWorkoutTemplate | null> => {
    try {
      return await getTemplate(id);
    } catch (err) {
      devLog.warn('Failed to get template:', err);
      return null;
    }
  }, []);

  const createNewTemplate = useCallback(async (data: CreateTemplateData): Promise<UserWorkoutTemplate | null> => {
    if (!user?.id) return null;

    try {
      const newTemplate = await createTemplate(user.id, data);
      setTemplates(prev => [newTemplate, ...prev]);
      return newTemplate;
    } catch (err) {
      setError('Failed to create workout template');
      devLog.warn('Failed to create template:', err);
      return null;
    }
  }, [user?.id]);

  const updateExistingTemplate = useCallback(async (
    id: string,
    data: UpdateTemplateData
  ): Promise<UserWorkoutTemplate | null> => {
    try {
      const updated = await updateTemplate(id, data);
      if (updated) {
        setTemplates(prev =>
          prev.map(t => (t.id === id ? updated : t))
        );
      }
      return updated;
    } catch (err) {
      setError('Failed to update workout template');
      devLog.warn('Failed to update template:', err);
      return null;
    }
  }, []);

  const removeTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await deleteTemplate(id);
      if (success) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      }
      return success;
    } catch (err) {
      setError('Failed to delete workout template');
      devLog.warn('Failed to delete template:', err);
      return false;
    }
  }, []);

  const duplicateExistingTemplate = useCallback(async (
    id: string,
    newName?: string
  ): Promise<UserWorkoutTemplate | null> => {
    try {
      const duplicated = await duplicateTemplate(id, newName);
      if (duplicated) {
        setTemplates(prev => [duplicated, ...prev]);
      }
      return duplicated;
    } catch (err) {
      setError('Failed to duplicate workout template');
      devLog.warn('Failed to duplicate template:', err);
      return null;
    }
  }, []);

  const markTemplateUsed = useCallback(async (id: string): Promise<void> => {
    try {
      await incrementTimesUsed(id);
      await refreshTemplates();
    } catch (err) {
      devLog.warn('Failed to mark template as used:', err);
    }
  }, [refreshTemplates]);

  return {
    templates,
    loading,
    error,
    refreshTemplates,
    getTemplateById,
    createNewTemplate,
    updateExistingTemplate,
    removeTemplate,
    duplicateExistingTemplate,
    markTemplateUsed,
  };
}

export default useWorkoutTemplates;

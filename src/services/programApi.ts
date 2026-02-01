/**
 * Program API Service
 * Handles workout program-related API calls
 */

import { apiClient } from '../api/api-client';

export interface Program {
  id: string;
  name: string;
  description?: string;
  duration?: number;
  difficulty?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramRequest {
  name: string;
  description?: string;
  duration?: number;
  difficulty?: string;
}

/**
 * Fetch all programs from the API
 */
export async function listPrograms(): Promise<Program[]> {
  const response = await apiClient.listExamples({ limit: 100 });
  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch programs');
  }
  return (response.data || []) as Program[];
}

/**
 * Create a new program
 */
export async function createProgram(data: CreateProgramRequest): Promise<Program> {
  const response = await apiClient.createExample({
    name: data.name,
    description: data.description,
  });
  if (!response.success) {
    throw new Error(response.message || 'Failed to create program');
  }
  return response.data as Program;
}

/**
 * Update an existing program
 */
export async function updateProgram(
  id: string,
  data: Partial<CreateProgramRequest>
): Promise<Program> {
  const response = await apiClient.updateExample(id, {
    name: data.name,
    description: data.description,
  });
  if (!response.success) {
    throw new Error(response.message || 'Failed to update program');
  }
  return response.data as Program;
}

/**
 * Delete a program
 */
export async function deleteProgram(id: string): Promise<void> {
  const response = await apiClient.deleteExample(id);
  if (!response.success) {
    throw new Error(response.message || 'Failed to delete program');
  }
}

/**
 * Get a specific program by ID
 */
export async function getProgram(id: string): Promise<Program> {
  const response = await apiClient.getExampleById(id);
  if (!response.success) {
    throw new Error(response.message || 'Failed to fetch program');
  }
  return response.data as Program;
}

/**
 * Start a program
 */
export async function startProgram(programId: string): Promise<Program> {
  // For now, just return the program
  return getProgram(programId);
}

/**
 * Update program progress
 */
export async function updateProgramProgress(
  programId: string,
  progress: { currentSession?: number; completedSessions?: number[] }
): Promise<Program> {
  // For now, just return the program
  return getProgram(programId);
}

// Alias for backward compatibility
export const fetchPrograms = listPrograms;

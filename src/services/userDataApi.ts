import {
  apiClient,
  type PrRecord,
  type Setlist,
  type FavoriteTrack,
} from "../api/api-client";

export async function listSetlists(userId: string) {
  const response = await apiClient.listSetlists(userId);
  if (!response.success) {
    throw new Error(response.message || "Failed to load setlists");
  }
  return response.data as Setlist[];
}

export async function createSetlist(
  userId: string,
  data: { name: string; tracks: Array<{ title: string; artist: string; uri: string }> }
) {
  const response = await apiClient.createSetlist(userId, data);
  if (!response.success) {
    throw new Error(response.message || "Failed to create setlist");
  }
  return response.data as Setlist;
}

export async function addTrackToSetlist(
  userId: string,
  setlistId: string,
  data: { title: string; artist: string; uri: string }
) {
  const response = await apiClient.addTrackToSetlist(userId, setlistId, data);
  if (!response.success) {
    throw new Error(response.message || "Failed to add track to setlist");
  }
  return response.data as Setlist;
}

export async function listPrs(userId: string) {
  const response = await apiClient.listPrs(userId);
  if (!response.success) {
    throw new Error(response.message || "Failed to load PRs");
  }
  return response.data as PrRecord[];
}

export async function createPr(
  userId: string,
  data: { exercise: string; weight: number; reps: number; source: "manual" | "apple-health" }
) {
  const response = await apiClient.createPr(userId, data);
  if (!response.success) {
    throw new Error(response.message || "Failed to create PR");
  }
  return response.data as PrRecord;
}

export async function deletePr(userId: string, prId: string) {
  const response = await apiClient.deletePr(userId, prId);
  if (!response.success) {
    throw new Error(response.message || 'Failed to delete PR');
  }
}

export async function deleteSetlist(userId: string, setlistId: string) {
  const response = await apiClient.deleteSetlist(userId, setlistId);
  if (!response.success) {
    throw new Error(response.message || 'Failed to delete setlist');
  }
}

export async function listFavorites(userId: string) {
  const response = await apiClient.listFavorites(userId);
  if (!response.success) {
    throw new Error(response.message || "Failed to load favorites");
  }
  return response.data as FavoriteTrack[];
}

export async function addFavorite(
  userId: string,
  data: { title: string; artist: string; uri: string }
) {
  const response = await apiClient.addFavorite(userId, data);
  if (!response.success) {
    throw new Error(response.message || "Failed to save favorite");
  }
  return response.data as FavoriteTrack;
}

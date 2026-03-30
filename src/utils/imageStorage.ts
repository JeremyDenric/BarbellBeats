import * as FileSystem from 'expo-file-system';

/**
 * Resolve a stored photo filename back to a full URI.
 * Full paths are NOT stored in AsyncStorage to prevent breakage when the app's
 * document directory path changes after updates (the UUID segment changes on iOS).
 */
export function resolvePhotoUri(filename: string): string {
  return `${FileSystem.documentDirectory}${filename}`;
}

/**
 * Copy a temporary URI (from expo-image-picker) to the app's documents directory.
 * Returns only the filename — callers must use resolvePhotoUri() to get the full path.
 */
export async function copyToDocuments(tempUri: string): Promise<string> {
  const filename = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
  const destUri = resolvePhotoUri(filename);
  await FileSystem.copyAsync({ from: tempUri, to: destUri });
  return filename;
}

/**
 * Delete an array of stored photo filenames from the documents directory.
 * Silently ignores errors (file already gone, etc).
 */
export async function deleteEntryPhotos(filenames: string[]): Promise<void> {
  await Promise.all(
    filenames.map((filename) =>
      FileSystem.deleteAsync(resolvePhotoUri(filename), { idempotent: true }).catch(() => {})
    )
  );
}

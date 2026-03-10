import * as FileSystem from 'expo-file-system';

/**
 * Copy a temporary URI (from expo-image-picker) to the app's documents directory,
 * returning a permanent URI that survives app restarts.
 */
export async function copyToDocuments(tempUri: string): Promise<string> {
  const filename = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
  const destUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.copyAsync({ from: tempUri, to: destUri });
  return destUri;
}

/**
 * Delete an array of permanent photo URIs from the documents directory.
 * Silently ignores errors (file already gone, etc).
 */
export async function deleteEntryPhotos(uris: string[]): Promise<void> {
  await Promise.all(
    uris.map((uri) =>
      FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {})
    )
  );
}

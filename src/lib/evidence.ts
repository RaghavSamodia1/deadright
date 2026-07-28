import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

export interface PickedPhoto {
  uri: string;
  width: number;
  height: number;
  /** bytes, when the picker reports it */
  fileSize?: number;
  mimeType?: string;
}

/**
 * Camera + library capture for bet evidence.
 *
 * Permission handling is deliberate: iOS only shows the system prompt once, so
 * on a hard denial we send the user to Settings rather than silently failing.
 */
export async function takePhoto(): Promise<PickedPhoto | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    promptForSettings('Camera access', 'DeadRight needs the camera to snap evidence.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.7, // evidence, not art — keeps uploads small
    exif: false,  // strip location metadata before it leaves the device
  });
  return firstAsset(result);
}

export async function pickFromLibrary(): Promise<PickedPhoto | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    promptForSettings('Photo access', 'DeadRight needs your photos to attach evidence.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    exif: false,
  });
  return firstAsset(result);
}

function firstAsset(result: ImagePicker.ImagePickerResult): PickedPhoto | null {
  if (result.canceled || !result.assets?.length) return null;
  const a = result.assets[0];
  return {
    uri: a.uri,
    width: a.width,
    height: a.height,
    fileSize: a.fileSize,
    mimeType: a.mimeType,
  };
}

function promptForSettings(title: string, body: string) {
  Alert.alert(title, body, [
    { text: 'Not now', style: 'cancel' },
    { text: 'Open Settings', onPress: () => Linking.openSettings() },
  ]);
}

/** Human-readable size for the uploaded-file row. */
export function formatSize(bytes?: number): string {
  if (!bytes) return 'just now';
  const mb = bytes / 1_048_576;
  return mb >= 1
    ? `${mb.toFixed(1)} MB · just now`
    : `${Math.round(bytes / 1024)} KB · just now`;
}

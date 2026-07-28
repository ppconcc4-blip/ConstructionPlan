import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App and Auth
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');

// Cache the access token in memory
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // If we don't have a token, we ask user to click Sign In or try to fetch
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup to obtain Access Token
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('ไม่ได้รับ Access Token จาก Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Google Sign-in Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign out
export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Target Folder ID specified by the user
export const TARGET_FOLDER_ID = '1yw6QNPcHAUNbaXcdmQRCPg891G3OoTpN';

// Search for the backup file in the Google Drive folder
export async function findBackupFile(accessToken: string, fileName: string = 'construction_projects_backup.json'): Promise<string | null> {
  const query = `name = '${fileName}' and '${TARGET_FOLDER_ID}' in parents and trashed = false`;
  try {
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      // If folder doesn't exist or is inaccessible, fall back to searching everywhere or root
      console.warn('Cannot access target folder, searching everywhere instead.');
      const fallbackQuery = `name = '${fileName}' and trashed = false`;
      const fallbackUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(fallbackQuery)}&fields=files(id,name)`;
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        if (data.files && data.files.length > 0) {
          return data.files[0].id;
        }
      }
      return null;
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (e) {
    console.error('Error finding backup file in Google Drive:', e);
    return null;
  }
}

// Upload project data JSON to Google Drive
export async function uploadBackupToDrive(
  accessToken: string,
  projectsData: any,
  fileName: string = 'construction_projects_backup.json'
): Promise<{ success: boolean; fileId?: string; error?: string }> {
  try {
    // 1. Check if the file already exists
    const existingFileId = await findBackupFile(accessToken, fileName);

    if (existingFileId) {
      // 2. Update existing file content (PATCH upload)
      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
      const response = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectsData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update backup file content: ${response.statusText}`);
      }

      return { success: true, fileId: existingFileId };
    } else {
      // 3. Create new file with metadata (including target folder as parent)
      const createMetadataUrl = `https://www.googleapis.com/drive/v3/files`;
      
      // Try creating inside target folder first
      let createResponse = await fetch(createMetadataUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fileName,
          mimeType: 'application/json',
          parents: [TARGET_FOLDER_ID],
        }),
      });

      // If the target folder is inaccessible, try creating in the user's root Drive
      if (!createResponse.ok) {
        console.warn('Target folder inaccessible, creating backup file in Google Drive root instead.');
        createResponse = await fetch(createMetadataUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: fileName,
            mimeType: 'application/json',
          }),
        });
      }

      if (!createResponse.ok) {
        throw new Error(`Failed to create backup file metadata: ${createResponse.statusText}`);
      }

      const fileMetadata = await createResponse.json();
      const newFileId = fileMetadata.id;

      // 4. Upload actual content to the new file ID
      const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${newFileId}?uploadType=media`;
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectsData),
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload content to new backup file: ${uploadResponse.statusText}`);
      }

      return { success: true, fileId: newFileId };
    }
  } catch (err: any) {
    console.error('Error uploading backup to Google Drive:', err);
    return { success: false, error: err.message || String(err) };
  }
}

// Download/Load project data JSON from Google Drive
export async function downloadBackupFromDrive(
  accessToken: string,
  fileName: string = 'construction_projects_backup.json'
): Promise<{ success: boolean; projects?: any[]; error?: string }> {
  try {
    const fileId = await findBackupFile(accessToken, fileName);
    if (!fileId) {
      return { success: false, error: 'ไม่พบไฟล์สำรองข้อมูลบน Google Drive' };
    }

    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const response = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download backup content: ${response.statusText}`);
    }

    const projects = await response.json();
    if (!Array.isArray(projects)) {
      throw new Error('ข้อมูลไฟล์สำรองไม่ได้อยู่ในรูปแบบที่ถูกต้อง (ต้องเป็น Array ของโครงการ)');
    }

    return { success: true, projects };
  } catch (err: any) {
    console.error('Error downloading backup from Google Drive:', err);
    return { success: false, error: err.message || String(err) };
  }
}

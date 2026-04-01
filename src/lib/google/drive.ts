import { google } from "googleapis";
import { getAuthClient } from "./sheets";
import { Readable } from "stream";

export const getDriveClient = () => {
  return google.drive({ version: "v3", auth: getAuthClient() });
};

export const getFileContent = async (fileId: string): Promise<string> => {
  const drive = getDriveClient();
  try {
    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "text" }
    );
    return typeof res.data === "string" ? res.data : JSON.stringify(res.data);
  } catch (error: any) {
    console.error("Error fetching drive file content details:", error.message || error);
    throw error;
  }
};

export const getFileBuffer = async (fileId: string): Promise<ArrayBuffer> => {
  const drive = getDriveClient();
  try {
    const res = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" }
    );
    return res.data as ArrayBuffer;
  } catch (error: any) {
    console.error("Error fetching drive file binary buffer:", error.message || error);
    throw error;
  }
};

export const updateFileContent = async (fileId: string, content: string): Promise<boolean> => {
  const drive = getDriveClient();
  try {
    await drive.files.update({
      fileId,
      media: {
        mimeType: "text/html",
        body: content,
      },
    });
    return true;
  } catch (error) {
    console.error("Error updating drive file content:", error);
    return false;
  }
};

export const uploadFile = async (
  filename: string,
  mimetype: string,
  buffer: Buffer,
  folderId?: string
): Promise<{ id: string; url: string }> => {
  const drive = getDriveClient();
  
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  
  const requestBody: any = {
    name: filename,
  };
  
  if (folderId) {
    requestBody.parents = [folderId];
  }

  try {
    const file = await drive.files.create({
      requestBody,
      media: {
        mimeType: mimetype,
        body: stream,
      },
      fields: "id, webViewLink, webContentLink",
    });
    
    // Set permission to anyone with link if it's media (images/videos/fonts)
    if (file.data.id && (mimetype.startsWith('image/') || mimetype.startsWith('video/') || mimetype.startsWith('font/') || mimetype.includes('ttf') || mimetype.includes('otf') || mimetype.includes('woff'))) {
      try {
        await drive.permissions.create({
          fileId: file.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });
      } catch (permError) {
        console.warn("Could not set public permission on file automatically", permError);
      }
    }

    return {
      id: file.data.id || "",
      url: file.data.webViewLink || file.data.webContentLink || "",
    };
  } catch (error) {
    console.error("Error uploading file to drive:", error);
    throw error;
  }
};

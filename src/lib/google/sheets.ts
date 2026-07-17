import { google } from "googleapis";
import { Project } from "@/types/project";
import { User, Role } from "@/types/user";
import { v4 as uuidv4 } from "uuid";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive"
];

export const getAuthClient = () => {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY;

  if (key && key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  key = key?.replace(/\\n/g, '\n');

  if (!email || !key) {
    throw new Error("Missing Google API credentials. Check GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY.");
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: SCOPES,
  });
};

export const getSheetsClient = () => {
  return google.sheets({ version: "v4", auth: getAuthClient() });
};

const getSheetId = () => process.env.GOOGLE_SHEET_ID;

// Helper to get the first sheet's name dynamically (e.g. "Sheet1" or "แผ่นที่ 1")
const getFirstSheetName = async (sheets: any, spreadsheetId: string) => {
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    includeGridData: false,
  });
  return response.data.sheets[0].properties.title;
};

export const getAllProjects = async (): Promise<Project[]> => {
  const spreadsheetId = getSheetId();
  if (!spreadsheetId) {
    console.warn("GOOGLE_SHEET_ID is missing.");
    return [];
  }

  const sheets = getSheetsClient();
  try {
    const sheetName = await getFirstSheetName(sheets, spreadsheetId);
    const range = `${sheetName}!A2:R`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    return rows.map((row) => ({
      id: row[0] || "",
      title: row[1] || "",
      image_url: row[2] || "",
      VDO_url: row[3] || "",
      thumbnail_url: row[4] || "",
      html_drive_id: row[5] || "",
      last_updated: row[6] || "",
      status: (row[7] as 'published' | 'draft' | 'pending') || "draft",
      manual_text: row[8] || "",
      manual_image_url: row[9] || "",
      manual_url: row[10] || "",
      learning_text: row[11] || "",
      learning_image_url: row[12] || "",
      learning_url: row[13] || "",
      other_text: row[14] || "",
      other_image_url: row[15] || "",
      other_url: row[16] || "",
      download_count: parseInt(row[17] || "0", 10) || 0,
    }));
  } catch (error: any) {
    console.error("Error fetching projects from sheets:", error?.message);
    throw error;
  }
};

export const getPublishedProjects = async (): Promise<Project[]> => {
  try {
    const projects = await getAllProjects();
    return projects.filter((p) => p.status === "published");
  } catch (error) {
    return [];
  }
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  try {
    const projects = await getAllProjects();
    return projects.find((p) => p.id === id) || null;
  } catch {
    return null;
  }
};

export const addProject = async (projectData: Partial<Project>, userRole?: string): Promise<Project> => {
  const spreadsheetId = getSheetId();
  const sheets = getSheetsClient();
  
  const sheetName = await getFirstSheetName(sheets, spreadsheetId!);
  
  // Rule: adminuser always creates pending
  const status = userRole === 'adminuser' ? 'pending' : (projectData.status || "draft");

  const newProject: Project = {
    id: projectData.id || uuidv4(),
    title: projectData.title || "New Project",
    image_url: projectData.image_url || "",
    VDO_url: projectData.VDO_url || "",
    thumbnail_url: projectData.thumbnail_url || "",
    html_drive_id: projectData.html_drive_id || "",
    last_updated: new Date().toISOString(),
    status: status as any,
    manual_text: projectData.manual_text || "",
    manual_image_url: projectData.manual_image_url || "",
    manual_url: projectData.manual_url || "",
    learning_text: projectData.learning_text || "",
    learning_image_url: projectData.learning_image_url || "",
    learning_url: projectData.learning_url || "",
    other_text: projectData.other_text || "",
    other_image_url: projectData.other_image_url || "",
    other_url: projectData.other_url || "",
    download_count: 0,
  };

  const values = [
    [
      newProject.id,
      newProject.title,
      newProject.image_url,
      newProject.VDO_url,
      newProject.thumbnail_url,
      newProject.html_drive_id,
      newProject.last_updated,
      newProject.status,
      newProject.manual_text,
      newProject.manual_image_url,
      newProject.manual_url,
      newProject.learning_text,
      newProject.learning_image_url,
      newProject.learning_url,
      newProject.other_text,
      newProject.other_image_url,
      newProject.other_url,
      newProject.download_count
    ]
  ];

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    includeGridData: false
  });
  const sheetId = response.data.sheets?.[0]?.properties?.sheetId;

  if (sheetId !== undefined) {
    // Insert a new row at row index 1 (second row, right after headers)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: 1,
                endIndex: 2
              },
              inheritFromBefore: false
            }
          }
        ]
      }
    });

    // Update the newly inserted row at A2:R2
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A2:R2`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
  } else {
    // Fallback: append if sheetId is somehow not found
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:A`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
  }

  return newProject;
};

export const updateProject = async (id: string, updateData: Partial<Project>, userRole?: string): Promise<boolean> => {
  const spreadsheetId = getSheetId();
  const sheets = getSheetsClient();
  
  const sheetName = await getFirstSheetName(sheets, spreadsheetId!);
  const range = `${sheetName}!A2:R`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  
  const rows = response.data.values || [];
  const rowIndex = rows.findIndex(row => row[0] === id);
  
  if (rowIndex === -1) return false;
  
  // Real row in sheet is rowIndex + 2 (since it's 0-indexed and we skip header)
  const sheetRow = rowIndex + 2;
  const existingRow = rows[rowIndex];
  
  // Logic: if adminuser updates, reset to pending
  let status = updateData.status !== undefined ? updateData.status : existingRow[7];
  if (userRole === 'adminuser') {
    status = 'pending';
  }

  const updatedValues = [
    id,
    updateData.title !== undefined ? updateData.title : existingRow[1],
    updateData.image_url !== undefined ? updateData.image_url : existingRow[2],
    updateData.VDO_url !== undefined ? updateData.VDO_url : existingRow[3],
    updateData.thumbnail_url !== undefined ? updateData.thumbnail_url : existingRow[4],
    updateData.html_drive_id !== undefined ? updateData.html_drive_id : existingRow[5],
    updateData.last_updated !== undefined ? updateData.last_updated : new Date().toISOString(),
    status,
    updateData.manual_text !== undefined ? updateData.manual_text : (existingRow[8] || ""),
    updateData.manual_image_url !== undefined ? updateData.manual_image_url : (existingRow[9] || ""),
    updateData.manual_url !== undefined ? updateData.manual_url : (existingRow[10] || ""),
    updateData.learning_text !== undefined ? updateData.learning_text : (existingRow[11] || ""),
    updateData.learning_image_url !== undefined ? updateData.learning_image_url : (existingRow[12] || ""),
    updateData.learning_url !== undefined ? updateData.learning_url : (existingRow[13] || ""),
    updateData.other_text !== undefined ? updateData.other_text : (existingRow[14] || ""),
    updateData.other_image_url !== undefined ? updateData.other_image_url : (existingRow[15] || ""),
    updateData.other_url !== undefined ? updateData.other_url : (existingRow[16] || ""),
    updateData.download_count !== undefined ? updateData.download_count : parseInt(existingRow[17] || "0", 10),
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${sheetRow}:R${sheetRow}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [updatedValues] },
  });

  return true;
};

export const deleteProject = async (id: string): Promise<boolean> => {
  const spreadsheetId = getSheetId();
  const sheets = getSheetsClient();
  
  const sheetName = await getFirstSheetName(sheets, spreadsheetId!);
  
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    includeGridData: false
  });
  
  const sheetId = response.data.sheets?.[0]?.properties?.sheetId;
  
  const valuesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:R`,
  });
  
  const rows = valuesResponse.data.values || [];
  const rowIndex = rows.findIndex(row => row[0] === id);
  
  if (rowIndex === -1 || sheetId === undefined) return false;
  
  const sheetRow = rowIndex + 1; // 0-indexed but we have header row
  
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: "ROWS",
              startIndex: sheetRow,
              endIndex: sheetRow + 1
            }
          }
        }
      ]
    }
  });

  return true;
};

export const reorderProject = async (id: string, direction: "up" | "down"): Promise<boolean> => {
  const spreadsheetId = getSheetId();
  const sheets = getSheetsClient();
  
  const sheetName = await getFirstSheetName(sheets, spreadsheetId!);
  
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    includeGridData: false
  });
  
  const sheetId = response.data.sheets?.[0]?.properties?.sheetId;
  
  const valuesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A2:R`,
  });
  
  const rows = valuesResponse.data.values || [];
  const rowIndex = rows.findIndex(row => row[0] === id);
  
  if (rowIndex === -1 || sheetId === undefined) return false;
  
  const sheetRow = rowIndex + 1; // 0-indexed sheet row index (skipping header)
  
  if (direction === "up") {
    if (rowIndex === 0) return false; // Already at the top
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            moveDimension: {
              source: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: sheetRow,
                endIndex: sheetRow + 1
              },
              destinationIndex: sheetRow - 1
            }
          }
        ]
      }
    });
  } else if (direction === "down") {
    if (rowIndex === rows.length - 1) return false; // Already at the bottom
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            moveDimension: {
              source: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: sheetRow,
                endIndex: sheetRow + 1
              },
              destinationIndex: sheetRow + 2
            }
          }
        ]
      }
    });
  }
  
  return true;
};


// Helper to ensure 'HTML_Code' sheet exists
const HTML_SHEET_NAME = "HTML_Code";

const ensureHtmlSheetExists = async (sheets: any, spreadsheetId: string) => {
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    includeGridData: false,
  });
  
  const existingSheets = response.data.sheets || [];
  const exists = existingSheets.some((s: any) => s.properties.title === HTML_SHEET_NAME);
  
  if (!exists) {
    // Create the HTML_Code sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: HTML_SHEET_NAME,
              }
            }
          }
        ]
      }
    });

    // Add headers to the new sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${HTML_SHEET_NAME}!A1:C1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["project_id", "html_content", "last_updated"]] },
    });
  }
  return HTML_SHEET_NAME;
};

export const getHtmlContentById = async (projectId: string): Promise<string | null> => {
  const spreadsheetId = getSheetId();
  if (!spreadsheetId) return null;

  const sheets = getSheetsClient();
  try {
    const sheetName = await ensureHtmlSheetExists(sheets, spreadsheetId);
    const range = `${sheetName}!A2:B`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    const row = rows.find(r => r[0] === projectId);
    
    if (row && row[1]) {
      return row[1];
    }
    return null;
  } catch (error: any) {
    console.error("Error fetching HTML from sheet:", error?.message);
    return null;
  }
};

export const updateHtmlContent = async (projectId: string, content: string, userRole?: string): Promise<boolean> => {
  const spreadsheetId = getSheetId();
  if (!spreadsheetId) return false;

  const sheets = getSheetsClient();
  try {
    const sheetName = await ensureHtmlSheetExists(sheets, spreadsheetId);
    const range = `${sheetName}!A2:C`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === projectId);
    const timestamp = new Date().toISOString();

    // If adminuser, also update the main project status to pending
    if (userRole === 'adminuser') {
      await updateProject(projectId, { status: 'pending' }, userRole);
    }
    
    if (rowIndex === -1) {
      // Append new row
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:A`,
        valueInputOption: "RAW",
        requestBody: { values: [[projectId, content, timestamp]] },
      });
    } else {
      // Update existing row
      const sheetRow = rowIndex + 2; // 0-indexed + 1 for header offset + 1 because rows array is from A2
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${sheetRow}:C${sheetRow}`,
        valueInputOption: "RAW",
        requestBody: { values: [[projectId, content, timestamp]] },
      });
    }

    return true;
  } catch (error: any) {
    console.error("Error saving HTML to sheet:", error?.message);
    return false;
  }
};

// --- Users Management ---

const USERS_SHEET_NAME = "Users";

const ensureUsersSheetExists = async (sheets: any, spreadsheetId: string) => {
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    includeGridData: false,
  });
  
  const existingSheets = response.data.sheets || [];
  const exists = existingSheets.some((s: any) => s.properties.title === USERS_SHEET_NAME);
  
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: USERS_SHEET_NAME,
              }
            }
          }
        ]
      }
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${USERS_SHEET_NAME}!A1:C1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["username", "password", "role"]] },
    });

    // Seed initial admin user based on environment variables if present
    const seedAdmin = process.env.ADMIN_USERNAME || "admin";
    const seedPassPlain = process.env.ADMIN_PASSWORD || "123456";
    // Hash the seed password to avoid storing plain text
    const { hashPassword } = await import("../password");
    const seedPassHashed = await hashPassword(seedPassPlain);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${USERS_SHEET_NAME}!A:A`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[seedAdmin, seedPassHashed, "admin"]] },
    });
  }
  return USERS_SHEET_NAME;
};

export const getAllUsers = async (): Promise<User[]> => {
  const spreadsheetId = getSheetId();
  if (!spreadsheetId) return [];

  const sheets = getSheetsClient();
  try {
    const sheetName = await ensureUsersSheetExists(sheets, spreadsheetId);
    const range = `${sheetName}!A2:C`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    return rows.map((row) => ({
      id: row[0] || "",
      username: row[0] || "",
      password: row[1] || "",
      role: (row[2] as Role) || "adminuser"
    }));
  } catch (error: any) {
    console.error("Error fetching users from sheet:", error?.message);
    return [];
  }
};

export const addUser = async (userData: User): Promise<boolean> => {
  const spreadsheetId = getSheetId();
  const sheets = getSheetsClient();
  try {
    const sheetName = await ensureUsersSheetExists(sheets, spreadsheetId!);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:A`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[userData.username, userData.password, userData.role]] },
    });
    return true;
  } catch {
    return false;
  }
};

export const deleteUser = async (username: string): Promise<boolean> => {
   const spreadsheetId = getSheetId();
   const sheets = getSheetsClient();
   
   try {
     const sheetName = await ensureUsersSheetExists(sheets, spreadsheetId!);
     const response = await sheets.spreadsheets.get({
       spreadsheetId, includeGridData: false
     });
     
     const sheetList = response.data.sheets || [];
     const sheetInfo = sheetList.find((s: any) => s.properties.title === sheetName);
     if (!sheetInfo) return false;
     
     const sheetId = sheetInfo?.properties?.sheetId;
     
     const valuesResponse = await sheets.spreadsheets.values.get({
       spreadsheetId, range: `${sheetName}!A2:C`,
     });
     
     const rows = valuesResponse.data.values || [];
     const rowIndex = rows.findIndex(row => row[0] === username);
     
     if (rowIndex === -1 || sheetId === undefined) return false;
     
     const sheetRow = rowIndex + 1; // skip header
     
     await sheets.spreadsheets.batchUpdate({
       spreadsheetId,
       requestBody: {
         requests: [
           {
             deleteDimension: {
               range: {
                 sheetId,
                 dimension: "ROWS",
                 startIndex: sheetRow,
                 endIndex: sheetRow + 1
               }
             }
           }
         ]
       }
     });
     return true;
   } catch {
     return false;
   }
};

export const updateUser = async (oldUsername: string, newData: { username: string, password?: string, role: Role }): Promise<boolean> => {
  const spreadsheetId = getSheetId();
  const sheets = getSheetsClient();
  try {
    const sheetName = await ensureUsersSheetExists(sheets, spreadsheetId!);
    const valuesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId, range: `${sheetName}!A2:C`,
    });
    const rows = valuesResponse.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === oldUsername);
    if (rowIndex === -1) return false;

    const sheetRow = rowIndex + 2; 
    const pass = newData.password !== undefined && newData.password !== "" ? newData.password : rows[rowIndex][1];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${sheetRow}:C${sheetRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[newData.username, pass, newData.role]] },
    });
    return true;
  } catch {
    return false;
  }
};

export const updateUserRole = async (username: string, newRole: Role, newPassword?: string): Promise<boolean> => {
  return updateUser(username, { username, role: newRole, password: newPassword });
};

export const incrementProjectDownloads = async (id: string): Promise<number> => {
  const spreadsheetId = getSheetId();
  if (!spreadsheetId) return 0;

  const sheets = getSheetsClient();
  try {
    const sheetName = await getFirstSheetName(sheets, spreadsheetId);
    const range = `${sheetName}!A2:R`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);
    if (rowIndex === -1) return 0;

    const sheetRow = rowIndex + 2;
    const currentDownloads = parseInt(rows[rowIndex][17] || "0", 10);
    const nextDownloads = currentDownloads + 1;

    // Update only the R column cell for that row (R is the 18th column)
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!R${sheetRow}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[String(nextDownloads)]] },
    });

    return nextDownloads;
  } catch (error) {
    console.error("Failed to increment project downloads:", error);
    return 0;
  }
};

export interface DownloadEvent {
  id: string;
  project_id: string;
  project_title: string;
  timestamp: string;
  ip_address: string;
}

const DOWNLOADS_SHEET_NAME = "Downloads";

const ensureDownloadsSheetExists = async (sheets: any, spreadsheetId: string) => {
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    includeGridData: false,
  });
  
  const existingSheets = response.data.sheets || [];
  const exists = existingSheets.some((s: any) => s.properties.title === DOWNLOADS_SHEET_NAME);
  
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: DOWNLOADS_SHEET_NAME,
              }
            }
          }
        ]
      }
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${DOWNLOADS_SHEET_NAME}!A1:E1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["id", "project_id", "project_title", "timestamp", "ip_address"]] },
    });
  }
  return DOWNLOADS_SHEET_NAME;
};

export const logDownloadEvent = async (projectId: string, ipAddress: string): Promise<void> => {
  const spreadsheetId = getSheetId();
  if (!spreadsheetId) return;

  const sheets = getSheetsClient();
  try {
    const sheetName = await ensureDownloadsSheetExists(sheets, spreadsheetId);
    
    // Fetch project title
    const project = await getProjectById(projectId);
    const title = project ? project.title : "Unknown Project";

    const downloadId = uuidv4();
    const timestamp = new Date().toISOString();

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:A`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[downloadId, projectId, title, timestamp, ipAddress]]
      }
    });
  } catch (error) {
    console.error("Failed to log download event:", error);
  }
};

export const getAllDownloads = async (): Promise<DownloadEvent[]> => {
  const spreadsheetId = getSheetId();
  if (!spreadsheetId) return [];

  const sheets = getSheetsClient();
  try {
    const sheetName = await ensureDownloadsSheetExists(sheets, spreadsheetId);
    const range = `${sheetName}!A2:E`;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    return rows.map((row) => ({
      id: row[0] || "",
      project_id: row[1] || "",
      project_title: row[2] || "",
      timestamp: row[3] || "",
      ip_address: row[4] || ""
    }));
  } catch (error: any) {
    console.error("Error fetching downloads from sheet:", error?.message);
    return [];
  }
};



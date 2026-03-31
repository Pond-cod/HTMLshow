import { google } from "googleapis";
import { Project } from "@/types/project";
import { v4 as uuidv4 } from "uuid";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive"
];

export const getAuthClient = () => {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

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
    const range = `${sheetName}!A2:H`;

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
      status: (row[7] as 'published' | 'draft') || "draft",
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

export const addProject = async (projectData: Partial<Project>): Promise<Project> => {
  const spreadsheetId = getSheetId();
  const sheets = getSheetsClient();
  
  const sheetName = await getFirstSheetName(sheets, spreadsheetId!);
  
  const newProject: Project = {
    id: projectData.id || uuidv4(),
    title: projectData.title || "New Project",
    image_url: projectData.image_url || "",
    VDO_url: projectData.VDO_url || "",
    thumbnail_url: projectData.thumbnail_url || "",
    html_drive_id: projectData.html_drive_id || "",
    last_updated: new Date().toISOString(),
    status: projectData.status || "draft",
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
      newProject.status
    ]
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:H`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });

  return newProject;
};

export const updateProject = async (id: string, updateData: Partial<Project>): Promise<boolean> => {
  const spreadsheetId = getSheetId();
  const sheets = getSheetsClient();
  
  const sheetName = await getFirstSheetName(sheets, spreadsheetId!);
  const range = `${sheetName}!A2:H`;

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
  
  const updatedValues = [
    id,
    updateData.title !== undefined ? updateData.title : existingRow[1],
    updateData.image_url !== undefined ? updateData.image_url : existingRow[2],
    updateData.VDO_url !== undefined ? updateData.VDO_url : existingRow[3],
    updateData.thumbnail_url !== undefined ? updateData.thumbnail_url : existingRow[4],
    updateData.html_drive_id !== undefined ? updateData.html_drive_id : existingRow[5],
    updateData.last_updated !== undefined ? updateData.last_updated : new Date().toISOString(),
    updateData.status !== undefined ? updateData.status : existingRow[7],
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A${sheetRow}:H${sheetRow}`,
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
    range: `${sheetName}!A2:H`,
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

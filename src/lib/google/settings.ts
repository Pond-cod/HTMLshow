import { getAuthClient, getSheetsClient } from "./sheets";

const getSheetId = () => process.env.GOOGLE_SHEET_ID;
const SETTINGS_SHEET_NAME = "Settings";

export interface SiteSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_badge: string;
  facebook_url: string;
  contact_email: string;
  [key: string]: string;
}

const defaultSettings: SiteSettings = {
  hero_title: "Gearing Up <br /> For The Future.",
  hero_subtitle: "ขับเคลื่อนสู่อนาคตผ่านผลงานแห่งนวัตกรรม สำรวจโซลูชัน IoT และระบบอัจฉริยะที่เราได้สร้างสรรค์ เสมือนฟันเฟืองที่ผลักดันทุกความสำเร็จ",
  hero_badge: "Technology Powerhouse",
  facebook_url: "https://facebook.com",
  contact_email: "contact@deedeviot.com"
};

const ensureSettingsSheetExists = async (sheets: any, spreadsheetId: string) => {
  const response = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetExists = response.data.sheets.some((s: any) => s.properties.title === SETTINGS_SHEET_NAME);

  if (!sheetExists) {
    // Create the sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: SETTINGS_SHEET_NAME }
            }
          }
        ]
      }
    });

    // Seed default settings
    const values = Object.entries(defaultSettings).map(([k, v]) => [k, v]);
    // add header
    values.unshift(["Key", "Value"]);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SETTINGS_SHEET_NAME}!A1:B`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values }
    });
  }
};

export const getSiteSettings = async (): Promise<SiteSettings> => {
  const spreadsheetId = getSheetId();
  if (!spreadsheetId) return defaultSettings;

  const sheets = getSheetsClient();
  try {
    await ensureSettingsSheetExists(sheets, spreadsheetId);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SETTINGS_SHEET_NAME}!A2:B`,
    });

    const rows = response.data.values || [];
    const settings: any = { ...defaultSettings };
    
    rows.forEach(row => {
      if (row[0] && row[1] !== undefined) {
        settings[row[0]] = row[1];
      }
    });

    return settings as SiteSettings;
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return defaultSettings;
  }
};

export const updateSiteSettings = async (updates: Partial<SiteSettings>): Promise<boolean> => {
  const spreadsheetId = getSheetId();
  if (!spreadsheetId) return false;

  const sheets = getSheetsClient();
  try {
    await ensureSettingsSheetExists(sheets, spreadsheetId);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SETTINGS_SHEET_NAME}!A2:B`,
    });

    let currentRows = response.data.values || [];
    const settingsMap = new Map<string, string>();
    
    currentRows.forEach(row => {
      if (row[0]) settingsMap.set(row[0], row[1] || "");
    });

    // Merge updates
    Object.entries(updates).forEach(([k, v]) => {
      settingsMap.set(k, v as string);
    });

    const newValues: string[][] = [["Key", "Value"]];
    settingsMap.forEach((v, k) => {
      newValues.push([k, v]);
    });

    // Overwrite the entire range
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SETTINGS_SHEET_NAME}!A1:B`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: newValues }
    });

    return true;
  } catch (error) {
    console.error("Failed to update settings:", error);
    return false;
  }
};

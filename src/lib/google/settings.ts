import { getAuthClient, getSheetsClient } from "./sheets";

const getSheetId = () => process.env.GOOGLE_SHEET_ID;
const SETTINGS_SHEET_NAME = "Settings";

export interface SiteSettings {
  hero_title: string;
  hero_title_size: string;
  hero_title_color: string;
  hero_subtitle: string;
  hero_badge: string;
  facebook_url: string;
  contact_email: string;
  cta_text: string;
  cta_size: string;
  cta_color: string;
  site_font: string;
  custom_font_id: string;
  custom_font_name: string;
  [key: string]: string;
}

const defaultSettings: SiteSettings = {
  hero_title: "Gearing Up <br /> For The Future.",
  hero_title_size: "72",
  hero_title_color: "#ffffff",
  hero_subtitle: "ขับเคลื่อนสู่อนาคตผ่านผลงานแห่งนวัตกรรม สำรวจโซลูชัน IoT และระบบอัจฉริยะที่เราได้สร้างสรรค์ เสมือนฟันเฟืองที่ผลักดันทุกความสำเร็จ",
  hero_badge: "Technology Powerhouse",
  facebook_url: "https://facebook.com",
  contact_email: "contact@deedeviot.com",
  cta_text: "คลิกเลือกดูผลงานผลงานได้เลย",
  cta_size: "18",
  cta_color: "#ef4444",
  site_font: "inter",
  custom_font_id: "",
  custom_font_name: "",
  site_views: "0"
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
      if (row[0]) {
        settings[row[0]] = row[1] || "";
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
      settingsMap.set(k, v !== undefined && v !== null ? String(v) : "");
    });

    const newValues: string[][] = [["Key", "Value"]];
    settingsMap.forEach((v, k) => {
      newValues.push([k, v]);
    });

    // Overwrite the entire range
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SETTINGS_SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: newValues }
    });

    return true;
  } catch (error: any) {
    console.error("Failed to update settings:", error?.message);
    throw new Error(error?.message || "Failed to update settings");
  }
};

export const incrementSiteViews = async (): Promise<string> => {
  const spreadsheetId = getSheetId();
  if (!spreadsheetId) return "0";

  const sheets = getSheetsClient();
  try {
    await ensureSettingsSheetExists(sheets, spreadsheetId);
    
    // Read current settings to parse out the view count and row position
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SETTINGS_SHEET_NAME}!A2:B`,
    });

    const rows = response.data.values || [];
    let rowIndex = -1;
    let currentViews = 0;
    
    rows.forEach((row, index) => {
      if (row[0] === 'site_views') {
        rowIndex = index;
        currentViews = parseInt(row[1] || "0", 10);
      }
    });

    // Increment
    currentViews += 1;

    // Update or Insert safely mapping to purely the B column for that row
    if (rowIndex === -1) {
      // Not found, append row
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SETTINGS_SHEET_NAME}!A:B`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [["site_views", String(currentViews)]] }
      });
    } else {
      // Target exact Cell (rowIndex is 0-indexed mapped from A2, so A2 = index 0. We update B[index+2])
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SETTINGS_SHEET_NAME}!B${rowIndex + 2}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[String(currentViews)]] }
      });
    }

    return String(currentViews);
  } catch (error) {
    console.error("Failed to increment views:", error);
    return "0";
  }
};

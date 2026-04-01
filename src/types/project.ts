export interface Project {
  id: string;
  title: string;
  image_url: string;
  VDO_url: string;
  thumbnail_url: string;
  html_drive_id: string;
  last_updated: string;
  status: 'published' | 'draft' | 'pending';
}

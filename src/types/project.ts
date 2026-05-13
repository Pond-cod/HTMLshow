export interface Project {
  id: string;
  title: string;
  image_url: string;
  VDO_url: string;
  thumbnail_url: string;
  html_drive_id: string;
  last_updated: string;
  status: 'published' | 'draft' | 'pending';
  manual_text?: string;
  manual_image_url?: string;
  manual_url?: string;
  learning_text?: string;
  learning_image_url?: string;
  learning_url?: string;
}

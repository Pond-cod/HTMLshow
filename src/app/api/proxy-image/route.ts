import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAuthClient } from '@/lib/google/sheets';

export async function GET(request: Request) {
  let id: string | null = null;
  try {
    const { searchParams } = new URL(request.url);
    id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
    }

    const auth = getAuthClient();
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.get(
      { fileId: id, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    const headers = new Headers();
    headers.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=86400');

    // Return the image buffer
    return new NextResponse(response.data as unknown as ArrayBuffer, {
      status: 200,
      headers
    });
  } catch (error: any) {
    console.error('Proxy Image Error:', error.message || error);
    // If it fails, fallback to redirecting to the standard Google Drive render URL
    // This allows it to work if the image IS public, even if proxy fails.
    return NextResponse.redirect(`https://drive.google.com/uc?export=view&id=${id}`);
  }
}

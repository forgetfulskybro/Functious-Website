import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { importTranslations, translationErrorResponse } from '@/lib/translations';
import { readZipEntries } from '@/lib/zipImport';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_UPLOADS = 25;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload' }, { status: 400 });
  }

  const uploads = form
    .getAll('files')
    .filter((entry): entry is File => entry instanceof File);

  if (uploads.length === 0) {
    return NextResponse.json(
      { error: 'Choose one or more .json or .zip translation files' },
      { status: 400 },
    );
  }
  if (uploads.length > MAX_UPLOADS) {
    return NextResponse.json(
      { error: `Upload at most ${MAX_UPLOADS} files at a time` },
      { status: 400 },
    );
  }

  const files: { name: string; content: string }[] = [];

  try {
    for (const upload of uploads) {
      if (upload.size > MAX_UPLOAD_BYTES) {
        throw new Error(`${upload.name} is too large`);
      }

      const lower = upload.name.toLowerCase();
      if (lower.endsWith('.zip')) {
        const entries = readZipEntries(
          Buffer.from(await upload.arrayBuffer()),
        );
        files.push(...entries);
      } else if (lower.endsWith('.json')) {
        files.push({ name: upload.name, content: await upload.text() });
      } else {
        throw new Error(`${upload.name} is not a .json or .zip file`);
      }
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Could not read the upload',
      },
      { status: 400 },
    );
  }

  if (files.length === 0) {
    return NextResponse.json(
      { error: 'No language JSON files were found in that upload' },
      { status: 400 },
    );
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: 'That upload contains too many translation files' },
      { status: 400 },
    );
  }

  try {
    const result = await importTranslations(String(session.user.id), files);
    return NextResponse.json(result);
  } catch (error) {
    return translationErrorResponse(error);
  }
}

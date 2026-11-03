import { inflateRawSync } from 'zlib';

export interface ZipImportFile {
  name: string;
  content: string;
}

const MAX_ENTRIES = 60;
const MAX_ENTRY_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 24 * 1024 * 1024;

function findEndOfCentralDirectory(buffer: Buffer): number {
  if (buffer.length < 22) return -1;

  const start = Math.max(0, buffer.length - 22 - 0xffff);
  for (let i = buffer.length - 22; i >= start; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) return i;
  }

  return -1;
}

export function readZipEntries(buffer: Buffer): ZipImportFile[] {
  const eocd = findEndOfCentralDirectory(buffer);
  if (eocd === -1) throw new Error('That file is not a valid ZIP archive.');

  const totalEntries = buffer.readUInt16LE(eocd + 10);
  const centralOffset = buffer.readUInt32LE(eocd + 16);

  if (totalEntries === 0xffff || centralOffset === 0xffffffff) {
    throw new Error('ZIP64 archives are not supported.');
  }
  if (totalEntries > MAX_ENTRIES) {
    throw new Error('That ZIP contains too many files.');
  }

  const entries: ZipImportFile[] = [];
  let offset = centralOffset;
  let totalBytes = 0;

  for (let i = 0; i < totalEntries; i++) {
    if (offset + 46 > buffer.length) {
      throw new Error('That ZIP archive is truncated.');
    }
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('That ZIP archive has an invalid central directory.');
    }

    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const entryEnd = offset + 46 + nameLength + extraLength + commentLength;

    if (entryEnd > buffer.length) {
      throw new Error('That ZIP archive is truncated.');
    }

    const entryName = buffer
      .subarray(offset + 46, offset + 46 + nameLength)
      .toString('utf8');
    offset = entryEnd;

    const baseName = entryName.split(/[\\/]/).pop() ?? entryName;
    if (
      !baseName.toLowerCase().endsWith('.json') ||
      baseName.startsWith('._') ||
      entryName.includes('__MACOSX/')
    ) {
      continue;
    }

    if (
      compressedSize > MAX_ENTRY_BYTES ||
      uncompressedSize > MAX_ENTRY_BYTES
    ) {
      throw new Error(`${baseName} is too large.`);
    }
    if (localOffset + 30 > buffer.length) {
      throw new Error('That ZIP archive is truncated.');
    }
    if (buffer.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error('That ZIP archive has an invalid local header.');
    }

    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;

    if (dataStart + compressedSize > buffer.length) {
      throw new Error('That ZIP archive is truncated.');
    }

    const compressed = buffer.subarray(
      dataStart,
      dataStart + compressedSize,
    );

    let data: Buffer;
    if (method === 0) {
      data = compressed;
    } else if (method === 8) {
      data = inflateRawSync(compressed);
    } else {
      throw new Error(`${baseName}: unsupported ZIP compression.`);
    }

    if (data.length > MAX_ENTRY_BYTES) {
      throw new Error(`${baseName} is too large.`);
    }

    totalBytes += data.length;
    if (totalBytes > MAX_TOTAL_BYTES) {
      throw new Error('That ZIP is too large to import.');
    }

    entries.push({ name: baseName, content: data.toString('utf8') });
  }

  return entries;
}

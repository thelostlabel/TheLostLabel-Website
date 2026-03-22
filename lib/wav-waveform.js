import { open, stat } from "fs/promises";

const DEFAULT_PEAK_COUNT = 640;
const waveformCache = new Map();

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

async function readBuffer(fileHandle, position, length) {
  const buffer = Buffer.alloc(length);
  const { bytesRead } = await fileHandle.read(buffer, 0, length, position);

  if (bytesRead !== length) {
    throw new Error("Unexpected end of WAV file");
  }

  return buffer;
}

async function readWavMetadata(fileHandle, fileSize) {
  const header = await readBuffer(fileHandle, 0, 12);
  const riff = header.toString("ascii", 0, 4);
  const wave = header.toString("ascii", 8, 12);

  if (riff !== "RIFF" || wave !== "WAVE") {
    throw new Error("Unsupported WAV container");
  }

  let format = null;
  let data = null;
  let offset = 12;

  while (offset + 8 <= fileSize && (!format || !data)) {
    const chunkHeader = await readBuffer(fileHandle, offset, 8);
    const chunkId = chunkHeader.toString("ascii", 0, 4);
    const chunkSize = chunkHeader.readUInt32LE(4);
    const chunkDataOffset = offset + 8;

    if (chunkId === "fmt ") {
      const formatBuffer = await readBuffer(fileHandle, chunkDataOffset, Math.min(chunkSize, 16));
      format = {
        audioFormat: formatBuffer.readUInt16LE(0),
        numChannels: formatBuffer.readUInt16LE(2),
        sampleRate: formatBuffer.readUInt32LE(4),
        byteRate: formatBuffer.readUInt32LE(8),
        blockAlign: formatBuffer.readUInt16LE(12),
        bitsPerSample: formatBuffer.readUInt16LE(14),
      };
    } else if (chunkId === "data") {
      data = {
        offset: chunkDataOffset,
        size: Math.min(chunkSize, Math.max(0, fileSize - chunkDataOffset)),
      };
    }

    offset = chunkDataOffset + chunkSize + (chunkSize % 2);
  }

  if (!format || !data) {
    throw new Error("Invalid WAV file structure");
  }

  return { ...format, dataOffset: data.offset, dataSize: data.size };
}

function readNormalizedSample(buffer, offset, audioFormat, bitsPerSample) {
  if (audioFormat === 1) {
    switch (bitsPerSample) {
      case 8:
        return (buffer.readUInt8(offset) - 128) / 128;
      case 16:
        return buffer.readInt16LE(offset) / 32768;
      case 24:
        return buffer.readIntLE(offset, 3) / 8388608;
      case 32:
        return buffer.readInt32LE(offset) / 2147483648;
      default:
        break;
    }
  }

  if (audioFormat === 3) {
    if (bitsPerSample === 32) {
      return clamp(buffer.readFloatLE(offset), -1, 1);
    }

    if (bitsPerSample === 64) {
      return clamp(buffer.readDoubleLE(offset), -1, 1);
    }
  }

  throw new Error(`Unsupported WAV format: format=${audioFormat}, bits=${bitsPerSample}`);
}

async function computeWavWaveform(filePath, peakCount) {
  const fileHandle = await open(filePath, "r");

  try {
    const fileInfo = await fileHandle.stat();
    const metadata = await readWavMetadata(fileHandle, fileInfo.size);
    const bytesPerSample = Math.ceil(metadata.bitsPerSample / 8);

    if (!metadata.numChannels || !metadata.sampleRate || !metadata.blockAlign) {
      throw new Error("Incomplete WAV metadata");
    }

    if (metadata.blockAlign < metadata.numChannels * bytesPerSample) {
      throw new Error("Invalid WAV block alignment");
    }

    const totalFrames = Math.floor(metadata.dataSize / metadata.blockAlign);
    const duration = totalFrames > 0 ? totalFrames / metadata.sampleRate : 0;
    const bucketCount = Math.max(1, Math.min(peakCount, totalFrames || 1));
    const channelCount = Math.max(1, Math.min(metadata.numChannels, 2));
    const peaks = Array.from({ length: channelCount }, () => new Array(bucketCount).fill(0));
    const chunkSize = Math.max(metadata.blockAlign, 1024 * 64 - ((1024 * 64) % metadata.blockAlign));

    let position = metadata.dataOffset;
    let processedFrames = 0;
    const dataEnd = metadata.dataOffset + metadata.dataSize;

    while (position < dataEnd) {
      const bytesRemaining = dataEnd - position;
      const bytesToRead = Math.min(chunkSize, bytesRemaining);
      const buffer = Buffer.alloc(bytesToRead);
      const { bytesRead } = await fileHandle.read(buffer, 0, bytesToRead, position);

      if (!bytesRead) break;

      const frameCount = Math.floor(bytesRead / metadata.blockAlign);

      for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
        const absoluteFrame = processedFrames + frameIndex;
        const bucketIndex = Math.min(
          bucketCount - 1,
          Math.floor((absoluteFrame * bucketCount) / Math.max(totalFrames, 1)),
        );
        const frameOffset = frameIndex * metadata.blockAlign;

        for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
          const sampleOffset = frameOffset + channelIndex * bytesPerSample;
          const sample = readNormalizedSample(
            buffer,
            sampleOffset,
            metadata.audioFormat,
            metadata.bitsPerSample,
          );

          if (Math.abs(sample) > Math.abs(peaks[channelIndex][bucketIndex])) {
            peaks[channelIndex][bucketIndex] = sample;
          }
        }
      }

      processedFrames += frameCount;
      position += bytesRead;
    }

    return {
      duration,
      peaks: peaks.map((channel) => channel.map((value) => Math.round(value * 10000) / 10000)),
    };
  } finally {
    await fileHandle.close();
  }
}

export async function getCachedWavWaveform(filePath, peakCount = DEFAULT_PEAK_COUNT) {
  const fileInfo = await stat(filePath);
  const cacheKey = `${filePath}:${fileInfo.size}:${fileInfo.mtimeMs}:${peakCount}`;

  const cached = waveformCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const waveformPromise = computeWavWaveform(filePath, peakCount).catch((error) => {
    waveformCache.delete(cacheKey);
    throw error;
  });

  waveformCache.set(cacheKey, waveformPromise);
  return waveformPromise;
}

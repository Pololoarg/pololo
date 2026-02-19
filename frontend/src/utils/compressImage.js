import Compressor from "compressorjs";

const DEFAULTS = {
  maxSizeBytes: 500 * 1024,
  maxWidth: 1600,
  maxHeight: 1600,
  initialQuality: 0.8,
  minQuality: 0.4,
  qualityStep: 0.1,
  mimeType: "image/jpeg"
};

function getOutputName(file, mimeType) {
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  let ext = ".jpg";
  if (mimeType === "image/png") {
    ext = ".png";
  } else if (mimeType === "image/webp") {
    ext = ".webp";
  }
  return `${baseName}${ext}`;
}

export function compressImageToMaxSize(file, options = {}) {
  const config = { ...DEFAULTS, ...options };

  if (!file || file.size <= config.maxSizeBytes) {
    return Promise.resolve(file);
  }

  const attemptCompress = (quality) =>
    new Promise((resolve, reject) => {
      new Compressor(file, {
        quality,
        maxWidth: config.maxWidth,
        maxHeight: config.maxHeight,
        mimeType: config.mimeType,
        convertSize: 0,
        success(result) {
          const outputName = getOutputName(file, result.type || config.mimeType);
          const compressedFile = new File([result], outputName, {
            type: result.type || config.mimeType,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        },
        error(err) {
          reject(err);
        }
      });
    });

  return (async () => {
    let quality = config.initialQuality;
    let lastFile = file;

    while (quality >= config.minQuality) {
      // eslint-disable-next-line no-await-in-loop
      const compressed = await attemptCompress(quality);
      lastFile = compressed;

      if (compressed.size <= config.maxSizeBytes) {
        return compressed;
      }

      quality = Number((quality - config.qualityStep).toFixed(2));
    }

    return lastFile;
  })();
}

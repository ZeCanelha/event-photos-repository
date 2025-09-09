import sharp from "sharp";
import path from "path";

export const processImage = async (
  inputPath: string,
  outputPath: string,
  watermarkPath?: string,
  width = 1200
): Promise<string> => {
  try {
    if (!watermarkPath)
      watermarkPath = path.resolve(process.cwd(), "images", "watermark.png");

    await sharp(inputPath)
      .resize({ width, withoutEnlargement: true }) // resize but don’t upscale
      .composite([
        {
          input: watermarkPath,
          gravity: "center",
          blend: "overlay",
        },
      ])
      .webp({ quality: 90 })
      .toFile(outputPath);

    return outputPath;
  } catch (error: any) {
    console.log(error);

    throw new Error(error);
  }
};

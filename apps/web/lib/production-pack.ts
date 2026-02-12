import archiver from "archiver";
import fs from "fs";

export async function generateProductionPack(outputPath: string, files: Array<{ path: string; name: string }>) {
  await new Promise<void>((resolve, reject) => {
    const out = fs.createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(out);
    for (const file of files) archive.file(file.path, { name: file.name });
    out.on("close", () => resolve());
    archive.on("error", reject);
    archive.finalize();
  });
}

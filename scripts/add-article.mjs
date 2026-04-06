import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

async function addArticle() {
  console.log("Tides of Knowing — article publisher");
  console.log("=====================================\n");

  const stagingDir = path.join(root, "staging");
  const articlesDir = path.join(root, "src", "content", "articles");
  const imagesDir = path.join(root, "public", "images", "articles");

  try {
    const files = await fs.readdir(stagingDir);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    if (mdFiles.length === 0) {
      console.log("No markdown files found in ./staging/");
      console.log("Add your articles to the staging folder first.\n");
      return;
    }

    await fs.mkdir(articlesDir, { recursive: true });
    await fs.mkdir(imagesDir, { recursive: true });

    console.log(`Found ${mdFiles.length} article(s) to process:\n`);

    for (const file of mdFiles) {
      const slug = path.basename(file, ".md");
      const sourcePath = path.join(stagingDir, file);
      const destPath = path.join(articlesDir, file);

      await fs.copyFile(sourcePath, destPath);
      console.log(`Copied: ${file}`);

      const imageFiles = files.filter(
        (f) =>
          f.startsWith(`${slug}-`) &&
          (f.endsWith(".jpg") ||
            f.endsWith(".jpeg") ||
            f.endsWith(".png") ||
            f.endsWith(".webp")),
      );

      if (imageFiles.length > 0) {
        const articleImageDir = path.join(imagesDir, slug);
        await fs.mkdir(articleImageDir, { recursive: true });

        for (const imgFile of imageFiles) {
          const imgSource = path.join(stagingDir, imgFile);
          const imgDest = path.join(articleImageDir, imgFile);
          await fs.copyFile(imgSource, imgDest);
          console.log(`  Image: ${imgFile}`);
        }
      }
    }

    console.log("\nDone. Run `npm run dev` to preview, or `npm run build` to build.\n");
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  }
}

addArticle();

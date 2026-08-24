import { access, readFile, readdir, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";

const DIST_DIRECTORY = path.resolve("dist");
const MAXIMUM_JAVASCRIPT_BYTES = 700 * 1024;
const MAXIMUM_GZIP_JAVASCRIPT_BYTES = 190 * 1024;
const MAXIMUM_CSS_BYTES = 40 * 1024;

function assertRelease(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Release verification failed: ${message}`);
}

async function filesWithExtension(
  directory: string,
  extension: string,
): Promise<readonly string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await filesWithExtension(entryPath, extension));
    } else if (entry.name.endsWith(extension)) {
      files.push(entryPath);
    }
  }
  return Object.freeze(files);
}

function localReferences(html: string): readonly string[] {
  return Object.freeze(
    [...html.matchAll(/\b(?:href|src)="([^"]+)"/gu)]
      .map((match) => match[1])
      .filter((reference): reference is string => Boolean(reference))
      .filter(
        (reference) =>
          !reference.startsWith("https://") &&
          !reference.startsWith("http://") &&
          !reference.startsWith("data:") &&
          !reference.startsWith("#"),
      ),
  );
}

async function verifyLocalReference(reference: string): Promise<void> {
  assertRelease(
    reference.startsWith("./"),
    `local HTML reference must remain repository-subpath safe: ${reference}`,
  );
  const relativePath = reference.slice(2).split(/[?#]/u, 1)[0];
  assertRelease(relativePath, `local HTML reference is empty: ${reference}`);
  await access(path.join(DIST_DIRECTORY, relativePath));
}

async function totalSize(files: readonly string[]): Promise<number> {
  const sizes = await Promise.all(files.map(async (file) => (await stat(file)).size));
  return sizes.reduce((total, size) => total + size, 0);
}

async function totalGzipSize(files: readonly string[]): Promise<number> {
  const sizes = await Promise.all(
    files.map(async (file) => gzipSync(await readFile(file)).byteLength),
  );
  return sizes.reduce((total, size) => total + size, 0);
}

async function main(): Promise<void> {
  const indexPath = path.join(DIST_DIRECTORY, "index.html");
  const html = await readFile(indexPath, "utf8");
  assertRelease(
    html.includes("<title>NIBBLES — 深空字彙任務</title>"),
    "production title does not identify the deep-space vocabulary mission",
  );

  const references = localReferences(html);
  assertRelease(references.length >= 3, "production HTML is missing expected assets");
  await Promise.all(references.map(verifyLocalReference));
  await access(path.join(DIST_DIRECTORY, "favicon.svg"));
  await access(path.join(DIST_DIRECTORY, "data", "vocabulary.json"));

  const assetDirectory = path.join(DIST_DIRECTORY, "assets");
  const javascriptFiles = await filesWithExtension(assetDirectory, ".js");
  const cssFiles = await filesWithExtension(assetDirectory, ".css");
  assertRelease(javascriptFiles.length > 0, "production JavaScript bundle is missing");
  assertRelease(cssFiles.length > 0, "production CSS bundle is missing");

  const javascriptBytes = await totalSize(javascriptFiles);
  const gzipJavascriptBytes = await totalGzipSize(javascriptFiles);
  const cssBytes = await totalSize(cssFiles);
  assertRelease(
    javascriptBytes <= MAXIMUM_JAVASCRIPT_BYTES,
    `JavaScript budget exceeded (${javascriptBytes} > ${MAXIMUM_JAVASCRIPT_BYTES} bytes)`,
  );
  assertRelease(
    gzipJavascriptBytes <= MAXIMUM_GZIP_JAVASCRIPT_BYTES,
    `gzip JavaScript budget exceeded (${gzipJavascriptBytes} > ${MAXIMUM_GZIP_JAVASCRIPT_BYTES} bytes)`,
  );
  assertRelease(
    cssBytes <= MAXIMUM_CSS_BYTES,
    `CSS budget exceeded (${cssBytes} > ${MAXIMUM_CSS_BYTES} bytes)`,
  );

  console.log(
    `Release verification OK: ${references.length} relative references, ` +
    `${javascriptBytes} B JavaScript (${gzipJavascriptBytes} B gzip), ${cssBytes} B CSS.`,
  );
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

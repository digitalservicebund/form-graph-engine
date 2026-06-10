import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const forbiddenPattern =
  /from\s+["']node:|import\(["']node:|\bprocess\.|\bBuffer\b|\brequire\(/g;
const queue = [path.resolve("dist")];
const findings = [];

while (queue.length > 0) {
  const dir = queue.pop();
  if (!dir) continue;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      queue.push(fullPath);
      continue;
    }
    if (!entry.isFile() || !fullPath.endsWith(".js")) continue;

    const content = readFileSync(fullPath, "utf8");
    if (forbiddenPattern.test(content)) {
      findings.push(path.relative(process.cwd(), fullPath));
    }
    forbiddenPattern.lastIndex = 0;
  }
}

if (findings.length > 0) {
  console.error("Node runtime usage detected in built files:");
  for (const file of findings) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log("No Node runtime usage detected in dist");

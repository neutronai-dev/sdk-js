// node scripts/check-version.mjs <version> — every package carries the tag's version.
import { readFileSync } from "node:fs";

const expected = process.argv[2];
if (!expected) {
  console.error("usage: check-version.mjs <version>");
  process.exit(2);
}
const failures = [];
for (const dir of ["shared", "sdk-ts", "cli"]) {
  const { name, version } = JSON.parse(readFileSync(`packages/${dir}/package.json`, "utf8"));
  if (version !== expected) failures.push(`${name} is ${version}, the tag is ${expected}`);
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Every package is at ${expected}.`);

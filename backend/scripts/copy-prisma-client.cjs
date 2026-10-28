const fs = require("node:fs");
const path = require("node:path");

const generatedClientPath = path.resolve(__dirname, "../src/generated/client");
const compiledClientPath = path.resolve(__dirname, "../dist/generated/client");

if (!fs.existsSync(generatedClientPath)) {
  throw new Error("Generated Prisma client not found. Run prisma generate before building.");
}

fs.mkdirSync(path.dirname(compiledClientPath), { recursive: true });
fs.cpSync(generatedClientPath, compiledClientPath, { recursive: true });

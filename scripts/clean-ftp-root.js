#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const ftp = require("basic-ftp");

const PROTECTED_ROOTS = new Set([
  ".canpolat-ftp-deploy-state.json",
  ".ftpquota",
  ".user.ini",
  ".well-known",
  "cgi-bin",
  "error_log",
  "php.ini",
]);

const REQUIRED_LOCAL_FILES = [
  ".htaccess",
  "index.html",
  "index.php",
  "css/style.css",
  "js/script.js",
];

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Eksik ortam değişkeni: ${name}`);
  }
  return value;
}

function parsePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("FTP_PORT 1-65535 arasında bir tam sayı olmalıdır.");
  }
  return port;
}

function parseMaxDelete(value) {
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 10000) {
    throw new Error("FTP_CLEAN_MAX_DELETE 1-10000 arasında bir tam sayı olmalıdır.");
  }
  return limit;
}

function validateRemoteName(name) {
  if (
    !name ||
    name === "." ||
    name === ".." ||
    name.includes("/") ||
    name.includes("\0") ||
    /[\r\n]/.test(name)
  ) {
    throw new Error("FTP listelemesinde güvenli olmayan bir dosya adı bulundu; temizlik durduruldu.");
  }
}

function isProtected(relativePath) {
  return PROTECTED_ROOTS.has(relativePath.split("/")[0]);
}

function collectLocalEntries(rootDirectory) {
  const entries = new Map();

  function walk(relativeDirectory) {
    const absoluteDirectory = path.join(rootDirectory, relativeDirectory);
    const children = fs
      .readdirSync(absoluteDirectory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));

    for (const child of children) {
      const relativePath = relativeDirectory
        ? path.posix.join(relativeDirectory, child.name)
        : child.name;

      if (child.isSymbolicLink()) {
        throw new Error(`Yayın paketinde sembolik bağlantı kabul edilmez: ${relativePath}`);
      }

      if (child.isDirectory()) {
        entries.set(relativePath, "directory");
        walk(relativePath);
      } else if (child.isFile()) {
        entries.set(relativePath, "file");
      } else {
        throw new Error(`Yayın paketinde desteklenmeyen kayıt türü: ${relativePath}`);
      }
    }
  }

  walk("");
  return entries;
}

function validateLocalPackage(rootDirectory, entries) {
  if (!fs.existsSync(rootDirectory) || !fs.statSync(rootDirectory).isDirectory()) {
    throw new Error(`Yayın paketi klasörü bulunamadı: ${rootDirectory}`);
  }

  for (const requiredFile of REQUIRED_LOCAL_FILES) {
    if (entries.get(requiredFile) !== "file") {
      throw new Error(`Temizlik için zorunlu yayın dosyası eksik: ${requiredFile}`);
    }
  }

  const localFileCount = [...entries.values()].filter((type) => type === "file").length;
  if (localFileCount < 20) {
    throw new Error(`Yayın paketinde yalnız ${localFileCount} dosya var; güvenlik için temizlik durduruldu.`);
  }
}

async function collectRemoteEntries(client) {
  const files = [];
  const directories = [];
  const protectedEntries = new Set();

  async function walk(relativeDirectory) {
    const children = await client.list(relativeDirectory || ".");

    for (const child of children) {
      validateRemoteName(child.name);
      const relativePath = relativeDirectory
        ? path.posix.join(relativeDirectory, child.name)
        : child.name;

      if (isProtected(relativePath)) {
        protectedEntries.add(relativePath.split("/")[0]);
        continue;
      }

      if (child.isDirectory) {
        directories.push(relativePath);
        await walk(relativePath);
      } else if (child.isFile) {
        files.push(relativePath);
      } else {
        throw new Error(
          `Sunucuda desteklenmeyen kayıt türü bulundu: ${relativePath}. Temizlik durduruldu.`
        );
      }
    }
  }

  await walk("");
  return { files, directories, protectedEntries };
}

function createDeletionPlan(localEntries, remoteEntries) {
  const files = remoteEntries.files
    .filter((relativePath) => localEntries.get(relativePath) !== "file")
    .sort();
  const directories = remoteEntries.directories
    .filter((relativePath) => localEntries.get(relativePath) !== "directory")
    .sort((left, right) => {
      const depthDifference = right.split("/").length - left.split("/").length;
      return depthDifference || right.localeCompare(left);
    });

  return { files, directories };
}

function appendStepSummary(plan, protectedEntries, mode) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    return;
  }

  const protectedList = [...protectedEntries].sort().map((item) => `\`${item}\``).join(", ");
  const lines = [
    "## Kontrollü FTP kök temizliği",
    "",
    `- Mod: \`${mode}\``,
    `- Silinecek eski dosya: **${plan.files.length}**`,
    `- Silinecek eski klasör: **${plan.directories.length}**`,
    `- Sunucuda görülen korumalı kökler: ${protectedList || "Yok"}`,
    "",
  ];
  fs.appendFileSync(summaryPath, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const server = requireEnv("FTP_SERVER");
  const username = requireEnv("FTP_USERNAME");
  const password = requireEnv("FTP_PASSWORD");
  const serverDirectory = requireEnv("FTP_SERVER_DIR");
  const localDirectory = path.resolve(requireEnv("FTP_LOCAL_DIR"));
  const protocol = process.env.FTP_PROTOCOL || "ftps";
  const security = process.env.FTP_SECURITY || "loose";
  const mode = process.env.FTP_CLEAN_MODE || "audit";
  const port = parsePort(process.env.FTP_PORT || "21");
  const maxDelete = parseMaxDelete(process.env.FTP_CLEAN_MAX_DELETE || "2000");

  if (server.includes("://") || server.includes("/")) {
    throw new Error("FTP_SERVER yalnızca sunucu adı olmalıdır.");
  }
  if (serverDirectory !== "./") {
    throw new Error("Temizlik yalnız FTP hesabının doğrulanmış ./ kökünde çalışabilir.");
  }
  if (!["ftp", "ftps", "ftps-legacy"].includes(protocol)) {
    throw new Error("FTP_PROTOCOL ftp, ftps veya ftps-legacy olmalıdır.");
  }
  if (!["strict", "loose"].includes(security)) {
    throw new Error("FTP_SECURITY strict veya loose olmalıdır.");
  }
  if (!["audit", "apply"].includes(mode)) {
    throw new Error("FTP_CLEAN_MODE audit veya apply olmalıdır.");
  }
  if (mode === "apply" && process.env.FTP_CLEAN_CONFIRM !== "canpolatnakliyat.com") {
    throw new Error("Canlı kök temizliği için onay değeri geçersiz.");
  }

  const localEntries = collectLocalEntries(localDirectory);
  validateLocalPackage(localDirectory, localEntries);

  const client = new ftp.Client(30000);
  client.ftp.verbose = false;

  try {
    const secure = protocol === "ftps" ? true : protocol === "ftps-legacy" ? "implicit" : false;
    await client.access({
      host: server,
      user: username,
      password,
      port,
      secure,
      secureOptions: { rejectUnauthorized: security === "strict" },
    });
    await client.cd(serverDirectory);

    const remoteEntries = await collectRemoteEntries(client);
    const plan = createDeletionPlan(localEntries, remoteEntries);
    const deletionCount = plan.files.length + plan.directories.length;

    console.log(`Kontrollü temizlik planı: ${plan.files.length} eski dosya, ${plan.directories.length} eski klasör.`);
    console.log(`Korunan sunucu kökü sayısı: ${remoteEntries.protectedEntries.size}.`);
    appendStepSummary(plan, remoteEntries.protectedEntries, mode);

    if (deletionCount > maxDelete) {
      throw new Error(
        `Silme planı ${deletionCount} kayıt içeriyor ve güvenlik sınırı ${maxDelete}; temizlik durduruldu.`
      );
    }

    if (mode === "audit" || deletionCount === 0) {
      console.log(mode === "audit" ? "Denetim modu: sunucuda değişiklik yapılmadı." : "Eski dosya bulunmadı.");
      return;
    }

    for (const relativePath of plan.files) {
      await client.remove(relativePath);
    }
    for (const relativePath of plan.directories) {
      await client.removeEmptyDir(relativePath);
    }

    console.log(
      `Kontrollü temizlik tamamlandı: ${plan.files.length} dosya ve ${plan.directories.length} klasör kaldırıldı.`
    );
  } finally {
    client.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`HATA: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  createDeletionPlan,
  isProtected,
  parseMaxDelete,
  parsePort,
  validateRemoteName,
};

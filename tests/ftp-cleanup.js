"use strict";

const assert = require("node:assert/strict");
const {
  createDeletionPlan,
  isProtected,
  parseMaxDelete,
  parsePort,
  validateRemoteName,
} = require("../scripts/clean-ftp-root");

assert.equal(parsePort("21"), 21);
assert.equal(parsePort("990"), 990);
assert.throws(() => parsePort("0"), /1-65535/);
assert.throws(() => parsePort("abc"), /1-65535/);

assert.equal(parseMaxDelete("2000"), 2000);
assert.throws(() => parseMaxDelete("10001"), /1-10000/);

assert.equal(isProtected(".well-known/acme-challenge/token"), true);
assert.equal(isProtected("cgi-bin/script.cgi"), true);
assert.equal(isProtected(".canpolat-ftp-deploy-state.json"), true);
assert.equal(isProtected("admin/old-index.html"), false);

assert.doesNotThrow(() => validateRemoteName("eski dosya.html"));
assert.throws(() => validateRemoteName("../index.html"), /güvenli olmayan/);
assert.throws(() => validateRemoteName("bad\nname"), /güvenli olmayan/);

const localEntries = new Map([
  ["assets", "directory"],
  ["assets/logo.svg", "file"],
  ["css", "directory"],
  ["index.html", "file"],
]);
const remoteEntries = {
  files: ["assets/old.png", "css", "index.html", "old.html"],
  directories: ["archive", "archive/deep", "assets", "index.html"],
};
const plan = createDeletionPlan(localEntries, remoteEntries);

assert.deepEqual(plan.files, ["assets/old.png", "css", "old.html"]);
assert.deepEqual(new Set(plan.directories), new Set(["archive", "archive/deep", "index.html"]));
assert.equal(plan.directories[0], "archive/deep");

console.log("Kontrollü FTP temizliği güvenlik testleri geçti.");

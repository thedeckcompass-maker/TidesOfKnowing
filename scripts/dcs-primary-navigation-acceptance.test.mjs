// Run the existing synthetic navigation/creation contract without overwriting
// its historical evidence receipt outside this workspace.
import fs from 'node:fs';
const original = fs.writeFileSync;
const protectedReceipt = 'C:/Users/DELL 7410/Documents/ChatGPT/Tides of Knowing Website/DCS-CONNECTED-NAVIGATION-IMPLEMENTATION-20261110/CONTRACT-RESULTS.json';
fs.writeFileSync = function (target, ...args) {
  if (String(target).replaceAll('\\', '/') === protectedReceipt) return;
  return original.call(this, target, ...args);
};
try { await import('./connected-navigation-contract.test.mjs'); }
finally { fs.writeFileSync = original; }

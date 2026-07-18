// ponytail: one guard for the only non-trivial client logic — split parsing must
// match the contract (1–20 recipients, positive int bps, sum === 10000).
// Run: node dashboard/test-split.mjs   (no deps; stubs isAddress with a regex)
import assert from "node:assert";

const isAddress = a => /^0x[0-9a-fA-F]{40}$/.test(a);

function parseSplit(text) {
  const rows = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (rows.length === 0 || rows.length > 20) throw new Error("Need 1–20 recipients");
  const recipients = [], bps = [];
  let sum = 0;
  for (const row of rows) {
    const [addr, b] = row.split(",").map(x => x.trim());
    if (!isAddress(addr)) throw new Error("Bad address: " + addr);
    const n = Number(b);
    if (!Number.isInteger(n) || n <= 0) throw new Error("bps must be a positive integer: " + b);
    recipients.push(addr); bps.push(n); sum += n;
  }
  if (sum !== 10000) throw new Error(`bps sum = ${sum}, must be 10000`);
  return { recipients, bps };
}

const A = "0x" + "a".repeat(40), B = "0x" + "b".repeat(40);

// valid 70/30 split
const ok = parseSplit(`${A},7000\n${B},3000`);
assert.deepEqual(ok.bps, [7000, 3000]);
assert.equal(ok.recipients.length, 2);

// sum != 10000 rejected
assert.throws(() => parseSplit(`${A},7000\n${B},2000`), /sum = 9000/);

// zero/negative bps rejected
assert.throws(() => parseSplit(`${A},0`), /positive integer/);

// bad address rejected
assert.throws(() => parseSplit(`0xnope,10000`), /Bad address/);

// empty rejected
assert.throws(() => parseSplit(``), /1–20/);

console.log("ok — parseSplit matches contract rules");

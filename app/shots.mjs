import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = process.env.OUT || "/tmp/shots";
mkdirSync(OUT, { recursive: true });

const BASE = "http://127.0.0.1:8765/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });

const shots = [];
async function shot(name) {
  await page.waitForTimeout(900); // let rise animations settle
  const file = `${OUT}/${name}.png`;
  await page.screenshot({ path: file, fullPage: true });
  shots.push(file);
  console.log("captured", name);
}
async function click(name) {
  await page.getByRole("button", { name, exact: false }).first().click();
}

await page.goto(BASE, { waitUntil: "networkidle" });

// s0 — Lobby
await page.getByRole("button", { name: "Begin session" }).waitFor();
await shot("s0-lobby");
await click("Begin session");

// s1 — Convene
await page.getByRole("button", { name: "Present the case" }).waitFor();
await shot("s1-convene");
await click("Present the case");

// s2 — Present
await page.getByRole("button", { name: "See the what-ifs" }).waitFor();
await shot("s2-present");
await click("See the what-ifs");

// s3 — Feel
await page.getByRole("button", { name: "Open the vote" }).waitFor();
await shot("s3-feel");
await click("Open the vote");

// s4 — Judge (set a verdict on all three steps, then lock)
await page.locator("button.opt").first().waitFor();
const passButtons = page.locator("button.opt.sound");
const n = await passButtons.count();
for (let i = 0; i < n; i++) await passButtons.nth(i).click();
await shot("s4-judge");
await page.getByRole("button", { name: "Lock the room's verdict" }).click();

// s5 — Reckon
await page.getByRole("button", { name: "Decide what to keep" }).waitFor();
await shot("s5-reckon");
await click("Decide what to keep");

// s6 — Decide (record a reusable rule so the artifact is non-empty)
await page.locator("textarea").waitFor();
await page.locator("textarea").fill(
  "Confirm a 24-hour stable-vitals window and a confirmed follow-up before discharging frail pneumonia patients."
);
await shot("s6-decide");
await page.getByRole("button", { name: "Compound & export" }).click();

// s7 — Compound
await page.getByRole("button", { name: /Next case|session summary/ }).first().waitFor();
await shot("s7-compound");
// End the session here to reach the summary (skip the cohort loop)
await page.getByRole("button", { name: /End session|session summary/ }).first().click();

// s8 — Summary
await page.getByRole("button", { name: "New session" }).waitFor();
await shot("s8-summary");

console.log(JSON.stringify(shots, null, 2));
await browser.close();

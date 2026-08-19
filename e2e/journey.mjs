// End-to-end walk through the real UI, against the real FastAPI backend.
// Exercises what curl cannot: Server Actions, hydration, and the progress
// WebSocket running in an actual browser.
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const EMAIL = `e2e-${Date.now()}@example.com`;
const PASSWORD = "scanner-e2e-123";

let failures = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
  if (!ok) failures += 1;
};

/** isVisible() is instantaneous and races the render; this waits. */
const visible = async (locator, timeout = 20000) => {
  try {
    await locator.first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
};

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

const consoleErrors = [];
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

const sockets = [];
page.on("websocket", (ws) => sockets.push(ws.url()));

try {
  console.log("\n[1] Landing page");
  await page.goto(BASE, { waitUntil: "load" });
  check("hero renders", await visible(page.getByRole("heading", { level: 1 })));
  check("signed-out CTA shown", await visible(page.getByRole("link", { name: "Get started" })));

  console.log("\n[2] Register (Server Action)");
  await page.getByRole("link", { name: "Get started" }).click();
  await page.waitForURL("**/register");
  await page.fill('input[name="full_name"]', "E2E Runner");
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL("**/scans", { timeout: 30000 });
  check("redirected to /scans after register", page.url().includes("/scans"));
  check("empty state shown", await visible(page.getByText("No scans yet")));

  const cookies = await context.cookies();
  const access = cookies.find((c) => c.name === "scanner_access");
  check("access cookie set", Boolean(access));
  check("access cookie is httpOnly", access?.httpOnly === true);
  check(
    "token not readable from document.cookie",
    !(await page.evaluate(() => document.cookie)).includes("scanner_access"),
  );

  console.log("\n[3] Start a scan (Server Action)");
  await page.getByRole("link", { name: "New scan" }).first().click();
  await page.waitForURL("**/scans/new");
  await page.fill('input[name="domain"]', "example.com");
  // Click the label, as a user would — the radio itself is sr-only. This also
  // proves the label/input association works.
  await page.getByText("Quick", { exact: true }).click();
  check(
    "clicking the profile label selects the radio",
    await page.locator('input[name="profile"][value="quick"]').isChecked(),
  );
  await page.getByRole("button", { name: /start scan/i }).click();
  await page.waitForURL(/\/scans\/[0-9a-f]{24}$/, { timeout: 30000 });
  const scanUrl = page.url();
  check("redirected to the new scan", /\/scans\/[0-9a-f]{24}$/.test(scanUrl));

  console.log("\n[4] Live progress over the WebSocket");
  await page.goto(scanUrl, { waitUntil: "load" });

  // A quick example.com scan can finish before this page finishes loading, so
  // observing the live view is best-effort. What must always hold is that the
  // finished report arrives.
  const liveVisible = await visible(
    page.getByText("Progress streams over a WebSocket"),
    8000,
  );

  if (liveVisible) {
    check("live view rendered while running", true);
    check("socket reported Live", await visible(page.getByText("Live", { exact: true })));
    check(
      "websocket opened",
      sockets.some((u) => u.includes("/ws?token=")),
    );
  } else {
    console.log("  note  the scan finished before the live view could be observed");
  }

  check(
    "report replaces the live view",
    await visible(page.getByRole("heading", { name: "Findings", exact: true }), 150000),
  );

  console.log("\n[5] Finished report");
  check("grade badge rendered", await visible(page.getByLabel(/^Grade /)));
  check(
    "security headers table rendered",
    await visible(page.getByRole("heading", { name: "Security headers" })),
  );
  check(
    "transport panel rendered",
    await visible(page.getByRole("heading", { name: "Transport" })),
  );
  check(
    "subdomains section rendered",
    await visible(page.getByRole("heading", { name: "Subdomains" })),
  );
  check(
    "exposures section rendered",
    await visible(page.getByRole("heading", { name: "Exposed files" })),
  );
  check(
    "a finding is listed",
    (await page
      .locator("h3")
      .filter({ hasText: /HSTS|Content-Security-Policy|redirect/i })
      .count()) > 0,
  );

  console.log("\n[6] Scan list");
  await page.getByRole("link", { name: "All scans" }).click();
  await page.waitForURL("**/scans");
  check("the scan appears in the list", await visible(page.getByText("example.com")));

  console.log("\n[7] Settings (Server Action)");
  await page.getByRole("link", { name: "Settings" }).click();
  await page.waitForURL("**/settings");
  await page.fill('input[name="full_name"]', "E2E Renamed");
  await page.getByRole("button", { name: /save changes/i }).click();
  check("profile update succeeded", await visible(page.getByText("Profile updated.")));
  check("header picked up the new name", await visible(page.getByText("E2E Renamed")));

  console.log("\n[8] Guard rails");
  await page.goto(`${BASE}/scans/new`);
  await page.fill('input[name="domain"]', "printer.local");
  await page.getByRole("button", { name: /start scan/i }).click();
  // Scoped to the form: Next.js renders its own route announcer with
  // role="alert" holding the page title, so a bare getByRole("alert") is never
  // a safe locator in a Next app.
  const guardAlert = page.locator("form").getByRole("alert");
  await guardAlert.waitFor({ timeout: 20000 });
  const guardText = await guardAlert.innerText();
  check(
    "the standing 'only scan what you may' notice is not a live region",
    (await page.locator("main").getByRole("alert").count()) === 1,
  );
  check(
    "reserved suffix refused",
    /not permitted|cannot be scanned/i.test(guardText),
    guardText.slice(0, 60),
  );

  await page.goto(`${BASE}/scans/000000000000000000000000`);
  check(
    "unknown scan shows not-found",
    await visible(page.getByRole("heading", { name: "Not found" })),
  );

  console.log("\n[9] Sign out");
  await page.goto(`${BASE}/scans`);
  await page.getByRole("button", { name: /sign out/i }).click();
  await page.waitForURL("**/login", { timeout: 20000 });
  check("redirected to /login", page.url().includes("/login"));

  await page.goto(`${BASE}/scans`);
  await page.waitForURL(/\/login/);
  check("protected route now redirects", page.url().includes("/login"));
  check("redirect remembers where you were going", page.url().includes("next=%2Fscans"));

  console.log("\n[10] Log back in (Server Action)");
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/scans", { timeout: 30000 });
  check("logged back in and returned to the requested page", page.url().includes("/scans"));

  console.log("\n[11] Bad credentials");
  await page.goto(`${BASE}/scans`);
  await page.getByRole("button", { name: /sign out/i }).click();
  await page.waitForURL("**/login");
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', "definitely-wrong-1");
  await page.getByRole("button", { name: /sign in/i }).click();
  const loginAlert = page.locator("form").getByRole("alert");
  await loginAlert.waitFor({ timeout: 20000 });
  check(
    "wrong password rejected",
    /incorrect email or password/i.test(await loginAlert.innerText()),
  );

  console.log("\n[12] Browser console");
  const noisy = consoleErrors.filter(
    (e) => !/favicon|Download the React DevTools|websocket.*close/i.test(e),
  );
  check("no console errors", noisy.length === 0, noisy.slice(0, 3).join(" | "));
} catch (error) {
  failures += 1;
  console.log(`\n  FAIL  threw: ${error.message.split("\n")[0]}`);
  await page.screenshot({ path: "failure.png", fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);

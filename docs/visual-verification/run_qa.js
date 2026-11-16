/**
 * Bab Al Hara - Visual & Responsive QA Suite
 * 
 * Verifies Phase 10A Customer Home/Menu across 12 viewports in Arabic RTL and English LTR:
 * [320, 360, 375, 390, 412, 430, 480, 768, 1024, 1280, 1440, 1920]
 * 
 * Assertions:
 * 1. Horizontal Overflow: scrollWidth <= clientWidth (0px horizontal overflow)
 * 2. Semantic Heading Hierarchy: Exactly 1 <h1> heading per route
 * 3. Touch Target Usability: Interactive elements (buttons, links) >= 44x44 CSS px
 * 
 * Usage:
 *   node docs/visual-verification/run_qa.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetUrl = process.env.APP_URL || 'http://localhost:4200/';
const cdpPort = parseInt(process.env.CDP_PORT || '9244', 10);

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Chrome executable not found. Set CHROME_PATH environment variable.');
}

const chromePath = findChrome();
const outDir = path.resolve(__dirname, 'latest-run');
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log(`Starting Bab Al Hara Responsive QA Audit on ${targetUrl}...`);
  console.log(`Using Chrome at: ${chromePath}`);

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    '--hide-scrollbars',
    '--no-default-browser-check',
    '--no-first-run',
    'about:blank'
  ]);

  await new Promise((r) => setTimeout(r, 2000));
  const versionRes = await fetch(`http://127.0.0.1:${cdpPort}/json/version`).then((r) => r.json());
  const wsUrl = versionRes.webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => { ws.onopen = r; });

  let id = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  const target = await send('Target.createTarget', { url: 'about:blank' });
  const targetId = target.result.targetId;
  const session = await send('Target.attachToTarget', { targetId, flatten: true });
  const sessionId = session.result.sessionId;

  function sendSession(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, sessionId, method, params }));
    });
  }

  await sendSession('Page.enable');
  await sendSession('DOM.enable');
  await sendSession('Runtime.enable');

  const widths = [320, 360, 375, 390, 412, 430, 480, 768, 1024, 1280, 1440, 1920];

  async function setViewport(w, h = 900) {
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: h,
      deviceScaleFactor: 1,
      mobile: w <= 768
    });
  }

  async function evaluate(expr) {
    const res = await sendSession('Runtime.evaluate', { expression: expr, returnByValue: true });
    return res && res.result && res.result.result ? res.result.result.value : null;
  }

  async function checkMetrics() {
    return await evaluate(`(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const interactives = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
      const smallTargets = [];
      for (const el of interactives) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0) {
          if (rect.width < 44 || rect.height < 44) {
            smallTargets.push({
              text: el.innerText.trim().slice(0, 24),
              tag: el.tagName,
              className: el.className,
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            });
          }
        }
      }
      const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.innerText.trim());
      const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.innerText.trim());

      return {
        overflowPx: scrollWidth - docWidth,
        smallTargets,
        h1Count: h1s.length,
        h1Texts: h1s,
        h2Count: h2s.length,
        h2Texts: h2s
      };
    })()`);
  }

  async function captureScreenshot(filepath) {
    const layout = await sendSession('Page.getLayoutMetrics');
    const contentWidth = Math.ceil(layout.result.contentSize.width);
    const contentHeight = Math.ceil(layout.result.contentSize.height);

    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: contentWidth,
      height: contentHeight,
      deviceScaleFactor: 1,
      mobile: contentWidth <= 768
    });

    const res = await sendSession('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(filepath, Buffer.from(res.result.data, 'base64'));
  }

  const results = [];
  let allPass = true;

  try {
    for (const lang of ['ar', 'en']) {
      for (const w of widths) {
        await setViewport(w, 900);
        await sendSession('Page.navigate', { url: targetUrl });
        await new Promise((r) => setTimeout(r, 1200));

        if (lang === 'en') {
          await evaluate(`(() => {
            const btn = document.querySelector('[data-language="en"]');
            if (btn) btn.click();
          })()`);
          await new Promise((r) => setTimeout(r, 600));
        }

        const metrics = await checkMetrics();
        const filename = `qa-customer-home-${lang}-w${w}.png`;
        const filepath = path.join(outDir, filename);
        await captureScreenshot(filepath);

        const isOverflowPass = metrics.overflowPx <= 0;
        const isHeadingPass = metrics.h1Count === 1;
        const isTouchTargetPass = metrics.smallTargets.length === 0;

        if (!isOverflowPass || !isHeadingPass || !isTouchTargetPass) {
          allPass = false;
        }

        const record = {
          route: 'home-menu',
          lang,
          width: w,
          overflow: isOverflowPass ? 'PASS (0px)' : `FAIL (${metrics.overflowPx}px)`,
          headings: `${metrics.h1Count} h1 (${metrics.h1Texts.join(', ')}) | ${metrics.h2Count} h2`,
          smallTargets: isTouchTargetPass ? 'PASS (all >= 44px)' : `WARN (${metrics.smallTargets.length} small targets)`,
          samples: metrics.smallTargets.slice(0, 5),
          filename
        };
        results.push(record);

        console.log(
          `[${lang.toUpperCase()} ${w}px] Overflow: ${record.overflow} | Headings: ${metrics.h1Count} h1 | Small Targets: ${metrics.smallTargets.length}`
        );
      }
    }

    const reportPath = path.join(outDir, 'qa-audit-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`Saved audit results to ${reportPath}`);

    if (allPass) {
      console.log('\\n✅ ALL RESPONSIVE & VISUAL AUDIT CHECKS PASSED!');
    } else {
      console.error('\\n❌ SOME CHECKS FAILED!');
      process.exitCode = 1;
    }
  } finally {
    ws.close();
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

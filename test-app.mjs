import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, 'test-screenshots');
if (!existsSync(screenshotsDir)) mkdirSync(screenshotsDir, { recursive: true });

const REPORT = [];
const CONSOLE_LOGS = [];
const NETWORK_REQUESTS = [];

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
  REPORT.push(msg);
}

function snapshotInfo(page, label) {
  const info = {
    label,
    url: page.url(),
    title: page.title(),
    visibleText: '',
    elements: {}
  };
  // Get visible text body for snapshot
  return page.evaluate(() => {
    function getVisibleText(el, depth = 0) {
      if (!el || depth > 8) return '';
      if (el.nodeType === Node.TEXT_NODE) {
        const t = el.textContent.trim();
        return t ? t : '';
      }
      if (el.nodeType !== Node.ELEMENT_NODE) return '';
      if (el.offsetParent === null && el.tagName !== 'BODY') return '';
      let out = '';
      for (const c of el.childNodes) {
        out += getVisibleText(c, depth + 1) + ' ';
      }
      return out.trim();
    }
    const out = {};
    out.title = document.title;
    out.bodyText = getVisibleText(document.body).slice(0, 2000);
    out.activeButton = (() => {
      const el = document.querySelector('.nav-btn.active');
      return el ? el.textContent.trim() : null;
    })();
    out.activeMediaTab = (() => {
      const el = document.querySelector('.media-tab-btn.active');
      return el ? el.textContent.trim() : null;
    })();
    out.activeSubTab = (() => {
      const el = document.querySelector('.sub-tab.active');
      return el ? el.textContent.trim() : null;
    })();
    out.promptValue = (() => {
      const ta = document.querySelector('textarea');
      return ta ? ta.value : null;
    })();
    out.errorVisible = (() => {
      const el = document.querySelector('.error-toast, .toast-error, [class*="error"]');
      return el && el.offsetParent !== null ? el.textContent.trim() : null;
    })();
    out.statusText = (() => {
      const el = document.querySelector('.status-text');
      return el && el.offsetParent !== null ? el.textContent.trim() : null;
    })();
    out.generatedImage = (() => {
      const el = document.querySelector('.preview-media');
      return el ? el.src : null;
    })();
    out.previewEmpty = !!document.querySelector('.preview-empty');
    out.apiKeyValue = (() => {
      const el = document.querySelector('input[type="password"]');
      return el ? el.value : null;
    })();
    out.baseUrlValue = (() => {
      const inputs = document.querySelectorAll('input[type="text"]');
      for (const i of inputs) {
        if (i.value && i.value.startsWith('http')) return i.value;
      }
      return null;
    })();
    return out;
  }).then(res => {
    info.snapshot = res;
    return info;
  });
}

(async () => {
  // Use Edge browser
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  log(`Launching browser: ${edgePath}`);

  const browser = await chromium.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN'
  });
  const page = await context.newPage();

  page.on('console', msg => {
    const t = msg.type();
    const text = msg.text();
    CONSOLE_LOGS.push({ type: t, text });
    log(`CONSOLE [${t}]: ${text}`);
  });
  page.on('pageerror', err => {
    CONSOLE_LOGS.push({ type: 'pageerror', text: err.message });
    log(`PAGE ERROR: ${err.message}`);
  });
  page.on('request', req => {
    NETWORK_REQUESTS.push({ method: req.method(), url: req.url() });
  });
  page.on('response', res => {
    const req = NETWORK_REQUESTS.find(r => r.url === res.url() && !r.status);
    if (req) req.status = res.status();
    else NETWORK_REQUESTS.push({ method: res.request().method(), url: res.url(), status: res.status() });
    if (res.url().includes('localhost:3002') || res.url().includes('agnes-ai')) {
      log(`NETWORK ${res.status()} ${res.request().method()} ${res.url()}`);
    }
  });

  try {
    // Step 1: Open homepage
    log('STEP 1: 打开首页 http://localhost:3002/');
    await page.goto('http://localhost:3002/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    let info = await snapshotInfo(page, 'home-initial');
    log(`Home title: ${info.snapshot.title}`);
    log(`Active nav: ${info.snapshot.activeButton}`);
    log(`Active media tab: ${info.snapshot.activeMediaTab}`);
    log(`Active sub tab: ${info.snapshot.activeSubTab}`);

    // Step 2: Screenshot initial
    log('STEP 2: 截图初始状态 01-initial.png');
    await page.screenshot({ path: path.join(screenshotsDir, '01-initial.png'), fullPage: false });

    // Step 3: Click settings nav
    log('STEP 3: 点击"设置"导航按钮');
    const settingsBtn = page.locator('.nav-btn:has-text("设置")');
    await settingsBtn.click();
    await page.waitForTimeout(800);
    info = await snapshotInfo(page, 'settings');
    log(`Active nav: ${info.snapshot.activeButton}`);

    // Step 4: Fill API Key
    log('STEP 4: 填入 API Key');
    const apiKeyInput = page.locator('input[type="password"]');
    await apiKeyInput.fill('sk-test-dummy-key-12345');
    await page.waitForTimeout(300);
    log(`API Key value: ${await apiKeyInput.inputValue()}`);

    // Step 5: Fill API URL
    log('STEP 5: 填入 API 地址');
    const baseUrlInput = page.locator('input[placeholder*="apihub"]');
    await baseUrlInput.fill('https://apihub.agnes-ai.com/v1');
    await page.waitForTimeout(300);
    log(`Base URL value: ${await baseUrlInput.inputValue()}`);

    // Step 7: Screenshot settings (before test connection)
    log('STEP 7: 截图设置页面 02-settings.png');
    await page.screenshot({ path: path.join(screenshotsDir, '02-settings.png'), fullPage: false });

    // Step 6: Click test connection
    log('STEP 6: 点击"测试连接"按钮');
    const testBtn = page.locator('button:has-text("测试连接")');
    await testBtn.click();
    await page.waitForTimeout(3500);
    info = await snapshotInfo(page, 'settings-after-test');
    log(`Status text: ${info.snapshot.statusText}`);

    // Step 8: Click create tab
    log('STEP 8: 点击"创作"导航按钮');
    const createBtn = page.locator('.nav-btn:has-text("创作")');
    await createBtn.click();
    await page.waitForTimeout(1000);
    info = await snapshotInfo(page, 'create');
    log(`Active nav: ${info.snapshot.activeButton}`);
    log(`Active media tab: ${info.snapshot.activeMediaTab}`);
    log(`Active sub tab: ${info.snapshot.activeSubTab}`);

    // Step 9 & 10: confirm image mode
    log('STEP 9/10: 确认图片生成和文生图选中');

    // Step 11: Fill prompt
    log('STEP 11: 输入提示词');
    const promptTa = page.locator('textarea').first();
    await promptTa.fill('一只可爱的橘猫坐在窗台上，夕阳余晖，电影感');
    await page.waitForTimeout(300);
    log(`Prompt value: ${await promptTa.inputValue()}`);

    // Step 12: Screenshot prompt filled
    log('STEP 12: 截图填好提示词 03-prompt-filled.png');
    await page.screenshot({ path: path.join(screenshotsDir, '03-prompt-filled.png'), fullPage: false });

    // Step 13: Click generate
    log('STEP 13: 点击"生成图片"按钮');
    const generateBtn = page.locator('button:has-text("生成图片")');
    const networkBefore = NETWORK_REQUESTS.length;
    await generateBtn.click();

    // Step 14: Wait 3 seconds
    log('STEP 14: 等待 3 秒');
    await page.waitForTimeout(3000);

    // Step 15: Screenshot result state
    log('STEP 15: 截图 04-generate-result.png');
    info = await snapshotInfo(page, 'after-generate');
    log(`Has generated image: ${!!info.snapshot.generatedImage}`);
    log(`Status: ${info.snapshot.statusText}`);
    log(`Error: ${info.snapshot.errorVisible}`);
    await page.screenshot({ path: path.join(screenshotsDir, '04-generate-result.png'), fullPage: false });

    // Step 16: Check for error
    const errorVisible = info.snapshot.errorVisible;
    log(`STEP 16: 错误状态: ${errorVisible ? 'YES - ' + errorVisible : 'NONE'}`);
    await page.screenshot({ path: path.join(screenshotsDir, '05-error.png'), fullPage: false });

    // Step 17: Switch to img2img
    log('STEP 17: 切换到"图生图"子标签');
    const img2imgBtn = page.locator('.sub-tab:has-text("图生图")');
    await img2imgBtn.click();
    await page.waitForTimeout(800);
    info = await snapshotInfo(page, 'img2img');
    log(`Active sub tab: ${info.snapshot.activeSubTab}`);
    await page.screenshot({ path: path.join(screenshotsDir, '06-img2img.png'), fullPage: false });

    // Step 18: Switch to video and back
    log('STEP 18: 切换到视频生成再切回来');
    const videoTabBtn = page.locator('.media-tab-btn:has-text("视频生成")');
    await videoTabBtn.click();
    await page.waitForTimeout(1000);
    log(`After click video: media tab = ${(await snapshotInfo(page, 'video')).snapshot.activeMediaTab}`);
    const imageTabBtn = page.locator('.media-tab-btn:has-text("图片生成")');
    await imageTabBtn.click();
    await page.waitForTimeout(1000);
    info = await snapshotInfo(page, 'back-to-image');
    log(`After click back to image: media tab = ${info.snapshot.activeMediaTab}, sub tab = ${info.snapshot.activeSubTab}`);
    await page.screenshot({ path: path.join(screenshotsDir, '07-tab-switch.png'), fullPage: false });

    // Step 19: Click gallery
    log('STEP 19: 点击"画廊"导航');
    const galleryBtn = page.locator('.nav-btn:has-text("画廊")');
    await galleryBtn.click();
    await page.waitForTimeout(1000);
    info = await snapshotInfo(page, 'gallery');
    log(`Active nav: ${info.snapshot.activeButton}`);
    await page.screenshot({ path: path.join(screenshotsDir, '08-gallery.png'), fullPage: false });

  } catch (err) {
    log(`ERROR: ${err.message}`);
    log(err.stack);
  } finally {
    writeFileSync(path.join(screenshotsDir, 'report.txt'), REPORT.join('\n'), 'utf8');
    writeFileSync(path.join(screenshotsDir, 'console.json'), JSON.stringify(CONSOLE_LOGS, null, 2), 'utf8');
    writeFileSync(path.join(screenshotsDir, 'network.json'), JSON.stringify(NETWORK_REQUESTS, null, 2), 'utf8');
    await browser.close();
  }
})();

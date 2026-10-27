'use strict';

/* =========================================================
   起始页逻辑
   1) 搜索框 + 搜索引擎下拉
   2) 右上角：设置抽屉（天气接口 / 城市）+ 主题与配色
   3) 天气卡片（数据源见 data/weather.js）
   4) 日历卡片
   ========================================================= */

const STORAGE_KEY = 'startpage.settings.v2';

const ENGINES = [
  { id: 'bing', name: '必应', url: 'https://cn.bing.com/search?q=' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=' },
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=' },
  { id: 'ddg', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
];

/* 主题色：与 style.css 里 html[data-accent] 一一对应 */
const ACCENTS = [
  { id: 'green', label: '翠绿', color: '#00a76e' },
  { id: 'blue', label: '蔚蓝', color: '#2f7cf6' },
  { id: 'purple', label: '紫罗兰', color: '#7c5cff' },
  { id: 'orange', label: '琥珀', color: '#ef8a3c' },
  { id: 'pink', label: '玫红', color: '#ec4899' },
  { id: 'cyan', label: '青碧', color: '#0891b2' },
  { id: 'indigo', label: '靛蓝', color: '#5b5bd6' },
  { id: 'lime', label: '青柠', color: '#65a30d' },
  { id: 'red', label: '绯红', color: '#e5484d' },
  { id: 'teal', label: '松石', color: '#0d9488' },
];

const $ = (sel) => document.querySelector(sel);

/* ---------------- 设置读写 ---------------- */
/* accentLocked：手动选过颜色就固定下来，否则每次打开随机一个 */
const DEFAULTS = { engine: 'bing', accent: 'green', theme: 'light', accentLocked: false };

function randomAccentId() {
  return ACCENTS[Math.floor(Math.random() * ACCENTS.length)].id;
}

function loadSettings() {
  const settings = { ...DEFAULTS };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (ENGINES.some((e) => e.id === parsed.engine)) settings.engine = parsed.engine;
    if (ACCENTS.some((a) => a.id === parsed.accent)) settings.accent = parsed.accent;
    if (parsed.theme === 'dark' || parsed.theme === 'light') settings.theme = parsed.theme;
    settings.accentLocked = parsed.accentLocked === true;
  } catch {
    /* 存储损坏时回落到默认值 */
  }
  if (!settings.accentLocked) settings.accent = randomAccentId();
  return settings;
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* 存储不可用时静默降级，不影响使用 */
  }
}

let settings = loadSettings();

/* ---------------- 输入判定 ---------------- */
/** 补全协议：输入 "example.com" 也能直接跳转 */
function normalizeUrl(raw) {
  const url = String(raw || '').trim();
  if (!url) return '';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) return url;
  return 'https://' + url;
}

/**
 * 判断输入是网址还是搜索词
 *   - 不含空格
 *   - 带协议前缀，或形如 host.tld / host.tld/path
 */
function looksLikeUrl(text) {
  const t = String(text || '').trim();
  if (!t || /\s/.test(t)) return false;

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(t)) return true;

  if (/^localhost(:\d+)?(\/|$)/i.test(t)) return true;
  if (/^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/|$)/.test(t)) return true;

  return /^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(:\d+)?([/?#]\S*)?$/i.test(t);
}

/* ---------------- 搜索 ---------------- */
function currentEngine() {
  return ENGINES.find((e) => e.id === settings.engine) || ENGINES[0];
}

function go(raw) {
  const value = String(raw || '').trim();
  if (!value) {
    $('#searchInput').focus();
    return;
  }

  if (looksLikeUrl(value)) {
    window.location.href = normalizeUrl(value);
    return;
  }

  window.location.href = currentEngine().url + encodeURIComponent(value);
}

/* ---------------- 引擎下拉 ---------------- */
function renderEngine() {
  const engine = currentEngine();
  $('#engineLabel').textContent = engine.name;
  $('#engineBtn').title = `当前搜索引擎：${engine.name}`;

  const menu = $('#engineMenu');
  menu.innerHTML = '';
  ENGINES.forEach((item) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'option');
    btn.setAttribute('aria-selected', String(item.id === settings.engine));
    btn.dataset.engine = item.id;

    const name = document.createElement('span');
    name.className = 'engine-name';
    name.textContent = item.name;

    const tick = document.createElement('span');
    tick.className = 'tick';
    tick.textContent = '✓';
    tick.setAttribute('aria-hidden', 'true');

    btn.append(name, tick);
    li.appendChild(btn);
    menu.appendChild(li);
  });
}

function openEngineMenu() {
  $('#engineMenu').hidden = false;
  $('#engineSelect').classList.add('open');
  $('#engineBtn').setAttribute('aria-expanded', 'true');
  const selected = $('#engineMenu').querySelector('[aria-selected="true"]');
  if (selected) selected.focus();
}

function closeEngineMenu() {
  $('#engineMenu').hidden = true;
  $('#engineSelect').classList.remove('open');
  $('#engineBtn').setAttribute('aria-expanded', 'false');
}

function toggleEngineMenu() {
  if ($('#engineMenu').hidden) openEngineMenu();
  else closeEngineMenu();
}

/** 选中某个搜索引擎：点击与键盘共用这一条路径 */
function pickEngine(id) {
  if (!ENGINES.some((e) => e.id === id)) return;
  settings.engine = id;
  saveSettings();
  renderEngine();
  closeEngineMenu();
  $('#searchInput').focus();
}

/* ---------------- 主题 ---------------- */
function applySettings() {
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.dataset.accent = settings.accent;

  const isDark = settings.theme === 'dark';
  $('#modeBtn').setAttribute('aria-checked', String(isDark));
  $('#modeLabel').textContent = isDark ? '浅色模式' : '深色模式';
  $('#modeBtn').setAttribute('aria-label', isDark ? '切换到浅色模式' : '切换到深色模式');
  document.querySelector('meta[name="color-scheme"]').content = isDark ? 'dark light' : 'light dark';
}

const SHUFFLE_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" '
  + 'stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<path d="M16 3h5v5"></path><path d="M4 20 21 3"></path>'
  + '<path d="M21 16v5h-5"></path><path d="m15 15 6 6"></path><path d="m4 4 5 5"></path></svg>';

function renderSwatches() {
  const box = $('#swatches');
  box.innerHTML = '';
  ACCENTS.forEach((accent) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch';
    /* 用 data-swatch 而非 data-accent：后者已作为属性挂在 <html> 上，避免选择器混淆 */
    btn.dataset.swatch = accent.id;
    btn.title = accent.label;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-label', accent.label);
    btn.setAttribute('aria-checked', String(settings.accentLocked && accent.id === settings.accent));
    btn.style.background = `linear-gradient(135deg, ${accent.color}, ${accent.color}bb)`;
    box.appendChild(btn);
  });

  /* 「随机」开关：开启后每次打开页面都换一个主题色 */
  const dice = document.createElement('button');
  dice.type = 'button';
  dice.className = 'swatch swatch-dice';
  dice.dataset.random = '1';
  dice.title = settings.accentLocked ? '改为每次打开随机主题色' : '每次打开随机主题色（已开启）';
  dice.setAttribute('role', 'radio');
  dice.setAttribute('aria-label', '每次打开随机主题色');
  dice.setAttribute('aria-checked', String(!settings.accentLocked));
  dice.innerHTML = SHUFFLE_SVG;
  box.appendChild(dice);
}

function setAccent(id) {
  if (!ACCENTS.some((a) => a.id === id)) return;
  settings.accent = id;
  settings.accentLocked = true;   // 手动选了颜色就不再随机
  saveSettings();
  applySettings();
  renderSwatches();
}

/** 恢复「每次打开随机」：立即换一个与当前不同的颜色 */
function randomizeAccent() {
  let id = randomAccentId();
  if (ACCENTS.length > 1 && id === settings.accent) {
    id = ACCENTS[(ACCENTS.findIndex((a) => a.id === id) + 1) % ACCENTS.length].id;
  }
  settings.accent = id;
  settings.accentLocked = false;
  saveSettings();
  applySettings();
  renderSwatches();
}

function toggleTheme() {
  settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
  saveSettings();
  applySettings();
}

/* ---------------- 主题面板开关 ---------------- */
function openPanel() {
  $('#themePanel').hidden = false;
  $('#themeBtn').classList.add('active');
  $('#themeBtn').setAttribute('aria-expanded', 'true');
}

function closePanel() {
  $('#themePanel').hidden = true;
  $('#themeBtn').classList.remove('active');
  $('#themeBtn').setAttribute('aria-expanded', 'false');
}

function togglePanel() {
  if ($('#themePanel').hidden) openPanel();
  else closePanel();
}

/* =========================================================
   天气：数据源 = data/weather.js（预置）+ localStorage（自定义与选择）
   ========================================================= */
const WEATHER_CONFIG_KEY = 'startpage.weather.config';
const WEATHER_CACHE_KEY = 'startpage.weather.cache';
const WEATHER_TTL = 15 * 60 * 1000;  // 15 分钟内复用缓存
const DEFAULT_WEATHER_API = 'https://api.hgovo.cn/API/zgtq';

/** 读取 data/weather.js 暴露的预置清单 */
function readPresets() {
  const raw = (typeof window !== 'undefined' && window.WEATHER_DATA) || {};
  const apis = (Array.isArray(raw.apis) ? raw.apis : [])
    .filter((a) => a && a.id && typeof a.url === 'string' && a.url.trim());
  const cities = (Array.isArray(raw.cities) ? raw.cities : [])
    .filter((c) => c && c.id && typeof c.city === 'string' && c.city.trim());

  if (!apis.length) apis.push({ id: 'hgovo', name: '默认接口', url: DEFAULT_WEATHER_API });
  if (!Array.isArray(raw.apis)) {
    console.warn('[起始页] 未读取到 data/weather.js，天气接口已回落到内置默认值');
  }
  return { apis, cities };
}

const PRESETS = readPresets();

const isValidApi = (x) => x && typeof x.id === 'string' && x.id
  && typeof x.url === 'string' && !!x.url.trim();
const isValidCity = (x) => x && typeof x.id === 'string' && x.id
  && typeof x.city === 'string' && !!x.city.trim();

/** 比较接口地址：忽略协议、查询串与末尾斜杠，同一接口的不同参数视为同一个 */
const apiKeyOf = (url) => String(url || '').trim().toLowerCase()
  .replace(/^https?:\/\//, '')
  .replace(/\/+$/, '')
  .split('?')[0];

/**
 * 读取天气配置
 *   { apiId, cityId, customApis[], customCities[] }
 * 旧版 { api, city } 两个字符串会自动迁移为自定义条目
 */
function readWeatherConfig() {
  const cfg = { apiId: '', cityId: '', customApis: [], customCities: [] };

  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(WEATHER_CONFIG_KEY) || 'null');
  } catch {
    raw = null;
  }
  if (!raw || typeof raw !== 'object') return cfg;

  if (Array.isArray(raw.customApis)) cfg.customApis = raw.customApis.filter(isValidApi);
  if (Array.isArray(raw.customCities)) cfg.customCities = raw.customCities.filter(isValidCity);
  if (typeof raw.apiId === 'string') cfg.apiId = raw.apiId;
  if (typeof raw.cityId === 'string') cfg.cityId = raw.cityId;

  /* 旧版 { api, city }：地址 / 城市与预置一致时直接复用预置条目，不再造「旧版接口」 */
  if (!cfg.apiId && typeof raw.api === 'string' && raw.api.trim()) {
    const url = raw.api.trim();
    const preset = PRESETS.apis.find((a) => apiKeyOf(a.url) === apiKeyOf(url));
    if (preset) {
      cfg.apiId = preset.id;
    } else {
      let item = cfg.customApis.find((a) => a.url === url);
      if (!item) {
        item = { id: 'legacy-api', name: '旧版接口', url };
        cfg.customApis.push(item);
      }
      cfg.apiId = item.id;
    }
  }

  if (!cfg.cityId && typeof raw.city === 'string' && raw.city.trim()) {
    const name = raw.city.trim();
    const preset = PRESETS.cities.find((c) => c.city === name);
    if (preset) {
      cfg.cityId = preset.id;
    } else {
      let item = cfg.customCities.find((c) => c.city === name);
      if (!item) {
        item = { id: 'legacy-city', province: '', city: name };
        cfg.customCities.push(item);
      }
      cfg.cityId = item.id;
    }
  }

  /* 清掉与预置重复的自定义条目（历史配置里可能已经写进去了） */
  cfg.customApis = cfg.customApis.filter((a) => {
    const dup = PRESETS.apis.find((p) => apiKeyOf(p.url) === apiKeyOf(a.url));
    if (!dup) return true;
    if (cfg.apiId === a.id) cfg.apiId = dup.id;
    return false;
  });

  cfg.customCities = cfg.customCities.filter((c) => {
    const dup = PRESETS.cities.find((p) => p.city === c.city
      && String(p.district || '').trim() === String(c.district || '').trim());
    if (!dup) return true;
    if (cfg.cityId === c.id) cfg.cityId = dup.id;
    return false;
  });

  return cfg;
}

let weatherCfg = readWeatherConfig();

function writeWeatherConfig() {
  try {
    localStorage.setItem(WEATHER_CONFIG_KEY, JSON.stringify(weatherCfg));
  } catch {
    /* 存储不可用时忽略 */
  }
}

/* 把去重后的配置写回，避免历史重复项每次都重新计算 */
writeWeatherConfig();

const apiList = () => [...PRESETS.apis, ...weatherCfg.customApis];
const cityList = () => [...PRESETS.cities, ...weatherCfg.customCities];
const isCustomApi = (id) => weatherCfg.customApis.some((a) => a.id === id);
const isCustomCity = (id) => weatherCfg.customCities.some((c) => c.id === id);

function currentApi() {
  const list = apiList();
  return list.find((a) => a.id === weatherCfg.apiId) || list[0] || null;
}

function currentCity() {
  return cityList().find((c) => c.id === weatherCfg.cityId) || null;
}

/** 展示用名称：省 + 市 + 区；直辖市等省名与市名相同时只显示一次 */
function cityLabel(city) {
  if (!city) return '未设置';

  const parts = [city.province, city.city, city.district]
    .map((s) => String(s || '').trim())
    .filter(Boolean);

  /* 相邻重复项去重：「北京市 北京市 朝阳区」→「北京市 朝阳区」 */
  const uniq = parts.filter((p, i) => i === 0 || p !== parts[i - 1]);
  return uniq.length ? uniq.join(' ') : '未设置';
}

/**
 * 传给接口的名称
 *   有 district 时用「城市+区」（如 广州市天河区），既精确到区，
 *   又能避开「天河」被解析成武汉天河机场这类同名歧义；
 *   否则去掉末尾行政后缀（杭州市 → 杭州）。
 */
function cityQuery(city) {
  if (!city) return '';

  const explicit = String(city.query || '').trim();
  if (explicit) return explicit;

  const name = String(city.city || '').trim();
  const district = String(city.district || '').trim();
  if (district) return name + district;

  return name.replace(/(特别行政区|自治区|市|地区|盟)$/, '');
}

/* ---------------- 天气缓存 ---------------- */
function readWeatherCache(cityId, apiUrl) {
  try {
    const c = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || 'null');
    if (!c || !c.at || Date.now() - c.at > WEATHER_TTL) return null;
    if (c.cityId !== cityId || c.apiUrl !== apiUrl) return null;
    return c.data || null;
  } catch {
    return null;
  }
}

function writeWeatherCache(data, cityId, apiUrl) {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
      data, cityId, apiUrl, at: Date.now(),
    }));
  } catch {
    /* 存储不可用时忽略 */
  }
}

/* 天气描述 → 图标（按关键字匹配，覆盖常见天气词） */
function weatherIcon(text) {
  const t = (text || '').trim();
  if (!t) return '🌡️';
  if (/雷/.test(t)) return '⛈️';
  if (/雪/.test(t)) return /大|暴/.test(t) ? '❄️' : '🌨️';
  if (/雨/.test(t)) return /大|暴/.test(t) ? '🌧️' : '🌦️';
  if (/雾|霾|沙|尘/.test(t)) return '🌫️';
  if (/阴/.test(t)) return '☁️';
  if (/多云/.test(t)) return '⛅';
  if (/晴/.test(t)) return '☀️';
  return '🌡️';
}

/* ---------------- 天气状态视图 ---------------- */
function showWeatherEmpty() {
  const body = $('#weatherBody');
  body.innerHTML = '<div class="weather-empty"><span>请先在设置中选择城市</span>'
    + '<button type="button">打开设置</button></div>';
  body.querySelector('button').addEventListener('click', openDrawer);
}

function showWeatherLoading() {
  $('#weatherBody').innerHTML = '<div class="weather-loading">正在获取天气…</div>';
}

function showWeatherError(message) {
  const body = $('#weatherBody');
  body.innerHTML = '';

  const box = document.createElement('div');
  box.className = 'weather-error';

  const text = document.createElement('span');
  text.textContent = message;

  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = '重试';
  retry.addEventListener('click', () => loadWeather(true));

  box.append(text, retry);
  body.appendChild(box);
}

/**
 * 取「今天起」的若干天预报
 *   接口首项可能是今天也可能是昨天，所以按 date 字段（如 "10.29"）判断，
 *   只丢弃已经过去的日子；缺 date 时才退回旧规则。
 */
function upcomingDays(forecast, count) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const base = today.getTime();

  const dated = forecast
    .map((day) => {
      const m = /^(\d{1,2})\D(\d{1,2})$/.exec(String(day.date || '').trim());
      if (!m) return null;
      const at = new Date(today.getFullYear(), Number(m[1]) - 1, Number(m[2]));
      /* 跨年：接口给的是一月的日期而当前是十二月 */
      if (at.getTime() < base - 180 * 86400000) at.setFullYear(at.getFullYear() + 1);
      return { day, at: at.getTime() };
    })
    .filter((x) => x && x.at >= base)
    .sort((a, b) => a.at - b.at)
    .slice(0, count)
    .map((x) => x.day);

  return dated.length ? dated : forecast.slice(0, count);
}

function renderWeather(data, city) {
  const body = $('#weatherBody');
  body.innerHTML = '';

  const loc = data.location || {};
  /* 以本地配置为准：选了区就保留区名，不被接口返回的市级名称覆盖 */
  $('#weatherCityName').textContent = cityLabel({
    province: city.province || loc.province,
    city: city.city || loc.city || loc.name,
    district: city.district,
  });

  // ---- 上部分：今日天气 ----
  const cur = data.current || {};

  const now = document.createElement('div');
  now.className = 'weather-now';

  const iconEl = document.createElement('div');
  iconEl.className = 'weather-icon';
  iconEl.textContent = weatherIcon(cur.weather);
  iconEl.setAttribute('aria-hidden', 'true');

  const main = document.createElement('div');
  main.className = 'weather-main';

  const temp = document.createElement('div');
  temp.className = 'weather-temp';
  temp.innerHTML = `${cur.temperature || '--'}<sup>°C</sup>`;

  const descEl = document.createElement('div');
  descEl.className = 'weather-desc';
  descEl.textContent = cur.weather || '—';

  main.append(temp, descEl);
  now.append(iconEl, main);

  const meta = document.createElement('div');
  meta.className = 'weather-meta';

  [
    cur.wind && cur.wind_level ? `${cur.wind} ${cur.wind_level}` : '',
    cur.humidity ? `湿度 ${cur.humidity}` : '',
    cur.pressure ? `气压 ${cur.pressure}` : '',
    cur.air_quality ? `空气 ${cur.air_quality}` : '',
  ].filter(Boolean).forEach((t) => {
    const span = document.createElement('span');
    span.textContent = t;
    meta.appendChild(span);
  });

  body.append(now, meta);

  // ---- 下部分：未来几天气温折线图（天数按接口返回的为准） ----
  const forecast = upcomingDays(data.forecast || [], 8);
  if (forecast.length) {
    forecastDays = forecast;
    mountForecastChart(body, forecast);
  }
}

/* 当前渲染的预报，窗口尺寸变化时用来重绘（图表按实际像素绘制） */
let forecastDays = [];

function mountForecastChart(parent, days) {
  const wrap = document.createElement('div');
  wrap.className = 'weather-forecast';
  parent.appendChild(wrap);
  drawForecastChart(wrap, days);
}

/** 顶部星期 + 淡灰列底板 + 双折线 + 底部天气类型，按容器实际尺寸绘制 */
function drawForecastChart(wrap, days) {
  wrap.innerHTML = '';

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'weather-chart');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `未来${days.length}天天气与气温`);
  wrap.appendChild(svg);

  /* 1 单位 = 1 像素：图形自然铺满整宽，也不会因缩放变形 */
  const box = svg.getBoundingClientRect();
  const W = Math.max(240, Math.round(box.width) || 360);
  const H = Math.max(110, Math.round(box.height) || 160);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const add = (tag, attrs) => {
    const el = document.createElementNS(ns, tag);
    Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k]));
    svg.appendChild(el);
    return el;
  };

  const colW = W / days.length;
  const cx = (i) => colW * i + colW / 2;

  const highs = days.map((d) => parseInt(d.high_temp, 10) || 0);
  const lows = days.map((d) => parseInt(d.low_temp, 10) || 0);
  const minVal = Math.min(...lows);
  const maxVal = Math.max(...highs);
  const pad = Math.max(2, Math.ceil((maxVal - minVal) * 0.2));
  const lo = minVal - pad;
  const hi = maxVal + pad;
  const span = Math.max(1, hi - lo);

  const chartTop = 38;
  const chartBot = H - 44;
  const chartH = Math.max(20, chartBot - chartTop);
  const cy = (v) => chartTop + ((hi - v) / span) * chartH;

  // 1) 每列的淡灰底板：从周几到天气类型整列包住
  days.forEach((d, i) => {
    add('rect', {
      x: (colW * i + 2).toFixed(1),
      y: 1,
      width: Math.max(0, colW - 4).toFixed(1),
      height: (H - 2).toFixed(1),
      rx: 10,
      class: 'col-bg',
    });
  });

  // 2) 顶部：只显示周几
  days.forEach((d, i) => {
    const t = add('text', {
      x: cx(i).toFixed(1),
      y: 20,
      'text-anchor': 'middle',
      class: 'day-label',
    });
    t.textContent = d.day_of_week || '';
  });

  // 3) 双折线：最高温实线 / 最低温浅线
  const hiPts = days.map((d, i) => `${cx(i).toFixed(1)},${cy(highs[i]).toFixed(1)}`).join(' ');
  const loPts = days.map((d, i) => `${cx(i).toFixed(1)},${cy(lows[i]).toFixed(1)}`).join(' ');
  add('polyline', { points: hiPts, class: 'hi-line' });
  add('polyline', { points: loPts, class: 'lo-line' });

  // 4) 数据点 + 气温数值 + 底部天气类型
  days.forEach((d, i) => {
    const x = cx(i).toFixed(1);
    const hy = cy(highs[i]);
    const ly = cy(lows[i]);

    add('circle', { cx: x, cy: hy.toFixed(1), r: 3, class: 'hi-dot' });
    add('circle', { cx: x, cy: ly.toFixed(1), r: 2.6, class: 'lo-dot' });

    const hiText = add('text', {
      x, y: Math.max(32, hy - 9).toFixed(1), 'text-anchor': 'middle', class: 'hi-label',
    });
    hiText.textContent = `${highs[i]}°`;

    const loText = add('text', {
      x, y: Math.min(H - 30, ly + 15).toFixed(1), 'text-anchor': 'middle', class: 'lo-label',
    });
    loText.textContent = `${lows[i]}°`;

    const wxText = add('text', {
      x, y: H - 13, 'text-anchor': 'middle', class: 'wx-label',
    });
    wxText.textContent = weatherType(d);
  });
}

/** 白天与夜间不同则写成「多云转晴」 */
function weatherType(day) {
  const d = String(day.day_weather || '').trim();
  const n = String(day.night_weather || '').trim();
  if (d && n && d !== n) return `${d}转${n}`;
  return d || n || '—';
}

/** 请求天气接口：{api}?city=城市名 */
async function fetchWeather(api, city) {
  const url = `${api}${api.includes('?') ? '&' : '?'}city=${encodeURIComponent(city)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const json = await res.json();
  if (json.code !== 200 || !json.data) throw new Error(json.message || '接口返回异常');
  return json.data;
}

/** 主入口：未选城市显示空状态，已选则走缓存或请求 */
function loadWeather(force = false) {
  const city = currentCity();
  const api = currentApi();
  const btn = $('#weatherRefresh');

  if (!city) {
    $('#weatherCityName').textContent = '未设置';
    showWeatherEmpty();
    return;
  }

  $('#weatherCityName').textContent = cityLabel(city);

  if (!api) {
    showWeatherError('尚未配置天气接口，请在设置中添加');
    return;
  }

  btn.classList.add('spinning');
  const done = () => btn.classList.remove('spinning');

  if (!force) {
    const cached = readWeatherCache(city.id, api.url);
    if (cached) {
      renderWeather(cached, city);
      done();
      return;
    }
  }

  showWeatherLoading();
  fetchWeather(api.url, cityQuery(city))
    .then((data) => {
      writeWeatherCache(data, city.id, api.url);
      renderWeather(data, city);
    })
    .catch((err) => {
      showWeatherError(`天气获取失败：${err.message || '请检查网络'}`);
    })
    .finally(done);
}

/* =========================================================
   设置抽屉
   ========================================================= */
function openDrawer() {
  const drawer = $('#drawer');
  if (drawer.classList.contains('open')) return;

  renderApiList();
  renderCityList();

  drawer.classList.add('open');
  $('#drawerMask').classList.add('open');
  $('#settingsBtn').classList.add('active');
  $('#settingsBtn').setAttribute('aria-expanded', 'true');

  const first = $('#gameSelect') || $('#apiList .opt') || $('#drawerClose');
  first.focus({ preventScroll: true });
}

function closeDrawer() {
  const drawer = $('#drawer');
  if (!drawer.classList.contains('open')) return;

  drawer.classList.remove('open');
  $('#drawerMask').classList.remove('open');
  $('#settingsBtn').classList.remove('active');
  $('#settingsBtn').setAttribute('aria-expanded', 'false');
  $('#settingsBtn').focus({ preventScroll: true });
}

function renderApiList() {
  const box = $('#apiList');
  box.innerHTML = '';
  const selected = currentApi();

  apiList().forEach((api) => {
    const row = document.createElement('div');
    row.className = 'opt-row';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'opt';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(!!selected && api.id === selected.id));
    btn.dataset.apiId = api.id;

    const main = document.createElement('span');
    main.className = 'opt-main';

    const name = document.createElement('span');
    name.className = 'opt-name';
    name.textContent = api.name || '未命名接口';

    const sub = document.createElement('span');
    sub.className = 'opt-sub';
    sub.textContent = api.url;

    main.append(name, sub);

    const tick = document.createElement('span');
    tick.className = 'tick';
    tick.textContent = '✓';
    tick.setAttribute('aria-hidden', 'true');

    btn.append(main, tick);
    row.appendChild(btn);

    if (isCustomApi(api.id)) {
      row.appendChild(deleteButton('delApi', api.id, `删除接口 ${api.name || api.url}`));
    }
    box.appendChild(row);
  });
}

/** 城市：只显示当前城市，换城市用下方表单新增 */
function renderCityList() {
  const box = $('#cityList');
  box.innerHTML = '';
  const city = currentCity();

  if (!city) {
    const empty = document.createElement('p');
    empty.className = 'opt-empty';
    empty.textContent = '尚未选择城市，请在下方填写并添加。';
    box.appendChild(empty);
    return;
  }

  const row = document.createElement('div');
  row.className = 'opt-row';

  const card = document.createElement('div');
  card.className = 'opt is-current';

  const main = document.createElement('span');
  main.className = 'opt-main';

  const name = document.createElement('span');
  name.className = 'opt-name';
  name.textContent = cityLabel(city);

  const sub = document.createElement('span');
  sub.className = 'opt-sub';
  sub.textContent = '当前城市';

  main.append(name, sub);
  card.appendChild(main);
  row.appendChild(card);

  if (isCustomCity(city.id)) {
    row.appendChild(deleteButton('delCity', city.id, `删除城市 ${cityLabel(city)}`));
  }
  box.appendChild(row);
}

function deleteButton(attr, id, label) {
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'opt-del';
  del.dataset[attr] = id;
  del.title = '删除';
  del.setAttribute('aria-label', label);
  del.textContent = '×';
  return del;
}

function pickApi(id) {
  if (!apiList().some((a) => a.id === id)) return;
  weatherCfg.apiId = id;
  writeWeatherConfig();
  renderApiList();
  loadWeather(true);
}

function removeApi(id) {
  weatherCfg.customApis = weatherCfg.customApis.filter((a) => a.id !== id);
  if (weatherCfg.apiId === id) weatherCfg.apiId = '';
  writeWeatherConfig();
  renderApiList();
  loadWeather(true);
}

function removeCity(id) {
  weatherCfg.customCities = weatherCfg.customCities.filter((c) => c.id !== id);
  if (weatherCfg.cityId === id) weatherCfg.cityId = '';
  writeWeatherConfig();
  renderCityList();
  loadWeather(true);
}

function setFormMsg(el, text, kind) {
  el.textContent = text;
  el.className = 'form-msg' + (kind ? ' ' + kind : '');
  clearTimeout(el._timer);
  if (text) {
    el._timer = setTimeout(() => {
      el.textContent = '';
      el.className = 'form-msg';
    }, 3000);
  }
}

function addApi(name, url) {
  const exists = apiList().find((a) => a.url === url);
  if (exists) {
    weatherCfg.apiId = exists.id;
    return '该接口已存在，已切换为当前接口';
  }
  const item = {
    id: 'api-' + Date.now().toString(36),
    name: name || `自定义接口 ${weatherCfg.customApis.length + 1}`,
    url,
  };
  weatherCfg.customApis.push(item);
  weatherCfg.apiId = item.id;
  return '接口已添加并启用';
}

function addCity(province, city, district) {
  const exists = cityList().find((c) => c.city === city
    && String(c.district || '').trim() === String(district || '').trim());
  if (exists) {
    weatherCfg.cityId = exists.id;
    return '该城市已存在，已切换为当前城市';
  }

  const item = { id: 'city-' + Date.now().toString(36), province, city };
  if (district) item.district = district;
  weatherCfg.customCities.push(item);
  weatherCfg.cityId = item.id;
  return '城市已添加并启用';
}

function bindDrawer() {
  $('#settingsBtn').addEventListener('click', openDrawer);
  $('#drawerClose').addEventListener('click', closeDrawer);
  $('#drawerMask').addEventListener('click', closeDrawer);

  // 切换赛事：记住选择并重新拉取该赛事赛程
  $('#gameSelect').addEventListener('change', (e) => {
    const id = e.target.value;
    if (!id || id === lolLeagueId) return;
    lolLeagueId = id;
    writeLolPref(id);
    loadLolMatches(id);
  });

  // 选择 / 删除（事件委托）
  $('#apiList').addEventListener('click', (e) => {
    const del = e.target.closest('[data-del-api]');
    if (del) { removeApi(del.dataset.delApi); return; }
    const opt = e.target.closest('[data-api-id]');
    if (opt) pickApi(opt.dataset.apiId);
  });

  /* 城市行只做展示，仅「删除自定义城市」需要处理 */
  $('#cityList').addEventListener('click', (e) => {
    const del = e.target.closest('[data-del-city]');
    if (del) removeCity(del.dataset.delCity);
  });

  // 新增接口
  $('#apiForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const nameEl = $('#apiName');
    const urlEl = $('#apiUrl');
    const msg = $('#apiMsg');

    let url = urlEl.value.trim();
    if (!url) {
      setFormMsg(msg, '请填写接口地址', 'err');
      urlEl.focus();
      return;
    }
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    if (!/^https?:\/\/[^\s/?#]+/i.test(url)) {
      setFormMsg(msg, '接口地址格式不正确', 'err');
      urlEl.focus();
      return;
    }

    const feedback = addApi(nameEl.value.trim(), url);
    writeWeatherConfig();
    nameEl.value = '';
    urlEl.value = '';
    renderApiList();
    setFormMsg(msg, feedback, 'ok');
    loadWeather(true);
  });

  // 新增城市
  $('#cityForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const provinceEl = $('#cityProvince');
    const cityEl = $('#cityName');
    const districtEl = $('#cityDistrict');
    const msg = $('#cityMsg');

    const city = cityEl.value.trim();
    if (!city) {
      setFormMsg(msg, '请填写城市名称', 'err');
      cityEl.focus();
      return;
    }

    const feedback = addCity(provinceEl.value.trim(), city, districtEl.value.trim());
    writeWeatherConfig();
    provinceEl.value = '';
    cityEl.value = '';
    districtEl.value = '';
    renderCityList();
    setFormMsg(msg, feedback, 'ok');
    loadWeather(true);
  });

  // Tab 焦点循环，避免焦点跑到抽屉背后的页面
  $('#drawer').addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const items = [...$('#drawer').querySelectorAll('button, input, select')]
      .filter((el) => !el.disabled && el.getClientRects().length);
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

/* ---------------- 事件 ---------------- */
function bindEvents() {
  // 搜索提交
  $('#searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    go($('#searchInput').value);
  });

  // 引擎下拉：开合
  $('#engineBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleEngineMenu();
  });

  // 引擎按钮的键盘打开：Enter / Space 显式处理
  // （部分浏览器在 click 默认行为里对 Enter 的合成不一定稳定，这里补一次自己开合）
  $('#engineBtn').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    e.stopPropagation();
    if ($('#engineMenu').hidden) openEngineMenu();
    else { closeEngineMenu(); $('#engineBtn').focus(); }
  });

  // 引擎下拉：选择
  $('#engineMenu').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-engine]');
    if (!btn) return;
    pickEngine(btn.dataset.engine);
  });

  // 键盘：下拉内上下移动 / Enter 选中 / Esc 关闭
  $('#engineMenu').addEventListener('keydown', (e) => {
    const items = [...$('#engineMenu').querySelectorAll('[data-engine]')];
    const index = items.indexOf(document.activeElement);

    if (e.key === 'Escape') {
      e.preventDefault();
      closeEngineMenu();
      $('#engineBtn').focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      // 菜单项用 <button> 承载，但键盘选择统一走这里，避免依赖合成 click
      e.preventDefault();
      e.stopPropagation();
      if (items[index]) pickEngine(items[index].dataset.engine);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      items[(index + step + items.length) % items.length].focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      items[e.key === 'Home' ? 0 : items.length - 1].focus();
    }
  });

  // 主题按钮开合
  $('#themeBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    togglePanel();
  });

  // 颜色选择 / 随机开关
  $('#swatches').addEventListener('click', (e) => {
    if (e.target.closest('[data-random]')) {
      randomizeAccent();
      return;
    }
    const btn = e.target.closest('[data-swatch]');
    if (!btn) return;
    setAccent(btn.dataset.swatch);
  });

  // 明暗切换
  $('#modeBtn').addEventListener('click', toggleTheme);

  // 点外部 / Esc 关闭浮层
  document.addEventListener('click', (e) => {
    if (!$('#themePanel').hidden && !e.target.closest('.topbar')) closePanel();
    if (!$('#engineMenu').hidden && !e.target.closest('.engine-select')) closeEngineMenu();
  });

  document.addEventListener('keydown', (e) => {
    const input = $('#searchInput');
    const active = document.activeElement;
    const inInput = active === input;
    /* 正在输入框里打字时不抢快捷键 */
    const typing = !!active && (active.tagName === 'INPUT'
      || active.tagName === 'TEXTAREA' || active.isContentEditable);

    if (e.key === 'Escape') {
      if ($('#drawer').classList.contains('open')) { closeDrawer(); return; }
      if (!$('#themePanel').hidden) { closePanel(); $('#themeBtn').focus(); return; }
      if (!$('#engineMenu').hidden) { closeEngineMenu(); $('#engineBtn').focus(); return; }
      if (inInput) input.blur();
      return;
    }

    // / 或 Ctrl/⌘+K 聚焦搜索框
    if ((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });
}

/* =========================================================
   LoL 赛程：Riot 官方赛事接口
   esports-api.lolesports.com 带 Access-Control-Allow-Origin: *，
   静态页可直接请求，不需要任何本地代理。
   Key / 语言 / 排除项见 data/lol.js
   ========================================================= */
const LOL_PREF_KEY = 'startpage.lol.league';

const LOL = {
  apiKey: '',
  base: 'https://esports-api.lolesports.com/persisted/gw',
  hl: 'zh-CN',
  exclude: ['tft_esports'],
  /* 队徽图片代理前缀（如 https://your-worker.workers.dev/?url=），留空则直连官方源 */
  logoProxy: '',
  ...(typeof window !== 'undefined' && window.LOL_CONFIG ? window.LOL_CONFIG : {}),
};

/** 统一请求：拼 hl 参数并带 x-api-key，返回 data 字段 */
async function lolGet(path, params) {
  const qs = new URLSearchParams({ hl: LOL.hl, ...(params || {}) });
  const res = await fetch(`${LOL.base}/${path}?${qs}`, {
    headers: { 'x-api-key': LOL.apiKey },
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const json = await res.json();
  if (!json || !json.data) throw new Error('返回结构异常');
  return json.data;
}

const LOL_CACHE_KEY = 'startpage.lol.cache';   // 运行时缓存（浏览器 localStorage）

let lolStore = { leagues: [], schedules: {} };  // { leagues:[{id,name}], schedules:{ id:{ at, events } } }
let lolLeagues = [];
let lolLeagueId = '';
let lolMatches = {};      // 'YYYY-MM-DD' → 当天比赛
let lolCacheAt = 0;       // 当前赛程数据的缓存时间戳
let lolState = 'idle';    // idle | loading | stale | ready | fail
let lolMessage = '';

function readLolPref() {
  try {
    return localStorage.getItem(LOL_PREF_KEY) || '';
  } catch {
    return '';
  }
}

function writeLolPref(id) {
  try {
    localStorage.setItem(LOL_PREF_KEY, id);
  } catch {
    /* 存储不可用时忽略 */
  }
}

function lolMatchCount() {
  return Object.keys(lolMatches).reduce((n, k) => n + lolMatches[k].length, 0);
}

/** 赛事下拉：加载完成后填充，默认选中第一项 */
function renderGameSelect() {
  const sel = $('#gameSelect');
  if (!sel) return;

  sel.innerHTML = '';
  if (!lolLeagues.length) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = lolState === 'loading' ? '正在获取赛事列表…' : '暂无赛事';
    sel.appendChild(opt);
    sel.disabled = true;
    return;
  }

  sel.disabled = false;
  lolLeagues.forEach((g) => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.name;
    sel.appendChild(opt);
  });
  sel.value = lolLeagueId;
}

function renderLolStatus() {
  const el = $('#lolStatus');
  if (!el) return;

  el.className = 'lol-status';
  const ago = lolCacheAt ? formatAgo(lolCacheAt) : '';

  if (lolState === 'loading') {
    el.textContent = '正在获取赛程…';
  } else if (lolState === 'stale') {
    el.textContent = ago ? `缓存数据（${ago}）· 正在更新…` : '正在更新…';
  } else if (lolState === 'fail') {
    el.textContent = (lolMessage || '赛程获取失败') + (ago ? `（当前显示 ${ago}的缓存）` : '');
    el.classList.add('err');
  } else if (lolState === 'ready') {
    el.textContent = lolMatchCount()
      ? `已获取 ${lolMatchCount()} 场对阵${ago ? ` · 更新于 ${ago}` : ''}`
      : '该赛事暂无对阵';
  } else {
    el.textContent = '';
  }
}

/** 时间戳 → 「刚刚 / N 分钟前 / N 小时前 / N 天前」 */
function formatAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60 * 1000) return '刚刚';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}

/* ---------------- 缓存读写 ---------------- */
const isValidStore = (s) => s && Array.isArray(s.leagues) && s.leagues.length
  && s.schedules && typeof s.schedules === 'object';

function readLocalCache() {
  try {
    const s = JSON.parse(localStorage.getItem(LOL_CACHE_KEY) || 'null');
    return isValidStore(s) ? s : null;
  } catch {
    return null;
  }
}

function writeLocalCache() {
  try {
    localStorage.setItem(LOL_CACHE_KEY, JSON.stringify(lolStore));
  } catch {
    /* 超出配额时只保留当前赛事的赛程再试一次 */
    try {
      const keep = {};
      if (lolStore.schedules[lolLeagueId]) keep[lolLeagueId] = lolStore.schedules[lolLeagueId];
      localStorage.setItem(LOL_CACHE_KEY, JSON.stringify({ leagues: lolStore.leagues, schedules: keep }));
    } catch {
      /* 仍失败则放弃持久化，本次会话内仍可用 */
    }
  }
}

/** 最多保留 3 个赛事的赛程，避免缓存无限增长 */
function trimStore() {
  const ids = Object.keys(lolStore.schedules);
  if (ids.length <= 3) return;
  ids.sort((a, b) => (lolStore.schedules[b].at || 0) - (lolStore.schedules[a].at || 0))
    .slice(3)
    .forEach((id) => { delete lolStore.schedules[id]; });
}

/** 用内存缓存渲染：下拉 + 当前赛事日程 */
function applyStore() {
  lolLeagues = lolStore.leagues || [];
  if (!lolLeagues.length) return;

  if (!lolLeagues.some((g) => g.id === lolLeagueId)) {
    const saved = readLolPref();
    lolLeagueId = lolLeagues.some((g) => g.id === saved) ? saved : lolLeagues[0].id;
  }
  renderGameSelect();

  const entry = lolStore.schedules[lolLeagueId];
  if (entry && Array.isArray(entry.events)) {
    lolMatches = bucketEvents(entry.events);
    preloadTeamLogos(lolMatches);
    lolCacheAt = entry.at || 0;
  } else {
    lolMatches = {};
    lolCacheAt = 0;
  }
  renderCalendar();
}

/** 只保留英雄联盟赛事：排除配置里的 slug，并按名称兜底过滤 */
function filterLeagues(list) {
  const excluded = new Set((LOL.exclude || []).map((s) => String(s).toLowerCase()));
  return (list || [])
    .filter((l) => l && l.id && l.slug
      && !excluded.has(String(l.slug).toLowerCase())
      && !/tft|云顶/i.test(String(l.name || '') + String(l.slug || '')))
    .map((l) => ({ id: String(l.id), name: String(l.name || l.slug).trim() }));
}

async function loadLol() {
  if (!LOL.apiKey) {
    lolState = 'fail';
    lolMessage = '缺少接口 Key，请检查 data/lol.js';
    renderGameSelect();
    renderLolStatus();
    return;
  }

  /* 1) 先用浏览器缓存渲染，避免等接口时白屏 */
  const local = readLocalCache();
  if (local) lolStore = local;

  if (lolStore.leagues.length) {
    applyStore();
    lolState = 'stale';
    renderLolStatus();
  } else {
    lolState = 'loading';
    renderGameSelect();
    renderLolStatus();
  }

  /* 2) 后台刷新 */
  await refreshLol();
}

/** 拉赛事列表，再拉当前赛事的赛程 */
async function refreshLol() {
  try {
    const data = await lolGet('getLeagues');
    const list = filterLeagues(data.leagues);
    if (list.length) {
      lolStore.leagues = list;
      if (!list.some((g) => g.id === lolLeagueId)) lolLeagueId = list[0].id;
      lolLeagues = list;
      renderGameSelect();
    }
  } catch (e) {
    lolState = 'fail';
    lolMessage = `赛事列表更新失败：${e.message}`;
    renderLolStatus();
    return;
  }

  if (!lolStore.leagues.length) {
    lolState = 'fail';
    lolMessage = '赛事列表为空';
    renderGameSelect();
    renderLolStatus();
    return;
  }

  writeLolPref(lolLeagueId);
  await loadLolMatches(lolLeagueId);
}

async function loadLolMatches(id) {
  /* 该赛事有缓存就先渲染出来，再后台更新 */
  const entry = lolStore.schedules[id];
  const hasCache = !!(entry && Array.isArray(entry.events));

  if (lolLeagueId === id) {
    if (hasCache) {
      lolMatches = bucketEvents(entry.events);
      preloadTeamLogos(lolMatches);
      lolCacheAt = entry.at || 0;
    } else {
      lolMatches = {};
      lolCacheAt = 0;
    }
    renderCalendar();
  }
  lolState = hasCache ? 'stale' : 'loading';
  renderLolStatus();

  try {
    const data = await lolGet('getSchedule', { leagueId: id });
    const events = (data.schedule && data.schedule.events) || [];
    lolStore.schedules[id] = { at: Date.now(), events };
    trimStore();
    writeLocalCache();

    /* 期间可能已切到别的赛事，只在仍是当前赛事时更新界面 */
    if (lolLeagueId === id) {
      lolMatches = bucketEvents(events);
      preloadTeamLogos(lolMatches);
      lolCacheAt = lolStore.schedules[id].at;
      lolState = 'ready';
      lolMessage = '';
      renderCalendar();
      renderLolStatus();
    }
  } catch (e) {
    if (lolLeagueId === id) {
      lolState = 'fail';
      lolMessage = `赛程更新失败：${e.message}`;
      renderLolStatus();
    }
  }
}

/** 事件列表 → 按本地日期分桶（startTime 是 UTC，需转本地时间再取日期） */
function bucketEvents(events) {
  const bucket = {};

  events.forEach((e) => {
    if (!e || e.type !== 'match' || !e.startTime) return;
    const start = new Date(e.startTime);
    if (Number.isNaN(start.getTime())) return;

    const teams = (e.match && e.match.teams) || [];
    const a = teams[0];
    const b = teams[1];
    if (!a || !b) return;

    const key = dateKey(start);
    if (!bucket[key]) bucket[key] = [];
    bucket[key].push({
      time: `${pad2(start.getHours())}:${pad2(start.getMinutes())}`,
      a: teamLabel(a),
      b: teamLabel(b),
      ai: teamLogo(a),
      aid: teamLogoRaw(a),
      bi: teamLogo(b),
      bid: teamLogoRaw(b),
      sa: scoreOf(a),
      sb: scoreOf(b),
      done: e.state === 'completed',
      stage: String(e.blockName || '').trim(),
      mode: e.match && e.match.strategy && e.match.strategy.count
        ? `BO${e.match.strategy.count}`
        : '',
    });
  });

  Object.keys(bucket).forEach((k) => bucket[k].sort((x, y) => x.time.localeCompare(y.time)));
  return bucket;
}

/** 队名：优先代号（BLG / T1 / G2），没有则用全名 */
const teamLabel = (t) => String((t && (t.code || t.name)) || '待定').trim();

/** 战队图标直链：接口里是 http 地址，统一升级到 https 以免被混合内容拦截 */
const teamLogoRaw = (t) => String((t && t.image) || '').trim().replace(/^http:\/\//i, 'https://');

/** 实际展示的图标地址：配置了代理就走代理（顺带缩图，加载更快） */
function teamLogo(t) {
  const raw = teamLogoRaw(t);
  if (!raw || !LOL.logoProxy) return raw;
  return LOL.logoProxy + encodeURIComponent(raw.replace(/^https?:\/\//i, ''));
}

/* 已预取的队徽地址，避免重复请求 */
const logoPreloaded = new Set();

/** 官方图源连接不稳定：失败后延迟再补一次 */
function preloadLogo(url, attempt = 0) {
  const img = new Image();
  img.decoding = 'async';
  img.onerror = () => {
    if (attempt >= 1) return;
    setTimeout(() => preloadLogo(url, attempt + 1), 800);
  };
  img.src = url;
}

/** 预取整份赛程里的队徽：切日期/切赛事时图标直接从缓存出图，不用再等网络 */
function preloadTeamLogos(bucket) {
  Object.keys(bucket || {}).forEach((day) => {
    (bucket[day] || []).forEach((m) => {
      [m.ai, m.bi].forEach((url) => {
        if (!url || logoPreloaded.has(url)) return;
        logoPreloaded.add(url);
        preloadLogo(url);
      });
    });
  });
}

/** 已结束的场次带 gameWins */
const scoreOf = (t) => (t && t.result && t.result.gameWins != null ? String(t.result.gameWins) : '');

/** 对阵标题：已结束且有比分时写成「BLG 3 : 2 T1」 */
function matchTitle(m) {
  if (m.done && m.sa !== '' && m.sb !== '') return `${m.a} ${m.sa} : ${m.sb} ${m.b}`;
  return `${m.a} vs ${m.b}`;
}

/** 某天是否有比赛，用于日期红点 */
function hasAgenda(key) {
  return !!(lolMatches[key] && lolMatches[key].length);
}

/** 当天比赛列表（bucketEvents 已按时间升序排好） */
function agendaItems(key) {
  return (lolMatches[key] || []).map((m) => ({
    time: m.time,
    title: matchTitle(m),
    note: [m.stage, m.mode].filter(Boolean).join(' · '),
    a: m.a,
    b: m.b,
    ai: m.ai,
    aid: m.aid,
    bi: m.bi,
    bid: m.bid,
    sa: m.sa,
    sb: m.sb,
    done: m.done,
  }));
}

/* =========================================================
   日历组件：单周日期条 + 当日日程（数据来自 LoL 赛程）
   ========================================================= */
const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const pad2 = (n) => String(n).padStart(2, '0');

/** 日期 → YYYY-MM-DD，作为日程匹配键 */
function dateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** 当周周日 00:00 */
function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

let calSelected = new Date();                 // 选中日期
let calWeekStart = startOfWeek(calSelected);  // 当前展示周的周日

function renderCalendar() {
  const today = new Date();

  $('#calTitle').textContent = `${calSelected.getFullYear()}年${calSelected.getMonth() + 1}月`;

  const strip = $('#weekStrip');
  strip.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const date = new Date(calWeekStart);
    date.setDate(calWeekStart.getDate() + i);

    const isToday = isSameDay(date, today);
    const isSelected = isSameDay(date, calSelected);

    const key = dateKey(date);
    const marked = hasAgenda(key);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'week-day';
    if (isToday) btn.classList.add('today');
    if (isSelected) btn.classList.add('selected');
    // 跨月周：不属于当前显示月份的日期淡显
    if (date.getMonth() !== calSelected.getMonth()) btn.classList.add('other');
    btn.dataset.date = key;
    btn.setAttribute('aria-pressed', String(isSelected));
    btn.setAttribute('aria-label',
      `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 周${WEEK_LABELS[date.getDay()]}`
      + (marked ? '，有日程' : ''));
    if (isToday) btn.setAttribute('aria-current', 'date');

    const label = document.createElement('span');
    label.className = 'wd-label';
    label.textContent = WEEK_LABELS[date.getDay()];

    const num = document.createElement('span');
    num.className = 'wd-num';
    num.textContent = String(date.getDate());

    btn.append(label, num);

    // 有日程 / 有比赛：日期下方一个红点
    if (marked) {
      const dot = document.createElement('span');
      dot.className = 'wd-dot';
      dot.setAttribute('aria-hidden', 'true');
      btn.appendChild(dot);
    }

    strip.appendChild(btn);
  }

  renderAgenda();
}

/** 渲染选中日期的日程，无则显示「暂无日程」 */
function renderAgenda() {
  const today = new Date();
  const isToday = isSameDay(calSelected, today);

  const key = dateKey(calSelected);
  const items = agendaItems(key);

  const head = $('#agendaHead');
  head.textContent =
    `${isToday ? '今天 · ' : ''}${calSelected.getMonth() + 1}月${calSelected.getDate()}日`
    + ` 周${WEEK_LABELS[calSelected.getDay()]}`;

  /* 当天日程总数，用主题色角标显示 */
  if (items.length) {
    const badge = document.createElement('span');
    badge.className = 'agenda-count';
    badge.textContent = String(items.length);
    badge.title = `共 ${items.length} 条日程`;
    badge.setAttribute('aria-label', `共 ${items.length} 条日程`);
    head.appendChild(badge);
  }

  const body = $('#agendaBody');
  body.innerHTML = '';

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'agenda-empty';
    empty.textContent = '暂无日程';
    body.appendChild(empty);
    updateAgendaFade();
    return;
  }

  const list = document.createElement('ul');
  list.className = 'agenda-list';

  items.forEach((it) => {
    const li = document.createElement('li');
    li.className = 'agenda-item';

    const time = document.createElement('span');
    time.className = 'agenda-time';
    time.textContent = it.time || '全天';

    const main = document.createElement('span');
    main.className = 'agenda-main';

    /* 单行排布：时间 · 赛事说明 · 对阵（含图标），不换行 */
    if (it.note) {
      const stage = document.createElement('span');
      stage.className = 'agenda-stage';
      stage.textContent = it.note;
      main.appendChild(stage);
    }
    main.appendChild(renderMatchRow(it));

    li.append(time, main);
    list.appendChild(li);
  });

  body.appendChild(list);
  updateAgendaFade();
}

/** 对阵行：图标 + 队名 | 比分/vs | 图标 + 队名 */
function renderMatchRow(m) {
  const row = document.createElement('span');
  row.className = 'match-row';
  row.title = m.title;

  const sep = document.createElement('span');
  sep.className = 'match-sep';
  sep.textContent = m.done && m.sa !== '' && m.sb !== ''
    ? `${m.sa} : ${m.sb}`
    : 'vs';
  if (m.done) sep.classList.add('done');

  row.append(teamNode(m.a, m.ai, m.aid), sep, teamNode(m.b, m.bi, m.bid));
  return row;
}

/** 单支战队：图标 + 队名（接口无图时回落为队名前两位） */
function teamNode(name, logoUrl, directUrl) {
  const wrap = document.createElement('span');
  wrap.className = 'team';

  const badge = document.createElement('span');
  badge.className = 'team-badge';

  const initials = document.createElement('span');
  initials.className = 'team-initial';
  initials.textContent = String(name || '?').slice(0, 2);
  badge.appendChild(initials);

  if (logoUrl) {
    const img = document.createElement('img');
    img.className = 'team-logo';
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';

    /* 官方图源偶尔首次连接就被重置，失败后带参数重试几次，全部失败才露出队名文字 */
    const sources = [logoUrl, directUrl].filter((u, i, arr) => u && arr.indexOf(u) === i);
    const MAX_TRY = 3;
    let attempt = 0;

    const load = () => {
      const base = sources[Math.min(attempt, sources.length - 1)];
      img.src = attempt === 0
        ? base
        : `${base}${base.includes('?') ? '&' : '?'}retry=${attempt}`;
    };

    img.addEventListener('load', () => { initials.hidden = true; });
    img.addEventListener('error', () => {
      attempt += 1;
      if (attempt > MAX_TRY) {
        img.remove();
        return;
      }
      setTimeout(load, 200 * attempt);
    });

    load();
    badge.appendChild(img);
  }

  const label = document.createElement('span');
  label.className = 'team-name';
  label.textContent = name;

  wrap.append(badge, label);
  return wrap;
}

/** 议程区可滚动且未到底时，底部加渐隐，避免条目被生硬截断 */
function updateAgendaFade() {
  const body = $('#agendaBody');
  const overflow = body.scrollHeight > body.clientHeight + 1;
  const atBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 2;
  body.classList.toggle('fade-bottom', overflow && !atBottom);
}

/** 切换周：选中日期同步平移 ±7 天，保持同一星期几 */
function shiftWeek(step) {
  calSelected = new Date(calSelected.getFullYear(), calSelected.getMonth(), calSelected.getDate());
  calSelected.setDate(calSelected.getDate() + step * 7);
  calWeekStart = startOfWeek(calSelected);
  renderCalendar();
}

function selectDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  calSelected = new Date(y, m - 1, d);
  calWeekStart = startOfWeek(calSelected);
  renderCalendar();
}

function backToToday() {
  calSelected = new Date();
  calWeekStart = startOfWeek(calSelected);
  renderCalendar();
}

/* ---------------- 组件事件 ---------------- */
function bindWidgets() {
  $('#weatherRefresh').addEventListener('click', () => loadWeather(true));
  $('#weatherCity').addEventListener('click', openDrawer);

  /* 折线图按实际像素绘制，窗口尺寸变化后重绘一次 */
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const wrap = $('.weather-forecast');
      if (wrap && forecastDays.length) drawForecastChart(wrap, forecastDays);
    }, 200);
  });

  $('#calPrev').addEventListener('click', () => shiftWeek(-1));
  $('#calNext').addEventListener('click', () => shiftWeek(1));
  $('#calToday').addEventListener('click', backToToday);

  // 点击日期切换选中日
  $('#weekStrip').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-date]');
    if (btn) selectDate(btn.dataset.date);
  });

  // 日期条支持左右方向键
  $('#weekStrip').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const step = e.key === 'ArrowRight' ? 1 : -1;
    const next = new Date(calSelected.getFullYear(), calSelected.getMonth(), calSelected.getDate() + step);
    calSelected = next;
    calWeekStart = startOfWeek(next);
    renderCalendar();
    const active = $('#weekStrip').querySelector('[aria-pressed="true"]');
    if (active) active.focus();
  });

  // 议程区滚动时同步渐隐状态
  $('#agendaBody').addEventListener('scroll', updateAgendaFade, { passive: true });
}

/* ---------------- 启动 ---------------- */
function init() {
  applySettings();
  renderEngine();
  renderSwatches();
  bindEvents();
  bindDrawer();
  renderCalendar();
  bindWidgets();
  loadWeather();
  loadLol();
  $('#searchInput').focus({ preventScroll: true });
}

init();

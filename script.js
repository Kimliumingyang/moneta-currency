// Moneta — zero-dependency personal currency converter
// Frankfurter API v2: https://frankfurter.dev/
// Rates update daily; they are reference rates, not live bank/trading quotes.
const CURRENCIES = {
  NZD: '🇳🇿', USD: '🇺🇸', CNY: '🇨🇳', EUR: '🇪🇺', AUD: '🇦🇺',
  EGP: '🇪🇬', GBP: '🇬🇧', JPY: '🇯🇵', AED: '🇦🇪', CAD: '🇨🇦',
  CHF: '🇨🇭', SGD: '🇸🇬', HKD: '🇭🇰', KRW: '🇰🇷', THB: '🇹🇭'
};
const API = 'https://api.frankfurter.dev/v2/rates';
const CACHE_PREFIX = 'moneta-rates-v2-';
const fromEl = document.querySelector('#fromCurrency');
const toEl = document.querySelector('#toCurrency');
const amountEl = document.querySelector('#amount');
const resultEl = document.querySelector('#result');
const rateEl = document.querySelector('#exchangeRate');
const statusEl = document.querySelector('#statusText');
const dotEl = document.querySelector('#statusDot');
const updatedEl = document.querySelector('#updatedAt');
const errorEl = document.querySelector('#errorMessage');
const chips = [...document.querySelectorAll('.chip')];

for (const [code, flag] of Object.entries(CURRENCIES)) {
  fromEl.add(new Option(`${flag} ${code}`, code));
  toEl.add(new Option(`${flag} ${code}`, code));
}
fromEl.value = 'NZD';
toEl.value = 'USD';

let rates = null; // Map quote currency -> {rate,date}; base has a self-rate of 1
let loadedBase = null;
let requestId = 0;

function cacheKey(base) { return `${CACHE_PREFIX}${base}`; }
function getCache(base) {
  try {
    const data = JSON.parse(localStorage.getItem(cacheKey(base)) || 'null');
    if (data && data.base === base && data.rates && typeof data.rates === 'object') return data.rates;
  } catch (_) { /* Browser storage may be disabled */ }
  return null;
}
function saveCache(base, data) {
  try { localStorage.setItem(cacheKey(base), JSON.stringify({ base, rates: data, cachedAt: Date.now() })); } catch (_) {}
}
function setStatus(message, cls) {
  statusEl.textContent = message;
  dotEl.className = `status-dot ${cls}`;
}
function formatAmount(value) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
function formatRate(value) {
  return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 7 }).format(value);
}
function updateChips() {
  chips.forEach(chip => chip.classList.toggle('active', chip.dataset.currency === toEl.value));
}
function render() {
  updateChips();
  const amount = Number(amountEl.value);
  if (amountEl.value.trim() === '' || !Number.isFinite(amount) || amount < 0) {
    resultEl.textContent = '—';
    rateEl.textContent = 'Enter a valid amount';
    return;
  }
  if (fromEl.value === toEl.value) {
    resultEl.textContent = formatAmount(amount);
    rateEl.textContent = `1 ${fromEl.value} = 1 ${toEl.value}`;
    updatedEl.textContent = 'Same currency';
    return;
  }
  const record = rates && loadedBase === fromEl.value ? rates[toEl.value] : null;
  if (!record || !Number.isFinite(record.rate) || record.rate <= 0) {
    resultEl.textContent = '—';
    rateEl.textContent = 'Rate unavailable';
    updatedEl.textContent = 'Reference rates, not bank quotes';
    return;
  }
  resultEl.textContent = formatAmount(amount * record.rate);
  rateEl.textContent = `1 ${fromEl.value} ≈ ${formatRate(record.rate)} ${toEl.value}`;
  updatedEl.textContent = `Rate date: ${record.date || 'unknown'} · indicative`;
}

async function loadRates() {
  const base = fromEl.value;
  const thisRequest = ++requestId;
  errorEl.hidden = true;
  rates = getCache(base);
  loadedBase = base;
  if (rates) setStatus('Saved rates · refreshing…', 'cached');
  else setStatus('Loading rates…', '');
  render();
  if (base === toEl.value) {
    setStatus('Ready', 'ready');
    return;
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let response;
    try { response = await fetch(`${API}?base=${encodeURIComponent(base)}`, { signal: controller.signal }); }
    finally { clearTimeout(timeout); }
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error('Unexpected API format');
    const parsed = {};
    for (const item of rows) {
      if (item.base === base && CURRENCIES[item.quote] && Number.isFinite(item.rate) && item.rate > 0) {
        parsed[item.quote] = { rate: item.rate, date: item.date };
      }
    }
    if (!Object.keys(parsed).length) throw new Error('No usable rates found');
    saveCache(base, parsed);
    if (thisRequest !== requestId) return; // Ignore stale responses after rapid switching
    rates = parsed;
    loadedBase = base;
    setStatus('Rates updated', 'ready');
    render();
    if (!rates[toEl.value]) {
      errorEl.textContent = 'No reference rate is currently available for this currency pair.';
      errorEl.hidden = false;
    }
  } catch (err) {
    if (thisRequest !== requestId) return;
    if (rates) {
      setStatus('Offline · saved rates', 'cached');
      render();
    } else {
      setStatus('Connection unavailable', 'failed');
      errorEl.textContent = 'Could not load rates. Check your internet connection and try changing the currency.';
      errorEl.hidden = false;
      render();
    }
  }
}

fromEl.addEventListener('change', loadRates);
toEl.addEventListener('change', () => {
  if (fromEl.value !== toEl.value && (!rates || !rates[toEl.value])) loadRates();
  else render();
});
amountEl.addEventListener('input', render);
document.querySelector('#swapButton').addEventListener('click', () => {
  [fromEl.value, toEl.value] = [toEl.value, fromEl.value];
  loadRates();
});
chips.forEach(chip => chip.addEventListener('click', () => {
  toEl.value = chip.dataset.currency;
  if (fromEl.value !== toEl.value && (!rates || !rates[toEl.value])) loadRates();
  else render();
}));
loadRates();

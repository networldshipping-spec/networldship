document.addEventListener('DOMContentLoaded', () => {
  const sideBtns = document.querySelectorAll('.side-btn');
  const presets = document.querySelectorAll('.preset');
  const qtyInput = document.querySelector('input[name="quantity"]');
  const priceInput = document.querySelector('input[name="price"]');
  const orderType = document.getElementById('orderType');
  const summarySide = document.getElementById('summarySide');
  const summaryTotal = document.getElementById('summaryTotal');
  const summaryFees = document.getElementById('summaryFees');
  const previewBtn = document.getElementById('previewOffer');
  const clearBtn = document.getElementById('clearOffer');
  const recentTrades = document.getElementById('recentTrades');
  const modal = document.getElementById('previewModal');
  const previewBody = document.getElementById('previewBody');
  const confirmOffer = document.getElementById('confirmOffer');
  const cancelPreview = document.getElementById('cancelPreview');
  const buyBtn = document.getElementById('buyBtn');
  const sellBtn = document.getElementById('sellBtn');

  function updateSummary() {
    const qty = Number(qtyInput.value) || 0;
    let price = Number(priceInput.value) || 0;
    // if market order, use live ticker
    if (orderType && orderType.value === 'market'){
      const marketEl = document.getElementById('marketTickerPrice');
      if (marketEl) {
        const raw = marketEl.textContent.replace(/[^0-9.-]+/g,'');
        const m = Number(raw) || 0;
        price = m;
      }
      // reflect disabled state visually
      priceInput.disabled = true;
    } else if (priceInput) {
      priceInput.disabled = false;
    }
    const total = qty * price;
    summaryTotal.textContent = total.toLocaleString(undefined, {style:'currency', currency:'USD'});
    summaryFees.textContent = (0).toLocaleString(undefined, {style:'currency', currency:'USD'});
  }

  if (orderType) {
    orderType.addEventListener('change', () => {
      // update price disabled state and summary
      updateSummary();
      // update UI note for stop order
      const formStatus = document.querySelector('.form-status');
      if (orderType.value === 'stop') formStatus.textContent = 'Stop orders will trigger when stop price is reached.';
      else formStatus.textContent = '';
    });
  }

  sideBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sideBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      summarySide.textContent = btn.dataset.side.charAt(0).toUpperCase() + btn.dataset.side.slice(1);
      updateSummary();
    });
  });

  presets.forEach(p => p.addEventListener('click', () => {
    qtyInput.value = p.textContent.trim();
    updateSummary();
  }));

  qtyInput.addEventListener('input', updateSummary);
  priceInput.addEventListener('input', updateSummary);
  updateSummary();

  if (clearBtn) clearBtn.addEventListener('click', () => {
    document.getElementById('offerForm').reset();
    updateSummary();
    document.querySelector('.form-status').textContent = '';
  });

  if (previewBtn) previewBtn.addEventListener('click', () => {
    const commodity = document.querySelector('select[name="commodity"]').value;
    const unit = document.querySelector('select[name="unit"]').value;
    const qty = qtyInput.value;
    const price = Number(priceInput.value).toFixed(2);
    const side = document.querySelector('.side-btn.active').dataset.side || 'sell';
    previewBody.innerHTML = `
      <p><strong>${side.toUpperCase()}</strong> ${commodity} — ${qty} ${unit} @ $${price}</p>
      <p class="muted">Please confirm the offer details before submission.</p>
    `;
    if (modal) modal.setAttribute('aria-hidden', 'false');
  });

  if (cancelPreview) cancelPreview.addEventListener('click', () => {
    if (modal) modal.setAttribute('aria-hidden', 'true');
  });

  if (confirmOffer) confirmOffer.addEventListener('click', () => {
    const commodity = document.querySelector('select[name="commodity"]').value;
    const unit = document.querySelector('select[name="unit"]').value;
    const qty = qtyInput.value;
    const price = Number(priceInput.value).toFixed(2);
    const side = document.querySelector('.side-btn.active').dataset.side || 'sell';
    const li = document.createElement('li');
    li.innerHTML = `${commodity} — ${qty} ${unit} @ $${price} <span class="muted">(just now)</span>`;
    recentTrades.insertBefore(li, recentTrades.firstChild);
    document.querySelector('.form-status').textContent = 'Offer submitted (simulated).';
    if (modal) modal.setAttribute('aria-hidden', 'true');
  });

  // close modal on outside click
  if (modal) modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.setAttribute('aria-hidden', 'true');
  });

  // Handle Buy button
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      const commodity = document.querySelector('select[name="commodity"]')?.value || 'Silica';
      const unit = document.querySelector('select[name="unit"]')?.value || 'MT';
      const qty = document.querySelector('input[name="quantity"]')?.value || '100';
      const price = (Number(document.querySelector('input[name="price"]')?.value) || 0).toFixed(2);
      const li = document.createElement('li');
      li.innerHTML = `${commodity} — ${qty} ${unit} @ $${price} <span class="muted">(just now)</span>`;
      if (recentTrades) recentTrades.insertBefore(li, recentTrades.firstChild);
      const status = document.querySelector('.form-status');
      if (status) status.textContent = 'Buy order submitted.';
    });
  }

  // Handle Sell button
  if (sellBtn) {
    sellBtn.addEventListener('click', () => {
      const commodity = document.querySelector('select[name="commodity"]')?.value || 'Silica';
      const unit = document.querySelector('select[name="unit"]')?.value || 'MT';
      const qty = document.querySelector('input[name="quantity"]')?.value || '100';
      const price = (Number(document.querySelector('input[name="price"]')?.value) || 0).toFixed(2);
      const li = document.createElement('li');
      li.innerHTML = `${commodity} — ${qty} ${unit} @ $${price} <span class="muted">(just now)</span>`;
      if (recentTrades) recentTrades.insertBefore(li, recentTrades.firstChild);
      const status = document.querySelector('.form-status');
      if (status) status.textContent = 'Sell order submitted.';
    });
  }

  // initialize candlestick chart (Lightweight Charts) and simulate live updates
  (function initChart(){
    let retries = 0;
    const tryInit = () => {
      if (!window.LightweightCharts) {
        if (retries < 10) {
          retries++;
          setTimeout(tryInit, 200);
        }
        return;
      }
      const container = document.getElementById('chart');
      if (!container) return;
      try {
        const chart = LightweightCharts.createChart(container, {
          layout: { background: { color: 'transparent' }, textColor: '#111' },
          width: container.clientWidth,
          height: 260,
          timeScale: { timeVisible: true, secondsVisible: false }
        });
        const series = chart.addCandlestickSeries({
          upColor: '#dc2626',
          downColor: '#059669',
          wickUpColor: '#dc2626',
          wickDownColor: '#059669',
          borderVisible: false
        });

        // generate initial data
        const now = Math.floor(Date.now()/1000);
        const initial = [];
        let price = 128.00;
        for (let i = 60; i > 0; i--) {
          const t = now - i * 60;
          const open = +(price + (Math.random() - 0.5) * 1).toFixed(2);
          const close = +(open + (Math.random() - 0.5) * 0.8).toFixed(2);
          const high = +(Math.max(open, close) + Math.random() * 0.5).toFixed(2);
          const low = +(Math.min(open, close) - Math.random() * 0.5).toFixed(2);
          initial.push({ time: t, open, high, low, close });
          price = close;
        }
        series.setData(initial);

        // update marketTickerPrice
        const marketTicker = document.getElementById('marketTickerPrice');
        if (marketTicker) marketTicker.textContent = '$' + initial[initial.length - 1].close.toFixed(2);

        // push new candle every 3s (simulated)
        setInterval(() => {
          const last = initial[initial.length - 1];
          const t = last.time + 60;
          const open = last.close;
          const close = +(open + (Math.random() - 0.5) * 1).toFixed(2);
          const high = +(Math.max(open, close) + Math.random() * 0.4).toFixed(2);
          const low = +(Math.min(open, close) - Math.random() * 0.4).toFixed(2);
          const bar = { time: t, open, high, low, close };
          initial.push(bar);
          series.update(bar);
          if (marketTicker) marketTicker.textContent = '$' + close.toFixed(2);
          if (initial.length > 200) initial.shift();
          if (orderType && orderType.value === 'market') updateSummary();
        }, 3000);

        // handle chart resize
        window.addEventListener('resize', () => {
          chart.applyOptions({ width: container.clientWidth });
        });
      } catch(e) {
        console.error('Chart init error:', e);
      }
    };
    tryInit();
  })();

  // Style P/L value based on sign
  const plEl = document.getElementById('plValue');
  if (plEl) {
    const raw = plEl.textContent.trim();
    // remove currency symbols and commas
    const num = Number(raw.replace(/[^0-9.-]+/g, ''));
    if (!Number.isNaN(num)) {
      plEl.classList.remove('pl-positive','pl-negative');
      plEl.classList.add(num >= 0 ? 'pl-positive' : 'pl-negative');
    }
  }
});

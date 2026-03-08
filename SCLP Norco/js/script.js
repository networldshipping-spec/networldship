document.addEventListener('DOMContentLoaded',function(){
  const toggle=document.querySelector('.nav-toggle');
  const nav=document.querySelector('.site-nav');
  if(toggle && nav){
    toggle.addEventListener('click',()=>{
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.style.display = expanded ? 'none' : 'block';
    });
  }

  // Balance visibility toggle
  const balanceToggle = document.getElementById('balanceToggle');
  const balanceAmount = document.getElementById('balanceDisplay');
  if(balanceToggle && balanceAmount){
    let isVisible = true;
    balanceToggle.addEventListener('click', ()=>{
      isVisible = !isVisible;
      balanceAmount.classList.toggle('hidden');
    });
  }

  const form = document.getElementById('contactForm');
  const status = document.querySelector('.form-status');
  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const f = new FormData(form);
      if(!f.get('name') || !f.get('email') || !f.get('message')){
        status.textContent = 'Please fill out all fields.';
        return;
      }
      status.textContent = 'Thanks — your message was recorded (demo).';
      form.reset();
    });
  }

  // Bottom navigation active state handling
  const bottomItems = document.querySelectorAll('.bottom-nav__item');
  if(bottomItems.length){
    // Set active based on current page
    const raw = location.pathname.split('/').pop();
    const current = raw === '' ? 'index.html' : raw;
    bottomItems.forEach(item=>{
      const href = item.getAttribute('href') || '';
      const target = href.split('/').pop();
      if(target === current || (current === 'index.html' && (href === '#' || href === 'index.html' || href === './' ))) {
        item.classList.add('active');
      }
      item.addEventListener('click', function(e){
        bottomItems.forEach(i=>i.classList.remove('active'));
        this.classList.add('active');
      });
    });
  }

  // Trade page: handle offer form (demo)
  const offerForm = document.getElementById('offerForm');
  const offersList = document.getElementById('offersList');
  if(offerForm && offersList){
    offerForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(offerForm);
      const commodity = fd.get('commodity');
      const qty = fd.get('quantity');
      const unit = fd.get('unit');
      const price = fd.get('price');
      const li = document.createElement('li');
      li.innerHTML = `<strong>${commodity}</strong> — ${qty} ${unit} @ $${Number(price).toFixed(2)}/unit <span class="muted">(now)</span>`;
      offersList.prepend(li);
      offerForm.reset();
      offerForm.querySelector('.form-status').textContent = 'Offer submitted (demo)';
      setTimeout(()=> offerForm.querySelector('.form-status').textContent = '', 3000);
    });
    const clearBtn = document.getElementById('clearOffer');
    if(clearBtn) clearBtn.addEventListener('click', ()=> offerForm.reset());
  }

  // Trade UX: side toggle, presets, preview modal, confirm
  const sideButtons = document.querySelectorAll('.side-btn');
  let currentSide = 'sell';
  sideButtons.forEach(b=> b.addEventListener('click', ()=>{
    sideButtons.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    currentSide = b.dataset.side || 'sell';
  }));

  document.querySelectorAll('.preset').forEach(p=> p.addEventListener('click', (e)=>{
    const val = e.target.textContent.trim();
    const q = offerForm.querySelector('input[name="quantity"]');
    if(q) q.value = val;
  }));

  const previewModal = document.getElementById('previewModal');
  const previewBody = document.getElementById('previewBody');
  const previewBtn = document.getElementById('previewOffer');
  const confirmBtn = document.getElementById('confirmOffer');
  const cancelPreview = document.getElementById('cancelPreview');
  if(previewBtn && previewModal && previewBody){
    previewBtn.addEventListener('click', ()=>{
      const fd = new FormData(offerForm);
      const commodity = fd.get('commodity');
      const qty = fd.get('quantity');
      const unit = fd.get('unit');
      const price = fd.get('price');
      const notes = fd.get('notes');
      if(!qty || !price){
        offerForm.querySelector('.form-status').textContent = 'Please enter quantity and price.';
        return;
      }
      previewBody.innerHTML = `<p><strong>Side:</strong> ${currentSide.toUpperCase()}</p>
        <p><strong>Commodity:</strong> ${commodity}</p>
        <p><strong>Quantity:</strong> ${qty} ${unit}</p>
        <p><strong>Price:</strong> $${Number(price).toFixed(2)}</p>
        <p><strong>Notes:</strong> ${notes || '—'}</p>`;
      previewModal.setAttribute('aria-hidden','false');
    });
    cancelPreview.addEventListener('click', ()=> previewModal.setAttribute('aria-hidden','true'));
    confirmBtn.addEventListener('click', ()=>{
      // simulate adding to offers and adjusting balance
      const fd = new FormData(offerForm);
      const commodity = fd.get('commodity');
      const qty = Number(fd.get('quantity'));
      const unit = fd.get('unit');
      const price = Number(fd.get('price'));
      const li = document.createElement('li');
      li.innerHTML = `<strong>${commodity}</strong> — ${qty} ${unit} @ $${price.toFixed(2)}/unit <span class="muted">(now)</span>`;
      if(offersList) offersList.prepend(li);
      // adjust demo balance
      const balEl = document.getElementById('balanceAmount');
      if(balEl){
        const current = Number(String(balEl.textContent).replace(/[^0-9.-]+/g, '')) || 0;
        balEl.textContent = `${Math.max(0,current - qty)} MT`;
      }
      previewModal.setAttribute('aria-hidden','true');
      offerForm.reset();
      offerForm.querySelector('.form-status').textContent = 'Offer confirmed (demo)';
      setTimeout(()=> offerForm.querySelector('.form-status').textContent = '', 3000);
    });
  }

  // Market product selector + live ticker (demo data)
  const productSelect = document.getElementById('productSelect');
  const marketName = document.getElementById('marketName');
  const marketPrice = document.getElementById('marketTickerPrice');
  const arrowUp = document.getElementById('marketArrowUp');
  const arrowDown = document.getElementById('marketArrowDown');
  const candleChart = document.getElementById('candleChart');

  const products = [
    'Silica','Naphtha','Thermal Coal','Calcium Carbonate','Iron Ore','Copper','Aluminum','Nickel','Zinc','Lithium','Potash','Phosphate','Bauxite','Sulfur','Manganese','Cobalt','Gypsum','Barite','Kaolin','Bentonite','Chromite','Ilmenite','Rutile','Magnesite','Talc','Graphite','Gold','Silver','Platinum','Copper Concentrate'
  ];

  function populateProducts(){
    if(!productSelect) return;
    products.forEach(p=>{
      const opt = document.createElement('option'); opt.value = p; opt.textContent = p; productSelect.appendChild(opt);
    });
    productSelect.value = products[0];
  }

  function updateMarket(product){
    if(marketName) marketName.textContent = product;
    // simulate price
    const base = 50 + Math.floor(Math.random()*200);
    const change = (Math.random()*4-2).toFixed(2);
    const priceStr = `$${(base + Number(change)).toFixed(2)}`;
    if(marketPrice) marketPrice.textContent = priceStr;
    if(arrowUp && arrowDown){
      const up = Number(change) >= 0;
      arrowUp.classList.toggle('active', up);
      arrowDown.classList.toggle('active', !up);
    }
    // render exactly two short candle bars: first red (buy), second green (sell)
    if(candleChart){
      candleChart.innerHTML = '';
      const buyHeight = Math.floor(Math.random()*60)+10;
      const sellHeight = Math.floor(Math.random()*60)+10;
      const spBuy = document.createElement('span');
      spBuy.style.height = `${buyHeight}px`;
      spBuy.className = 'buy';
      const spSell = document.createElement('span');
      spSell.style.height = `${sellHeight}px`;
      spSell.className = 'sell';
      candleChart.appendChild(spBuy);
      candleChart.appendChild(spSell);
    }
  }

  if(productSelect){
    populateProducts();
    productSelect.addEventListener('change', ()=> updateMarket(productSelect.value));
    // initial
    updateMarket(products[0]);
    // periodic refresh demo
    setInterval(()=>{
      const current = productSelect.value || products[0];
      updateMarket(current);
    }, 7000);
  }

  // Category switching functionality
  const categoryBtns = document.querySelectorAll('.category-btn');
  const categoryContents = document.querySelectorAll('.category-content');

  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedCategory = btn.getAttribute('data-category');
      
      // Remove active class from all buttons and contents
      categoryBtns.forEach(b => b.classList.remove('active'));
      categoryContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      btn.classList.add('active');
      const targetContent = document.getElementById(selectedCategory);
      if(targetContent){
        targetContent.classList.add('active');
      }
    });
  });

  // View More button functionality
  const viewMoreBtns = document.querySelectorAll('.btn-view-more');
  viewMoreBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');
      const categoryContent = document.getElementById(category);
      const hiddenCards = categoryContent.querySelectorAll('.product-card.hidden');
      
      if(hiddenCards.length > 0){
        // Show all hidden cards
        hiddenCards.forEach(card => {
          card.classList.remove('hidden');
        });
        // Change button text to "View Less"
        btn.textContent = 'View Less';
      } else {
        // Hide cards beyond first 3
        const cards = categoryContent.querySelectorAll('.product-card');
        if(cards.length > 3){
          for(let i = 3; i < cards.length; i++){
            cards[i].classList.add('hidden');
          }
        }
        // Change button text back to "View More"
        btn.textContent = 'View More';
      }
    });
  });

  // Post interaction functionality
  const likeButtons = document.querySelectorAll('.like-btn');
  const commentButtons = document.querySelectorAll('.comment-btn');
  const shareButtons = document.querySelectorAll('.share-btn');

  likeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('liked');
      const isLiked = btn.classList.contains('liked');
      btn.style.color = isLiked ? '#e74c3c' : 'var(--muted)';
    });
  });

  commentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      alert('Comment feature coming soon!');
    });
  });

  shareButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const postCard = btn.closest('.post-card-extended');
      const postTitle = postCard.querySelector('.post-content p:first-child').textContent;
      if(navigator.share){
        navigator.share({
          title: postTitle,
          text: 'Check out this post from Shell Chemical LP Norco',
          url: window.location.href
        }).catch(err => console.log('Share cancelled'));
      } else {
        alert('Post shared! (Native share not supported on this device)');
      }
    });
  });

  // Wallet page functionality
  const walletBalanceToggle = document.getElementById('walletBalanceToggle');
  const walletBalance = document.getElementById('walletBalance');
  if(walletBalanceToggle && walletBalance){
    let balanceVisible = true;
    walletBalanceToggle.addEventListener('click', () => {
      balanceVisible = !balanceVisible;
      walletBalance.textContent = balanceVisible ? '$125,450.50' : '••••••••••';
    });
  }

  const balanceVisibility = document.getElementById('balanceVisibility');
  const totalBalance = document.getElementById('totalBalance');
  if(balanceVisibility && totalBalance){
    let visible = true;
    balanceVisibility.addEventListener('click', () => {
      visible = !visible;
      totalBalance.textContent = visible ? '$125,450.50' : '••••••••••';
    });
  }

  // Action card buttons
  const depositCard = document.getElementById('depositCard');
  const withdrawCard = document.getElementById('withdrawCard');
  const transferCard = document.getElementById('transferCard');
  const statementCard = document.getElementById('statementCard');

  if(depositCard){
    depositCard.addEventListener('click', () => {
      alert('Deposit Feature:\n\nSelect amount and payment method to deposit funds to your account.');
    });
  }

  if(withdrawCard){
    withdrawCard.addEventListener('click', () => {
      alert('Withdraw Feature:\n\nEnter withdrawal amount and select destination account.');
    });
  }

  if(transferCard){
    transferCard.addEventListener('click', () => {
      alert('Transfer Feature:\n\nTransfer funds between your trading accounts.');
    });
  }

  if(statementCard){
    statementCard.addEventListener('click', () => {
      alert('Statement Download:\n\nDownloading transaction history for the current period...');
    });
  }

  // Transaction filter functionality
  const filterButtons = document.querySelectorAll('.filter-btn');
  const transactions = document.querySelectorAll('.transaction-row');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      
      // Update active button
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter transactions
      transactions.forEach(tx => {
        const type = tx.getAttribute('data-type');
        if(filter === 'all' || type === filter){
          tx.style.display = 'grid';
        } else {
          tx.style.display = 'none';
        }
      });
    });
  });
});

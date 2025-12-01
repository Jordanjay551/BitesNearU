/* ===========================
   BitesNearU — Frontend Demo
   Single-file SPA using localStorage
   =========================== */

/* ---------- Storage keys ---------- */
const LS_USERS = "bnu_users_v1";
const LS_AUTH = "bnu_auth_v1";
const LS_OFFERS = "bnu_offers_v1";
const LS_CART = "bnu_cart_v1";
const LS_CARDS = "bnu_cards_v1";

/* ---------- Utilities ---------- */
const $ = (id) => document.getElementById(id);
const qs = (sel, root=document) => root.querySelector(sel);

function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function load(key, fallback){ const v=localStorage.getItem(key); return v? JSON.parse(v): fallback; }
function money(n){ return "£" + Number(n).toFixed(2); }

/* ---------- Seed demo data if missing ---------- */
let users = load(LS_USERS, []);
let offers = load(LS_OFFERS, []);
let cart = load(LS_CART, []);
let cards = load(LS_CARDS, []);

/* seed user */
if(!users.length){
  users.push({ name: "Andy", email:"andy@example.com", pass:"demo123", points:450, saved:127.50, meals:34, avatar:"🍕" });
  users.push({ name: "Emma", email:"emma@example.com", pass:"pass123", points:120, saved:40.0, meals:12, avatar:"🍓" });
  save(LS_USERS, users);
}

/* seed offers */
if(!offers.length){
  offers = [
    { id: "o1", store:"Sakura Sushi", title:"Salmon Bento", cat:["Ready Meals"], price:8.99, original:22.00, dist:0.9, pickup:"7:00 PM - 8:30 PM", qty:3, tags:["Japanese","Healthy"] },
    { id: "o2", store:"Bella Italia", title:"Pasta Carbonara", cat:["Ready Meals"], price:6.00, original:15.00, dist:1.2, pickup:"6:30 PM - 8:00 PM", qty:2, tags:["Italian"] },
    { id: "o3", store:"Green Leaf Market", title:"Fruit Pack", cat:["Fresh Produce","Beverages"], price:3.50, original:6.00, dist:0.6, pickup:"Anytime", qty:10, tags:["Produce","Healthy","Vegetarian"] },
    { id: "o4", store:"FreshBake", title:"Pastry Bundle (x3)", cat:["Bakery & Pastries"], price:2.00, original:6.50, dist:0.4, pickup:"5:00 PM - 6:30 PM", qty:8, tags:["Bakery"] },
    { id: "o5", store:"Spice Route", title:"Curry & Rice Combo", cat:["Ready Meals"], price:5.49, original:13.99, dist:1.6, pickup:"7:30 PM - 9:00 PM", qty:3, tags:["Indian"] }
  ];
  save(LS_OFFERS, offers);
}

/* seed cards */
if(!cards.length){
  cards = [{ id:"c1", label:"Visa •••• 4242", isDefault:true }, { id:"c2", label:"Mastercard •••• 5678", isDefault:false }];
  save(LS_CARDS, cards);
}

/* ---------- App state ---------- */
let auth = load(LS_AUTH, null); // { email }
let activeTab = "popular";

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  $('year').textContent = new Date().getFullYear();
  wireUi();
  route();
  window.addEventListener('hashchange', route);
  renderGlobalMetrics();
  renderAvatarOptions();
});

/* ---------- Routing ---------- */
function go(hash){
  location.hash = hash;
}
function route(){
  const hash = location.hash || "#home";
  document.querySelectorAll('.screen').forEach(s => { s.hidden = true; });
  if(hash.startsWith("#deal")){
    showDeal(hash.split(":")[1]);
  } else {
    const id = "#screen-" + hash.replace("#","") ;
    const el = document.querySelector(id);
    if(el) el.hidden = false;
    else document.querySelector('#screen-home').hidden = false;
    // screen-specific renders:
    if(hash === "#home" || hash === "" ) renderHome();
    if(hash === "#search") renderSearch();
    if(hash === "#restaurants") renderRestaurants();
    if(hash === "#cart") renderCart();
    if(hash === "#profile") renderProfile();
  }
}

/* ---------- UI wiring ---------- */
function wireUi(){
  // auth
  $('auth-action').addEventListener('click', handleAuthAction);
  $('switch-auth').addEventListener('click', toggleAuthMode);
  // open auth
  window.openAuth = function(){
    openModal('modal-auth'); setAuthMode('signin');
  };
  window.closeAuth = function(){ closeModal('modal-auth'); };

  // search filters
  $('toggle-filters').addEventListener('click', ()=> {
    const f = $('filters'); f.hidden = !f.hidden;
  });
  $('price-range').addEventListener('input', ()=> $('price-val').textContent = $('price-range').value );
  $('apply-filters').addEventListener('click', applyFilters);
  $('clear-filters').addEventListener('click', clearFilters);
  $('search-input').addEventListener('input', ()=> { if(location.hash!="#search") go('#search') });

  // home tabs
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', (e)=> {
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    e.target.classList.add('active'); activeTab = e.target.dataset.tab; renderHome();
  }));

  // cart / checkout
  $('place-order').addEventListener('click', placeOrder);
  $('apply-promo').addEventListener('click', applyPromo);
  $('manage-cards').addEventListener('click', ()=> openModal('modal-cards'));
  $('add-card').addEventListener('click', addCard);

  // avatar
  window.openAvatarModal = function(){ openModal('modal-avatar'); };
  window.closeAvatarModal = function(){ closeModal('modal-avatar'); };

  // card modal close buttons
  document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', ()=> {
    const modal = btn.closest('.modal'); if(modal) modal.hidden = true;
  }));
}

/* ---------- Modals ---------- */
function openModal(id){ $(id).hidden = false; }
function closeModal(id){ $(id).hidden = true; }

/* ---------- Auth ---------- */
let authMode = 'signin'; // or 'signup'
function setAuthMode(mode){
  authMode = mode;
  $('auth-heading').textContent = mode === 'signin' ? 'Sign In' : 'Sign Up';
  $('auth-action').textContent = mode === 'signin' ? 'Sign in' : 'Create account';
  $('switch-auth').textContent = mode === 'signin' ? 'Switch to Sign up' : 'Switch to Sign in';
  // prefill for demo
  $('auth-name').value = mode === 'signup' ? 'Austin' : '';
  $('auth-email').value = mode === 'signup' ? 'austinblue@gmail.com' : '';
  $('auth-pass').value = '';
}
function toggleAuthMode(){ setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); }
function handleAuthAction(){
  const name = $('auth-name').value.trim();
  const email = $('auth-email').value.trim();
  const pass = $('auth-pass').value;
  if(!email || !pass) return alert('Please enter email and password.');
  if(authMode === 'signup'){
    if(users.find(u=>u.email === email)) return alert('Email already registered.');
    const newUser = { name: name || email.split('@')[0], email, pass, points:0, saved:0, meals:0, avatar:'🐼' };
    users.push(newUser); save(LS_USERS, users);
    auth = { email }; save(LS_AUTH, auth); closeModal('modal-auth'); refreshAuthUi();
    alert('Account created and logged in (demo).');
  } else {
    const u = users.find(u => u.email===email && u.pass===pass);
    if(!u) return alert('Invalid credentials (demo accounts seeded: andy@example.com / demo123).');
    auth = { email }; save(LS_AUTH, auth); closeModal('modal-auth'); refreshAuthUi();
    alert('Signed in (demo).');
  }
}
function refreshAuthUi(){
  const btn = $('auth-btn');
  if(auth && auth.email){
    btn.textContent = auth.email.split('@')[0];
    btn.onclick = ()=> go('#profile');
  } else {
    btn.textContent = 'Sign in / Sign up';
    btn.onclick = ()=> openModal('modal-auth');
  }
}
refreshAuthUi();

function currentUser(){
  if(!auth) return null;
  return users.find(u => u.email === auth.email) || null;
}

/* ---------- Global metrics ---------- */
function renderGlobalMetrics(){
  // these are demo static numbers but we can update from stored totals
  $('m-meals').textContent = '12,847';
  $('m-saved').textContent = '£45,678';
  $('m-co2').textContent = '25,694 kg';
}

/* ---------- HOME ---------- */
function renderHome(){
  const list = $('home-list'); list.innerHTML = '';
  // pick offers depending on activeTab (simple demo: same list)
  let shown = offers.slice();
  // sort by deals for 'deals' tab, by distance for 'popular' etc
  if(activeTab === 'deals') shown.sort((a,b)=> (a.price / a.original) - (b.price / b.original));
  if(activeTab === 'popular') shown.sort((a,b)=> a.dist - b.dist);
  shown.forEach(o => list.appendChild(makeOfferCard(o)));
}

/* create small DOM card for list */
function makeOfferCard(o){
  const el = document.createElement('div'); el.className = 'deal';
  el.innerHTML = `
    <div>
      <div style="font-weight:700">${o.store}</div>
      <div class="meta">${o.title} • <span class="muted">${o.dist} mi</span></div>
      <div class="meta">Pickup: ${o.pickup}</div>
    </div>
    <div style="text-align:right">
      <div class="price">${money(o.price)}</div>
      <div class="meta"><s>${money(o.original)}</s> <span class="muted">${Math.round((1 - o.price/o.original)*100)}% OFF</span></div>
      <div style="margin-top:.5rem">
        <button class="btn" onclick="goForDeal('${o.id}')">View</button>
        <button class="btn outline" onclick="quickAdd('${o.id}')">Add to cart</button>
      </div>
    </div>
  `;
  return el;
}
function goForDeal(id){ go('#deal:' + id); }

/* ---------- SEARCH & FILTER ---------- */
function renderSearch(){
  $('search-input').value = '';
  $('search-results').innerHTML = '';
  $('price-range').value = 20; $('price-val').textContent = 20;
  // hide filters initially
  $('filters').hidden = true;
}
function applyFilters(){
  const q = $('search-input').value.trim().toLowerCase();
  const maxPrice = parseFloat($('price-range').value);
  const budget = $('f-budget').checked;
  const healthy = $('f-healthy').checked;
  const veg = $('f-veg').checked;
  const cats = Array.from(document.querySelectorAll('.f-cat:checked')).map(n=>n.value);

  let res = offers.filter(o => (o.price <= maxPrice));
  if(q) res = res.filter(o => (o.title.toLowerCase().includes(q) || o.store.toLowerCase().includes(q)));
  if(budget) res = res.filter(o => o.price <= 6);
  if(healthy) res = res.filter(o => o.tags && o.tags.includes('Healthy'));
  if(veg) res = res.filter(o => o.tags && o.tags.includes('Vegetarian'));
  if(cats.length) res = res.filter(o => o.cat.some(c => cats.includes(c)));

  const container = $('search-results'); container.innerHTML = '';
  if(!res.length) container.innerHTML = '<div class="card">No results</div>';
  res.forEach(o=> container.appendChild(makeOfferCard(o)));
}
function clearFilters(){
  $('price-range').value = 20; $('price-val').textContent = 20;
  document.querySelectorAll('.f-cat').forEach(cb=>cb.checked=false);
  $('f-budget').checked=false; $('f-healthy').checked=false; $('f-veg').checked=false;
  $('search-input').value = '';
  $('search-results').innerHTML = '';
}

/* ---------- RESTAURANTS LIST ---------- */
function renderRestaurants(){
  const list = $('restaurants-list'); list.innerHTML = '';
  // group by store
  const grouped = {};
  offers.forEach(o => { grouped[o.store] = grouped[o.store] || []; grouped[o.store].push(o); });
  Object.keys(grouped).forEach(store => {
    const el = document.createElement('div'); el.className = 'deal';
    el.innerHTML = `
      <div>
        <div style="font-weight:700">${store}</div>
        <div class="meta">${grouped[store].length} items available</div>
      </div>
      <div style="text-align:right">
        <div class="muted">${grouped[store].map(x=>x.cat[0]).join(' • ')}</div>
        <div style="margin-top:.5rem">
          <button class="btn" onclick="openStore('${store}')">Open</button>
        </div>
      </div>`;
    list.appendChild(el);
  });
}
function openStore(name){
  // show store's offers in home-list area
  const list = $('home-list'); list.innerHTML = '';
  offers.filter(o=>o.store===name).forEach(o => list.appendChild(makeOfferCard(o)));
  go('#home');
}

/* ---------- DEAL DETAIL ---------- */
function showDeal(id){
  const o = offers.find(x=>x.id===id);
  if(!o){ go('#home'); return; }
  const d = $('deal-card'); d.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <h2>${o.title}</h2>
        <div class="muted">${o.store} • ${o.dist} mi</div>
      </div>
      <div style="text-align:right">
        <div class="price">${money(o.price)}</div>
        <div class="muted"><s>${money(o.original)}</s> • ${Math.round((1 - o.price/o.original)*100)}% OFF</div>
      </div>
    </div>
    <p class="meta" style="margin-top:.6rem">Availability: <strong>${o.qty} available</strong></p>
    <p>${o.pickup}</p>
    <div class="row" style="margin-top:.8rem">
      <button class="btn" onclick="addToCart('${o.id}',1)">Add to Cart</button>
      <button class="btn outline" onclick="buyNow('${o.id}')">Buy now</button>
      <button class="btn outline" onclick="go('#restaurants')">Back</button>
    </div>
    <hr/>
    <h4>Details & tags</h4>
    <div class="row">${ (o.tags||[]).map(t=>`<span class="pill" style="background:#f2fff6;padding:.25rem .5rem;border-radius:999px;margin-right:.3rem">${t}</span>`).join('') }</div>
  `;
  // show deal screen
  document.querySelectorAll('.screen').forEach(s=>s.hidden=true);
  $('screen-deal').hidden = false;
}

/* ---------- CART ---------- */
function quickAdd(id){
  addToCart(id,1);
  alert('Added to cart (demo)');
}
function addToCart(id, qty=1){
  const o = offers.find(x=>x.id===id);
  if(!o) return;
  // reduce qty if no stock
  const existing = cart.find(c=>c.id===id);
  if(existing){
    existing.qty += qty;
  } else {
    cart.push({ id:o.id, title:o.title, store:o.store, price:o.price, qty: qty });
  }
  save(LS_CART, cart);
  renderCart();
  updateCartCount();
}

/* render cart screen */
function renderCart(){
  const list = $('cart-list'); list.innerHTML = '';
  if(!cart.length) list.innerHTML = '<div class="card">Your cart is empty.</div>';
  cart.forEach(item => {
    const el = document.createElement('div'); el.className = 'deal';
    el.innerHTML = `
      <div>
        <div style="font-weight:700">${item.title}</div>
        <div class="meta">${item.store} • Qty: <input type="number" min="1" value="${item.qty}" style="width:68px" onchange="updateQty('${item.id}', this.value)"/></div>
      </div>
      <div style="text-align:right">
        <div class="price">${money(item.price * item.qty)}</div>
        <div style="margin-top:.5rem">
          <button class="btn outline" onclick="removeFromCart('${item.id}')">Remove</button>
        </div>
      </div>
    `;
    list.appendChild(el);
  });

  // fill summary
  const summary = $('order-summary'); summary.innerHTML = '';
  let subtotal = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  summary.innerHTML = `<div>Subtotal: ${money(subtotal)}</div>`;
  // pickup times: options from items (concat)
  const times = Array.from(new Set(cart.map(i => (offers.find(o=>o.id===i.id)||{}).pickup || 'Anytime')));
  const psel = $('pickup-time'); psel.innerHTML = ''; times.forEach(t=> psel.appendChild(new Option(t,t)));
  document.querySelector('#total-amt').textContent = money(subtotal);
  $('saving-amt').textContent = cart.length ? `You're saving ${money(cart.reduce((s,i)=> s + ((offers.find(o=>o.id===i.id)||{}).original - i.price) * i.qty , 0))}` : '';
  // payment methods
  const paySelect = $('pay-method'); paySelect.innerHTML = '';
  cards.forEach(c => { const opt = new Option(c.label, c.id); paySelect.appendChild(opt); });
  if(!cards.length) paySelect.appendChild(new Option('No cards — add one', ''));
}

/* cart helpers */
function updateQty(id, val){
  const q = Math.max(1, parseInt(val||1));
  const it = cart.find(i=>i.id===id); if(it) it.qty = q; save(LS_CART, cart); renderCart(); updateCartCount();
}
function removeFromCart(id){ cart = cart.filter(i=>i.id!==id); save(LS_CART, cart); renderCart(); updateCartCount(); }
function updateCartCount(){ $('cart-count').textContent = cart.reduce((s,i)=>s + i.qty, 0); }

/* promo */
function applyPromo(){
  const code = $('promo').value.trim().toUpperCase();
  if(code === 'SAVE5'){
    let subtotal = cart.reduce((s,i)=>s + i.price * i.qty, 0);
    const newTotal = Math.max(0, subtotal - 5);
    $('total-amt').textContent = money(newTotal);
    $('saving-amt').textContent = `Promo applied — you saved ${money(subtotal - newTotal)}!`;
  } else {
    alert('Invalid promo (demo code: SAVE5)');
  }
}

/* place order */
function placeOrder(){
  if(!auth){ if(!confirm('You are not signed in. Sign in now?')) return; openModal('modal-auth'); return; }
  if(!cart.length) return alert('Cart is empty.');
  // Simulate payment
  const cardId = $('pay-method').value;
  if(!cardId) { return alert('Select or add a payment method (demo).'); }
  // deduct stock (demo)
  cart.forEach(ci => {
    const off = offers.find(o=>o.id===ci.id);
    if(off) off.qty = Math.max(0, off.qty - ci.qty);
  });
  save(LS_OFFERS, offers);
  // update user stats
  const user = currentUser();
  const subtotal = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  if(user){ user.points = (user.points||0) + Math.round(subtotal*10); user.saved = (user.saved||0) + subtotal; user.meals = (user.meals||0) + cart.reduce((s,i)=>s + i.qty,0); }
  save(LS_USERS, users);
  // clear cart
  cart = []; save(LS_CART, cart); renderCart(); updateCartCount();
  // unlock achievements
  unlockAchievements();
  alert('Payment successful (demo). Reservation ready for pickup.');
  go('#profile');
}

/* buy now: add to cart and go to checkout */
function buyNow(id){
  addToCart(id,1); go('#cart');
}

/* ---------- PROFILE ---------- */
function renderProfile(){
  const u = currentUser();
  if(!u){
    $('profile-name').textContent = 'Guest';
    $('profile-email').textContent = 'Not signed in';
    $('p-saved').textContent = money(0);
    $('p-meals').textContent = '0';
    $('p-points').textContent = '0';
    $('points-progress').textContent = '0 / 500';
    $('#progress-bar').style.width = '0%';
    $('achievements').innerHTML = '<div class="card">Sign in to see achievements and loyalty rewards.</div>';
    $('payment-methods').innerHTML = '<div class="card">Sign in to manage payment methods.</div>';
  } else {
    $('profile-name').textContent = u.name || u.email.split('@')[0];
    $('profile-email').textContent = u.email;
    $('p-saved').textContent = money(u.saved || 0);
    $('p-meals').textContent = (u.meals || 0);
    $('p-points').textContent = (u.points || 0);
    $('points-progress').textContent = `${u.points || 0} / 500`;
    const pct = Math.min(100, Math.round(((u.points||0) / 500) * 100));
    $('progress-bar').style.width = pct + '%';
    // achievements
    const ach = generateAchievements(u);
    $('achievements').innerHTML = '';
    ach.forEach(a=>{
      const el = document.createElement('div'); el.className='card small';
      el.innerHTML = `<strong>${a.title}</strong><div class="muted">${a.desc}</div><div style="margin-top:.4rem">${a.unlocked?'<span style="color:var(--green)">Unlocked</span>':'Locked'}</div>`;
      $('achievements').appendChild(el);
    });
    // payment methods
    $('payment-methods').innerHTML = '';
    cards.forEach(c=> $('payment-methods').appendChild(cardItem(c)));
  }
}
function cardItem(c){
  const el = document.createElement('div'); el.className='deal';
  el.innerHTML = `<div>${c.label}</div><div><button class="btn outline" onclick="setDefaultCard('${c.id}')">${c.isDefault?'Default':'Set default'}</button> <button class="btn outline" onclick="removeCard('${c.id}')">Remove</button></div>`;
  return el;
}
function currentUser(){ if(!auth) return null; return users.find(u=>u.email === auth.email); }
function signOut(){ auth = null; save(LS_AUTH, auth); refreshAuthUi(); renderProfile(); alert('Signed out (demo).'); }

/* ---------- CART PAGE helpers ---------- */
function updateQty(id, val){ const q = Math.max(1, Number(val || 1)); const it = cart.find(i=>i.id===id); if(it) it.qty=q; save(LS_CART, cart); renderCart(); updateCartCount(); }

/* ---------- CARDS ---------- */
function openCardModal(){ openModal('modal-cards'); renderCardsList(); }
function closeCardModal(){ closeModal('modal-cards'); }
function addCard(){
  const num = $('card-number').value.trim(); const name = $('card-name').value.trim();
  if(!num || !name) return alert('Enter card number and name (demo).');
  const id = 'card-' + Date.now();
  cards.push({ id, label: `${name} •••• ${num.slice(-4)}`, isDefault: cards.length===0 });
  save(LS_CARDS, cards); renderCardsList(); renderProfile();
  $('card-number').value=''; $('card-name').value='';
}
function renderCardsList(){
  const list = $('cards-list'); list.innerHTML = '';
  cards.forEach(c => {
    const el = document.createElement('div'); el.className='deal';
    el.innerHTML = `<div>${c.label}</div><div><button class="btn outline" onclick="setDefaultCard('${c.id}')">${c.isDefault?'Default':'Set default'}</button> <button class="btn outline" onclick="removeCard('${c.id}')">Remove</button></div>`;
    list.appendChild(el);
  });
}
function setDefaultCard(id){ cards = cards.map(c=> ({...c, isDefault: c.id===id})); save(LS_CARDS, cards); renderCardsList(); renderProfile(); }
function removeCard(id){ cards = cards.filter(c=>c.id!==id); save(LS_CARDS, cards); renderCardsList(); renderProfile(); }

/* ---------- AVATAR PICKER ---------- */
const avatarOptions = ['🐼','🦊','🐶','🍓','🍕','🐱','🦁','🍰','🥑'];
function renderAvatarOptions(){
  const list = $('avatar-list'); if(!list) return;
  list.innerHTML = '';
  avatarOptions.forEach(a=>{
    const el = document.createElement('div'); el.className='avatar'; el.textContent = a;
    el.onclick = ()=> { const u = currentUser(); if(!u) return alert('Sign in to pick avatar.'); u.avatar = a; save(LS_USERS, users); renderProfile(); closeModal('modal-avatar'); }
    list.appendChild(el);
  });
}
function openAvatarModal(){ openModal('modal-avatar'); renderAvatarOptions(); }
function closeAvatarModal(){ closeModal('modal-avatar'); }

/* ---------- ACHIEVEMENTS logic ---------- */
function generateAchievements(user){
  const visitedStores = (user.visitedStores || 0);
  const saved = user.saved || 0;
  const meals = user.meals || 0;
  return [
    { id:'explorer', title:'Explorer', desc:'Visited 10+ stores', unlocked: visitedStores >= 10 },
    { id:'early', title:'Early Saver', desc:'Saved ≤ £50', unlocked: saved <= 50 && saved > 0 },
    { id:'first', title:'First Timer', desc:'Completed first order', unlocked: meals >= 1 }
  ];
}
function unlockAchievements(){
  const user = currentUser();
  if(!user) return;
  // increment visited stores demo & others
  user.visitedStores = (user.visitedStores || 0) + 1;
  save(LS_USERS, users);
}

/* ---------- Avatar on topbar/profile display ---------- */
function refreshAuthUi(){
  const btn = $('auth-btn') || {textContent:'Sign in / Sign up', onclick:()=>openModal('modal-auth')};
  if(auth && auth.email){ btn.textContent = auth.email.split('@')[0]; btn.onclick = ()=> go('#profile'); }
  else { btn.textContent = 'Sign in / Sign up'; btn.onclick = ()=> openModal('modal-auth'); }
}
refreshAuthUi();

/* ---------- Misc ---------- */
function renderAvatarPreview(){
  const u = currentUser();
  const avatar = u?.avatar || '🙂';
  const ael = $('profile-avatar'); if(ael) ael.textContent = avatar;
}
function renderInitialUI(){
  renderHome(); renderSearch(); renderRestaurants(); renderCart(); renderProfile(); updateCartCount(); renderAvatarPreview();
}
renderInitialUI();

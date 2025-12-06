/* -------------------------
   StockWise - SPA Demo logic
   ------------------------- */

/* ---------- PRE-CREATED DATA ---------- */
const PRE_USERS = [
    { username: "admin", password: "admin123", role: "admin" },
    { username: "staff", password: "staff123", role: "staff" }
  ];
  
  const SAMPLE_INVENTORY = [
    { id: 1, name: "Milk (Whole)", category: "Food", expiry: datePlusDaysISO(3), quantity: 2, notes: "1L carton. Store in refrigerator.", added: todayISO() },
    { id: 2, name: "Paracetamol", category: "Medicine", expiry: datePlusDaysISO(5), quantity: 5, notes: "Pain reliever", added: todayISO() },
    { id: 3, name: "Rice (Basmati)", category: "Food", expiry: datePlusDaysISO(20), quantity: 12, notes: "", added: todayISO() },
    { id: 4, name: "Detergent", category: "Supplies", expiry: datePlusDaysISO(300), quantity: 1, notes: "", added: todayISO() }
  ];
  
  const DEFAULT_CATEGORIES = ["Food","Medicine","Supplies"];
  
  /* ---------- HELPERS ---------- */
  function todayISO(){ const d=new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }
  function datePlusDaysISO(n){ const d=new Date(); d.setDate(d.getDate()+n); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }
  function daysBetween(aISO,bISO){
    const a=new Date(aISO); const b=new Date(bISO);
    const diff = Math.floor((new Date(b).setHours(0,0,0,0) - new Date(a).setHours(0,0,0,0)) / (1000*60*60*24));
    return diff;
  }
  function uid(){ return Date.now() + Math.floor(Math.random()*999); }
  function showToast(text, t=2000){ const el=document.getElementById('toast'); el.innerText=text; el.classList.remove('hidden'); setTimeout(()=>el.classList.add('hidden'),t); }
  
  /* ---------- INIT STORAGE ON FIRST LOAD ---------- */
  if(!localStorage.getItem('sw_users')) localStorage.setItem('sw_users', JSON.stringify(PRE_USERS));
  if(!localStorage.getItem('sw_inventory')) localStorage.setItem('sw_inventory', JSON.stringify(SAMPLE_INVENTORY));
  if(!localStorage.getItem('sw_categories')) localStorage.setItem('sw_categories', JSON.stringify(DEFAULT_CATEGORIES));
  
  /* ---------- NAV / SCREEN MANAGEMENT ---------- */
  const screens = {
    splash: document.getElementById('splash'),
    login: document.getElementById('login'),
    app: document.getElementById('app'),
    home: document.getElementById('home-screen'),
    inventory: document.getElementById('inventory-screen'),
    calendar: document.getElementById('calendar-screen'),
    settings: document.getElementById('settings-screen'),
    addItem: document.getElementById('add-item-screen'),
    itemDetails: document.getElementById('item-details-screen'),
    editItem: document.getElementById('edit-item-screen')
  };
  
  let currentUser = JSON.parse(localStorage.getItem('sw_logged')) || null;
  let currentView = 'splash';
  let currentMonthOffset = 0;
  let currentViewingItemId = null;
  
  function navTo(view){
    // hide all main screens first
    document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
    // handle special flows
    if(view === 'login'){ screens.login.classList.remove('hidden'); currentView='login'; return; }
    if(view === 'splash'){ screens.splash.classList.remove('hidden'); currentView='splash'; return; }
  
    // must be logged in to access app views
    if(!currentUser){
      showToast('Please login first');
      screens.login.classList.remove('hidden'); currentView='login'; return;
    }
  
    // show app container and target screen
    screens.app.classList.remove('hidden');
    document.getElementById('top-title').innerText = view.charAt(0).toUpperCase() + view.slice(1);
    // toggle specific screen
    switch(view){
      case 'home':
        screens.home.classList.remove('hidden'); renderHome(); break;
      case 'inventory':
        screens.inventory.classList.remove('hidden'); renderInventory(); break;
      case 'calendar':
        screens.calendar.classList.remove('hidden'); renderCalendar(); break;
      case 'settings':
        screens.settings.classList.remove('hidden'); renderSettings(); break;
      case 'add-item':
        screens.addItem.classList.remove('hidden'); prepareAddForm(); break;
      case 'item-details':
        screens.itemDetails.classList.remove('hidden'); renderItemDetails(currentViewingItemId); break;
      case 'edit-item':
        screens.editItem.classList.remove('hidden'); prepareEditForm(currentViewingItemId); break;
      default:
        screens.home.classList.remove('hidden'); renderHome();
    }
    currentView = view;
    updateNavActive(view);
    document.getElementById('welcome-name').innerText = currentUser ? `${currentUser.username}` : '';
  }
  
  function updateNavActive(view){
    ['nav-home','nav-inv','nav-cal','nav-set'].forEach(id=>{
      const btn=document.getElementById(id);
      if(!btn) return;
      btn.style.background = 'transparent';
    });
    if(view==='home') document.getElementById('nav-home').style.background='#d6d3d1';
    if(view==='inventory') document.getElementById('nav-inv').style.background='#d6d3d1';
    if(view==='calendar') document.getElementById('nav-cal').style.background='#d6d3d1';
    if(view==='settings') document.getElementById('nav-set').style.background='#d6d3d1';
  }
  
  /* ---------- AUTH ---------- */
  function doLogin(){
    const u=document.getElementById('login-username').value.trim();
    const p=document.getElementById('login-password').value;
    const users = JSON.parse(localStorage.getItem('sw_users')||'[]');
    const found = users.find(x => x.username===u && x.password===p);
    const err = document.getElementById('login-error');
    if(!found){ err.innerText = 'Invalid credentials'; setTimeout(()=>err.innerText='',2200); return; }
    currentUser = found;
    localStorage.setItem('sw_logged', JSON.stringify(found));
    showToast(`Welcome, ${found.username}`);
    // show app home
    navTo('home');
  }
  
  /* ---------- LOGOUT ---------- */
  function logout(){
    localStorage.removeItem('sw_logged');
    currentUser = null;
    showToast('Logged out');
    navTo('login');
    // show splash instead optionally
  }
  
  /* ---------- HOME ---------- */
  function renderHome(){
    const inv = JSON.parse(localStorage.getItem('sw_inventory')||'[]');
    // upcoming expirations - sorted by soonest (within 30 days)
    const today = todayISO();
    const upcoming = inv
      .map(i => ({...i, days: daysBetween(today,i.expiry)}))
      .filter(i => i.days <= 30)
      .sort((a,b)=>a.days-b.days)
      .slice(0,6);
  
    const ul = document.getElementById('upcoming-list');
    ul.innerHTML = '';
    upcoming.forEach(i=>{
      const li = document.createElement('li');
      li.innerHTML = `<strong>${i.name}</strong><div style="font-size:12px;color:#555">Expires in ${i.days < 0 ? Math.abs(i.days)+' days ago' : i.days+' days'} · ${i.category}</div>`;
      li.onclick = ()=>{ currentViewingItemId = i.id; navTo('item-details'); }
      ul.appendChild(li);
    });
    if(upcoming.length===0) ul.innerHTML = '<li>No upcoming expirations</li>';
  
    // summary by category
    const cats = JSON.parse(localStorage.getItem('sw_categories')||'[]');
    const summaryDiv = document.getElementById('summary-list');
    summaryDiv.innerHTML = '';
    cats.forEach(cat=>{
      const items = inv.filter(x => x.category === cat);
      const total = items.reduce((s,i)=>s + Number(i.quantity||0), 0);
      const li = document.createElement('div'); li.className='item';
      const percent = Math.min(100, Math.floor((total/20)*100)); // visual scale
      li.innerHTML = `<div style="font-size:13px">${cat}: ${total} items</div><div class="bar"><i style="width:${percent}%;"></i></div>`;
      summaryDiv.appendChild(li);
    });
  }
  
  /* ---------- INVENTORY LIST ---------- */
  function renderInventory(){
    const q = document.getElementById('search-inv') ? document.getElementById('search-inv').value.toLowerCase() : '';
    const inv = JSON.parse(localStorage.getItem('sw_inventory')||'[]');
    const list = document.getElementById('inventory-list');
    const cats = JSON.parse(localStorage.getItem('sw_categories')||'[]');
  
    list.innerHTML = '';
    cats.forEach(cat=>{
      const catItems = inv.filter(it => it.category === cat && (it.name.toLowerCase().includes(q) || !q));
      if(catItems.length===0) return;
      const header = document.createElement('div'); header.style.fontWeight='700'; header.style.margin='8px 0'; header.innerText = `${cat} (${catItems.length})`;
      list.appendChild(header);
      catItems.forEach(i=>{
        const li = document.createElement('div'); li.className='list-item'; li.style.display='flex'; li.style.justifyContent='space-between'; li.style.alignItems='center';
        const status = expiryStatus(i.expiry);
        li.innerHTML = `<div style="flex:1"><div style="font-weight:600">${i.name}</div><div style="font-size:12px;color:#555">Expires: ${i.expiry}</div></div><div style="text-align:right"><div style="color:${status.color};font-weight:700">${status.text}</div><div style="font-size:12px">${i.quantity}</div></div>`;
        li.onclick = ()=>{ currentViewingItemId = i.id; navTo('item-details'); }
        list.appendChild(li);
      });
    });
    if(!list.innerHTML) list.innerHTML = '<div style="padding:8px;background:#f7f5f4;border-radius:6px">No items found</div>';
  }
  
  /* ---------- EXPIRY STATUS ---------- */
  function expiryStatus(expiryISO){
    const d0 = todayISO();
    const days = daysBetween(d0, expiryISO);
    if(days < 0) return { text: 'Expired', color: '#b44a4a' };
    if(days <= 7) return { text: 'Near Expiry', color: '#d18b2f' };
    return { text: 'Safe', color: '#2f6b2f' };
  }
  
  /* ---------- ADD ITEM ---------- */
  function prepareAddForm(){
    document.getElementById('ai-name').value = '';
    document.getElementById('ai-category').value = '';
    document.getElementById('ai-expiry').value = '';
    document.getElementById('ai-qty').value = 1;
    document.getElementById('ai-notes').value = '';
    populateCategoryDatalist();
  }
  
  function saveNewItem(){
    const name = document.getElementById('ai-name').value.trim();
    const category = document.getElementById('ai-category').value.trim() || 'Uncategorized';
    const expiry = document.getElementById('ai-expiry').value;
    const qty = Number(document.getElementById('ai-qty').value) || 1;
    const notes = document.getElementById('ai-notes').value || '';
    if(!name || !expiry){ showToast('Complete name and expiry'); return; }
  
    const inv = JSON.parse(localStorage.getItem('sw_inventory')||'[]');
    const item = { id: uid(), name, category, expiry, quantity: qty, notes, added: todayISO() };
    inv.push(item);
    localStorage.setItem('sw_inventory', JSON.stringify(inv));
  
    // add category if new
    const cats = JSON.parse(localStorage.getItem('sw_categories')||'[]');
    if(!cats.includes(category)){ cats.push(category); localStorage.setItem('sw_categories', JSON.stringify(cats)); }
  
    showToast('Item added');
    navTo('home');
  }
  
  /* ---------- ITEM DETAILS ---------- */
  function renderItemDetails(id){
    const inv = JSON.parse(localStorage.getItem('sw_inventory')||'[]');
    const item = inv.find(x=>x.id===id);
    if(!item){ showToast('Item not found'); navTo('home'); return; }
    document.getElementById('detail-name').innerText = item.name;
    document.getElementById('detail-category').innerText = item.category;
    const st = expiryStatus(item.expiry);
    const days = daysBetween(todayISO(), item.expiry);
    const suffix = days < 0 ? `${Math.abs(days)} days ago` : `${days} days from today`;
    document.getElementById('detail-expiry').innerText = `${item.expiry} (${suffix})`;
    document.getElementById('detail-qty').innerText = item.quantity;
    document.getElementById('detail-notes').innerText = item.notes || '-';
    document.getElementById('detail-date').innerText = item.added || '-';
  
    // role-based delete permission: staff cannot delete (but can view)
    document.querySelectorAll('.danger-btn').forEach(btn=>{
      btn.style.display = (currentUser.role === 'admin') ? 'inline-block' : 'none';
    });
  }
  
  /* ---------- EDIT ITEM ---------- */
  function startEdit(){
    if(currentUser.role !== 'admin' && currentUser.role !== 'staff'){ showToast('Not allowed'); return; }
    const id = currentViewingItemId;
    navTo('edit-item');
  }
  function prepareEditForm(id){
    const inv = JSON.parse(localStorage.getItem('sw_inventory')||'[]');
    const item = inv.find(x=>x.id===id);
    if(!item){ showToast('Item not found'); navTo('home'); return; }
    document.getElementById('ei-name').value = item.name;
    document.getElementById('ei-category').value = item.category;
    document.getElementById('ei-expiry').value = item.expiry;
    document.getElementById('ei-qty').value = item.quantity;
    document.getElementById('ei-notes').value = item.notes;
    populateCategoryDatalist();
  }
  function saveEditedItem(){
    const id = currentViewingItemId;
    const inv = JSON.parse(localStorage.getItem('sw_inventory')||'[]');
    const idx = inv.findIndex(x=>x.id===id);
    if(idx === -1){ showToast('Not found'); return; }
    inv[idx].name = document.getElementById('ei-name').value.trim();
    inv[idx].category = document.getElementById('ei-category').value.trim() || 'Uncategorized';
    inv[idx].expiry = document.getElementById('ei-expiry').value;
    inv[idx].quantity = Number(document.getElementById('ei-qty').value) || 1;
    inv[idx].notes = document.getElementById('ei-notes').value;
    localStorage.setItem('sw_inventory', JSON.stringify(inv));
  
    // update categories
    const cats = JSON.parse(localStorage.getItem('sw_categories')||'[]');
    if(!cats.includes(inv[idx].category)){ cats.push(inv[idx].category); localStorage.setItem('sw_categories', JSON.stringify(cats)); }
  
    showToast('Saved');
    currentViewingItemId = id;
    navTo('item-details');
  }
  
  /* ---------- DELETE ITEM ---------- */
  function deleteCurrentItem(){
    if(currentUser.role !== 'admin'){ showToast('Only admin can delete'); return; }
    if(!confirm('Delete this item?')) return;
    const inv = JSON.parse(localStorage.getItem('sw_inventory')||'[]');
    const updated = inv.filter(x=>x.id !== currentViewingItemId);
    localStorage.setItem('sw_inventory', JSON.stringify(updated));
    showToast('Deleted');
    navTo('home');
  }
  
  /* ---------- CATEGORIES ---------- */
  function renderSettings(){
    document.getElementById('enable-reminders').checked = false;
    const cats = JSON.parse(localStorage.getItem('sw_categories')||'[]');
    const list = document.getElementById('category-list'); list.innerHTML='';
    cats.forEach(c=>{
      const li = document.createElement('li'); li.innerText = '• ' + c;
      list.appendChild(li);
    });
    populateCategoryDatalist();
  }
  function addCategory(){
    const v = document.getElementById('new-category').value.trim();
    if(!v) return;
    const cats = JSON.parse(localStorage.getItem('sw_categories')||'[]');
    if(cats.includes(v)){ showToast('Category exists'); return; }
    cats.push(v);
    localStorage.setItem('sw_categories', JSON.stringify(cats));
    document.getElementById('new-category').value='';
    renderSettings();
  }
  
  /* ---------- DATALISTS ---------- */
  function populateCategoryDatalist(){
    const cats = JSON.parse(localStorage.getItem('sw_categories')||'[]');
    const dl = document.getElementById('category-datalist');
    dl.innerHTML = '';
    cats.forEach(c=>{
      const opt = document.createElement('option'); opt.value=c;
      dl.appendChild(opt);
    });
  }
  
  /* ---------- CALENDAR ---------- */
  function renderCalendar(){
    currentMonthOffset = currentMonthOffset || 0;
    const d = new Date(); d.setMonth(d.getMonth() + currentMonthOffset);
    const monthName = d.toLocaleString('default',{month:'long', year:'numeric'});
    document.getElementById('calendar-month').innerText = monthName;
  
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const startDay = first.getDay(); // 0-6 sun-sat
    const daysInMonth = new Date(d.getFullYear(), d.getMonth()+1,0).getDate();
  
    const grid = document.getElementById('calendar-grid'); grid.innerHTML='';
    // show day labels
    const labels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    labels.forEach(lbl => { const el=document.createElement('div'); el.className='day'; el.style.fontWeight='700'; el.innerText = lbl; grid.appendChild(el); });
  
    // fill blanks for first week
    for(let i=0;i<startDay;i++){
      const el=document.createElement('div'); el.className='day'; el.innerHTML=''; grid.appendChild(el);
    }
    // days
    for(let day=1; day<=daysInMonth; day++){
      const el=document.createElement('div'); el.className='day'; el.innerText = day;
      const dayISO = new Date(d.getFullYear(), d.getMonth(), day).toISOString().slice(0,10);
      // mark if has expiry
      const inv = JSON.parse(localStorage.getItem('sw_inventory')||'[]');
      const has = inv.some(i => i.expiry === dayISO);
      if(has){ el.style.background = '#ded9d7'; el.style.fontWeight='700' }
      grid.appendChild(el);
    }
  
    // list items expiring this month
    const inv = JSON.parse(localStorage.getItem('sw_inventory')||'[]');
    const items = inv.filter(i=>{
      const dt = new Date(i.expiry);
      return dt.getMonth() === d.getMonth() && dt.getFullYear()===d.getFullYear();
    });
    const li = document.getElementById('calendar-items'); li.innerHTML='';
    items.forEach(i=>{
      const item = document.createElement('li');
      item.innerText = `${i.name} — Expires: ${i.expiry}`;
      item.onclick = ()=>{ currentViewingItemId = i.id; navTo('item-details'); }
      li.appendChild(item);
    });
    if(items.length===0) li.innerHTML = '<li>No expirations this month</li>';
  }
  function changeMonth(delta){ currentMonthOffset += delta; renderCalendar(); }
  
  /* ---------- BOOTSTRAP / START ---------- */
  function boot(){
    // if logged in, go to app home; else show splash
    currentUser = JSON.parse(localStorage.getItem('sw_logged')||'null');
    if(currentUser){ navTo('home'); } else { navTo('splash'); }
  
    // wire up small events
    document.getElementById('login-username').addEventListener('keydown', (e)=>{ if(e.key==='Enter') doLogin(); });
    document.getElementById('login-password').addEventListener('keydown', (e)=>{ if(e.key==='Enter') doLogin(); });
    populateCategoryDatalist();
  }
  /* ---------- LOGOUT ---------- */
function logout(){
    localStorage.removeItem('sw_logged');
    currentUser = null;
    showToast('Logged out');
    
    // Clear navigation active state
    updateNavActive('');
    
    // Hide app screens and show login screen directly
    screens.app.classList.add('hidden');
    screens.login.classList.remove('hidden');
    currentView = 'login';
    
    // Clear login form
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').innerText = '';
  }
  
  /* ---------- START ---------- */
  boot();
/* -------------------------
   StockWise - Main Application Logic
   ------------------------- */

/* ---------- GLOBAL VARIABLES ---------- */
let currentUser = null;
let currentView = 'splash';
let currentMonthOffset = 0;
let currentViewingItemId = null;

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

const DEFAULT_CATEGORIES = ["Food", "Medicine", "Supplies"];

/* ---------- HELPER FUNCTIONS ---------- */
function todayISO() { 
  const d = new Date(); 
  d.setHours(0, 0, 0, 0); 
  return d.toISOString().slice(0, 10); 
}

function datePlusDaysISO(n) { 
  const d = new Date(); 
  d.setDate(d.getDate() + n); 
  d.setHours(0, 0, 0, 0); 
  return d.toISOString().slice(0, 10); 
}

function daysBetween(aISO, bISO) {
  const a = new Date(aISO);
  const b = new Date(bISO);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  const diff = Math.floor((b - a) / (1000 * 60 * 60 * 24));
  return diff;
}

function uid() { 
  return Date.now() + Math.floor(Math.random() * 999); 
}

function showToast(text, duration = 3000) { 
  const el = document.getElementById('toast'); 
  if (el) {
    el.innerText = text; 
    el.classList.remove('hidden'); 
    setTimeout(() => el.classList.add('hidden'), duration);
  }
}

/* ---------- INITIALIZE STORAGE ---------- */
function initializeStorage() {
  if (!localStorage.getItem('sw_users')) {
    localStorage.setItem('sw_users', JSON.stringify(PRE_USERS));
  }
  if (!localStorage.getItem('sw_inventory')) {
    localStorage.setItem('sw_inventory', JSON.stringify(SAMPLE_INVENTORY));
  }
  if (!localStorage.getItem('sw_categories')) {
    localStorage.setItem('sw_categories', JSON.stringify(DEFAULT_CATEGORIES));
  }
}

/* ---------- NAVIGATION ---------- */
function navTo(view) {
  console.log('Navigating to:', view);
  
  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.add('hidden');
  });
  
  // Handle auth screens
  if (view === 'login') {
    document.getElementById('login').classList.remove('hidden');
    currentView = 'login';
    return;
  }
  
  if (view === 'register') {
    document.getElementById('register').classList.remove('hidden');
    currentView = 'register';
    return;
  }
  
  if (view === 'splash') {
    document.getElementById('splash').classList.remove('hidden');
    currentView = 'splash';
    return;
  }
  
  // Must be logged in to access app views
  if (!currentUser) {
    showToast('Please login first');
    document.getElementById('login').classList.remove('hidden');
    currentView = 'login';
    return;
  }
  
  // Show app container
  const appElement = document.getElementById('app');
  if (appElement) {
    appElement.classList.remove('hidden');
  }
  
  // Update top title
  const titleMap = {
    'home': 'Home',
    'inventory': 'Inventory',
    'calendar': 'Calendar',
    'settings': 'Settings',
    'add-item': 'Add Item',
    'item-details': 'Item Details',
    'edit-item': 'Edit Item'
  };
  
  const topTitle = document.getElementById('top-title');
  if (topTitle) {
    topTitle.textContent = titleMap[view] || 'StockWise';
  }
  
  // Show target screen and render content
  switch(view) {
    case 'home':
      document.getElementById('home-screen').classList.remove('hidden');
      renderHome();
      break;
    case 'inventory':
      document.getElementById('inventory-screen').classList.remove('hidden');
      renderInventory();
      break;
    case 'calendar':
      document.getElementById('calendar-screen').classList.remove('hidden');
      renderCalendar();
      break;
    case 'settings':
      document.getElementById('settings-screen').classList.remove('hidden');
      renderSettings();
      break;
    case 'add-item':
      document.getElementById('add-item-screen').classList.remove('hidden');
      prepareAddForm();
      break;
    case 'item-details':
      document.getElementById('item-details-screen').classList.remove('hidden');
      renderItemDetails(currentViewingItemId);
      break;
    case 'edit-item':
      document.getElementById('edit-item-screen').classList.remove('hidden');
      prepareEditForm(currentViewingItemId);
      break;
    default:
      document.getElementById('home-screen').classList.remove('hidden');
      renderHome();
  }
  
  currentView = view;
  updateNavActive(view);
  updateWelcomeMessage();
}

function updateNavActive(view) {
  const navButtons = ['nav-home', 'nav-inv', 'nav-cal', 'nav-set'];
  navButtons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  if (view === 'home') {
    const btn = document.getElementById('nav-home');
    if (btn) btn.classList.add('active');
  }
  if (view === 'inventory') {
    const btn = document.getElementById('nav-inv');
    if (btn) btn.classList.add('active');
  }
  if (view === 'calendar') {
    const btn = document.getElementById('nav-cal');
    if (btn) btn.classList.add('active');
  }
  if (view === 'settings') {
    const btn = document.getElementById('nav-set');
    if (btn) btn.classList.add('active');
  }
}

function updateWelcomeMessage() {
  const welcomeElement = document.getElementById('welcome-name');
  if (welcomeElement && currentUser) {
    welcomeElement.textContent = `Welcome, ${currentUser.username} (${currentUser.role})`;
  }
}

/* ---------- AUTHENTICATION ---------- */
function doLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errorElement = document.getElementById('login-error');
  
  if (!errorElement) {
    console.error('Login error element not found');
    return;
  }
  
  // Get users from localStorage
  const storedUsers = JSON.parse(localStorage.getItem('sw_users') || '[]');
  
  // Combine demo users with registered users
  const allUsers = [...PRE_USERS, ...storedUsers];
  
  // Check credentials
  const user = allUsers.find(u => u.username === username && u.password === password);
  
  if (!username || !password) {
    errorElement.textContent = 'Please enter username and password';
    return;
  }
  
  if (user) {
    errorElement.textContent = '';
    currentUser = user;
    localStorage.setItem('sw_logged', JSON.stringify(user));
    showToast(`Welcome, ${user.username} (${user.role})`);
    navTo('home');
  } else {
    errorElement.textContent = 'Invalid username or password';
  }
}

function registerUser() {
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  const errorElement = document.getElementById('register-error');
  
  if (!errorElement) {
    console.error('Register error element not found');
    return;
  }
  
  // Clear previous error
  errorElement.textContent = '';
  
  // Validation
  if (!username || !email || !password || !confirm) {
    errorElement.textContent = 'All fields are required';
    return;
  }
  
  if (password !== confirm) {
    errorElement.textContent = 'Passwords do not match';
    return;
  }
  
  if (password.length < 6) {
    errorElement.textContent = 'Password must be at least 6 characters';
    return;
  }
  
  if (!email.includes('@')) {
    errorElement.textContent = 'Please enter a valid email';
    return;
  }
  
  // Get existing users
  const users = JSON.parse(localStorage.getItem('sw_users') || '[]');
  
  // Check if user already exists
  if (users.find(user => user.username === username)) {
    errorElement.textContent = 'Username already exists';
    return;
  }
  
  if (users.find(user => user.email === email)) {
    errorElement.textContent = 'Email already registered';
    return;
  }
  
  // Add new user with 'user' role by default
  users.push({ 
    username, 
    email, 
    password, 
    role: 'user'
  });
  
  localStorage.setItem('sw_users', JSON.stringify(users));
  
  // Show success and redirect to login
  showToast('Registration successful! Redirecting to login...');
  
  setTimeout(() => {
    navTo('login');
    const loginUsername = document.getElementById('login-username');
    if (loginUsername) {
      loginUsername.value = username;
    }
  }, 1500);
}

function logout() {
  localStorage.removeItem('sw_logged');
  currentUser = null;
  showToast('Logged out successfully');
  
  // Clear login form
  const loginUsername = document.getElementById('login-username');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  
  if (loginUsername) loginUsername.value = '';
  if (loginPassword) loginPassword.value = '';
  if (loginError) loginError.textContent = '';
  
  // Go to login screen
  navTo('login');
}

/* ---------- EXPIRY STATUS ---------- */
function expiryStatus(expiryISO) {
  const today = todayISO();
  const days = daysBetween(today, expiryISO);
  
  if (days < 0) return { text: 'Expired', color: '#b44a4a' };
  if (days <= 7) return { text: 'Near Expiry', color: '#d18b2f' };
  return { text: 'Safe', color: '#2f6b2f' };
}

/* ---------- HOME SCREEN ---------- */
function renderHome() {
  const inventory = JSON.parse(localStorage.getItem('sw_inventory') || '[]');
  const today = todayISO();
  
  // Upcoming expirations (within 30 days)
  const upcoming = inventory
    .map(item => ({ ...item, days: daysBetween(today, item.expiry) }))
    .filter(item => item.days <= 30)
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);
  
  const upcomingList = document.getElementById('upcoming-list');
  if (!upcomingList) return;
  
  upcomingList.innerHTML = '';
  
  if (upcoming.length === 0) {
    upcomingList.innerHTML = '<li>No upcoming expirations</li>';
  } else {
    upcoming.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${item.name}</strong>
        <div style="font-size:12px;color:#555">
          Expires in ${item.days < 0 ? Math.abs(item.days) + ' days ago' : item.days + ' days'} · ${item.category}
        </div>
      `;
      li.onclick = () => {
        currentViewingItemId = item.id;
        navTo('item-details');
      };
      upcomingList.appendChild(li);
    });
  }
  
  // Inventory summary by category
  const categories = JSON.parse(localStorage.getItem('sw_categories') || '[]');
  const summaryList = document.getElementById('summary-list');
  if (!summaryList) return;
  
  summaryList.innerHTML = '';
  
  categories.forEach(category => {
    const items = inventory.filter(item => item.category === category);
    const total = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const percent = Math.min(100, Math.floor((total / 20) * 100)); // Visual scale
    
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <div style="font-size:13px">${category}: ${total} items</div>
      <div class="bar"><i style="width:${percent}%;"></i></div>
    `;
    summaryList.appendChild(div);
  });
}

/* ---------- INVENTORY SCREEN ---------- */
function renderInventory() {
  const searchInput = document.getElementById('search-inv');
  const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
  const inventory = JSON.parse(localStorage.getItem('sw_inventory') || '[]');
  const categories = JSON.parse(localStorage.getItem('sw_categories') || '[]');
  const inventoryList = document.getElementById('inventory-list');
  
  if (!inventoryList) return;
  
  inventoryList.innerHTML = '';
  
  if (inventory.length === 0) {
    inventoryList.innerHTML = '<div style="padding:8px;background:#f7f5f4;border-radius:6px;text-align:center;">No items in inventory</div>';
    return;
  }
  
  categories.forEach(category => {
    const categoryItems = inventory.filter(item => 
      item.category === category && 
      (item.name.toLowerCase().includes(searchQuery) || !searchQuery)
    );
    
    if (categoryItems.length === 0) return;
    
    const header = document.createElement('div');
    header.style.fontWeight = '700';
    header.style.margin = '8px 0';
    header.style.padding = '5px 0';
    header.style.borderBottom = '1px solid #ddd';
    header.innerText = `${category} (${categoryItems.length})`;
    inventoryList.appendChild(header);
    
    categoryItems.forEach(item => {
      const div = document.createElement('div');
      div.className = 'list-item';
      div.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px;
        margin-bottom: 4px;
        background: #f7f5f4;
        border-radius: 6px;
        cursor: pointer;
      `;
      
      const status = expiryStatus(item.expiry);
      div.innerHTML = `
        <div style="flex:1">
          <div style="font-weight:600">${item.name}</div>
          <div style="font-size:12px;color:#555">Expires: ${item.expiry} · Qty: ${item.quantity}</div>
        </div>
        <div style="text-align:right">
          <div style="color:${status.color};font-weight:700;font-size:12px">${status.text}</div>
          <div style="font-size:11px;color:#777">${item.category}</div>
        </div>
      `;
      
      div.onclick = () => {
        currentViewingItemId = item.id;
        navTo('item-details');
      };
      
      inventoryList.appendChild(div);
    });
  });
  
  if (inventoryList.innerHTML === '') {
    inventoryList.innerHTML = '<div style="padding:8px;background:#f7f5f4;border-radius:6px;text-align:center;">No items found</div>';
  }
}

/* ---------- ITEM DETAILS ---------- */
function renderItemDetails(id) {
  const inventory = JSON.parse(localStorage.getItem('sw_inventory') || '[]');
  const item = inventory.find(item => item.id === id);
  
  if (!item) {
    showToast('Item not found');
    navTo('home');
    return;
  }
  
  const detailName = document.getElementById('detail-name');
  const detailCategory = document.getElementById('detail-category');
  const detailExpiry = document.getElementById('detail-expiry');
  const detailQty = document.getElementById('detail-qty');
  const detailNotes = document.getElementById('detail-notes');
  const detailDate = document.getElementById('detail-date');
  
  if (!detailName || !detailCategory || !detailExpiry || !detailQty || !detailNotes || !detailDate) {
    console.error('Item detail elements not found');
    return;
  }
  
  detailName.textContent = item.name;
  detailCategory.textContent = item.category;
  
  const status = expiryStatus(item.expiry);
  const days = daysBetween(todayISO(), item.expiry);
  const suffix = days < 0 ? `${Math.abs(days)} days ago` : `${days} days from today`;
  
  detailExpiry.textContent = `${item.expiry} (${suffix})`;
  detailExpiry.style.color = status.color;
  detailQty.textContent = item.quantity;
  detailNotes.textContent = item.notes || '-';
  detailDate.textContent = item.added || '-';
  
  // Role-based button visibility - FIXED FOR STAFF USERS
  const editBtn = document.querySelector('#item-details-screen .secondary-btn');
  const deleteBtn = document.querySelector('#item-details-screen .danger-btn');
  
  if (!currentUser) {
    if (editBtn) editBtn.style.display = 'none';
    if (deleteBtn) deleteBtn.style.display = 'none';
    return;
  }
  
  // Clear any previous styles
  if (editBtn) {
    editBtn.style.display = 'inline-block';
    editBtn.style.visibility = 'visible';
    editBtn.style.opacity = '1';
  }
  
  if (deleteBtn) {
    deleteBtn.style.display = 'inline-block';
    deleteBtn.style.visibility = 'visible';
    deleteBtn.style.opacity = '1';
  }
  
  // Set permissions based on role
  if (currentUser.role === 'admin') {
    // Admin can edit and delete
    if (editBtn) editBtn.disabled = false;
    if (deleteBtn) deleteBtn.disabled = false;
  } else if (currentUser.role === 'staff') {
    // Staff can edit but not delete
    if (editBtn) editBtn.disabled = false;
    if (deleteBtn) {
      deleteBtn.style.display = 'none';
    }
  } else {
    // Regular users can only view - no edit or delete
    if (editBtn) editBtn.style.display = 'none';
    if (deleteBtn) deleteBtn.style.display = 'none';
  }
}

function startEdit() {
  if (!currentUser) {
    showToast('Please login first');
    navTo('login');
    return;
  }
  
  // Check permissions
  if (currentUser.role === 'admin' || currentUser.role === 'staff') {
    navTo('edit-item');
  } else {
    showToast('You do not have permission to edit items');
  }
}

/* ---------- ADD ITEM ---------- */
function prepareAddForm() {
  const aiName = document.getElementById('ai-name');
  const aiCategory = document.getElementById('ai-category');
  const aiExpiry = document.getElementById('ai-expiry');
  const aiQty = document.getElementById('ai-qty');
  const aiNotes = document.getElementById('ai-notes');
  
  if (aiName) aiName.value = '';
  if (aiCategory) aiCategory.value = '';
  if (aiExpiry) aiExpiry.value = '';
  if (aiQty) aiQty.value = 1;
  if (aiNotes) aiNotes.value = '';
  
  populateCategoryDatalist();
}

function saveNewItem() {
  if (!currentUser) {
    showToast('Please login first');
    navTo('login');
    return;
  }
  
  // Check permissions for adding items
  if (currentUser.role === 'user') {
    showToast('Regular users cannot add items. Please contact admin or staff.');
    return;
  }
  
  const name = document.getElementById('ai-name')?.value.trim();
  const category = document.getElementById('ai-category')?.value.trim() || 'Uncategorized';
  const expiry = document.getElementById('ai-expiry')?.value;
  const qty = Number(document.getElementById('ai-qty')?.value) || 1;
  const notes = document.getElementById('ai-notes')?.value;
  
  if (!name || !expiry) {
    showToast('Please complete name and expiry date');
    return;
  }
  
  const inventory = JSON.parse(localStorage.getItem('sw_inventory') || '[]');
  const newItem = {
    id: uid(),
    name,
    category,
    expiry,
    quantity: qty,
    notes,
    added: todayISO()
  };
  
  inventory.push(newItem);
  localStorage.setItem('sw_inventory', JSON.stringify(inventory));
  
  // Add category if new
  const categories = JSON.parse(localStorage.getItem('sw_categories') || '[]');
  if (!categories.includes(category)) {
    categories.push(category);
    localStorage.setItem('sw_categories', JSON.stringify(categories));
  }
  
  showToast('Item added successfully');
  navTo('home');
}

/* ---------- EDIT ITEM ---------- */
function prepareEditForm(id) {
  const inventory = JSON.parse(localStorage.getItem('sw_inventory') || '[]');
  const item = inventory.find(item => item.id === id);
  
  if (!item) {
    showToast('Item not found');
    navTo('home');
    return;
  }
  
  const eiName = document.getElementById('ei-name');
  const eiCategory = document.getElementById('ei-category');
  const eiExpiry = document.getElementById('ei-expiry');
  const eiQty = document.getElementById('ei-qty');
  const eiNotes = document.getElementById('ei-notes');
  
  if (eiName) eiName.value = item.name;
  if (eiCategory) eiCategory.value = item.category;
  if (eiExpiry) eiExpiry.value = item.expiry;
  if (eiQty) eiQty.value = item.quantity;
  if (eiNotes) eiNotes.value = item.notes || '';
  
  populateCategoryDatalist();
}

function saveEditedItem() {
  if (!currentUser) {
    showToast('Please login first');
    navTo('login');
    return;
  }
  
  // Check permissions for editing
  if (currentUser.role === 'user') {
    showToast('Regular users cannot edit items');
    navTo('item-details');
    return;
  }
  
  const id = currentViewingItemId;
  const inventory = JSON.parse(localStorage.getItem('sw_inventory') || '[]');
  const index = inventory.findIndex(item => item.id === id);
  
  if (index === -1) {
    showToast('Item not found');
    return;
  }
  
  const eiName = document.getElementById('ei-name');
  const eiCategory = document.getElementById('ei-category');
  const eiExpiry = document.getElementById('ei-expiry');
  const eiQty = document.getElementById('ei-qty');
  const eiNotes = document.getElementById('ei-notes');
  
  if (!eiName || !eiCategory || !eiExpiry || !eiQty) {
    showToast('Form fields not found');
    return;
  }
  
  inventory[index].name = eiName.value.trim();
  inventory[index].category = eiCategory.value.trim() || 'Uncategorized';
  inventory[index].expiry = eiExpiry.value;
  inventory[index].quantity = Number(eiQty.value) || 1;
  inventory[index].notes = eiNotes ? eiNotes.value : '';
  
  localStorage.setItem('sw_inventory', JSON.stringify(inventory));
  
  // Update categories if new
  const categories = JSON.parse(localStorage.getItem('sw_categories') || '[]');
  if (!categories.includes(inventory[index].category)) {
    categories.push(inventory[index].category);
    localStorage.setItem('sw_categories', JSON.stringify(categories));
  }
  
  showToast('Item updated successfully');
  navTo('item-details');
}

/* ---------- DELETE ITEM ---------- */
function deleteCurrentItem() {
  if (!currentUser) {
    showToast('Please login first');
    navTo('login');
    return;
  }
  
  // Only admin can delete
  if (currentUser.role !== 'admin') {
    showToast('Only admin can delete items');
    return;
  }
  
  if (!confirm('Are you sure you want to delete this item?')) {
    return;
  }
  
  const inventory = JSON.parse(localStorage.getItem('sw_inventory') || '[]');
  const updatedInventory = inventory.filter(item => item.id !== currentViewingItemId);
  
  localStorage.setItem('sw_inventory', JSON.stringify(updatedInventory));
  showToast('Item deleted');
  navTo('home');
}

/* ---------- CATEGORIES ---------- */
function renderSettings() {
  const enableReminders = document.getElementById('enable-reminders');
  if (enableReminders) {
    enableReminders.checked = false;
  }
  
  const categories = JSON.parse(localStorage.getItem('sw_categories') || '[]');
  const categoryList = document.getElementById('category-list');
  if (!categoryList) return;
  
  categoryList.innerHTML = '';
  categories.forEach(category => {
    const li = document.createElement('li');
    li.textContent = '• ' + category;
    categoryList.appendChild(li);
  });
  
  populateCategoryDatalist();
}

function addCategory() {
  if (!currentUser) {
    showToast('Please login first');
    navTo('login');
    return;
  }
  
  // Only admin and staff can add categories
  if (currentUser.role === 'user') {
    showToast('Regular users cannot manage categories');
    return;
  }
  
  const newCategoryInput = document.getElementById('new-category');
  if (!newCategoryInput) return;
  
  const newCategory = newCategoryInput.value.trim();
  
  if (!newCategory) {
    showToast('Please enter a category name');
    return;
  }
  
  const categories = JSON.parse(localStorage.getItem('sw_categories') || '[]');
  
  if (categories.includes(newCategory)) {
    showToast('Category already exists');
    return;
  }
  
  categories.push(newCategory);
  localStorage.setItem('sw_categories', JSON.stringify(categories));
  
  newCategoryInput.value = '';
  renderSettings();
  showToast('Category added');
}

/* ---------- CATEGORY DATALIST ---------- */
function populateCategoryDatalist() {
  const categories = JSON.parse(localStorage.getItem('sw_categories') || '[]');
  const datalist = document.getElementById('category-datalist');
  if (!datalist) return;
  
  datalist.innerHTML = '';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    datalist.appendChild(option);
  });
}

/* ---------- CALENDAR ---------- */
function renderCalendar() {
  currentMonthOffset = currentMonthOffset || 0;
  const date = new Date();
  date.setMonth(date.getMonth() + currentMonthOffset);
  
  const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
  const calendarMonth = document.getElementById('calendar-month');
  if (calendarMonth) {
    calendarMonth.textContent = monthName;
  }
  
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const startDay = firstDay.getDay(); // 0-6 (Sun-Sat)
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  
  const grid = document.getElementById('calendar-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  // Day labels
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  labels.forEach(label => {
    const day = document.createElement('div');
    day.className = 'day';
    day.style.fontWeight = '700';
    day.textContent = label;
    grid.appendChild(day);
  });
  
  // Blank days for first week
  for (let i = 0; i < startDay; i++) {
    const day = document.createElement('div');
    day.className = 'day';
    grid.appendChild(day);
  }
  
  // Days of month
  const inventory = JSON.parse(localStorage.getItem('sw_inventory') || '[]');
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'day';
    dayElement.textContent = day;
    
    const dayISO = new Date(date.getFullYear(), date.getMonth(), day).toISOString().slice(0, 10);
    const hasExpiry = inventory.some(item => item.expiry === dayISO);
    
    if (hasExpiry) {
      dayElement.classList.add('has-expiry');
    }
    
    grid.appendChild(dayElement);
  }
  
  // Items expiring this month
  const itemsThisMonth = inventory.filter(item => {
    const itemDate = new Date(item.expiry);
    return itemDate.getMonth() === date.getMonth() && 
           itemDate.getFullYear() === date.getFullYear();
  });
  
  const calendarItems = document.getElementById('calendar-items');
  if (!calendarItems) return;
  
  calendarItems.innerHTML = '';
  
  if (itemsThisMonth.length === 0) {
    calendarItems.innerHTML = '<li>No items expiring this month</li>';
  } else {
    itemsThisMonth.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name} — Expires: ${item.expiry}`;
      li.onclick = () => {
        currentViewingItemId = item.id;
        navTo('item-details');
      };
      calendarItems.appendChild(li);
    });
  }
}

function changeMonth(delta) {
  currentMonthOffset += delta;
  renderCalendar();
}

/* ---------- INITIALIZATION ---------- */
function boot() {
  console.log('StockWise app booting...');
  
  initializeStorage();
  
  // Check if user is logged in
  try {
    currentUser = JSON.parse(localStorage.getItem('sw_logged'));
  } catch (e) {
    currentUser = null;
    localStorage.removeItem('sw_logged');
  }
  
  if (currentUser) {
    console.log('User logged in:', currentUser.username, 'Role:', currentUser.role);
    navTo('home');
  } else {
    console.log('No user logged in, showing splash');
    navTo('splash');
  }
  
  // Add event listeners for Enter key in login
  const loginUsername = document.getElementById('login-username');
  const loginPassword = document.getElementById('login-password');
  
  if (loginUsername) {
    loginUsername.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doLogin();
    });
  }
  
  if (loginPassword) {
    loginPassword.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doLogin();
    });
  }
  
  // Initialize category datalist
  populateCategoryDatalist();
  
  console.log('StockWise app ready!');
}

/* ---------- START APPLICATION ---------- */
// Make functions available globally
window.navTo = navTo;
window.doLogin = doLogin;
window.registerUser = registerUser;
window.logout = logout;
window.showToast = showToast;
window.startEdit = startEdit;
window.saveNewItem = saveNewItem;
window.saveEditedItem = saveEditedItem;
window.deleteCurrentItem = deleteCurrentItem;
window.addCategory = addCategory;
window.changeMonth = changeMonth;
window.renderInventory = renderInventory;

document.addEventListener('DOMContentLoaded', boot);
// === STOCKWISE APP - WORKING VERSION ===

// === PRE-CREATED ACCOUNTS ===
const users = [
    { username: "admin", password: "admin123", role: "admin" },
    { username: "staff", password: "staff123", role: "staff" }
];

// === SAMPLE INVENTORY ===
const sampleInventory = [
    { id: 1, name: "Milk (Whole)", category: "Food", quantity: 3, expiry: "2025-03-15", notes: "Whole milk", dateAdded: getToday() },
    { id: 2, name: "Eggs (Large)", category: "Food", quantity: 12, expiry: "2025-03-18", notes: "Large eggs", dateAdded: getToday() },
    { id: 3, name: "Paracetamol", category: "Medicine", quantity: 5, expiry: "2025-03-20", notes: "500mg tablets", dateAdded: getToday() },
    { id: 4, name: "Rice (Basmati)", category: "Food", quantity: 1, expiry: "2025-04-05", notes: "5kg bag", dateAdded: getToday() },
    { id: 5, name: "Detergent", category: "Supplies", quantity: 2, expiry: "2025-09-30", notes: "Laundry detergent", dateAdded: getToday() }
];

// === HELPER FUNCTIONS ===
function getToday() {
    return new Date().toISOString().split('T')[0];
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// === INITIALIZE APP DATA ===
function initAppData() {
    if (!localStorage.getItem('sw_inventory')) {
        localStorage.setItem('sw_inventory', JSON.stringify(sampleInventory));
    }
    
    if (!localStorage.getItem('sw_categories')) {
        const categories = ["Food", "Medicine", "Supplies"];
        localStorage.setItem('sw_categories', JSON.stringify(categories));
    }
    
    if (!localStorage.getItem('sw_nextId')) {
        localStorage.setItem('sw_nextId', '6');
    }
}

// === NAVIGATION FUNCTION ===
function navTo(screenId) {
    console.log('Navigating to:', screenId);
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Check if user is logged in for app screens
    const appScreens = ['home-screen', 'inventory-screen', 'calendar-screen', 'settings-screen', 'add-item-screen'];
    const isLoggedIn = localStorage.getItem('sw_loggedIn');
    
    if (appScreens.includes(screenId) && !isLoggedIn) {
        document.getElementById('login').classList.remove('hidden');
        showToast('Please login first');
        return;
    }
    
    // Show the target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
    }
    
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Update top bar title
    const topTitle = document.getElementById('top-title');
    if (topTitle) {
        switch(screenId) {
            case 'home-screen':
                topTitle.textContent = 'Home';
                document.getElementById('nav-home').classList.add('active');
                renderHomeScreen();
                break;
            case 'inventory-screen':
                topTitle.textContent = 'Inventory';
                document.getElementById('nav-inv').classList.add('active');
                renderInventory();
                break;
            case 'calendar-screen':
                topTitle.textContent = 'Calendar';
                document.getElementById('nav-cal').classList.add('active');
                renderCalendar();
                break;
            case 'settings-screen':
                topTitle.textContent = 'Settings';
                document.getElementById('nav-set').classList.add('active');
                renderSettings();
                break;
            case 'add-item-screen':
                topTitle.textContent = 'Add Item';
                break;
        }
    }
}

// === LOGIN SYSTEM ===
function beginApp() {
    document.getElementById('splash').classList.add('hidden');
    document.getElementById('login').classList.remove('hidden');
}

function doLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errorElement = document.getElementById('login-error');
    
    errorElement.textContent = '';
    
    if (!username || !password) {
        errorElement.textContent = 'Please enter both username and password';
        return;
    }
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        localStorage.setItem('sw_currentUser', JSON.stringify(user));
        localStorage.setItem('sw_loggedIn', 'true');
        
        initAppData();
        
        document.getElementById('login').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        navTo('home-screen');
        
        document.getElementById('welcome-name').textContent = `Hi, ${user.username} (${user.role})`;
        showToast(`Welcome, ${user.username}!`);
    } else {
        errorElement.textContent = 'Invalid username or password. Try admin/admin123 or staff/staff123';
    }
}

function logout() {
    localStorage.removeItem('sw_currentUser');
    localStorage.removeItem('sw_loggedIn');
    
    document.getElementById('app').classList.add('hidden');
    document.getElementById('login').classList.remove('hidden');
    
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').textContent = '';
    
    showToast('Successfully logged out');
}

// === RENDER FUNCTIONS ===
function renderHomeScreen() {
    const inventory = JSON.parse(localStorage.getItem('sw_inventory') || '[]');
    const categories = JSON.parse(localStorage.getItem('sw_categories') || '[]');
    
    // Render category sections
    const categoryInventory = document.querySelector('.category-inventory');
    if (categoryInventory) {
        categoryInventory.innerHTML = '';
        
        categories.forEach(category => {
            const categoryItems = inventory.filter(item => item.category === category);
            if (categoryItems.length > 0) {
                const categorySection = document.createElement('div');
                categorySection.className = 'category-section';
                
                categorySection.innerHTML = `
                    <h4 class="category-title">${category} <span class="item-count">(${categoryItems.length})</span></h4>
                    <div class="category-items">
                        <div class="item-pair">
                            <div class="item-column">
                                ${categoryItems.map(item => `<div class="item"><strong>${item.name.split(' ')[0]}</strong> ${item.name.split(' ').slice(1).join(' ')}</div>`).join('')}
                            </div>
                            <div class="date-column">
                                ${categoryItems.map(item => `<div class="date">Expires: ${item.expiry.split('-').slice(1).reverse().join('/')}</div>`).join('')}
                            </div>
                        </div>
                    </div>
                `;
                
                categoryInventory.appendChild(categorySection);
            }
        });
    }
}

function renderInventory() {
    const inventory = JSON.parse(localStorage.getItem('sw_inventory') || '[]');
    const categories = JSON.parse(localStorage.getItem('sw_categories') || '[]');
    const inventoryList = document.getElementById('inventory-list');
    
    if (!inventoryList) return;
    
    inventoryList.innerHTML = '';
    
    if (inventory.length === 0) {
        inventoryList.innerHTML = '<div style="padding:20px;text-align:center;color:#666">No items in inventory</div>';
        return;
    }
    
    categories.forEach(category => {
        const categoryItems = inventory.filter(item => item.category === category);
        if (categoryItems.length === 0) return;
        
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        
        categoryCard.innerHTML = `
            <div class="category-header">
                <h3 class="category-title">${category} <span class="category-count">(${categoryItems.length})</span></h3>
            </div>
            <div class="category-content">
                <div class="items-column">
                    ${categoryItems.map(item => `<div class="inventory-item">${item.name}</div>`).join('')}
                </div>
                <div class="dates-column">
                    ${categoryItems.map(item => `<div class="expiry-date">Expires: ${item.expiry.split('-').slice(1).reverse().join('/')}</div>`).join('')}
                </div>
            </div>
        `;
        
        inventoryList.appendChild(categoryCard);
    });
}

function renderCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    if (calendarGrid) {
        calendarGrid.innerHTML = '';
        
        // Day headers
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'day';
            dayEl.style.fontWeight = '700';
            dayEl.textContent = day;
            calendarGrid.appendChild(dayEl);
        });
        
        // Calendar days
        for (let i = 1; i <= 31; i++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'day';
            dayEl.textContent = i;
            calendarGrid.appendChild(dayEl);
        }
    }
}

function renderSettings() {
    const categories = JSON.parse(localStorage.getItem('sw_categories') || '[]');
    const categoryList = document.getElementById('category-list');
    
    if (categoryList) {
        categoryList.innerHTML = '';
        categories.forEach(category => {
            const li = document.createElement('li');
            li.textContent = '• ' + category;
            categoryList.appendChild(li);
        });
    }
}

// === CATEGORY MANAGEMENT ===
function addCategory() {
    const input = document.getElementById('new-category');
    const category = input.value.trim();
    
    if (!category) {
        showToast('Please enter a category name');
        return;
    }
    
    const categories = JSON.parse(localStorage.getItem('sw_categories') || '[]');
    
    if (categories.includes(category)) {
        showToast('Category already exists');
        return;
    }
    
    categories.push(category);
    localStorage.setItem('sw_categories', JSON.stringify(categories));
    
    input.value = '';
    showToast('Category added');
    renderSettings();
}

// === ADD ITEM ===
function saveNewItem() {
    const name = document.getElementById('ai-name').value.trim();
    const category = document.getElementById('ai-category').value.trim();
    const expiry = document.getElementById('ai-expiry').value;
    const qty = document.getElementById('ai-qty').value;
    const notes = document.getElementById('ai-notes').value;
    
    if (!name || !category || !expiry || !qty) {
        showToast('Please fill all required fields');
        return;
    }
    
    const inventory = JSON.parse(localStorage.getItem('sw_inventory') || '[]');
    const nextId = parseInt(localStorage.getItem('sw_nextId') || '6');
    
    const newItem = {
        id: nextId,
        name: name,
        category: category,
        quantity: parseInt(qty),
        expiry: expiry,
        notes: notes,
        dateAdded: getToday()
    };
    
    inventory.push(newItem);
    localStorage.setItem('sw_inventory', JSON.stringify(inventory));
    localStorage.setItem('sw_nextId', (nextId + 1).toString());
    
    // Add category if new
    const categories = JSON.parse(localStorage.getItem('sw_categories') || '[]');
    if (!categories.includes(category)) {
        categories.push(category);
        localStorage.setItem('sw_categories', JSON.stringify(categories));
    }
    
    showToast('Item added successfully');
    navTo('home-screen');
}

// === CALENDAR FUNCTIONS ===
function changeMonth(delta) {
    showToast('Calendar month changed');
}

// === HELPER FUNCTIONS ===
function showForgotPassword() {
    showToast('Forgot password feature coming soon');
}

function showRegister() {
    showToast('Registration feature coming soon');
}

// === INITIALIZE APP ===
function initApp() {
    const isLoggedIn = localStorage.getItem('sw_loggedIn');
    const currentUser = JSON.parse(localStorage.getItem('sw_currentUser') || '{}');
    
    if (isLoggedIn && currentUser.username) {
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('splash').classList.add('hidden');
        document.getElementById('login').classList.add('hidden');
        
        initAppData();
        document.getElementById('welcome-name').textContent = `Hi, ${currentUser.username} (${currentUser.role})`;
        navTo('home-screen');
    } else {
        document.getElementById('splash').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
        document.getElementById('login').classList.add('hidden');
    }
}

// Start the app
window.onload = initApp;
// ============================================================
// 0. USER PROFILE & GLOBAL STATE
// ============================================================
let userProfile = { name: 'Guest', currency: 'PKR', symbol: 'Rs' };
let budgets = [];
let editingBudgetId = null;

const CURRENCY_SYMBOLS = { PKR: 'Rs', USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' };
const CATEGORY_ICONS = {
    'Food & Dining': 'fa-utensils',
    'Transport': 'fa-car',
    'Shopping': 'fa-shopping-bag',
    'Bills & Utilities': 'fa-file-invoice',
    'Entertainment': 'fa-film',
    'Salary': 'fa-money-bill-wave',
    'Rent': 'fa-home',
    'Other': 'fa-box'
};

// ============================================================
// 1. LOAD USER PROFILE
// ============================================================
function loadUserProfile() {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
        userProfile = JSON.parse(stored);
        if (!userProfile.symbol || !CURRENCY_SYMBOLS[userProfile.currency]) {
            userProfile.symbol = CURRENCY_SYMBOLS[userProfile.currency] || 'Rs';
        }
        return true;
    }
    return false;
}

function updateUIWithUser() {
    document.getElementById('sidebarUserName').textContent = userProfile.name;
    const initials = userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('headerCurrencyDisplay').textContent = userProfile.currency;
}

function formatCurrency(amount) {
    const symbol = userProfile.symbol || 'Rs';
    return symbol + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ============================================================
// 2. SIDEBAR LOGIC
// ============================================================
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
const menuToggle = document.getElementById('menuToggle');
const mainContent = document.getElementById('mainContent');

function toggleSidebar(forceState) {
    const isOpen = forceState !== undefined ? forceState : !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', isOpen);

    if (window.innerWidth < 901) {
        overlay.classList.toggle('active', isOpen);
    } else {
        overlay.classList.remove('active');
    }

    if (window.innerWidth >= 901) {
        mainContent.classList.toggle('sidebar-open', isOpen);
    } else {
        mainContent.classList.remove('sidebar-open');
    }
    localStorage.setItem('sidebarOpen', isOpen);
}

menuToggle.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
overlay.addEventListener('click', () => { if (window.innerWidth < 901) toggleSidebar(false); });
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open') && window.innerWidth < 901) {
        toggleSidebar(false);
    }
});

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const isDesktop = window.innerWidth >= 901;
        if (isDesktop && sidebar.classList.contains('open')) {
            mainContent.classList.add('sidebar-open');
            overlay.classList.remove('active');
        } else {
            mainContent.classList.remove('sidebar-open');
        }
        if (!isDesktop && sidebar.classList.contains('open')) {
            overlay.classList.add('active');
        } else if (!isDesktop) {
            overlay.classList.remove('active');
        }
    }, 150);
});

// ============================================================
// 3. SETTINGS MODAL
// ============================================================
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const settingsName = document.getElementById('settingsName');
const settingsCurrency = document.getElementById('settingsCurrency');

closeSettingsBtn.addEventListener('click', () => { settingsModal.classList.remove('active'); });
settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.remove('active');
});

saveSettingsBtn.addEventListener('click', () => {
    const name = settingsName.value.trim();
    const currency = settingsCurrency.value;
    if (!name) return showToast('Please enter a name.', 'error');
    userProfile.name = name;
    userProfile.currency = currency;
    userProfile.symbol = CURRENCY_SYMBOLS[currency] || 'Rs';
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    updateUIWithUser();
    renderAll();
    closeSettings();
    showToast('✅ Settings updated!', 'success');
});

// ============================================================
// 4. BUDGET MODAL LOGIC
// ============================================================
const budgetModal = document.getElementById('budgetModal');
const budgetCategory = document.getElementById('budgetCategory');
const budgetAmount = document.getElementById('budgetAmount');
const saveBudgetBtn = document.getElementById('saveBudgetBtn');
const closeBudgetBtn = document.getElementById('closeBudgetBtn');
const budgetModalTitle = document.getElementById('budgetModalTitle');

function openBudgetModal(category = null, amount = null, id = null) {
    budgetModal.classList.add('active');
    if (id !== null) {
        editingBudgetId = id;
        budgetModalTitle.innerHTML = '<i class="fas fa-pen text-purple-600"></i> Edit Budget';
        saveBudgetBtn.innerHTML = '<i class="fas fa-save"></i> Update Budget';
        if (category) budgetCategory.value = category;
        if (amount) budgetAmount.value = amount;
    } else {
        editingBudgetId = null;
        budgetModalTitle.innerHTML = '<i class="fas fa-plus-circle text-purple-600"></i> Set Budget';
        saveBudgetBtn.innerHTML = '<i class="fas fa-save"></i> Save Budget';
        budgetCategory.value = 'Food & Dining';
        budgetAmount.value = '';
    }
}

function closeBudgetModal() {
    budgetModal.classList.remove('active');
    editingBudgetId = null;
}

closeBudgetBtn.addEventListener('click', closeBudgetModal);
budgetModal.addEventListener('click', (e) => {
    if (e.target === budgetModal) closeBudgetModal();
});

document.getElementById('addBudgetBtn').addEventListener('click', () => {
    openBudgetModal();
});

saveBudgetBtn.addEventListener('click', () => {
    const category = budgetCategory.value;
    const amount = parseFloat(budgetAmount.value);
    if (!category) return showToast('Select a category.', 'error');
    if (isNaN(amount) || amount <= 0) return showToast('Enter a valid positive amount.', 'error');

    if (editingBudgetId === null) {
        const existing = budgets.find(b => b.category === category);
        if (existing) {
            return showToast(`A budget for "${category}" already exists.`, 'error');
        }
        budgets.push({ id: Date.now().toString(), category, amount });
        showToast(`✅ Budget set for "${category}"`, 'success');
    } else {
        const index = budgets.findIndex(b => b.id === editingBudgetId);
        if (index !== -1) {
            budgets[index].category = category;
            budgets[index].amount = amount;
            showToast(`✅ Budget updated for "${category}"`, 'success');
        }
        editingBudgetId = null;
    }
    saveBudgets();
    closeBudgetModal();
    renderAll();
});

function editBudget(id) {
    const budget = budgets.find(b => b.id === id);
    if (!budget) return;
    openBudgetModal(budget.category, budget.amount, budget.id);
}

function deleteBudget(id) {
    const budget = budgets.find(b => b.id === id);
    if (!budget) return;
    if (!confirm(`Delete budget for "${budget.category}"?`)) return;
    budgets = budgets.filter(b => b.id !== id);
    saveBudgets();
    renderAll();
    showToast(`🗑️ Budget deleted for "${budget.category}"`, 'info');
}

// ============================================================
// 5. TOAST SYSTEM
// ============================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        toast.style.transition = '0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// 6. DARK MODE
// ============================================================
const darkToggle = document.getElementById('darkModeToggle');
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    darkToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i> Light' : '<i class="fas fa-moon"></i> Dark';
    localStorage.setItem('darkMode', isDark);
    renderAll();
}

// ============================================================
// 7. BUDGET DATA MANAGEMENT
// ============================================================
function loadBudgets() {
    const stored = localStorage.getItem('budgets');
    if (stored) {
        budgets = JSON.parse(stored);
    } else {
        // SEED WITH DEFAULT BUDGETS (so it looks great immediately)
        budgets = [
            { id: Date.now() + 1, category: 'Food & Dining', amount: 500 },
            { id: Date.now() + 2, category: 'Transport', amount: 200 },
            { id: Date.now() + 3, category: 'Shopping', amount: 300 },
            { id: Date.now() + 4, category: 'Bills & Utilities', amount: 400 },
            { id: Date.now() + 5, category: 'Entertainment', amount: 150 }
        ];
        saveBudgets();
    }
}

function saveBudgets() {
    localStorage.setItem('budgets', JSON.stringify(budgets));
}

// ============================================================
// 8. LOAD TRANSACTIONS (SHARED WITH DASHBOARD)
// ============================================================
function loadTransactions() {
    const stored = localStorage.getItem('financeData');
    if (stored) {
        return JSON.parse(stored);
    }
    return [];
}

function getCategorySpending(transactions, category, month) {
    const filtered = transactions.filter(tx => {
        if (tx.type !== 'expense') return false;
        if (tx.category !== category) return false;
        if (month && tx.date) {
            return tx.date.startsWith(month);
        }
        return true;
    });
    return filtered.reduce((sum, tx) => sum + tx.amount, 0);
}

// ============================================================
// 9. RENDER ALL
// ============================================================
function renderAll() {
    const month = document.getElementById('budgetMonthFilter').value;
    if (!month) {
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        document.getElementById('budgetMonthFilter').value = monthStr;
        updateMonthLabel(monthStr);
    } else {
        updateMonthLabel(month);
    }

    loadBudgets();
    const transactions = loadTransactions();
    const selectedMonth = document.getElementById('budgetMonthFilter').value;

    renderBudgetList(transactions, selectedMonth);
    renderBudgetSummary(transactions, selectedMonth);
}

function updateMonthLabel(month) {
    if (!month) return;
    const [year, m] = month.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const label = `${months[parseInt(m) - 1]} ${year}`;
    document.getElementById('listMonthLabel').textContent = `For ${label}`;
    document.getElementById('currentMonthDisplay').textContent = `Managing budgets for ${label}`;
}

// ============================================================
// 10. RENDER BUDGET LIST
// ============================================================
function renderBudgetList(transactions, month) {
    const container = document.getElementById('budgetList');
    const badge = document.getElementById('budgetCountBadge');
    const overBadge = document.getElementById('overBudgetBadge');

    if (budgets.length === 0) {
        container.innerHTML = `
            <div class="empty-budgets">
                <i class="fas fa-wallet"></i>
                <h3>No budgets set yet</h3>
                <p>Click the <strong>"New Budget"</strong> button to set spending limits for your categories.</p>
            </div>
        `;
        badge.innerHTML = `<i class="fas fa-list"></i> 0 Budgets`;
        overBadge.innerHTML = `<i class="fas fa-exclamation-triangle"></i> 0 Over Budget`;
        return;
    }

    let overCount = 0;
    let html = '';

    budgets.forEach(budget => {
        const spent = getCategorySpending(transactions, budget.category, month);
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        const remaining = budget.amount - spent;
        const icon = CATEGORY_ICONS[budget.category] || 'fa-tag';

        let statusClass = 'under';
        let statusText = `${formatCurrency(remaining)} remaining`;
        let progressClass = 'safe';
        let progressWidth = Math.min(percentage, 100);

        if (percentage >= 100) {
            statusClass = 'over';
            statusText = `⚠️ ${formatCurrency(Math.abs(remaining))} over`;
            progressClass = 'danger';
            overCount++;
        } else if (percentage >= 80) {
            statusClass = 'over';
            statusText = `⚠️ ${formatCurrency(remaining)} remaining`;
            progressClass = 'warning';
        }

        if (percentage === 0 && spent === 0) {
            statusClass = 'under';
            statusText = 'No spending yet 🎯';
            progressClass = 'safe';
            progressWidth = 0;
        }

        html += `
            <div class="budget-item" data-id="${budget.id}">
                <div class="budget-header">
                    <div>
                        <span class="budget-category"><i class="fas ${icon}"></i> ${budget.category}</span>
                    </div>
                    <div class="budget-numbers">
                        <span class="budget-limit"><i class="fas fa-bullseye"></i> ${formatCurrency(budget.amount)}</span>
                        <span class="budget-spent ${statusClass}"><i class="fas fa-arrow-right"></i> ${formatCurrency(spent)}</span>
                        <span class="budget-remaining ${statusClass}">${statusText}</span>
                        <div class="budget-actions">
                            <button class="edit-budget-btn" onclick="editBudget('${budget.id}')"><i class="fas fa-pen"></i></button>
                            <button class="delete-budget-btn" onclick="deleteBudget('${budget.id}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
                <div class="budget-progress">
                    <div class="progress-fill ${progressClass}" style="width: ${Math.min(progressWidth, 100)}%;"></div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    badge.innerHTML = `<i class="fas fa-list"></i> ${budgets.length} Budgets`;
    overBadge.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${overCount} Over Budget`;
}

// ============================================================
// 11. RENDER BUDGET SUMMARY
// ============================================================
function renderBudgetSummary(transactions, month) {
    let totalBudget = 0;
    let totalSpent = 0;

    budgets.forEach(budget => {
        totalBudget += budget.amount;
        totalSpent += getCategorySpending(transactions, budget.category, month);
    });

    document.getElementById('totalBudgetDisplay').textContent = formatCurrency(totalBudget);
    document.getElementById('totalSpentDisplay').textContent = formatCurrency(totalSpent);

    const usage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    document.getElementById('overallUsageDisplay').textContent = usage.toFixed(0) + '%';
}

// ============================================================
// 12. LISTEN FOR STORAGE CHANGES (sync with dashboard)
// ============================================================
window.addEventListener('storage', (e) => {
    if (e.key === 'financeData' || e.key === 'userProfile' || e.key === 'darkMode') {
        renderAll();
        updateUIWithUser();
    }
});

// ============================================================
// 13. INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const hasUser = loadUserProfile();
    if (!hasUser) {
        window.location.href = 'index.html';
        return;
    }

    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('budgetMonthFilter').value = monthStr;

    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark');
        darkToggle.innerHTML = '<i class="fas fa-sun"></i> Light';
    }
    darkToggle.addEventListener('click', toggleDarkMode);

    loadBudgets();
    renderAll();

    document.getElementById('budgetMonthFilter').addEventListener('change', renderAll);

    const savedSidebarState = localStorage.getItem('sidebarOpen');
    const isDesktop = window.innerWidth >= 901;
    let defaultOpen = isDesktop;
    if (savedSidebarState !== null) defaultOpen = savedSidebarState === 'true';
    toggleSidebar(defaultOpen);

    updateUIWithUser();
});

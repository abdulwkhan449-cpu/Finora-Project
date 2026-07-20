// ============================================================
// 0. USER PROFILE & GLOBAL STATE
// ============================================================
let userProfile = { name: 'Guest', currency: 'PKR', symbol: 'Rs' };
const CURRENCY_SYMBOLS = { PKR: 'Rs', USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' };

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

    document.getElementById('settingsProfileName').value = userProfile.name;
    document.getElementById('settingsProfileCurrency').value = userProfile.currency;
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
// 3. DARK MODE
// ============================================================
const darkToggle = document.getElementById('darkModeToggle');
const darkModeSwitch = document.getElementById('darkModeSwitch');

function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    darkToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i> Light' : '<i class="fas fa-moon"></i> Dark';
    if (darkModeSwitch) {
        darkModeSwitch.checked = isDark;
    }
    localStorage.setItem('darkMode', isDark);
    window.dispatchEvent(new Event('storage'));
}

darkToggle.addEventListener('click', toggleDarkMode);

if (darkModeSwitch) {
    darkModeSwitch.addEventListener('change', (e) => {
        const isDark = e.target.checked;
        if (isDark) {
            document.body.classList.add('dark');
            darkToggle.innerHTML = '<i class="fas fa-sun"></i> Light';
        } else {
            document.body.classList.remove('dark');
            darkToggle.innerHTML = '<i class="fas fa-moon"></i> Dark';
        }
        localStorage.setItem('darkMode', isDark);
        window.dispatchEvent(new Event('storage'));
    });
}

// ============================================================
// 4. TOAST SYSTEM
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
// 5. SAVE PROFILE
// ============================================================
document.getElementById('saveProfileBtn').addEventListener('click', () => {
    const name = document.getElementById('settingsProfileName').value.trim();
    const currency = document.getElementById('settingsProfileCurrency').value;

    if (!name) {
        showToast('Please enter your name.', 'error');
        return;
    }

    userProfile.name = name;
    userProfile.currency = currency;
    userProfile.symbol = CURRENCY_SYMBOLS[currency] || 'Rs';
    localStorage.setItem('userProfile', JSON.stringify(userProfile));

    updateUIWithUser();
    window.dispatchEvent(new Event('storage'));

    showToast('✅ Profile updated successfully!', 'success');
});

// ============================================================
// 6. EXPORT DATA
// ============================================================
document.getElementById('exportDataBtn').addEventListener('click', () => {
    const stored = localStorage.getItem('financeData');
    if (!stored) {
        showToast('No data to export.', 'error');
        return;
    }

    const transactions = JSON.parse(stored);
    if (transactions.length === 0) {
        showToast('No transactions to export.', 'error');
        return;
    }

    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = transactions.map(tx => [
        tx.date || '',
        `"${tx.description.replace(/"/g, '""')}"`,
        `"${tx.category.replace(/"/g, '""')}"`,
        tx.type || '',
        tx.amount || 0
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `finora_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`✅ Exported ${transactions.length} transactions!`, 'success');
});

// ============================================================
// 7. IMPORT DATA
// ============================================================
document.getElementById('importDataBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const csvText = event.target.result;
            const lines = csvText.split('\n').filter(line => line.trim() !== '');

            if (lines.length < 2) {
                showToast('Invalid CSV file. No data rows found.', 'error');
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const dateIdx = headers.findIndex(h => h.includes('date'));
            const descIdx = headers.findIndex(h => h.includes('desc'));
            const catIdx = headers.findIndex(h => h.includes('cat'));
            const typeIdx = headers.findIndex(h => h.includes('type'));
            const amountIdx = headers.findIndex(h => h.includes('amount'));

            if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
                showToast('Invalid CSV format. Required: Date, Description, Amount', 'error');
                return;
            }

            const transactions = [];
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                const date = cols[dateIdx] || '';
                const description = cols[descIdx] || '';
                const category = catIdx !== -1 ? cols[catIdx] || 'Other' : 'Other';
                const type = typeIdx !== -1 ? cols[typeIdx].toLowerCase() || 'expense' : 'expense';
                const amount = parseFloat(cols[amountIdx]) || 0;

                if (description && amount > 0 && date) {
                    transactions.push({
                        id: Date.now() + i,
                        date: date,
                        description: description,
                        category: category,
                        type: type,
                        amount: amount
                    });
                }
            }

            if (transactions.length === 0) {
                showToast('No valid transactions found in the CSV file.', 'error');
                return;
            }

            const existing = JSON.parse(localStorage.getItem('financeData') || '[]');
            const merged = [...existing, ...transactions];
            localStorage.setItem('financeData', JSON.stringify(merged));

            document.getElementById('fileInput').value = '';
            window.dispatchEvent(new Event('storage'));

            showToast(`✅ Imported ${transactions.length} transactions successfully!`, 'success');
        } catch (err) {
            showToast('Error reading CSV file. Please check the format.', 'error');
            console.error(err);
        }
    };
    reader.readAsText(file);
});

// ============================================================
// 8. CLEAR ALL DATA
// ============================================================
document.getElementById('clearDataBtn').addEventListener('click', () => {
    const stored = localStorage.getItem('financeData');
    if (!stored || JSON.parse(stored).length === 0) {
        showToast('No data to clear.', 'info');
        return;
    }

    if (!confirm('⚠️ Are you sure you want to permanently delete ALL your transactions? This cannot be undone!')) {
        return;
    }

    localStorage.removeItem('financeData');
    window.dispatchEvent(new Event('storage'));
    showToast('🗑️ All data has been cleared.', 'info');
});

// ============================================================
// 9. LOGOUT
// ============================================================
document.getElementById('settingsLogoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userProfile');
        window.location.href = 'index.html';
    }
});

// ============================================================
// 10. QUICK ADD MONEY (NEW)
// ============================================================
const quickForm = document.getElementById('quickAddForm');
const quickDescription = document.getElementById('quickDescription');
const quickAmount = document.getElementById('quickAmount');
const quickCategory = document.getElementById('quickCategory');
const quickTypeRadios = document.querySelectorAll('input[name="quickType"]');
const quickAddSuccess = document.getElementById('quickAddSuccess');

quickForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const description = quickDescription.value.trim();
    const amount = parseFloat(quickAmount.value);
    const category = quickCategory.value;
    let type = 'income';
    quickTypeRadios.forEach(r => { if (r.checked) type = r.value; });

    if (!description) {
        showToast('Please enter a description.', 'error');
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid positive amount.', 'error');
        return;
    }

    // Get today's date
    const today = new Date().toISOString().slice(0, 10);

    // Load existing transactions
    const stored = localStorage.getItem('financeData');
    let transactions = stored ? JSON.parse(stored) : [];

    // Create new transaction
    const newTx = {
        id: Date.now(),
        description: description,
        amount: amount,
        category: category,
        type: type,
        date: today
    };

    transactions.push(newTx);
    localStorage.setItem('financeData', JSON.stringify(transactions));

    // Reset form
    quickForm.reset();
    document.querySelector('input[name="quickType"][value="income"]').checked = true;

    // Show success message
    quickAddSuccess.style.display = 'block';
    setTimeout(() => {
        quickAddSuccess.style.display = 'none';
    }, 3000);

    // Dispatch event for other pages
    document.dispatchEvent(new Event('transactionsUpdated'));
    window.dispatchEvent(new Event('storage'));

    showToast(`✅ ${type === 'income' ? 'Income' : 'Expense'} of ${formatCurrency(amount)} added!`, 'success');
});

// ============================================================
// 11. LISTEN FOR STORAGE CHANGES
// ============================================================
window.addEventListener('storage', (e) => {
    if (e.key === 'userProfile') {
        loadUserProfile();
        updateUIWithUser();
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark');
            darkToggle.innerHTML = '<i class="fas fa-sun"></i> Light';
            if (darkModeSwitch) darkModeSwitch.checked = true;
        } else {
            document.body.classList.remove('dark');
            darkToggle.innerHTML = '<i class="fas fa-moon"></i> Dark';
            if (darkModeSwitch) darkModeSwitch.checked = false;
        }
    }
    if (e.key === 'darkMode') {
        const isDark = e.newValue === 'true';
        if (isDark) {
            document.body.classList.add('dark');
            darkToggle.innerHTML = '<i class="fas fa-sun"></i> Light';
            if (darkModeSwitch) darkModeSwitch.checked = true;
        } else {
            document.body.classList.remove('dark');
            darkToggle.innerHTML = '<i class="fas fa-moon"></i> Dark';
            if (darkModeSwitch) darkModeSwitch.checked = false;
        }
    }
});

// ============================================================
// 12. INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const hasUser = loadUserProfile();
    if (!hasUser) {
        window.location.href = 'index.html';
        return;
    }

    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark');
        darkToggle.innerHTML = '<i class="fas fa-sun"></i> Light';
        if (darkModeSwitch) darkModeSwitch.checked = true;
    }

    updateUIWithUser();

    const savedSidebarState = localStorage.getItem('sidebarOpen');
    const isDesktop = window.innerWidth >= 901;
    let defaultOpen = isDesktop;
    if (savedSidebarState !== null) defaultOpen = savedSidebarState === 'true';
    toggleSidebar(defaultOpen);
});

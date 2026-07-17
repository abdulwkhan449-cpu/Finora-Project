// ============================================================
// 0. USER PROFILE & GLOBAL STATE
// ============================================================
let userProfile = { name: 'Guest', currency: 'USD', symbol: '$' };
const CURRENCY_SYMBOLS = { PKR: 'Rs', USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' };

// ============================================================
// 1. LOAD USER PROFILE & THEME
// ============================================================
function loadUserProfile() {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
        userProfile = JSON.parse(stored);
        if (!userProfile.symbol || !CURRENCY_SYMBOLS[userProfile.currency]) {
            userProfile.symbol = CURRENCY_SYMBOLS[userProfile.currency] || '$';
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

    // Update profile form
    document.getElementById('settingsProfileName').value = userProfile.name;
    document.getElementById('settingsProfileCurrency').value = userProfile.currency;
}

function formatCurrency(amount) {
    const symbol = userProfile.symbol || '$';
    return symbol + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ============================================================
// 2. SIDEBAR LOGIC (Identical to index.js)
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
// 5. SETTINGS MODAL (Reused from index)
// ============================================================
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const settingsName = document.getElementById('settingsName');
const settingsCurrency = document.getElementById('settingsCurrency');

closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('active');
});

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.remove('active');
});

// ============================================================
// 6. SAVE PROFILE (From Settings Page)
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
    userProfile.symbol = CURRENCY_SYMBOLS[currency] || '$';
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    updateUIWithUser();
    showToast('✅ Profile updated successfully!', 'success');
});

// ============================================================
// 7. EXPORT DATA (CSV)
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

    // Create CSV header
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
// 8. IMPORT DATA (CSV)
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

            // Parse header
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const dateIdx = headers.findIndex(h => h.includes('date'));
            const descIdx = headers.findIndex(h => h.includes('desc'));
            const catIdx = headers.findIndex(h => h.includes('cat'));
            const typeIdx = headers.findIndex(h => h.includes('type'));
            const amountIdx = headers.findIndex(h => h.includes('amount'));

            if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
                showToast('Invalid CSV format. Required columns: Date, Description, Amount', 'error');
                return;
            }

            // Parse rows
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

            // Merge with existing data
            const existing = JSON.parse(localStorage.getItem('financeData') || '[]');
            const merged = [...existing, ...transactions];
            localStorage.setItem('financeData', JSON.stringify(merged));

            // Reset file input
            document.getElementById('fileInput').value = '';

            showToast(`✅ Imported ${transactions.length} transactions successfully!`, 'success');
        } catch (err) {
            showToast('Error reading CSV file. Please check the format.', 'error');
            console.error(err);
        }
    };
    reader.readAsText(file);
});

// ============================================================
// 9. CLEAR ALL DATA
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
    showToast('🗑️ All data has been cleared.', 'info');
});

// ============================================================
// 10. LOGOUT
// ============================================================
document.getElementById('settingsLogoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userProfile');
        window.location.href = 'index.html';
    }
});

// ============================================================
// 11. KEYBOARD SHORTCUT: Escape to close modals
// ============================================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (settingsModal.classList.contains('active')) {
            settingsModal.classList.remove('active');
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

    // Load dark mode
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark');
        darkToggle.innerHTML = '<i class="fas fa-sun"></i> Light';
        if (darkModeSwitch) darkModeSwitch.checked = true;
    }

    updateUIWithUser();

    // Restore sidebar state
    const savedSidebarState = localStorage.getItem('sidebarOpen');
    const isDesktop = window.innerWidth >= 901;
    let defaultOpen = isDesktop;
    if (savedSidebarState !== null) defaultOpen = savedSidebarState === 'true';
    toggleSidebar(defaultOpen);
});

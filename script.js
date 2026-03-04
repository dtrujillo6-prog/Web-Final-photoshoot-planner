// --- State Management ---
const STORAGE_KEY = 'dashboard_data';

// Default state if nothing in localStorage
const defaultState = {
    categories: [
        {
            id: 'cat_' + Date.now(),
            name: 'Favorites',
            links: [
                { id: 'link_1', name: 'GitHub', url: 'https://github.com' },
                { id: 'link_2', name: 'YouTube', url: 'https://youtube.com' }
            ]
        }
    ]
};

let appState = { categories: [] };

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            appState = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse state from localStorage', e);
            appState = JSON.parse(JSON.stringify(defaultState));
        }
    } else {
        appState = JSON.parse(JSON.stringify(defaultState));
        saveState();
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

// --- Theme Management ---
const THEME_KEY = 'dashboard_theme';

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);

    if (DOM.btnThemeToggle) {
        const iconName = theme === 'dark' ? 'sun' : 'moon';
        DOM.btnThemeToggle.innerHTML = `<i data-lucide="${iconName}"></i>`;
        lucide.createIcons();
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme || 'dark';
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

// --- DOM Elements ---
const DOM = {
    categoriesContainer: document.getElementById('categories-container'),
    emptyState: document.getElementById('empty-state'),

    // Buttons
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    btnAddCategory: document.getElementById('btn-add-category'),
    btnAddLink: document.getElementById('btn-add-link'),

    // Modals
    modalOverlay: document.getElementById('modal-overlay'),
    linkModal: document.getElementById('link-modal'),
    categoryModal: document.getElementById('category-modal'),
    btnCloseModals: document.querySelectorAll('.btn-close-modal'),

    // Forms
    linkForm: document.getElementById('link-form'),
    linkIdInput: document.getElementById('link-id'),
    linkUrlInput: document.getElementById('link-url'),
    linkNameInput: document.getElementById('link-name'),
    linkCategorySelect: document.getElementById('link-category'),
    linkModalTitle: document.getElementById('link-modal-title'),

    categoryForm: document.getElementById('category-form'),
    categoryNameInput: document.getElementById('category-name')
};

// --- Initialization ---
function init() {
    loadTheme();
    loadState();
    setupEventListeners();
    render();
}

// --- Render Logic ---
function render() {
    DOM.categoriesContainer.innerHTML = ''; // Clear current

    if (appState.categories.length === 0) {
        DOM.categoriesContainer.appendChild(DOM.emptyState);
        DOM.emptyState.style.display = 'flex';
        DOM.btnAddLink.disabled = true;
        DOM.btnAddLink.style.opacity = '0.5';
        DOM.btnAddLink.title = 'Create a category first';
    } else {
        DOM.emptyState.style.display = 'none';
        DOM.btnAddLink.disabled = false;
        DOM.btnAddLink.style.opacity = '1';
        DOM.btnAddLink.title = '';

        appState.categories.forEach(category => {
            const card = createCategoryCard(category);
            DOM.categoriesContainer.appendChild(card);
        });
    }

    // Update Lucide icons for newly rendered elements
    lucide.createIcons();
    updateCategorySelect();
}

function createCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.draggable = true;
    card.dataset.categoryId = category.id;
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);
    card.addEventListener('dragenter', handleDragEnter);
    card.addEventListener('dragleave', handleDragLeave);
    card.addEventListener('dragend', handleDragEnd);

    // Header
    const header = document.createElement('div');
    header.className = 'category-header';

    const title = document.createElement('h3');
    title.textContent = category.name;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon danger';
    deleteBtn.innerHTML = '<i data-lucide="trash-2"></i>';
    deleteBtn.title = 'Delete Category';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        setTimeout(() => deleteCategory(category.id), 10);
    };

    header.appendChild(title);
    header.appendChild(deleteBtn);
    card.appendChild(header);

    // Links List
    const linksList = document.createElement('div');
    linksList.className = 'links-list';

    if (category.links.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.fontSize = '0.875rem';
        emptyMsg.style.color = 'var(--text-muted)';
        emptyMsg.style.fontStyle = 'italic';
        emptyMsg.style.padding = '0.5rem 0';
        emptyMsg.textContent = 'No links yet';
        linksList.appendChild(emptyMsg);
    } else {
        category.links.forEach(link => {
            const linkItem = document.createElement('a');
            linkItem.className = 'link-item';
            linkItem.href = link.url;
            linkItem.draggable = true;
            linkItem.dataset.linkId = link.id;
            linkItem.dataset.categoryId = category.id;
            linkItem.addEventListener('dragstart', handleDragStart);
            linkItem.addEventListener('dragover', handleDragOver);
            linkItem.addEventListener('drop', handleDrop);
            linkItem.addEventListener('dragenter', handleDragEnter);
            linkItem.addEventListener('dragleave', handleDragLeave);
            linkItem.addEventListener('dragend', handleDragEnd);

            // Get domain for favicon or initial
            let domain = '';
            try {
                domain = new URL(link.url).hostname;
            } catch (e) { }

            const content = document.createElement('div');
            content.className = 'link-content';

            const favicon = document.createElement('div');
            favicon.className = 'link-favicon';
            if (domain) {
                const img = document.createElement('img');
                img.src = `https://icon.horse/icon/${domain}`;
                img.alt = '';
                img.onerror = () => { img.style.display = 'none'; };
                favicon.appendChild(img);
            } else {
                favicon.textContent = link.name.charAt(0).toUpperCase();
            }

            const name = document.createElement('span');
            name.className = 'link-name';
            name.textContent = link.name;

            content.appendChild(favicon);
            content.appendChild(name);

            const actions = document.createElement('div');
            actions.className = 'link-actions';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn-icon';
            editBtn.innerHTML = '<i data-lucide="edit-2"></i>';
            editBtn.title = 'Edit Link';
            editBtn.onclick = (e) => {
                e.preventDefault(); // Prevent navigating
                openEditLinkModal(category.id, link);
            };

            const delBtn = document.createElement('button');
            delBtn.className = 'btn-icon danger';
            delBtn.innerHTML = '<i data-lucide="trash"></i>';
            delBtn.title = 'Delete Link';
            delBtn.onclick = (e) => {
                e.preventDefault(); // Prevent navigating
                e.stopPropagation(); // Prevent drag/drop or parent click interference

                // We use setTimeout to allow the UI to finish rendering the click state 
                // before the synchronous window.confirm blocks the main thread
                setTimeout(() => deleteLink(category.id, link.id), 10);
            };

            actions.appendChild(editBtn);
            actions.appendChild(delBtn);

            linkItem.appendChild(content);
            linkItem.appendChild(actions);
            linksList.appendChild(linkItem);
        });
    }

    card.appendChild(linksList);
    return card;
}

function updateCategorySelect() {
    DOM.linkCategorySelect.innerHTML = '';
    appState.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        DOM.linkCategorySelect.appendChild(option);
    });
}

// --- Drag and Drop Logic ---
let draggedItem = null;
let draggedType = null;

function handleDragStart(e) {
    e.stopPropagation();
    draggedItem = this;
    if (this.classList.contains('category-card')) {
        draggedType = 'category';
        e.dataTransfer.effectAllowed = 'move';
    } else if (this.classList.contains('link-item')) {
        draggedType = 'link';
        e.dataTransfer.effectAllowed = 'move';
    }
    setTimeout(() => this.classList.add('dragging'), 0);
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    if (draggedItem !== this) {
        if (draggedType === 'category' && this.classList.contains('category-card')) {
            this.classList.add('drag-over');
        } else if (draggedType === 'link' && (this.classList.contains('link-item') || this.classList.contains('category-card'))) {
            this.classList.add('drag-over');
        }
    }
}

function handleDragLeave(e) {
    e.stopPropagation();
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.stopPropagation();
    this.classList.remove('drag-over');

    if (!draggedItem || this === draggedItem) return false;

    if (draggedType === 'category' && this.classList.contains('category-card')) {
        const draggedId = draggedItem.dataset.categoryId;
        const targetId = this.dataset.categoryId;

        const draggedIdx = appState.categories.findIndex(c => c.id === draggedId);
        const targetIdx = appState.categories.findIndex(c => c.id === targetId);

        if (draggedIdx > -1 && targetIdx > -1) {
            const [movedCat] = appState.categories.splice(draggedIdx, 1);
            appState.categories.splice(targetIdx, 0, movedCat);
            saveAndRender();
        }

    } else if (draggedType === 'link') {
        const draggedLinkId = draggedItem.dataset.linkId;
        const draggedCatId = draggedItem.dataset.categoryId;

        let targetCatId = null;
        let targetLinkId = null;

        if (this.classList.contains('link-item')) {
            targetCatId = this.dataset.categoryId;
            targetLinkId = this.dataset.linkId;
        } else if (this.classList.contains('category-card')) {
            targetCatId = this.dataset.categoryId;
        }

        if (targetCatId) {
            const sourceCat = appState.categories.find(c => c.id === draggedCatId);
            const linkIdx = sourceCat.links.findIndex(l => l.id === draggedLinkId);

            if (linkIdx > -1) {
                const [movedLink] = sourceCat.links.splice(linkIdx, 1);
                const targetCat = appState.categories.find(c => c.id === targetCatId);

                if (targetLinkId) {
                    const targetLinkIdx = targetCat.links.findIndex(l => l.id === targetLinkId);
                    targetCat.links.splice(targetLinkIdx, 0, movedLink);
                } else {
                    targetCat.links.push(movedLink);
                }
                saveAndRender();
            }
        }
    }
    return false;
}

function handleDragEnd(e) {
    e.stopPropagation();
    this.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    draggedItem = null;
    draggedType = null;
}

// --- Interaction Logic ---
function setupEventListeners() {
    // Theme Toggle
    if (DOM.btnThemeToggle) {
        DOM.btnThemeToggle.addEventListener('click', toggleTheme);
    }

    // Add Category
    DOM.btnAddCategory.addEventListener('click', () => {
        DOM.categoryForm.reset();
        openModal(DOM.categoryModal);
        DOM.categoryNameInput.focus();
    });

    DOM.categoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = DOM.categoryNameInput.value.trim();
        if (name) addCategory(name);
    });

    // Add Link
    DOM.btnAddLink.addEventListener('click', () => {
        if (appState.categories.length === 0) return;
        DOM.linkForm.reset();
        DOM.linkIdInput.value = '';
        DOM.linkModalTitle.textContent = 'Add Link';
        // Select first category by default
        if (appState.categories.length > 0) {
            DOM.linkCategorySelect.value = appState.categories[0].id;
        }
        openModal(DOM.linkModal);
        DOM.linkUrlInput.focus();
    });

    DOM.linkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = DOM.linkIdInput.value;
        const url = DOM.linkUrlInput.value.trim();
        const name = DOM.linkNameInput.value.trim();
        const categoryId = DOM.linkCategorySelect.value;

        let validUrl = url;
        if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
            validUrl = 'https://' + validUrl;
        }

        if (id) {
            // Editing existing
            // Find current category of this link to remove it if category changed
            let oldCategoryId = null;
            appState.categories.forEach(cat => {
                if (cat.links.some(l => l.id === id)) oldCategoryId = cat.id;
            });

            updateLink(oldCategoryId, categoryId, { id, url: validUrl, name });
        } else {
            // Adding new
            addLink(categoryId, { url: validUrl, name });
        }
    });

    // Modal Close Logic
    DOM.btnCloseModals.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    DOM.modalOverlay.addEventListener('click', closeAllModals);

    // Auto-fill link name from URL (basic heuristics)
    DOM.linkUrlInput.addEventListener('blur', () => {
        if (!DOM.linkNameInput.value && DOM.linkUrlInput.value) {
            try {
                let urlStr = DOM.linkUrlInput.value;
                if (!urlStr.startsWith('http')) urlStr = 'https://' + urlStr;
                const urlObj = new URL(urlStr);
                // Extract main domain name (e.g. from www.github.com -> github)
                const parts = urlObj.hostname.split('.');
                let name = parts.length > 2 ? parts[parts.length - 2] : parts[0];
                name = name.charAt(0).toUpperCase() + name.slice(1);
                DOM.linkNameInput.value = name;
            } catch (e) { }
        }
    });
}

function openModal(modalEl) {
    DOM.modalOverlay.classList.add('active');
    modalEl.classList.add('active');
}

function closeAllModals() {
    DOM.modalOverlay.classList.remove('active');
    DOM.linkModal.classList.remove('active');
    DOM.categoryModal.classList.remove('active');
}

function openEditLinkModal(categoryId, link) {
    DOM.linkIdInput.value = link.id;
    DOM.linkUrlInput.value = link.url;
    DOM.linkNameInput.value = link.name;
    DOM.linkCategorySelect.value = categoryId;
    DOM.linkModalTitle.textContent = 'Edit Link';

    openModal(DOM.linkModal);
    DOM.linkNameInput.focus();
}

// --- CRUD Operations ---
function addCategory(name) {
    const newCategory = {
        id: 'cat_' + Date.now(),
        name: name,
        links: []
    };
    appState.categories.push(newCategory);
    saveAndRender();
    closeAllModals();
}

function deleteCategory(categoryId) {
    if (confirm('Are you sure you want to delete this category and all its links?')) {
        appState.categories = appState.categories.filter(c => c.id !== categoryId);
        saveAndRender();
    }
}

function addLink(categoryId, linkData) {
    const category = appState.categories.find(c => c.id === categoryId);
    if (category) {
        category.links.push({
            id: 'link_' + Date.now(),
            name: linkData.name,
            url: linkData.url
        });
        saveAndRender();
        closeAllModals();
    }
}

function updateLink(oldCategoryId, newCategoryId, linkData) {
    // If category changed, remove from old, add to new
    if (oldCategoryId !== newCategoryId) {
        const oldCat = appState.categories.find(c => c.id === oldCategoryId);
        if (oldCat) {
            oldCat.links = oldCat.links.filter(l => l.id !== linkData.id);
        }
        const newCat = appState.categories.find(c => c.id === newCategoryId);
        if (newCat) {
            newCat.links.push(linkData);
        }
    } else {
        // Just update in place
        const cat = appState.categories.find(c => c.id === oldCategoryId);
        if (cat) {
            const linkIndex = cat.links.findIndex(l => l.id === linkData.id);
            if (linkIndex !== -1) {
                cat.links[linkIndex] = linkData;
            }
        }
    }
    saveAndRender();
    closeAllModals();
}

function deleteLink(categoryId, linkId) {
    if (confirm('Delete this link?')) {
        const category = appState.categories.find(c => c.id === categoryId);
        if (category) {
            category.links = category.links.filter(l => l.id !== linkId);
            saveAndRender();
        }
    }
}

function saveAndRender() {
    saveState();
    render();
}

// Get things started
document.addEventListener('DOMContentLoaded', init);

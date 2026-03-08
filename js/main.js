document.addEventListener('DOMContentLoaded', () => {

    // --- Data Configuration ---
    const config = {
        faculties: {
            engineering: {
                name: 'Engineering',
                departments: ['Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Computer Engineering', 'Chemical Engineering']
            },
            agriculture: {
                name: 'Agriculture',
                departments: ['Agronomy', 'Animal Science', 'Agricultural Economics', 'Soil Science', 'Crop Protection']
            },
            environmental: {
                name: 'Environmental',
                departments: ['Architecture', 'Estate Management', 'Urban & Regional Planning', 'Building Technology', 'Quantity Surveying']
            }
        }
    };

    // Local Storage Helper
    function saveMaterials() {
        localStorage.setItem('libraryMaterials', JSON.stringify(materials));
    }

    function loadMaterials() {
        const stored = localStorage.getItem('libraryMaterials');
        if (stored) {
            return JSON.parse(stored);
        }
        return [
            { id: 1, title: 'Advanced Structural Analysis', faculty: 'engineering', dept: 'Civil Engineering', course: 'CVE401', type: 'Book', date: '2023-10-15' },
            { id: 2, title: 'Thermodynamics Principles', faculty: 'engineering', dept: 'Mechanical Engineering', course: 'MEE202', type: 'Slide', date: '2023-11-02' },
            { id: 3, title: 'Soil Mechanics Past Questions', faculty: 'agriculture', dept: 'Soil Science', course: 'SOS301', type: 'Past Question', date: '2024-01-12' },
            { id: 4, title: 'Sustainable Architecture Design', faculty: 'environmental', dept: 'Architecture', course: 'ARC501', type: 'Paper', date: '2023-09-28' },
            { id: 5, title: 'Microprocessor Systems', faculty: 'engineering', dept: 'Computer Engineering', course: 'CPE405', type: 'Book', date: '2024-02-05' },
            { id: 6, title: 'Principles of Animal Nutrition', faculty: 'agriculture', dept: 'Animal Science', course: 'ANS204', type: 'Book', date: '2023-08-14' },
        ];
    }

    // Mock initial materials
    let materials = loadMaterials();

    // --- State Management ---
    const state = {
        currentView: 'home',
        searchQuery: '',
        filterFaculty: '',
        filterDepartment: '',
        isAdminLoggedIn: false
    };

    // --- DOM Elements ---
    const views = {
        home: document.getElementById('section-home'),
        catalog: document.getElementById('section-catalog'),
        admin: document.getElementById('section-admin'),
        'admin-login': document.getElementById('section-admin-login')
    };

    const links = {
        home: document.getElementById('link-home'),
        catalog: document.getElementById('link-catalog'),
        admin: document.getElementById('link-admin'),
        navHome: document.getElementById('nav-home')
    };

    const btnExplore = document.getElementById('btn-explore');

    // Search Elems
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-query');
    const selectFaculty = document.getElementById('filter-faculty');
    const selectDepartment = document.getElementById('filter-department');
    const resultsContainer = document.getElementById('materials-grid');
    const resultsCount = document.getElementById('results-count');

    // Admin Elems
    const uploadForm = document.getElementById('upload-form');
    const uploadFaculty = document.getElementById('upload-faculty');
    const uploadDepartment = document.getElementById('upload-department');
    const uploadFile = document.getElementById('upload-file');
    const fileNameDisplay = document.getElementById('selected-file-name');

    // Stats Elems
    const statTotal = document.getElementById('stat-total');
    const statEng = document.querySelector('.stat-card:nth-child(2) .stat-value');
    const statAgr = document.querySelector('.stat-card:nth-child(3) .stat-value');
    const statEnv = document.querySelector('.stat-card:nth-child(4) .stat-value');

    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // --- Routing & Navigation ---
    function navigateTo(viewName) {
        if (viewName === 'admin' && !state.isAdminLoggedIn) {
            viewName = 'admin-login';
        }

        state.currentView = viewName;

        // Hide all views
        Object.values(views).forEach(view => {
            if (view) view.classList.remove('active');
        });

        // Show target view
        if (views[viewName]) {
            views[viewName].classList.add('active');
        }

        // Update Nav links
        Object.values(links).forEach(link => {
            if (link) link.classList.remove('active');
        });

        if (links[viewName]) {
            links[viewName].classList.add('active');
        }

        // Specific view logic
        if (viewName === 'catalog') {
            renderCatalog();
        } else if (viewName === 'admin') {
            updateAdminStats();
            renderAdminMaterials();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Nav Listeners
    links.home.addEventListener('click', (e) => { e.preventDefault(); navigateTo('home'); });
    links.navHome.addEventListener('click', (e) => { e.preventDefault(); navigateTo('home'); });
    links.catalog.addEventListener('click', (e) => { e.preventDefault(); navigateTo('catalog'); });
    links.admin.addEventListener('click', (e) => { e.preventDefault(); navigateTo('admin'); });
    btnExplore.addEventListener('click', (e) => { e.preventDefault(); navigateTo('catalog'); });

    // Faculty Cards Listener (Home)
    document.querySelectorAll('.faculty-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const faculty = e.currentTarget.getAttribute('data-faculty');
            selectFaculty.value = faculty;
            populateDepartments(faculty, selectDepartment);
            state.filterFaculty = faculty;
            navigateTo('catalog');
            // Timeout to apply filters after navigation
            setTimeout(() => renderCatalog(), 100);
        });
    });

    // --- Utilities ---
    function populateDepartments(facultyKey, selectElement) {
        selectElement.innerHTML = '<option value="">Select Department</option>';
        if (facultyKey && config.faculties[facultyKey]) {
            config.faculties[facultyKey].departments.forEach(dept => {
                const opt = document.createElement('option');
                opt.value = dept;
                opt.textContent = dept;
                selectElement.appendChild(opt);
            });
            selectElement.disabled = false;
        } else {
            selectElement.disabled = true;
        }
    }

    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // --- Search & Catalog Logic ---
    selectFaculty.addEventListener('change', (e) => {
        populateDepartments(e.target.value, selectDepartment);
    });

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        state.searchQuery = searchInput.value.toLowerCase();
        state.filterFaculty = selectFaculty.value;
        state.filterDepartment = selectDepartment.value;
        renderCatalog();
    });

    function renderCatalog() {
        let filtered = materials.filter(mat => {
            const matchesSearch = mat.title.toLowerCase().includes(state.searchQuery) || mat.course.toLowerCase().includes(state.searchQuery);
            const matchesFac = state.filterFaculty ? mat.faculty === state.filterFaculty : true;
            const matchesDept = state.filterDepartment ? mat.dept === state.filterDepartment : true;
            return matchesSearch && matchesFac && matchesDept;
        });

        resultsCount.textContent = `Showing ${filtered.length} material(s)`;

        if (filtered.length === 0) {
            resultsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">No materials found matching your criteria.</div>';
            return;
        }

        resultsContainer.innerHTML = filtered.map(mat => {
            const facClass = mat.faculty; // e.g. 'engineering'
            const facName = config.faculties[mat.faculty]?.name || 'Unknown';
            return `
                <div class="material-card hover-lift">
                    <span class="mat-badge ${facClass}">${facName}</span>
                    <h4>${mat.title}</h4>
                    <div class="mat-meta">
                        <span>🏛️ ${mat.dept}</span>
                    </div>
                    <div class="mat-meta">
                        <span>📖 ${mat.course || 'N/A'}</span>
                        <span>📄 ${mat.type}</span>
                    </div>
                    <div class="mat-actions">
                        <button class="btn-primary btn-sm w-full">Download</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- Admin Logic ---
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const adminPasswordInput = document.getElementById('admin-password');
    const btnLogout = document.getElementById('btn-logout');
    const adminMaterialsList = document.getElementById('admin-materials-list');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (adminPasswordInput.value === 'admin123') {
                state.isAdminLoggedIn = true;
                loginError.style.display = 'none';
                adminPasswordInput.value = '';
                showToast('Logged in successfully!');
                navigateTo('admin');
            } else {
                loginError.style.display = 'block';
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            state.isAdminLoggedIn = false;
            showToast('Logged out successfully!');
            navigateTo('home');
        });
    }

    function renderAdminMaterials() {
        if (!adminMaterialsList) return;
        adminMaterialsList.innerHTML = materials.map(mat => `
            <tr>
                <td style="font-weight: 500;">${mat.title}</td>
                <td><span class="mat-badge ${mat.faculty}" style="margin-bottom:5px; display:inline-block;">${config.faculties[mat.faculty]?.name || 'Unknown'}</span><br><span style="font-size:0.85rem; color:var(--text-muted);">${mat.dept}</span></td>
                <td>${mat.course || 'N/A'}</td>
                <td>${mat.type}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-danger" onclick="deleteMaterial(${mat.id})" title="Delete">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    window.deleteMaterial = function (id) {
        if (confirm('Are you sure you want to delete this material?')) {
            materials = materials.filter(m => m.id !== id);
            saveMaterials();
            showToast('Material deleted.');
            updateAdminStats();
            renderAdminMaterials();
            renderCatalog();
        }
    };

    uploadFaculty.addEventListener('change', (e) => {
        populateDepartments(e.target.value, uploadDepartment);
    });

    uploadFile.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            fileNameDisplay.textContent = `Selected: ${e.target.files[0].name}`;
        } else {
            fileNameDisplay.textContent = '';
        }
    });

    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = document.getElementById('upload-title').value;
        const faculty = document.getElementById('upload-faculty').value;
        const dept = document.getElementById('upload-department').value;
        const course = document.getElementById('upload-course').value;
        const type = document.getElementById('upload-type').value;

        // Create new Material
        const newMaterial = {
            id: materials.length + 1,
            title,
            faculty,
            dept,
            course,
            type,
            date: new Date().toISOString().split('T')[0]
        };

        materials.unshift(newMaterial); // Add to beginning
        saveMaterials();
        showToast('Material uploaded successfully!');

        // Reset form
        uploadForm.reset();
        fileNameDisplay.textContent = '';
        uploadDepartment.innerHTML = '<option value="">Select Department</option>';
        uploadDepartment.disabled = true;

        updateAdminStats();
        renderAdminMaterials();
    });

    function updateAdminStats() {
        statTotal.textContent = materials.length;
        statEng.textContent = materials.filter(m => m.faculty === 'engineering').length;
        statAgr.textContent = materials.filter(m => m.faculty === 'agriculture').length;
        statEnv.textContent = materials.filter(m => m.faculty === 'environmental').length;
    }

    // Initialize
    updateAdminStats();
    renderCatalog();
});

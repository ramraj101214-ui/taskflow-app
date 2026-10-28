/**
 * TaskFlow — Simple Client-side JavaScript
 * Redesigned with pastel/purple accent theme, time-based greeting, and completion tracking
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    search: '',
    priority: 'All',
    categoryId: 'All',
    status: 'All',
    categories: [],
    editingTaskId: null,
    totalTasks: 0
  };

  // DOM Elements
  const elements = {
    taskList: document.getElementById('taskList'),
    emptyState: document.getElementById('emptyState'),
    resultsCount: document.getElementById('resultsCount'),
    pageTitle: document.getElementById('pageTitle'),
    statTotal: document.getElementById('statTotal'),
    statPending: document.getElementById('statPending'),
    statCompleted: document.getElementById('statCompleted'),
    categoryListNav: document.getElementById('categoryListNav'),
    catCountAll: document.getElementById('catCountAll'),
    greetingText: document.getElementById('greetingText'),

    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    priorityFilter: document.getElementById('priorityFilter'),
    categoryFilter: document.getElementById('categoryFilter'),
    statusFilter: document.getElementById('statusFilter'),

    taskModalBackdrop: document.getElementById('taskModalBackdrop'),
    taskForm: document.getElementById('taskForm'),
    modalTitle: document.getElementById('modalTitle'),
    taskIdInput: document.getElementById('taskIdInput'),
    taskTitleInput: document.getElementById('taskTitleInput'),
    taskDescInput: document.getElementById('taskDescInput'),
    taskCategorySelect: document.getElementById('taskCategorySelect'),
    taskPrioritySelect: document.getElementById('taskPrioritySelect'),
    taskDueDateInput: document.getElementById('taskDueDateInput'),
    statusGroup: document.getElementById('statusGroup'),
    taskStatusSelect: document.getElementById('taskStatusSelect'),

    openModalBtn: document.getElementById('openModalBtn'),
    emptyAddBtn: document.getElementById('emptyAddBtn'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),

    sidebar: document.getElementById('sidebar'),
    mobileOverlay: document.getElementById('mobileOverlay'),
    mobileSidebarToggle: document.getElementById('mobileSidebarToggle'),

    progressBar: document.getElementById('progressBar'),
    progressValue: document.getElementById('progressValue'),

    categoryModalBackdrop: document.getElementById('categoryModalBackdrop'),
    openAddCategoryBtn: document.getElementById('openAddCategoryBtn'),
    closeCatModalBtn: document.getElementById('closeCatModalBtn'),
    cancelCatModalBtn: document.getElementById('cancelCatModalBtn'),
    categoryForm: document.getElementById('categoryForm'),
    catNameInput: document.getElementById('catNameInput'),
    catColorInput: document.getElementById('catColorInput'),

    bellBtn: document.getElementById('bellBtn'),
    userBtn: document.getElementById('userBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn')
  };

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Display-only search (matches spec - display-only search bar)
  let searchTimeout = null;
  elements.searchInput.addEventListener('input', (e) => {
    state.search = e.target.value;
    elements.clearSearchBtn.style.display = state.search ? 'block' : 'none';

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      fetchTasks();
    }, 250);
  });

  elements.clearSearchBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.search = '';
    elements.clearSearchBtn.style.display = 'none';
    fetchTasks();
  });

  // Greeting based on time of day
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  function updateGreeting() {
    if (elements.greetingText) {
      elements.greetingText.textContent = `${getGreeting()}, User`;
    }
  }

  // Update title with task count
  function updateTitleCount() {
    if (elements.pageTitle) {
      elements.pageTitle.textContent = `Tasks Today (${state.totalTasks})`;
    }
  }

  // Fetch Categories
  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      state.categories = data.data || [];

      renderCategorySidebar(state.categories);
      renderCategoryOptions(state.categories);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }

  function renderCategorySidebar(categories) {
    elements.categoryListNav.innerHTML = '';
    let totalAllCount = 0;
    const fragment = document.createDocumentFragment();

    categories.forEach(cat => {
      totalAllCount += cat.task_count || 0;
      const navItem = document.createElement('a');
      navItem.href = '#';
      navItem.className = `cat-link ${state.categoryId == cat.id ? 'active' : ''}`;
      navItem.dataset.category = cat.id;
      navItem.dataset.catName = cat.name;

      navItem.innerHTML = `
        <span class="dot" style="background: ${cat.color || '#4f46e5'}"></span>
        <span class="cat-name">${escapeHtml(cat.name)}</span>
        <span class="badge">${cat.task_count || 0}</span>
      `;
      fragment.appendChild(navItem);
    });

    elements.categoryListNav.appendChild(fragment);
    elements.catCountAll.textContent = totalAllCount;
  }

  function renderCategoryOptions(categories) {
    let filterOptions = '<option value="All">All Categories</option>';
    let formOptions = '<option value="">No Category</option>';

    categories.forEach(cat => {
      const isFilterSel = state.categoryId == cat.id ? 'selected' : '';
      filterOptions += `<option value="${cat.id}" ${isFilterSel}>${escapeHtml(cat.name)}</option>`;
      formOptions += `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`;
    });

    elements.categoryFilter.innerHTML = filterOptions;
    elements.taskCategorySelect.innerHTML = formOptions;
  }

  // Fetch Tasks
  async function fetchTasks() {
    try {
      const params = new URLSearchParams();
      if (state.search) params.append('search', state.search);
      if (state.priority !== 'All') params.append('priority', state.priority);
      if (state.categoryId !== 'All') params.append('category_id', state.categoryId);
      if (state.status !== 'All') params.append('status', state.status);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      const json = await res.json();
      const tasks = json.data || [];
      const stats = json.stats || { total: 0, pending: 0, completed: 0 };

      state.totalTasks = stats.total;

      // Update sidebar stats
      elements.statTotal.textContent = stats.total;
      elements.statPending.textContent = stats.pending;
      elements.statCompleted.textContent = stats.completed;

      // Update progress bar / completion rate
      const rate = stats.total === 0 ? 0 : (stats.completed / stats.total) * 100;
      if (elements.progressBar) {
        elements.progressBar.style.width = `${rate}%`;
      }
      if (elements.progressValue) {
        elements.progressValue.textContent = `${rate.toFixed(0)}%`;
      }

      // Update title count
      updateTitleCount();

      renderTaskGrid(tasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  }

  // Render Task Grid
  function renderTaskGrid(tasks) {
    elements.taskList.innerHTML = '';

    if (tasks.length === 0) {
      elements.emptyState.style.display = 'flex';
      elements.resultsCount.textContent = 'Showing 0 tasks';
      return;
    }

    elements.emptyState.style.display = 'none';
    elements.resultsCount.textContent = `Showing ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;

    const fragment = document.createDocumentFragment();

    tasks.forEach(task => {
      const isDone = task.status === 'completed';
      const card = document.createElement('div');
      card.className = `task-card ${isDone ? 'completed' : ''}`;
      card.dataset.id = task.id;

      card.innerHTML = `
        <div class="task-card-top">
          <input
            type="checkbox"
            class="chk-input"
            ${isDone ? 'checked' : ''}
            data-id="${task.id}"
          />
          <div class="task-content">
            <div class="task-card-title">${escapeHtml(task.title)}</div>
            ${task.description ? `<div class="task-card-desc">${escapeHtml(task.description)}</div>` : ''}
          </div>
          <div class="task-actions">
            <button class="btn-icon edit-btn" data-id="${task.id}" title="Edit">✏️</button>
            <button class="btn-icon del delete-btn" data-id="${task.id}" title="Delete">🗑️</button>
          </div>
        </div>

        <div class="task-card-bottom">
          <span class="prio-badge prio-${task.priority}">${task.priority}</span>
          ${task.category_name ? `<span class="cat-pill">${escapeHtml(task.category_name)}</span>` : ''}
          ${task.due_date ? `<span class="due-txt">📅 ${task.due_date}</span>` : ''}
        </div>
      `;

      fragment.appendChild(card);
    });

    elements.taskList.appendChild(fragment);
  }

  // Delegated Event Handlers
  elements.taskList.addEventListener('change', async (e) => {
    const chk = e.target.closest('.chk-input');
    if (!chk) return;
    const taskId = chk.dataset.id;
    const newStatus = chk.checked ? 'completed' : 'pending';
    const card = chk.closest('.task-card');
    if (card) card.classList.toggle('completed', chk.checked);

    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    fetchTasks();
    fetchCategories();
  });

  elements.taskList.addEventListener('click', async (e) => {
    const delBtn = e.target.closest('.delete-btn');
    if (delBtn) {
      const taskId = delBtn.dataset.id;
      if (!confirm('Delete this task?')) return;
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      fetchTasks();
      fetchCategories();
      return;
    }

    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      openEditTaskModal(editBtn.dataset.id);
    }
  });

  elements.categoryListNav.addEventListener('click', (e) => {
    const catLink = e.target.closest('.cat-link');
    if (!catLink) return;
    e.preventDefault();
    setCategoryFilter(catLink.dataset.category, catLink.dataset.catName);
  });

  // Modals
  function openAddTaskModal() {
    state.editingTaskId = null;
    elements.modalTitle.textContent = 'Create New Task';
    elements.taskIdInput.value = '';
    elements.taskForm.reset();
    elements.statusGroup.style.display = 'none';

    elements.taskModalBackdrop.classList.add('active');
    setTimeout(() => elements.taskTitleInput.focus(), 100);
  }

  async function openEditTaskModal(taskId) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      const json = await res.json();
      const task = json.data;

      if (!task) return;

      state.editingTaskId = taskId;
      elements.modalTitle.textContent = 'Edit Task';
      elements.taskIdInput.value = task.id;
      elements.taskTitleInput.value = task.title || '';
      elements.taskDescInput.value = task.description || '';
      elements.taskCategorySelect.value = task.category_id || '';
      elements.taskPrioritySelect.value = task.priority || 'Medium';
      elements.taskDueDateInput.value = task.due_date || '';
      elements.taskStatusSelect.value = task.status || 'pending';
      elements.statusGroup.style.display = 'flex';

      elements.taskModalBackdrop.classList.add('active');
    } catch (err) {
      console.error('Error opening edit modal:', err);
    }
  }

  function closeModal() {
    elements.taskModalBackdrop.classList.remove('active');
    state.editingTaskId = null;
  }

  // Submit Task Form

  // Submit Task Form
  elements.taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = elements.taskTitleInput.value.trim();

    if (!title) {
      alert('Please enter a task title.');
      elements.taskTitleInput.focus();
      return;
    }

    const payload = {
      title,
      description: elements.taskDescInput.value.trim(),
      category_id: elements.taskCategorySelect.value || null,
      priority: elements.taskPrioritySelect.value,
      due_date: elements.taskDueDateInput.value || null
    };

    if (state.editingTaskId) {
      payload.status = elements.taskStatusSelect.value;
    }

    const method = state.editingTaskId ? 'PUT' : 'POST';
    const url = state.editingTaskId
      ? `/api/tasks/${state.editingTaskId}`
      : '/api/tasks';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || `Request failed (${response.status})`);
      }

      if (!result.data) {
        throw new Error('The server did not return the saved task.');
      }

      closeModal();
      await fetchTasks();
      await fetchCategories();
    } catch (error) {
      console.error('Task save failed:', error);
      alert(`Task could not be saved: ${error.message}`);
    }
  });


  elements.openModalBtn.addEventListener('click', openAddTaskModal);
  elements.emptyAddBtn.addEventListener('click', openAddTaskModal);
  elements.closeModalBtn.addEventListener('click', closeModal);
  elements.cancelModalBtn.addEventListener('click', closeModal);

  elements.taskModalBackdrop.addEventListener('click', (e) => {
    if (e.target === elements.taskModalBackdrop) closeModal();
  });

  // Filters
  elements.priorityFilter.addEventListener('change', (e) => {
    state.priority = e.target.value;
    fetchTasks();
  });

  elements.categoryFilter.addEventListener('change', (e) => {
    setCategoryFilter(e.target.value);
  });

  function setCategoryFilter(catId, catName = null) {
    state.categoryId = catId;
    elements.categoryFilter.value = catId;

    document.querySelectorAll('.cat-nav .cat-link').forEach(link => {
      const isMatch = link.dataset.category == catId || (catId === 'All' && link.dataset.category === 'All');
      link.classList.toggle('active', isMatch);
    });

    elements.pageTitle.textContent = (catName && catId !== 'All') ? `${catName} Tasks` : 'Dashboard';
    fetchTasks();
  }

  // Status Filter Tabs
  elements.statusFilter.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab || tab.classList.contains('active')) return;

    elements.statusFilter.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.status = tab.dataset.status;
    fetchTasks();
  });

  // Category Add Modal
  elements.openAddCategoryBtn.addEventListener('click', () => {
    elements.catNameInput.value = '';
    elements.categoryModalBackdrop.classList.add('active');
  });

  function closeCatModal() {
    elements.categoryModalBackdrop.classList.remove('active');
  }

  elements.closeCatModalBtn.addEventListener('click', closeCatModal);
  elements.cancelCatModalBtn.addEventListener('click', closeCatModal);

  elements.categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = elements.catNameInput.value.trim();
    const color = elements.catColorInput.value;
    if (!name) return;

    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });

    closeCatModal();
    await fetchCategories();
  });

  // Mobile Drawer
  elements.mobileSidebarToggle.addEventListener('click', () => {
    elements.sidebar.classList.add('mobile-open');
    elements.mobileOverlay.classList.add('active');
  });

  elements.mobileOverlay.addEventListener('click', () => {
    elements.sidebar.classList.remove('mobile-open');
    elements.mobileOverlay.classList.remove('active');
  });

  // Bell & User icons (display only as per spec)
  elements.bellBtn.addEventListener('click', () => {
    alert('No new notifications');
  });

  elements.userBtn.addEventListener('click', () => {
    alert('User Profile');
  });

  // Theme init - restore saved preference, defaulting to dark mode
  const savedTheme = localStorage.getItem('taskflow-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  function updateThemeToggleLabel(theme) {
    if (!elements.themeToggleBtn) return;
    elements.themeToggleBtn.textContent = theme === 'dark' ? '🌙' : '☀️';
    elements.themeToggleBtn.setAttribute(
      'aria-label',
      `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`
    );
    elements.themeToggleBtn.setAttribute(
      'title',
      `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`
    );
  }

  updateThemeToggleLabel(savedTheme);

  if (elements.themeToggleBtn) {
    elements.themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('taskflow-theme', newTheme);
      updateThemeToggleLabel(newTheme);
    });
  }

  // Initialize
  updateGreeting();
  updateTitleCount();
  fetchCategories();
  fetchTasks();
});

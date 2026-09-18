/**
 * TaskFlow — Simple Client-side JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    search: '',
    priority: 'All',
    categoryId: 'All',
    status: 'All',
    categories: [],
    editingTaskId: null
  };

  // DOM Elements
  const elements = {
    taskList: document.getElementById('taskList'),
    emptyState: document.getElementById('emptyState'),
    resultsCount: document.getElementById('resultsCount'),
    statTotal: document.getElementById('statTotal'),
    statPending: document.getElementById('statPending'),
    statCompleted: document.getElementById('statCompleted'),
    categoryListNav: document.getElementById('categoryListNav'),
    catCountAll: document.getElementById('catCountAll'),
    pageTitle: document.getElementById('pageTitle'),

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

    categoryModalBackdrop: document.getElementById('categoryModalBackdrop'),
    openAddCategoryBtn: document.getElementById('openAddCategoryBtn'),
    closeCatModalBtn: document.getElementById('closeCatModalBtn'),
    cancelCatModalBtn: document.getElementById('cancelCatModalBtn'),
    categoryForm: document.getElementById('categoryForm'),
    catNameInput: document.getElementById('catNameInput'),
    catColorInput: document.getElementById('catColorInput')
  };

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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

      elements.statTotal.textContent = stats.total;
      elements.statPending.textContent = stats.pending;
      elements.statCompleted.textContent = stats.completed;

      renderTaskGrid(tasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  }

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

  // Delegated Event Handlers (Bound once, avoiding repeated listener registration)
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
  elements.taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = elements.taskTitleInput.value.trim();
    if (!title) return;

    const payload = {
      title,
      description: elements.taskDescInput.value.trim() || null,
      category_id: elements.taskCategorySelect.value || null,
      priority: elements.taskPrioritySelect.value,
      due_date: elements.taskDueDateInput.value || null
    };

    if (state.editingTaskId) {
      payload.status = elements.taskStatusSelect.value;
    }

    const method = state.editingTaskId ? 'PUT' : 'POST';
    const url = state.editingTaskId ? `/api/tasks/${state.editingTaskId}` : '/api/tasks';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    closeModal();
    await fetchTasks();
    await fetchCategories();
  });

  elements.openModalBtn.addEventListener('click', openAddTaskModal);
  elements.emptyAddBtn.addEventListener('click', openAddTaskModal);
  elements.closeModalBtn.addEventListener('click', closeModal);
  elements.cancelModalBtn.addEventListener('click', closeModal);

  elements.taskModalBackdrop.addEventListener('click', (e) => {
    if (e.target === elements.taskModalBackdrop) closeModal();
  });

  // Search & Filters
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

  // Status Filter Tabs (Delegated)
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

  fetchCategories();
  fetchTasks();
});

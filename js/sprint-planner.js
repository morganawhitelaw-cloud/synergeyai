// ============================================
// Project & Data Management (Firebase-only)
// ============================================

let sprintData = [];
let effortData = null;
let currentSprintNum = null;
let unsubscribe = null;

// Get/set current project
function getCurrentProject() {
    return localStorage.getItem('selectedProject') || null;
}

function switchProject(projectId) {
    localStorage.setItem('selectedProject', projectId);
    location.reload();
}

// Load available projects from Firebase and populate dropdown
async function loadProjectList() {
    const selector = document.getElementById('projectSelector');
    try {
        const snapshot = await db.collection('projects').get();
        selector.innerHTML = '<option value="">Select Project...</option>';

        snapshot.forEach(doc => {
            const data = doc.data();
            const name = data.config?.name || doc.id;
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = name;
            selector.appendChild(option);
        });

        // Set current selection
        const current = getCurrentProject();
        if (current && selector.querySelector(`option[value="${current}"]`)) {
            selector.value = current;
        } else if (snapshot.size > 0) {
            // Auto-select first project
            selector.selectedIndex = 1;
            localStorage.setItem('selectedProject', selector.value);
        }
    } catch (error) {
        console.error('Error loading project list:', error);
        selector.innerHTML = '<option value="">Error loading projects</option>';
    }
}

// Save data to Firebase
function saveData() {
    const project = getCurrentProject();
    if (!project) return;

    db.collection('projects').doc(project).set({
        sprintData: sprintData,
        effortData: effortData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(() => {
        showSaveIndicator();
    }).catch(err => {
        console.error('Firebase save error:', err);
    });
}

// Show save indicator
function showSaveIndicator() {
    let indicator = document.getElementById('saveIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'saveIndicator';
        indicator.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: var(--success); color: white; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; z-index: 9999; opacity: 0; transition: opacity 0.3s; display: flex; align-items: center; gap: 0.5rem;';
        indicator.innerHTML = '<span style="font-size: 1.1rem;">✓</span> Saved';
        document.body.appendChild(indicator);
    }
    indicator.style.opacity = '1';
    setTimeout(() => indicator.style.opacity = '0', 2000);
}

// Delete project
async function resetToOriginal() {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    const project = getCurrentProject();
    if (!project) return;

    try {
        await db.collection('projects').doc(project).delete();
        localStorage.removeItem('selectedProject');
        location.reload();
    } catch (e) {
        console.error('Delete error:', e);
        alert('Error deleting project');
    }
}

// Load project data from Firebase
async function loadData() {
    const project = getCurrentProject();

    // Clear previous data and unsubscribe
    if (unsubscribe) unsubscribe();
    sprintData = [];
    effortData = null;

    if (!project) {
        showEmptyState('No project selected. Create a new project or select one from the dropdown.');
        return;
    }

    try {
        const doc = await db.collection('projects').doc(project).get();

        if (doc.exists && doc.data().sprintData) {
            const data = doc.data();
            sprintData = data.sprintData;
            effortData = data.effortData || { modules: [], summary: {} };
            initializeApp();
            setupRealtimeListener();
        } else {
            showEmptyState('Project has no data. Use the Project Builder to add sprints and tasks.');
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showEmptyState('Error loading project data. Check your connection.');
    }
}

function showEmptyState(message) {
    document.getElementById('sprintCardsGrid').innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
            <p>${message}</p>
            <a href="project-builder.html" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--accent); color: var(--primary); border-radius: 8px; text-decoration: none; font-weight: 600;">+ Create New Project</a>
        </div>
    `;
}

// Real-time listener for live updates
function setupRealtimeListener() {
    const project = getCurrentProject();
    if (!project) return;

    unsubscribe = db.collection('projects').doc(project).onSnapshot((doc) => {
        if (doc.exists && doc.data().sprintData) {
            const data = doc.data();
            if (JSON.stringify(data.sprintData) !== JSON.stringify(sprintData)) {
                sprintData = data.sprintData;
                effortData = data.effortData;
                initializeApp();
            }
        }
    }, (error) => {
        console.error('Real-time listener error:', error);
    });
}

function initializeApp() {
    updateStats();
    renderOverview();
    renderKanban();
    renderEffort();
    renderRoadmap();
    renderTimeline();
    setupDragAndDrop();
}

function switchView(view) {
    document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view-container').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(view + '-view').classList.add('active');
}

function updateStats() {
    const tasks = sprintData.filter(t => t.Type === 'Task');
    const completed = tasks.filter(t => t.Status === 'Completed').length;
    const inProgress = tasks.filter(t => t.Status === 'In Progress' || t.Status === 'In progress').length;
    const notStarted = tasks.filter(t => t.Status === 'Not Started' || !t.Status).length;

    document.getElementById('totalTasks').textContent = tasks.length;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('inProgressTasks').textContent = inProgress;
    document.getElementById('notStartedTasks').textContent = notStarted;
    document.getElementById('completionRate').textContent = tasks.length > 0 ? Math.round(completed / tasks.length * 100) + '%' : '0%';
}

function renderOverview() {
    const grid = document.getElementById('sprintCardsGrid');
    const sprints = [...new Set(sprintData.map(t => t.Sprint).filter(s => s !== null))].sort((a, b) => a - b);

    grid.innerHTML = sprints.map(sprintNum => {
        const sprintTasks = sprintData.filter(t => t.Sprint === sprintNum);
        const tasks = sprintTasks.filter(t => t.Type === 'Task');
        const milestone = sprintTasks.find(t => t.Type === 'Milestone');
        const completed = tasks.filter(t => t.Status === 'Completed').length;
        const progress = tasks.length > 0 ? Math.round(completed / tasks.length * 100) : 0;

        const circumference = 2 * Math.PI * 34;
        const offset = circumference - (progress / 100 * circumference);
        const colors = getSprintColors(sprintNum);

        return `
            <div class="sprint-card" onclick="openSprintDetail(${sprintNum})">
                <div class="sprint-card-header">
                    <div>
                        <span class="sprint-badge sprint-${sprintNum}">Sprint ${sprintNum}</span>
                        <h3 class="sprint-title">${milestone ? escapeHtml(milestone.Description.substring(0, 40)) : 'Sprint ' + sprintNum}</h3>
                        <p class="sprint-dates">${tasks.length} tasks</p>
                    </div>
                    <div class="progress-ring-container">
                        <svg class="progress-ring" width="80" height="80">
                            <circle class="progress-ring-bg" cx="40" cy="40" r="34"/>
                            <circle class="progress-ring-fill" cx="40" cy="40" r="34" stroke="${colors[0]}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
                        </svg>
                        <span class="progress-ring-text">${progress}%</span>
                    </div>
                </div>
                <div class="task-mini-list">
                    ${tasks.slice(0, 3).map(t => `
                        <div class="task-mini">
                            <div class="task-mini-dot ${getStatusClass(t.Status)}"></div>
                            <span class="task-mini-text">${escapeHtml(t.Description)}</span>
                        </div>
                    `).join('')}
                    ${tasks.length > 3 ? `<div class="task-mini" style="color: var(--accent);">+${tasks.length - 3} more</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getSprintColors(num) {
    const colors = { 0: ['#8b5cf6'], 1: ['#3b82f6'], 2: ['#10b981'], 3: ['#f59e0b'], 4: ['#ef4444'], 5: ['#ec4899'], 9: ['#06b6d4'], 10: ['#84cc16'], 11: ['#f97316'], 12: ['#6366f1'] };
    return colors[num] || ['#8b5cf6'];
}

function getStatusClass(status) {
    if (status === 'Completed') return 'completed';
    if (status === 'In Progress' || status === 'In progress') return 'in-progress';
    return 'not-started';
}

// Sprint Detail Panel
function openSprintDetail(sprintNum) {
    currentSprintNum = sprintNum;
    const sprintTasks = sprintData.filter(t => t.Sprint === sprintNum);
    const tasks = sprintTasks.filter(t => t.Type === 'Task');
    const milestone = sprintTasks.find(t => t.Type === 'Milestone');

    const completed = tasks.filter(t => t.Status === 'Completed').length;
    const inProgress = tasks.filter(t => t.Status === 'In Progress' || t.Status === 'In progress').length;
    const notStarted = tasks.filter(t => t.Status === 'Not Started' || !t.Status).length;
    const progress = tasks.length > 0 ? Math.round(completed / tasks.length * 100) : 0;

    document.getElementById('sprintDetailBadge').className = `sprint-badge sprint-${sprintNum}`;
    document.getElementById('sprintDetailBadge').textContent = `Sprint ${sprintNum}`;
    document.getElementById('sprintDetailName').textContent = milestone ? milestone.Description : `Sprint ${sprintNum}`;
    document.getElementById('sprintDetailMeta').textContent = `${tasks.length} tasks`;

    document.getElementById('detailCompleted').textContent = completed;
    document.getElementById('detailInProgress').textContent = inProgress;
    document.getElementById('detailNotStarted').textContent = notStarted;
    document.getElementById('detailProgress').textContent = progress + '%';
    document.getElementById('detailProgressBar').style.width = progress + '%';

    renderSprintDetailTasks(sprintNum);
    document.getElementById('sprintDetailOverlay').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeSprintDetail() {
    document.getElementById('sprintDetailOverlay').classList.remove('show');
    document.body.style.overflow = '';
    currentSprintNum = null;
    renderOverview();
    updateStats();
}

function renderSprintDetailTasks(sprintNum) {
    const container = document.getElementById('sprintDetailTasks');
    // Only show tasks, not milestones (milestone is the sprint title)
    const tasks = sprintData.filter(t => t.Sprint === sprintNum && t.Type === 'Task');

    if (tasks.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-muted);">No tasks in this sprint</p>';
        return;
    }

    container.innerHTML = tasks.map(task => {
        const globalIndex = sprintData.indexOf(task);
        const statusClass = getStatusClass(task.Status);

        return `
            <div class="detail-task-card" id="task-card-${globalIndex}">
                <div class="detail-task-header" onclick="toggleTaskExpand(${globalIndex})">
                    <div class="detail-task-status ${statusClass}"></div>
                    <div class="detail-task-info">
                        <div class="detail-task-name">${escapeHtml(task.Description)}</div>
                        <div class="detail-task-meta">
                            ${task.Start_Date && task.Start_Date !== 'TBD' ? `<span>${formatDate(task.Start_Date)}</span>` : ''}
                            ${task.Duration ? `<span>${task.Duration}d</span>` : ''}
                            <span>${task.Status || 'Not Started'}</span>
                        </div>
                    </div>
                    <button class="detail-task-expand" id="expand-btn-${globalIndex}">▼</button>
                </div>
                <div class="detail-task-body" id="task-body-${globalIndex}">
                    <div class="detail-form-grid">
                        <div class="detail-form-group full-width">
                            <label>Description</label>
                            <textarea onchange="updateTaskField(${globalIndex}, 'Description', this.value)">${escapeHtml(task.Description || '')}</textarea>
                        </div>
                        <div class="detail-form-group">
                            <label>Status</label>
                            <select onchange="updateTaskField(${globalIndex}, 'Status', this.value)">
                                <option value="Not Started" ${!task.Status || task.Status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                                <option value="In Progress" ${task.Status === 'In Progress' || task.Status === 'In progress' ? 'selected' : ''}>In Progress</option>
                                <option value="On Track" ${task.Status === 'On Track' ? 'selected' : ''}>On Track</option>
                                <option value="Completed" ${task.Status === 'Completed' ? 'selected' : ''}>Completed</option>
                            </select>
                        </div>
                        <div class="detail-form-group">
                            <label>Start Date</label>
                            <input type="date" value="${task.Start_Date && task.Start_Date !== 'TBD' ? task.Start_Date : ''}" onchange="updateTaskField(${globalIndex}, 'Start_Date', this.value)">
                        </div>
                        <div class="detail-form-group">
                            <label>End Date</label>
                            <input type="date" value="${task.End_Date && task.End_Date !== 'TBD' ? task.End_Date : ''}" onchange="updateTaskField(${globalIndex}, 'End_Date', this.value)">
                        </div>
                        <div class="detail-form-group">
                            <label>Duration (Days)</label>
                            <input type="number" min="1" value="${task.Duration || ''}" onchange="updateTaskField(${globalIndex}, 'Duration', parseInt(this.value) || null)">
                        </div>
                    </div>
                    <div class="detail-task-actions">
                        <button class="btn btn-danger btn-sm" onclick="deleteTask(${globalIndex})">Delete</button>
                        <button class="btn btn-secondary btn-sm" onclick="duplicateTask(${globalIndex})">Duplicate</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function toggleTaskExpand(index) {
    const body = document.getElementById(`task-body-${index}`);
    const btn = document.getElementById(`expand-btn-${index}`);
    const card = document.getElementById(`task-card-${index}`);
    const isExpanded = body.classList.contains('show');

    document.querySelectorAll('.detail-task-body.show').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.detail-task-card.expanded').forEach(el => el.classList.remove('expanded'));
    document.querySelectorAll('.detail-task-expand.expanded').forEach(el => el.classList.remove('expanded'));

    if (!isExpanded) {
        body.classList.add('show');
        card.classList.add('expanded');
        btn.classList.add('expanded');
    }
}

function updateTaskField(index, field, value) {
    if (sprintData[index]) {
        sprintData[index][field] = value;
        if (field === 'Status') {
            updateSprintDetailProgress();
            const statusEl = document.querySelector(`#task-card-${index} .detail-task-status`);
            if (statusEl) statusEl.className = 'detail-task-status ' + getStatusClass(value);
        }
        if (field === 'Description') {
            const nameEl = document.querySelector(`#task-card-${index} .detail-task-name`);
            if (nameEl) nameEl.textContent = value;
        }
        saveData(); // Auto-save changes
    }
}

function updateSprintDetailProgress() {
    if (currentSprintNum === null) return;
    const tasks = sprintData.filter(t => t.Sprint === currentSprintNum && t.Type === 'Task');
    const completed = tasks.filter(t => t.Status === 'Completed').length;
    const inProgress = tasks.filter(t => t.Status === 'In Progress' || t.Status === 'In progress').length;
    const notStarted = tasks.filter(t => t.Status === 'Not Started' || !t.Status).length;
    const progress = tasks.length > 0 ? Math.round(completed / tasks.length * 100) : 0;

    document.getElementById('detailCompleted').textContent = completed;
    document.getElementById('detailInProgress').textContent = inProgress;
    document.getElementById('detailNotStarted').textContent = notStarted;
    document.getElementById('detailProgress').textContent = progress + '%';
    document.getElementById('detailProgressBar').style.width = progress + '%';
}

function deleteTask(index) {
    if (confirm('Delete this task?')) {
        sprintData.splice(index, 1);
        renderSprintDetailTasks(currentSprintNum);
        updateSprintDetailProgress();
        saveData(); // Auto-save changes
    }
}

function duplicateTask(index) {
    const task = sprintData[index];
    if (task) {
        sprintData.push({ ...task, Description: task.Description + ' (Copy)' });
        renderSprintDetailTasks(currentSprintNum);
        saveData(); // Auto-save changes
    }
}

function addTaskToSprint() {
    if (currentSprintNum === null) return;
    sprintData.push({ Sprint: currentSprintNum, Type: 'Task', Description: 'New Task', Status: 'Not Started', Start_Date: null, End_Date: null, Duration: null, Progress: 0 });
    renderSprintDetailTasks(currentSprintNum);
    updateSprintDetailProgress();
    saveData(); // Auto-save changes
}

document.getElementById('sprintDetailOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeSprintDetail();
});

// Kanban
function renderKanban() {
    const columns = {
        'Not Started': document.getElementById('kanban-not-started'),
        'In Progress': document.getElementById('kanban-in-progress'),
        'On Track': document.getElementById('kanban-on-track'),
        'Completed': document.getElementById('kanban-completed')
    };

    Object.values(columns).forEach(col => col.innerHTML = '');
    const counts = { 'Not Started': 0, 'In Progress': 0, 'On Track': 0, 'Completed': 0 };

    sprintData.filter(t => t.Type === 'Task').forEach(task => {
        let status = task.Status || 'Not Started';
        if (status === 'In progress') status = 'In Progress';
        if (!columns[status]) status = 'Not Started';
        counts[status]++;

        const div = document.createElement('div');
        div.className = 'kanban-task';
        div.draggable = true;
        div.dataset.index = sprintData.indexOf(task);
        div.innerHTML = `
            <span class="kanban-task-sprint sprint-${task.Sprint}">Sprint ${task.Sprint}</span>
            <div class="kanban-task-title">${escapeHtml(task.Description)}</div>
            <div class="kanban-task-meta">
                ${task.Duration ? `<span>${task.Duration}d</span>` : ''}
                ${task.Start_Date && task.Start_Date !== 'TBD' ? `<span>${formatDate(task.Start_Date)}</span>` : ''}
            </div>
        `;
        columns[status].appendChild(div);
    });

    document.getElementById('kanban-not-started-count').textContent = counts['Not Started'];
    document.getElementById('kanban-in-progress-count').textContent = counts['In Progress'];
    document.getElementById('kanban-on-track-count').textContent = counts['On Track'];
    document.getElementById('kanban-completed-count').textContent = counts['Completed'];
}

let draggedElement = null;
let dragPreview = null;
let placeholder = null;

function setupDragAndDrop() {
    document.querySelectorAll('.kanban-task').forEach(task => {
        task.addEventListener('dragstart', handleDragStart);
        task.addEventListener('dragend', handleDragEnd);
    });

    document.querySelectorAll('.kanban-column').forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('dragleave', handleDragLeave);
        column.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    draggedElement = e.target;
    e.dataTransfer.setData('text/plain', e.target.dataset.index);
    e.dataTransfer.effectAllowed = 'move';

    // Create custom drag preview
    dragPreview = draggedElement.cloneNode(true);
    dragPreview.classList.add('drag-preview');
    dragPreview.style.width = draggedElement.offsetWidth + 'px';
    document.body.appendChild(dragPreview);

    // Hide default drag image
    const emptyImg = new Image();
    emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(emptyImg, 0, 0);

    // Mark original as dragging after a tiny delay
    setTimeout(() => {
        draggedElement.classList.add('dragging');
    }, 0);

    // Track mouse for custom preview
    document.addEventListener('dragover', moveDragPreview);
}

function moveDragPreview(e) {
    if (dragPreview) {
        dragPreview.style.left = (e.clientX - dragPreview.offsetWidth / 2) + 'px';
        dragPreview.style.top = (e.clientY - 20) + 'px';
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');

    // Clean up preview
    if (dragPreview) {
        dragPreview.remove();
        dragPreview = null;
    }

    // Clean up placeholder
    if (placeholder) {
        placeholder.remove();
        placeholder = null;
    }

    // Remove drag-over from all columns
    document.querySelectorAll('.kanban-column').forEach(col => {
        col.classList.remove('drag-over');
    });

    document.removeEventListener('dragover', moveDragPreview);
    draggedElement = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const column = e.target.closest('.kanban-column');
    if (!column) return;

    // Add visual feedback to column
    document.querySelectorAll('.kanban-column').forEach(col => {
        col.classList.remove('drag-over');
    });
    column.classList.add('drag-over');

    // Show placeholder
    const tasksContainer = column.querySelector('.kanban-tasks');
    if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'drop-placeholder';
    }

    // Find position to insert placeholder
    const afterElement = getDragAfterElement(tasksContainer, e.clientY);
    if (afterElement) {
        tasksContainer.insertBefore(placeholder, afterElement);
    } else {
        tasksContainer.appendChild(placeholder);
    }
}

function handleDragLeave(e) {
    const column = e.target.closest('.kanban-column');
    if (!column) return;

    // Only remove if actually leaving the column
    const rect = column.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right ||
        e.clientY < rect.top || e.clientY > rect.bottom) {
        column.classList.remove('drag-over');
        if (placeholder && placeholder.parentNode === column.querySelector('.kanban-tasks')) {
            placeholder.remove();
        }
    }
}

function handleDrop(e) {
    e.preventDefault();

    const column = e.target.closest('.kanban-column');
    if (!column) return;

    const index = e.dataTransfer.getData('text/plain');
    const newStatus = column.dataset.status;

    if (sprintData[index]) {
        sprintData[index].Status = newStatus;

        // Clean up
        if (placeholder) {
            placeholder.remove();
            placeholder = null;
        }
        column.classList.remove('drag-over');

        updateStats();
        renderKanban();
        renderOverview();
        saveData(); // Auto-save changes

        // Add drop animation to the newly placed card
        setTimeout(() => {
            const newCard = document.querySelector(`.kanban-task[data-index="${index}"]`);
            if (newCard) {
                newCard.classList.add('dropping');
                setTimeout(() => newCard.classList.remove('dropping'), 300);
            }
            setupDragAndDrop();
        }, 10);
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.kanban-task:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Effort & Resources
function renderEffort() {
    if (!effortData) return;

    const summary = effortData.summary;
    const modules = effortData.modules;

    // Summary cards
    document.getElementById('effortSummary').innerHTML = `
        <div class="effort-summary-card">
            <div class="big-number">${summary.total_hours.toLocaleString()}</div>
            <div class="label">Total Hours</div>
        </div>
        <div class="effort-summary-card fe">
            <div class="big-number">${summary.total_fe_hours.toLocaleString()}</div>
            <div class="label">Frontend Hours</div>
        </div>
        <div class="effort-summary-card be">
            <div class="big-number">${summary.total_be_hours.toLocaleString()}</div>
            <div class="label">Backend Hours</div>
        </div>
        <div class="effort-summary-card">
            <div class="big-number" style="display: flex; gap: 0.5rem; justify-content: center; align-items: baseline;">
                <span style="color: var(--info);">${summary.fe_resources}</span>
                <span style="font-size: 1rem; color: var(--text-muted);">FE</span>
                <span style="color: var(--text-muted); font-size: 1rem;">/</span>
                <span style="color: var(--purple);">${summary.be_resources}</span>
                <span style="font-size: 1rem; color: var(--text-muted);">BE</span>
            </div>
            <div class="label">Team Members</div>
        </div>
        <div class="effort-summary-card">
            <div class="big-number">${summary.total_weeks}</div>
            <div class="label">Weeks Timeline</div>
        </div>
    `;

    // Module cards - simple percentage-based composition (FE vs BE)
    document.getElementById('moduleCards').innerHTML = modules.map(mod => {
        const totalHours = mod.total_fe + mod.total_be;
        const fePercent = (mod.total_fe / totalHours) * 100;
        const bePercent = (mod.total_be / totalHours) * 100;
        const weekRange = mod.start_week ? (mod.start_week === mod.end_week ? `Week ${mod.start_week}` : `Week ${mod.start_week}-${mod.end_week}`) : '';

        return `
            <div class="module-card">
                <div class="module-header">
                    <div>
                        <div class="module-name">${escapeHtml(mod.module)}</div>
                        <div class="module-sprints">
                            ${weekRange ? `<span style="color: var(--accent); font-weight: 600;">${weekRange}</span>` : ''}
                            ${weekRange && mod.fe_sprint ? ' · ' : ''}
                            ${mod.fe_sprint ? `<span style="color: var(--info);">FE: Sprint ${mod.fe_sprint}</span>` : ''}
                            ${mod.fe_sprint && mod.be_sprint ? ' · ' : ''}
                            ${mod.be_sprint ? `<span style="color: var(--purple);">BE: Sprint ${mod.be_sprint}</span>` : ''}
                        </div>
                    </div>
                    <div class="module-total">
                        <div class="hours">${totalHours}</div>
                        <div class="hours-label">total hours</div>
                    </div>
                </div>
                <div class="module-stacked-bar-container">
                    <div class="module-stacked-bar">
                        ${mod.total_fe > 0 ? `<div class="stacked-seg fe" style="width: ${fePercent}%;" title="Frontend: ${mod.total_fe}h (${Math.round(fePercent)}%)">
                            <span>${mod.total_fe}h</span>
                        </div>` : ''}
                        ${mod.total_be > 0 ? `<div class="stacked-seg be" style="width: ${bePercent}%;" title="Backend: ${mod.total_be}h (${Math.round(bePercent)}%)">
                            <span>${mod.total_be}h</span>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Mini Gantt Chart - Interactive
    const weeks = Array.from({length: 16}, (_, i) => i + 1);
    // Include all modules except Buffer for Gantt editing
    const ganttModules = modules.filter(m => m.module !== 'Buffer');

    // Initialize active_weeks arrays if not present
    ganttModules.forEach((mod, idx) => {
        if (!mod.active_weeks) {
            mod.active_weeks = [];
            if (mod.start_week && mod.end_week) {
                for (let w = mod.start_week; w <= mod.end_week; w++) {
                    mod.active_weeks.push(w);
                }
            }
        }
    });

    document.getElementById('miniGantt').innerHTML = `
        <div class="gantt-header">
            <div class="gantt-header-cell"></div>
            ${weeks.map(w => `<div class="gantt-header-cell">W${w}</div>`).join('')}
        </div>
        ${ganttModules.map((mod, modIdx) => {
            return `
                <div class="gantt-row" data-module-idx="${modIdx}">
                    <div class="gantt-module-name" title="${escapeHtml(mod.module)}">${escapeHtml(mod.module)}</div>
                    ${weeks.map(w => {
                        const isActive = mod.active_weeks.includes(w);
                        const prevActive = mod.active_weeks.includes(w - 1);
                        const nextActive = mod.active_weeks.includes(w + 1);
                        let cellClass = 'gantt-cell';
                        if (isActive) {
                            cellClass += ' active';
                            if (!prevActive && !nextActive) cellClass += ' active-single';
                            else if (!prevActive) cellClass += ' active-start';
                            else if (!nextActive) cellClass += ' active-end';
                        }
                        return `<div class="${cellClass}" data-week="${w}" data-module="${modIdx}" onclick="toggleGanttCell(${modIdx}, ${w}, this)"></div>`;
                    }).join('')}
                </div>
            `;
        }).join('')}
        <div style="margin-top: 0.75rem; font-size: 0.7rem; color: var(--text-muted); text-align: center;">
            Click any cell to toggle week on/off
        </div>
    `;

    // Store gantt modules reference for toggle function
    window.ganttModules = ganttModules;

    // Sprint Workload - calculate hours per sprint
    const sprintHours = {};
    for (let s = 1; s <= 8; s++) {
        sprintHours[s] = { fe: 0, be: 0 };
    }

    modules.forEach(mod => {
        if (mod.fe_sprint) {
            const sprints = mod.fe_sprint.split(',').map(s => parseInt(s.trim()));
            const hoursPerSprint = mod.total_fe / sprints.length;
            sprints.forEach(s => {
                if (sprintHours[s]) sprintHours[s].fe += hoursPerSprint;
            });
        }
        if (mod.be_sprint) {
            const sprints = mod.be_sprint.split(',').map(s => parseInt(s.trim()));
            const hoursPerSprint = mod.total_be / sprints.length;
            sprints.forEach(s => {
                if (sprintHours[s]) sprintHours[s].be += hoursPerSprint;
            });
        }
    });

    const maxSprintHours = Math.max(...Object.values(sprintHours).map(s => s.fe + s.be));

    document.getElementById('sprintWorkload').innerHTML = Object.entries(sprintHours).map(([sprint, hours]) => {
        const total = hours.fe + hours.be;
        const feHeight = (hours.fe / maxSprintHours) * 80; // 80px max
        const beHeight = (hours.be / maxSprintHours) * 80;
        return `
            <div class="workload-sprint">
                <div class="workload-bar-container">
                    <div class="workload-bar">
                        ${hours.be > 0 ? `<div class="workload-seg be" style="height: ${beHeight}px;" title="BE: ${Math.round(hours.be)}h"></div>` : ''}
                        ${hours.fe > 0 ? `<div class="workload-seg fe" style="height: ${feHeight}px;" title="FE: ${Math.round(hours.fe)}h"></div>` : ''}
                    </div>
                </div>
                <div class="workload-label">Sprint ${sprint}</div>
                <div class="workload-hours">${Math.round(total)}h</div>
            </div>
        `;
    }).join('');

    // Hours breakdown (FE vs BE only)
    const fePct = (summary.total_fe_hours / summary.total_hours * 100).toFixed(0);
    const bePct = (summary.total_be_hours / summary.total_hours * 100).toFixed(0);

    document.getElementById('hoursBreakdown').innerHTML = `
        <div class="hours-row">
            <div class="hours-color fe"></div>
            <div class="hours-type">Frontend (incl. Design)</div>
            <div class="hours-value">${summary.total_fe_hours.toLocaleString()}h</div>
        </div>
        <div class="hours-row">
            <div class="hours-color be"></div>
            <div class="hours-type">Backend</div>
            <div class="hours-value">${summary.total_be_hours.toLocaleString()}h</div>
        </div>
        <div class="stacked-bar">
            <div class="stacked-segment fe" style="width: ${fePct}%">${fePct}%</div>
            <div class="stacked-segment be" style="width: ${bePct}%">${bePct}%</div>
        </div>
        <div style="margin-top: 1rem; text-align: center; font-size: 0.8rem; color: var(--text-muted);">
            ${summary.timeline}
        </div>
    `;
}

// Roadmap
function renderRoadmap() {
    const container = document.getElementById('roadmapSprints');
    const sprints = [...new Set(sprintData.map(t => t.Sprint).filter(s => s !== null))].sort((a, b) => a - b);

    let totalCompleted = 0;
    let totalSprints = sprints.length;

    container.innerHTML = sprints.map(sprintNum => {
        const tasks = sprintData.filter(t => t.Sprint === sprintNum && t.Type === 'Task');
        const milestone = sprintData.find(t => t.Sprint === sprintNum && t.Type === 'Milestone');
        const completed = tasks.filter(t => t.Status === 'Completed').length;
        const inProgress = tasks.filter(t => t.Status === 'In Progress' || t.Status === 'In progress').length;
        const progress = tasks.length > 0 ? Math.round(completed / tasks.length * 100) : 0;

        const isCompleted = progress === 100;
        const isInProgress = !isCompleted && (inProgress > 0 || completed > 0);
        let nodeClass = isCompleted ? 'completed' : isInProgress ? 'in-progress' : '';

        if (isCompleted) totalCompleted++;

        const statusColor = isCompleted ? 'var(--success)' : isInProgress ? 'var(--info)' : 'var(--border)';
        const milestoneName = milestone ? milestone.Description : 'Sprint ' + sprintNum;

        return `
            <div class="roadmap-sprint">
                <div class="roadmap-node ${nodeClass}" onclick="openSprintDetail(${sprintNum})">
                    S${sprintNum}
                </div>
                <div class="roadmap-card" onclick="openSprintDetail(${sprintNum})">
                    <div class="roadmap-card-header">
                        <span class="sprint-badge sprint-${sprintNum}">Sprint ${sprintNum}</span>
                    </div>
                    <h4>${escapeHtml(milestoneName)}</h4>
                    <div class="roadmap-card-meta">${tasks.length} tasks</div>
                    <div class="roadmap-progress">
                        <div class="roadmap-progress-bar" style="width: ${progress}%; background: ${statusColor};"></div>
                    </div>
                    <div class="roadmap-stats">
                        <span>${completed} done</span>
                        <span>${inProgress} active</span>
                        <span>${progress}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Update progress line
    const progressPercent = totalSprints > 0 ? (totalCompleted / totalSprints) * 100 : 0;
    document.getElementById('roadmapLineProgress').style.width = progressPercent + '%';
}

// Timeline
function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    const sprints = [...new Set(sprintData.map(t => t.Sprint).filter(s => s !== null))].sort((a, b) => a - b);

    let html = '<div class="timeline-line"></div>';
    sprints.forEach(sprintNum => {
        const sprintTasks = sprintData.filter(t => t.Sprint === sprintNum);
        const milestone = sprintTasks.find(t => t.Type === 'Milestone');
        const tasks = sprintTasks.filter(t => t.Type === 'Task');
        const startDates = tasks.map(t => t.Start_Date).filter(d => d && d !== 'TBD');

        html += `
            <div class="timeline-item" onclick="openSprintDetail(${sprintNum})" style="cursor: pointer;">
                <div class="timeline-dot ${milestone ? 'milestone' : ''}"></div>
                <div class="timeline-content">
                    <div class="timeline-date">
                        <span class="sprint-badge sprint-${sprintNum}" style="font-size: 0.65rem; margin-right: 0.5rem;">Sprint ${sprintNum}</span>
                        ${startDates.length > 0 ? formatDate(startDates[0]) : 'TBD'}
                    </div>
                    <h3 class="timeline-title">${milestone ? escapeHtml(milestone.Description) : 'Sprint ' + sprintNum}</h3>
                    <p class="timeline-desc">${tasks.length} tasks</p>
                    <div class="timeline-tasks">
                        ${tasks.slice(0, 5).map(t => `
                            <span class="timeline-task-chip">
                                <span class="dot" style="background: var(--${getStatusClass(t.Status) === 'completed' ? 'success' : getStatusClass(t.Status) === 'in-progress' ? 'info' : 'warning'});"></span>
                                ${escapeHtml(t.Description.substring(0, 20))}${t.Description.length > 20 ? '...' : ''}
                            </span>
                        `).join('')}
                        ${tasks.length > 5 ? `<span class="timeline-task-chip" style="color: var(--accent);">+${tasks.length - 5}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function formatDate(dateStr) {
    if (!dateStr || dateStr === 'TBD') return 'TBD';
    return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toggle Gantt cell active state
function toggleGanttCell(modIdx, week, cellEl) {
    const mod = window.ganttModules[modIdx];
    if (!mod) return;

    const weekIdx = mod.active_weeks.indexOf(week);
    if (weekIdx > -1) {
        // Remove week
        mod.active_weeks.splice(weekIdx, 1);
    } else {
        // Add week
        mod.active_weeks.push(week);
        mod.active_weeks.sort((a, b) => a - b);
    }

    // Update start/end weeks in the original data
    if (mod.active_weeks.length > 0) {
        mod.start_week = Math.min(...mod.active_weeks);
        mod.end_week = Math.max(...mod.active_weeks);
    } else {
        mod.start_week = null;
        mod.end_week = null;
    }

    // Re-render just this row for smooth visual update
    const row = cellEl.closest('.gantt-row');
    const cells = row.querySelectorAll('.gantt-cell');

    cells.forEach((cell, idx) => {
        const w = idx + 1;
        const isActive = mod.active_weeks.includes(w);
        const prevActive = mod.active_weeks.includes(w - 1);
        const nextActive = mod.active_weeks.includes(w + 1);

        cell.className = 'gantt-cell';
        if (isActive) {
            cell.classList.add('active');
            if (!prevActive && !nextActive) cell.classList.add('active-single');
            else if (!prevActive) cell.classList.add('active-start');
            else if (!nextActive) cell.classList.add('active-end');
        }
    });

    // Add a subtle animation to the clicked cell
    cellEl.style.transform = 'scale(1.2)';
    setTimeout(() => cellEl.style.transform = '', 150);

    // Update the module card's week display
    updateModuleCardWeeks(modIdx, mod);
}

function updateModuleCardWeeks(modIdx, mod) {
    // Find and update the corresponding module card
    const moduleCards = document.querySelectorAll('.module-card');
    const originalMod = effortData.modules.find(m => m.module === mod.module);
    if (originalMod) {
        originalMod.start_week = mod.start_week;
        originalMod.end_week = mod.end_week;
        originalMod.active_weeks = [...mod.active_weeks];
    }
    // Auto-save changes
    saveData();
}

// Initialize app
async function init() {
    await loadProjectList();
    await loadData();
}
init();

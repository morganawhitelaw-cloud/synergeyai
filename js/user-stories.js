// ============================================
// Project & Data Management (Firebase-only)
// ============================================

let userStories = [];
let filteredStories = [];
let unsubscribe = null;

function getCurrentProject() {
    return localStorage.getItem('selectedProject') || null;
}

function switchProject(projectId) {
    localStorage.setItem('selectedProject', projectId);
    loadData();
}

// Load available projects from Firebase
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

        const current = getCurrentProject();
        if (current && selector.querySelector(`option[value="${current}"]`)) {
            selector.value = current;
        } else if (snapshot.size > 0) {
            selector.selectedIndex = 1;
            localStorage.setItem('selectedProject', selector.value);
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Load user stories from Firebase
async function loadData() {
    const project = getCurrentProject();

    // Clear previous data and unsubscribe
    if (unsubscribe) unsubscribe();
    userStories = [];
    filteredStories = [];

    if (!project) {
        showEmptyState(false); // No project selected
        return;
    }

    try {
        const doc = await db.collection('projects').doc(project).get();

        if (doc.exists) {
            const data = doc.data();
            if (data.userStories && data.userStories.length > 0) {
                userStories = data.userStories;
                initializeApp();
                setupRealtimeListener();
            } else {
                // Project exists but no user stories
                showEmptyState(true);
                populateSprintDropdown(data.sprintData || []);
                setupRealtimeListener();
            }
        } else {
            showEmptyState(false); // Project doesn't exist in DB
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showEmptyState(false);
    }
}

// Populate sprint dropdown in modal from project data
function populateSprintDropdown(sprintData) {
    const select = document.getElementById('newStorySprint');
    select.innerHTML = '<option value="">Not Assigned</option>';
    sprintData.forEach(sprint => {
        const opt = document.createElement('option');
        opt.value = sprint.Sprint;
        opt.textContent = `Sprint ${sprint.Sprint}${sprint.Theme ? ': ' + sprint.Theme : ''}`;
        select.appendChild(opt);
    });
}

function showEmptyState(projectExists = false) {
    // Clear stats
    userStories = [];
    filteredStories = [];
    document.getElementById('totalStories').textContent = '0';
    document.getElementById('completedCount').textContent = '0';
    document.getElementById('inProgressCount').textContent = '0';
    document.getElementById('yetToStartCount').textContent = '0';
    document.getElementById('highPriorityCount').textContent = '0';
    document.getElementById('totalEffort').textContent = '0';

    if (projectExists) {
        // Project exists but has no user stories - show add story button
        document.getElementById('storiesTableBody').innerHTML = `
            <tr><td colspan="8" class="empty-state">
                <h3>No User Stories Yet</h3>
                <p>This project doesn't have any user stories. Add your first one using the button above!</p>
            </td></tr>`;
    } else {
        // No project selected - show create project button
        document.getElementById('storiesTableBody').innerHTML = `
            <tr><td colspan="8" class="empty-state">
                <h3>No Project Selected</h3>
                <p>Select a project from the dropdown or create a new one.</p>
                <a href="project-builder.html" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--accent); color: var(--primary); border-radius: 8px; text-decoration: none; font-weight: 600;">+ Create New Project</a>
            </td></tr>`;
    }
}

// Real-time listener
function setupRealtimeListener() {
    const project = getCurrentProject();
    if (!project) return;

    unsubscribe = db.collection('projects').doc(project).onSnapshot((doc) => {
        if (doc.exists && doc.data().userStories) {
            const newStories = doc.data().userStories;
            if (JSON.stringify(newStories) !== JSON.stringify(userStories)) {
                userStories = newStories;
                initializeApp();
            }
        }
    });
}

// Generate AI Suggested Solution based on user story content
function initializeApp() {
    populateFilters();
    updateStats();
    filterAndRender();
    setupEventListeners();
}

// Populate filter dropdowns
function populateFilters() {
    // Epics
    const epics = [...new Set(userStories.map(s => s.Epic).filter(e => e))].sort();
    const epicSelect = document.getElementById('epicFilter');
    epics.forEach(epic => {
        const option = document.createElement('option');
        option.value = epic;
        option.textContent = epic.length > 50 ? epic.substring(0, 47) + '...' : epic;
        epicSelect.appendChild(option);
    });

    // Sprints
    const sprints = [...new Set(userStories.map(s => s.Sprint).filter(s => s !== null))].sort((a, b) => a - b);
    const sprintSelect = document.getElementById('sprintFilter');
    sprints.forEach(sprint => {
        const option = document.createElement('option');
        option.value = sprint;
        option.textContent = `Sprint ${sprint}`;
        sprintSelect.appendChild(option);
    });
}

// Update statistics
function updateStats() {
    const total = userStories.length;
    const completed = userStories.filter(s => s.Status === 'Completed').length;
    const inProgress = userStories.filter(s => s.Status === 'In Progress').length;
    const yetToStart = userStories.filter(s => s.Status === 'Yet to start').length;
    const notSet = total - completed - inProgress - yetToStart;
    const highPriority = userStories.filter(s => s.Priority === 'High').length;
    const totalEffort = userStories.reduce((sum, s) => sum + (s.Effort_Required || 0), 0);

    document.getElementById('totalStories').textContent = total;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('inProgressCount').textContent = inProgress;
    document.getElementById('yetToStartCount').textContent = yetToStart;
    document.getElementById('highPriorityCount').textContent = highPriority;
    document.getElementById('totalEffort').textContent = totalEffort.toLocaleString();

    // Update progress bar
    const completedPct = (completed / total * 100).toFixed(1);
    const inProgressPct = (inProgress / total * 100).toFixed(1);
    const yetToStartPct = (yetToStart / total * 100).toFixed(1);
    const notSetPct = (notSet / total * 100).toFixed(1);

    document.getElementById('progressCompleted').style.width = completedPct + '%';
    document.getElementById('progressCompleted').textContent = completed > 0 ? completed : '';

    document.getElementById('progressInProgress').style.width = inProgressPct + '%';
    document.getElementById('progressInProgress').textContent = inProgress > 0 ? inProgress : '';

    document.getElementById('progressYetToStart').style.width = yetToStartPct + '%';
    document.getElementById('progressYetToStart').textContent = yetToStart > 0 ? yetToStart : '';

    document.getElementById('progressNotSet').style.width = notSetPct + '%';
    document.getElementById('progressNotSet').textContent = notSet > 0 ? notSet : '';

    document.getElementById('progressPercent').textContent = completedPct + '% Complete';
}

// Filter and render stories
function filterAndRender() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const epic = document.getElementById('epicFilter').value;
    const status = document.getElementById('statusFilter').value;
    const priority = document.getElementById('priorityFilter').value;
    const sprint = document.getElementById('sprintFilter').value;

    filteredStories = userStories.filter(story => {
        // Search filter
        if (search) {
            const searchFields = [story.ID, story.Feature, story.User_Story, story.Epic, story.Tool_Process].join(' ').toLowerCase();
            if (!searchFields.includes(search)) return false;
        }

        // Epic filter
        if (epic && story.Epic !== epic) return false;

        // Status filter
        if (status === 'null' && story.Status !== null) return false;
        if (status && status !== 'null' && story.Status !== status) return false;

        // Priority filter
        if (priority === 'null' && story.Priority !== null) return false;
        if (priority && priority !== 'null' && story.Priority !== priority) return false;

        // Sprint filter
        if (sprint && story.Sprint != sprint) return false;

        return true;
    });

    renderTable();
}

// Render table
function renderTable() {
    const tbody = document.getElementById('storiesTableBody');
    document.getElementById('filteredCount').textContent = filteredStories.length;

    if (filteredStories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><h3>No Stories Found</h3><p>Try adjusting your filters</p></td></tr>';
        return;
    }

    let html = '';
    filteredStories.forEach((story, index) => {
        const statusClass = getStatusClass(story.Status);
        const priorityClass = story.Priority === 'High' ? 'priority-high' : 'priority-normal';
        const isCompleted = story.Status === 'Completed';

        html += `
            <tr id="row-${index}">
                <td><span class="story-id">${story.ID}</span></td>
                <td><span class="epic-badge" title="${escapeHtml(story.Epic || 'N/A')}">${escapeHtml(truncate(story.Epic, 25))}</span></td>
                <td class="feature-name">${escapeHtml(story.Feature || 'N/A')}</td>
                <td><span class="status-badge ${statusClass}">${story.Status || 'Not Set'}</span></td>
                <td><span class="priority-badge ${priorityClass}">${story.Priority || 'Normal'}</span></td>
                <td>${story.Sprint ? `<span class="sprint-badge">${story.Sprint}</span>` : '-'}</td>
                <td><span class="effort-badge">${story.Effort_Required || '-'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="openEditStoryModal('${story.Story_ID}')" title="Edit">✎</button>
                        <button class="action-btn complete" onclick="markStoryComplete('${story.Story_ID}')" title="Mark Complete" ${isCompleted ? 'disabled' : ''}>✓</button>
                        <button class="action-btn delete" onclick="deleteStory('${story.Story_ID}')" title="Delete">✕</button>
                        <button class="action-btn details" onclick="toggleExpand(${index})">Details</button>
                    </div>
                </td>
            </tr>
            <tr class="expanded-content" id="expanded-${index}">
                <td colspan="8">
                    ${renderExpandedContent(story)}
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Render expanded content for a story
function renderExpandedContent(story) {
    // Check if story has a saved AI solution
    const savedSolution = story.AI_Solution;
    const hasSavedSolution = savedSolution && savedSolution.content;

    // Fallback to rule-based suggestions if no AI solution
    const fallbackSolution = generateAISolution(story);

    return `
        <div class="expanded-inner">
            <div class="detail-grid">
                <div class="detail-section">
                    <h4>User Story</h4>
                    <pre>${escapeHtml(story.User_Story || 'No user story provided')}</pre>
                </div>
                <div class="detail-section">
                    <h4>Scenarios</h4>
                    <pre>${escapeHtml(story.Scenario || 'No scenarios defined')}</pre>
                </div>
                <div class="detail-section">
                    <h4>Acceptance Criteria</h4>
                    <pre>${escapeHtml(story.Acceptance_Criteria || 'No acceptance criteria defined')}</pre>
                </div>
                <div class="detail-section ai-solution" style="grid-column: span 2;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h4>🤖 AI-Powered Implementation Guide</h4>
                        <button id="ai-btn-${story.Story_ID}" class="generate-ai-btn" onclick="generateAISolutionWithCodebase('${story.Story_ID}')">
                            ${hasSavedSolution ? '🔄 Regenerate Solution' : '🤖 Generate AI Solution'}
                        </button>
                    </div>
                    ${hasSavedSolution ? `
                        <div class="ai-solution-content" id="ai-result-${story.Story_ID}">
                            ${formatSavedAISolution(savedSolution)}
                        </div>
                    ` : `
                        <div id="ai-result-${story.Story_ID}">
                            <div style="background: var(--primary); border-radius: 8px; padding: 1rem;">
                                <p style="color: var(--text-muted); margin-bottom: 1rem;">
                                    Click "Generate AI Solution" to analyze this user story against your codebase and get specific implementation recommendations.
                                </p>
                                <p style="color: var(--text-muted); font-size: 0.85rem;">
                                    <strong>Requires:</strong> GitHub repo and OpenAI API key configured in <a href="#" onclick="event.preventDefault(); openProjectSettingsModal();" style="color: var(--accent);">Project Settings</a>
                                </p>
                                <hr style="border: none; border-top: 1px solid var(--bg-hover); margin: 1rem 0;">
                                <p style="color: var(--text-muted); font-size: 0.85rem;"><strong>Quick Suggestions (rule-based):</strong></p>
                                <div style="margin-top: 0.5rem;">
                                    ${fallbackSolution.techStack.length > 0 ? `
                                        <div style="margin-bottom: 0.5rem;">
                                            ${fallbackSolution.techStack.map(t => `<span class="tech-tag">${t}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                    <ul style="margin-left: 1.25rem; font-size: 0.85rem; color: var(--text-muted);">
                                        ${fallbackSolution.solutions.slice(0, 3).map(s => `<li style="margin-bottom: 0.25rem;">${escapeHtml(s)}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `}
                </div>
                ${story.Comments ? `
                <div class="detail-section comments-section">
                    <h4>Comments / Notes</h4>
                    <pre>${escapeHtml(story.Comments)}</pre>
                </div>
                ` : ''}
                <div class="detail-section">
                    <h4>Additional Details</h4>
                    <table style="width: 100%; font-size: 0.85rem;">
                        <tr><td style="padding: 0.25rem 0;"><strong>Tool/Process:</strong></td><td>${escapeHtml(story.Tool_Process || '-')}</td></tr>
                        <tr><td style="padding: 0.25rem 0;"><strong>Effort Points:</strong></td><td>${story.Effort_Point || '-'}</td></tr>
                        <tr><td style="padding: 0.25rem 0;"><strong>Dependencies:</strong></td><td>${escapeHtml(story.Dependencies || 'None')}</td></tr>
                        <tr><td style="padding: 0.25rem 0;"><strong>Version:</strong></td><td>${escapeHtml(story.Version_Assignment || '-')}</td></tr>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function formatSavedAISolution(solution) {
    let html = solution.content
        .replace(/### (.*)/g, '<h5>$1</h5>')
        .replace(/## (.*)/g, '<h4 style="color: var(--accent); margin-top: 1rem;">$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code style="background: var(--bg-hover); padding: 0.1rem 0.3rem; border-radius: 3px;">$1</code>')
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-reference"><code>$2</code></pre>')
        .replace(/\n- /g, '\n• ')
        .replace(/\n(\d+)\. /g, '\n<strong>$1.</strong> ')
        .replace(/\n/g, '<br>');

    if (solution.referencedFiles && solution.referencedFiles.length > 0) {
        html += `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--bg-hover);">
                <h5>📁 Referenced Files</h5>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                    ${solution.referencedFiles.map(f => `
                        <span style="background: var(--bg-hover); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; color: var(--accent);">
                            ${f}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    html += `<div style="margin-top: 0.75rem; font-size: 0.75rem; color: var(--text-muted);">Generated: ${new Date(solution.generatedAt).toLocaleString()} | Tokens: ${solution.tokens}</div>`;

    return html;
}

// Toggle expanded row
function toggleExpand(index) {
    const expandedRow = document.getElementById(`expanded-${index}`);
    const mainRow = document.getElementById(`row-${index}`);
    const isShowing = expandedRow.classList.contains('show');

    // Close all other expanded rows
    document.querySelectorAll('.expanded-content').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.stories-table tr').forEach(el => el.classList.remove('expanded'));

    if (!isShowing) {
        expandedRow.classList.add('show');
        mainRow.classList.add('expanded');
    }
}

// Helper functions

// Setup event listeners
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', debounce(filterAndRender, 300));
    document.getElementById('epicFilter').addEventListener('change', filterAndRender);
    document.getElementById('statusFilter').addEventListener('change', filterAndRender);
    document.getElementById('priorityFilter').addEventListener('change', filterAndRender);
    document.getElementById('sprintFilter').addEventListener('change', filterAndRender);
}


// Initialize
// ============================================
// Add User Story Modal Functions
// ============================================

function openAddStoryModal() {
    const project = getCurrentProject();
    if (!project) {
        alert('Please select a project first');
        return;
    }

    // Reset form
    document.getElementById('newStoryText').value = '';
    document.getElementById('newStoryEpic').value = '';
    document.getElementById('newStoryFeature').value = '';
    document.getElementById('newStoryPriority').value = '';
    document.getElementById('newStoryStatus').value = 'Yet to start';
    document.getElementById('newStorySprint').value = '';
    document.getElementById('newStoryEffort').value = '8';
    document.getElementById('newStoryCriteria').value = '';

    // Populate sprint dropdown with current project sprints
    db.collection('projects').doc(project).get().then(doc => {
        if (doc.exists) {
            populateSprintDropdown(doc.data().sprintData || []);
        }
    });

    document.getElementById('addStoryModal').classList.add('visible');
}

function closeAddStoryModal() {
    document.getElementById('addStoryModal').classList.remove('visible');
}

async function saveNewStory() {
    const project = getCurrentProject();
    if (!project) return;

    const storyText = document.getElementById('newStoryText').value.trim();
    const epic = document.getElementById('newStoryEpic').value.trim();

    if (!storyText || !epic) {
        alert('Please fill in the User Story and Epic fields');
        return;
    }

    try {
        // Get current stories to generate new ID
        const doc = await db.collection('projects').doc(project).get();
        const currentStories = doc.exists ? (doc.data().userStories || []) : [];

        // Generate new story ID
        const maxId = currentStories.reduce((max, s) => {
            const num = parseInt(s.Story_ID?.replace('US-', '') || '0');
            return num > max ? num : max;
        }, 0);
        const newId = `US-${String(maxId + 1).padStart(3, '0')}`;

        // Create new story object
        const newStory = {
            Story_ID: newId,
            User_Story: storyText,
            Epic: epic,
            Feature: document.getElementById('newStoryFeature').value.trim() || null,
            Priority: document.getElementById('newStoryPriority').value || null,
            Status: document.getElementById('newStoryStatus').value,
            Sprint: document.getElementById('newStorySprint').value ?
                    parseInt(document.getElementById('newStorySprint').value) : null,
            Effort_Required: parseInt(document.getElementById('newStoryEffort').value) || 8,
            Acceptance_Criteria: document.getElementById('newStoryCriteria').value.trim() || null,
            Created_At: new Date().toISOString(),
            Added_Manually: true
        };

        // Add to stories array
        currentStories.push(newStory);

        // Save to Firebase
        await db.collection('projects').doc(project).update({
            userStories: currentStories,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });

        closeAddStoryModal();

        // Data will auto-refresh via realtime listener

    } catch (error) {
        console.error('Error saving story:', error);
        alert('Error saving user story: ' + error.message);
    }
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAddStoryModal();
        closeEditStoryModal();
        closeProjectSettingsModal();
    }
});

// Close modal on backdrop click
document.getElementById('addStoryModal').addEventListener('click', (e) => {
    if (e.target.id === 'addStoryModal') {
        closeAddStoryModal();
    }
});

document.getElementById('editStoryModal').addEventListener('click', (e) => {
    if (e.target.id === 'editStoryModal') {
        closeEditStoryModal();
    }
});

document.getElementById('projectSettingsModal').addEventListener('click', (e) => {
    if (e.target.id === 'projectSettingsModal') {
        closeProjectSettingsModal();
    }
});

// ============================================
// Edit User Story Modal Functions
// ============================================

function openEditStoryModal(storyId) {
    const project = getCurrentProject();
    if (!project) return;

    // Find the story in userStories array
    const story = userStories.find(s => s.Story_ID === storyId);
    if (!story) {
        alert('Story not found');
        return;
    }

    // Populate the form with existing values
    document.getElementById('editStoryId').value = storyId;
    document.getElementById('editStoryText').value = story.User_Story || '';
    document.getElementById('editStoryEpic').value = story.Epic || '';
    document.getElementById('editStoryFeature').value = story.Feature || '';
    document.getElementById('editStoryPriority').value = story.Priority || '';
    document.getElementById('editStoryStatus').value = story.Status || 'Yet to start';
    document.getElementById('editStorySprint').value = story.Sprint || '';
    document.getElementById('editStoryEffort').value = story.Effort_Required || 8;
    document.getElementById('editStoryCriteria').value = story.Acceptance_Criteria || '';

    // Populate sprint dropdown with current project sprints
    db.collection('projects').doc(project).get().then(doc => {
        if (doc.exists) {
            const sprintData = doc.data().sprintData || [];
            const select = document.getElementById('editStorySprint');
            select.innerHTML = '<option value="">Not Assigned</option>';
            sprintData.forEach(sprint => {
                const opt = document.createElement('option');
                opt.value = sprint.Sprint;
                opt.textContent = `Sprint ${sprint.Sprint}${sprint.Theme ? ': ' + sprint.Theme : ''}`;
                if (sprint.Sprint == story.Sprint) opt.selected = true;
                select.appendChild(opt);
            });
        }
    });

    document.getElementById('editStoryModal').classList.add('visible');
}

function closeEditStoryModal() {
    document.getElementById('editStoryModal').classList.remove('visible');
}

async function saveEditedStory() {
    const project = getCurrentProject();
    if (!project) return;

    const storyId = document.getElementById('editStoryId').value;
    const storyText = document.getElementById('editStoryText').value.trim();
    const epic = document.getElementById('editStoryEpic').value.trim();

    if (!storyText || !epic) {
        alert('Please fill in the User Story and Epic fields');
        return;
    }

    try {
        // Find and update the story
        const storyIndex = userStories.findIndex(s => s.Story_ID === storyId);
        if (storyIndex === -1) {
            alert('Story not found');
            return;
        }

        // Update story object
        userStories[storyIndex] = {
            ...userStories[storyIndex],
            User_Story: storyText,
            Epic: epic,
            Feature: document.getElementById('editStoryFeature').value.trim() || null,
            Priority: document.getElementById('editStoryPriority').value || null,
            Status: document.getElementById('editStoryStatus').value,
            Sprint: document.getElementById('editStorySprint').value ?
                    parseInt(document.getElementById('editStorySprint').value) : null,
            Effort_Required: parseInt(document.getElementById('editStoryEffort').value) || 8,
            Acceptance_Criteria: document.getElementById('editStoryCriteria').value.trim() || null,
            Updated_At: new Date().toISOString()
        };

        // Save to Firebase
        await db.collection('projects').doc(project).update({
            userStories: userStories,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });

        closeEditStoryModal();

        // Data will auto-refresh via realtime listener

    } catch (error) {
        console.error('Error saving story:', error);
        alert('Error saving user story: ' + error.message);
    }
}

// ============================================
// Quick Actions
// ============================================

async function markStoryComplete(storyId) {
    const project = getCurrentProject();
    if (!project) return;

    // Find the story
    const storyIndex = userStories.findIndex(s => s.Story_ID === storyId);
    if (storyIndex === -1) {
        alert('Story not found');
        return;
    }

    // Check if already completed
    if (userStories[storyIndex].Status === 'Completed') {
        return;
    }

    try {
        // Update status to completed
        userStories[storyIndex].Status = 'Completed';
        userStories[storyIndex].Completed_At = new Date().toISOString();

        // Save to Firebase
        await db.collection('projects').doc(project).update({
            userStories: userStories,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Data will auto-refresh via realtime listener

    } catch (error) {
        console.error('Error completing story:', error);
        alert('Error marking story complete: ' + error.message);
    }
}

async function deleteStory(storyId) {
    const project = getCurrentProject();
    if (!project) return;

    // Find the story
    const story = userStories.find(s => s.Story_ID === storyId);
    if (!story) {
        alert('Story not found');
        return;
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${story.Story_ID}: ${story.User_Story?.substring(0, 50)}..."?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        // Remove story from array
        userStories = userStories.filter(s => s.Story_ID !== storyId);

        // Save to Firebase
        await db.collection('projects').doc(project).update({
            userStories: userStories,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Data will auto-refresh via realtime listener

    } catch (error) {
        console.error('Error deleting story:', error);
        alert('Error deleting user story: ' + error.message);
    }
}

// ============================================
// Project Settings Modal Functions
// ============================================

let projectSettings = {};

async function openProjectSettingsModal() {
    const project = getCurrentProject();
    if (!project) {
        alert('Please select a project first');
        return;
    }

    // Load existing settings from Firebase
    try {
        const doc = await db.collection('projects').doc(project).get();
        if (doc.exists) {
            const data = doc.data();
            projectSettings = data.settings || {};
            document.getElementById('settingsProjectLabel').textContent = data.config?.name || project;

            // Populate form
            document.getElementById('settingsGitHubRepo').value = projectSettings.githubRepo || '';
            document.getElementById('settingsGitHubToken').value = projectSettings.githubToken || '';
            document.getElementById('settingsGitHubBranch').value = projectSettings.githubBranch || 'main';
            document.getElementById('settingsOpenAIKey').value = projectSettings.openaiKey || localStorage.getItem('openai_api_key') || '';
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }

    document.getElementById('githubTestResult').innerHTML = '';
    document.getElementById('projectSettingsModal').classList.add('visible');
}

function closeProjectSettingsModal() {
    document.getElementById('projectSettingsModal').classList.remove('visible');
}

function toggleGitHubTokenVisibility() {
    const input = document.getElementById('settingsGitHubToken');
    input.type = input.type === 'password' ? 'text' : 'password';
}

function toggleOpenAIKeyVisibility() {
    const input = document.getElementById('settingsOpenAIKey');
    input.type = input.type === 'password' ? 'text' : 'password';
}

async function testGitHubConnection() {
    const repo = document.getElementById('settingsGitHubRepo').value.trim();
    const token = document.getElementById('settingsGitHubToken').value.trim();
    const resultDiv = document.getElementById('githubTestResult');

    if (!repo || !token) {
        resultDiv.innerHTML = '<div class="config-status not-connected">⚠️ Please enter repository and token</div>';
        return;
    }

    resultDiv.innerHTML = '<div class="config-status" style="background: rgba(96,165,250,0.15); color: #60a5fa;">🔄 Testing connection...</div>';

    try {
        const response = await fetch(`https://api.github.com/repos/${repo}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            resultDiv.innerHTML = `
                <div class="config-status connected">
                    ✓ Connected to <strong>${data.full_name}</strong>
                </div>
                <div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">
                    ${data.description || 'No description'}<br>
                    Language: ${data.language || 'N/A'} | Stars: ${data.stargazers_count} | Last push: ${new Date(data.pushed_at).toLocaleDateString()}
                </div>
            `;
        } else {
            const error = await response.json();
            resultDiv.innerHTML = `<div class="config-status not-connected">✗ Error: ${error.message || response.statusText}</div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<div class="config-status not-connected">✗ Connection failed: ${error.message}</div>`;
    }
}

async function saveProjectSettings() {
    const project = getCurrentProject();
    if (!project) return;

    const settings = {
        githubRepo: document.getElementById('settingsGitHubRepo').value.trim(),
        githubToken: document.getElementById('settingsGitHubToken').value.trim(),
        githubBranch: document.getElementById('settingsGitHubBranch').value.trim() || 'main',
        openaiKey: document.getElementById('settingsOpenAIKey').value.trim()
    };

    // Also save OpenAI key to localStorage for other features
    if (settings.openaiKey) {
        localStorage.setItem('openai_api_key', settings.openaiKey);
    }

    try {
        await db.collection('projects').doc(project).update({
            settings: settings,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });

        projectSettings = settings;
        closeProjectSettingsModal();
        alert('Settings saved successfully!');
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Error saving settings: ' + error.message);
    }
}

// ============================================
// AI-Powered Solution Generation with GitHub
// ============================================

async function generateAISolutionWithCodebase(storyId) {
    const project = getCurrentProject();
    if (!project) return;

    const story = userStories.find(s => s.Story_ID === storyId);
    if (!story) return;

    // Get project settings
    const doc = await db.collection('projects').doc(project).get();
    const data = doc.data();
    const settings = data.settings || {};

    if (!settings.githubRepo || !settings.githubToken) {
        alert('Please configure GitHub settings first (click Settings button)');
        openProjectSettingsModal();
        return;
    }

    const openaiKey = settings.openaiKey || localStorage.getItem('openai_api_key');
    if (!openaiKey) {
        alert('Please configure OpenAI API key in Settings');
        openProjectSettingsModal();
        return;
    }

    // Update button to show loading
    const btn = document.getElementById(`ai-btn-${storyId}`);
    const resultDiv = document.getElementById(`ai-result-${storyId}`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="ai-loading"></span> Analyzing...';
    }

    try {
        // Step 1: Search GitHub for relevant files
        const searchTerms = extractSearchTerms(story);
        const relevantFiles = await searchGitHubCode(settings, searchTerms);

        // Step 2: Fetch content from relevant files
        const codeContext = await fetchFileContents(settings, relevantFiles.slice(0, 5));

        // Step 3: Send to OpenAI for analysis
        const aiResponse = await analyzeWithAI(openaiKey, story, codeContext, data.config);

        // Step 4: Display results
        if (resultDiv) {
            resultDiv.innerHTML = formatAIResponse(aiResponse, relevantFiles);
        }

        // Step 5: Save the generated solution to Firebase
        await saveAISolution(project, storyId, aiResponse, relevantFiles);

    } catch (error) {
        console.error('AI analysis error:', error);
        if (resultDiv) {
            resultDiv.innerHTML = `<div class="config-status not-connected">Error: ${error.message}</div>`;
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '🤖 Generate AI Solution';
        }
    }
}

async function searchGitHubCode(settings, searchTerms) {
    const { githubRepo, githubToken } = settings;
    const relevantFiles = [];
    // Search for each term
    for (const term of searchTerms.slice(0, 3)) {
        try {
            const response = await fetch(
                `https://api.github.com/search/code?q=${encodeURIComponent(term)}+repo:${githubRepo}&per_page=5`,
                {
                    headers: {
                        'Authorization': `token ${githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                data.items?.forEach(item => {
                    if (!relevantFiles.find(f => f.path === item.path)) {
                        relevantFiles.push({
                            path: item.path,
                            name: item.name,
                            url: item.html_url,
                            score: item.score
                        });
                    }
                });
            }

            // Rate limiting - wait between requests
            await new Promise(r => setTimeout(r, 500));
        } catch (e) {
            console.warn(`Search failed for term: ${term}`, e);
        }
    }

    return relevantFiles;
}

async function fetchFileContents(settings, files) {
    const { githubRepo, githubToken, githubBranch } = settings;
    const contents = [];

    for (const file of files) {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${githubRepo}/contents/${file.path}?ref=${githubBranch}`,
                {
                    headers: {
                        'Authorization': `token ${githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.content) {
                    const decoded = atob(data.content);
                    // Truncate very long files
                    const truncated = decoded.length > 3000 ? decoded.substring(0, 3000) + '\n...[truncated]' : decoded;
                    contents.push({
                        path: file.path,
                        content: truncated,
                        url: file.url
                    });
                }
            }
        } catch (e) {
            console.warn(`Failed to fetch: ${file.path}`, e);
        }
    }

    return contents;
}

async function analyzeWithAI(apiKey, story, codeContext, projectConfig) {
    const codeSnippets = codeContext.map(c =>
        `### File: ${c.path}\n\`\`\`\n${c.content}\n\`\`\``
    ).join('\n\n');

    const prompt = `You are a senior software architect helping implement a user story. Analyze the user story and the existing codebase to provide a specific, actionable implementation plan.

## Project Context
Project: ${projectConfig?.name || 'Unknown'}
${projectConfig?.purpose ? `Purpose: ${projectConfig.purpose}` : ''}

## User Story
**ID:** ${story.Story_ID}
**Epic:** ${story.Epic || 'N/A'}
**Feature:** ${story.Feature || 'N/A'}
**Story:** ${story.User_Story || 'N/A'}
**Acceptance Criteria:** ${story.Acceptance_Criteria || 'N/A'}

## Relevant Code from Repository
${codeSnippets || 'No relevant code files found.'}

## Instructions
Based on the user story and the existing codebase patterns, provide:

1. **Implementation Approach** (2-3 sentences on the recommended approach)
2. **Files to Modify** (list specific files from the codebase that need changes)
3. **New Files to Create** (if any new files are needed)
4. **Code Changes** (specific code snippets or pseudocode showing key changes)
5. **Integration Points** (how this connects with existing code)
6. **Estimated Complexity** (Low/Medium/High with brief justification)

Be specific and reference the actual code patterns you see in the repository.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: 'You are a senior software architect providing implementation guidance. Be specific and actionable.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 2000
        })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    return {
        content: data.choices[0].message.content,
        tokens: data.usage?.total_tokens || 0
    };
}

function formatAIResponse(aiResponse, relevantFiles) {
    // Convert markdown-style formatting to HTML
    let html = aiResponse.content
        .replace(/### (.*)/g, '<h5>$1</h5>')
        .replace(/## (.*)/g, '<h4 style="color: var(--accent); margin-top: 1rem;">$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code style="background: var(--bg-hover); padding: 0.1rem 0.3rem; border-radius: 3px;">$1</code>')
        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-reference"><code>$2</code></pre>')
        .replace(/\n- /g, '\n• ')
        .replace(/\n(\d+)\. /g, '\n<strong>$1.</strong> ')
        .replace(/\n/g, '<br>');

    // Add referenced files section
    if (relevantFiles.length > 0) {
        html += `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--bg-hover);">
                <h5>📁 Referenced Files</h5>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                    ${relevantFiles.map(f => `
                        <a href="${f.url}" target="_blank" style="background: var(--bg-hover); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; color: var(--accent); text-decoration: none;">
                            ${f.path}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }

    html += `<div style="margin-top: 0.75rem; font-size: 0.75rem; color: var(--text-muted);">Tokens used: ${aiResponse.tokens}</div>`;

    return html;
}

async function saveAISolution(project, storyId, aiResponse, relevantFiles) {
    // Find and update the story with the AI solution
    const storyIndex = userStories.findIndex(s => s.Story_ID === storyId);
    if (storyIndex === -1) return;

    userStories[storyIndex].AI_Solution = {
        content: aiResponse.content,
        generatedAt: new Date().toISOString(),
        referencedFiles: relevantFiles.map(f => f.path),
        tokens: aiResponse.tokens
    };

    await db.collection('projects').doc(project).update({
        userStories: userStories,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
}

async function init() {
    await loadProjectList();
    await loadData();
}
init();

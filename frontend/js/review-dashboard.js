// review-dashboard.js - SM-2 Review Dashboard with Statistics
const API_BASE_URL = 'http://localhost:3000/api/notebooks';

// Store charts globally to update them
let masteryChart = null;
let sourceChart = null;
let progressChart = null;

/**
 * Initialize the review dashboard
 */
async function initializeReviewDashboard() {
    console.log('🎯 Initializing Review Dashboard...');

    try {
        await Promise.all([
            loadVocabularyStats(),
            loadDueCards(),
            loadLeeches()
        ]);

        console.log('✅ Review Dashboard initialized');
    } catch (error) {
        console.error('❌ Failed to initialize review dashboard:', error);
        showNotification('Failed to load dashboard statistics', 'error');
    }
}

/**
 * Load and display vocabulary statistics
 */
async function loadVocabularyStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats/vocabulary`);
        if (!response.ok) throw new Error('Failed to fetch stats');

        const stats = await response.json();
        console.log('📊 Vocabulary Stats:', stats);

        // Update stat cards
        updateStatCards(stats);

        // Update charts
        updateCharts(stats);

        // Update detailed stats
        updateDetailedStats(stats);

    } catch (error) {
        console.error('Error loading vocabulary stats:', error);
        throw error;
    }
}

/**
 * Update stat cards in the UI
 */
function updateStatCards(stats) {
    // Helper function to safely update element
    const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    // Main stat cards
    updateElement('dueCount', stats.dueForReview || 0);
    updateElement('retentionRate', stats.retentionRate || 'N/A');
    updateElement('totalVocab', stats.total || 0);
    updateElement('matureCards', stats.mature || 0);

    // Additional stats
    updateElement('newCards', stats.newCards || 0);
    updateElement('learningCards', stats.learning || 0);
    updateElement('matureCards2', stats.mature || 0); // Duplicate for stat box
    updateElement('avgEaseFactor', stats.averageEaseFactor || '2.50');
    updateElement('avgInterval', `${stats.averageInterval || 0} days`);
    updateElement('totalLapses', stats.totalLapses || 0);
    updateElement('leechCount', stats.leechCount || 0);

    // AI extraction stats
    updateElement('manualCount', stats.bySource?.manual || 0);
    updateElement('aiCount', stats.bySource?.ai || 0);
    updateElement('hybridCount', stats.bySource?.hybrid || 0);
    updateElement('avgConfidence', `${(parseFloat(stats.averageConfidence || 1) * 100).toFixed(0)}%`);
}

/**
 * Update charts with statistics data
 */
function updateCharts(stats) {
    // Mastery Distribution Chart
    updateMasteryChart(stats.masteryDistribution);

    // Source Distribution Chart
    updateSourceChart(stats.bySource);

    // Card Maturity Progress Chart
    updateProgressChart(stats);
}

/**
 * Update mastery distribution pie chart
 */
function updateMasteryChart(distribution) {
    const ctx = document.getElementById('masteryChart');
    if (!ctx) return;

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded, skipping chart update');
        return;
    }

    const data = {
        labels: ['New', 'Learning', 'Familiar', 'Known', 'Mastered', 'Expert'],
        datasets: [{
            label: 'Cards',
            data: [
                distribution[0] || 0,
                distribution[1] || 0,
                distribution[2] || 0,
                distribution[3] || 0,
                distribution[4] || 0,
                distribution[5] || 0
            ],
            backgroundColor: [
                '#ff6b6b',  // New - Red
                '#feca57',  // Learning - Yellow
                '#48dbfb',  // Familiar - Light Blue
                '#1dd1a1',  // Known - Green
                '#5f27cd',  // Mastered - Purple
                '#fd79a8'   // Expert - Pink
            ],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };

    if (masteryChart) {
        masteryChart.data = data;
        masteryChart.update();
    } else {
        masteryChart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Mastery Distribution',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                }
            }
        });
    }
}

/**
 * Update source distribution chart
 */
function updateSourceChart(bySource) {
    const ctx = document.getElementById('sourceChart');
    if (!ctx) return;

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded, skipping chart update');
        return;
    }

    const data = {
        labels: ['Manual', 'AI Extracted', 'Hybrid'],
        datasets: [{
            label: 'Vocabulary Count',
            data: [
                bySource?.manual || 0,
                bySource?.ai || 0,
                bySource?.hybrid || 0
            ],
            backgroundColor: [
                '#3498db',  // Manual - Blue
                '#e74c3c',  // AI - Red
                '#9b59b6'   // Hybrid - Purple
            ],
            borderWidth: 1,
            borderColor: '#fff'
        }]
    };

    if (sourceChart) {
        sourceChart.data = data;
        sourceChart.update();
    } else {
        sourceChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Vocabulary by Source',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                }
            }
        });
    }
}

/**
 * Update progress chart (card maturity)
 */
function updateProgressChart(stats) {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded, skipping chart update');
        return;
    }

    const data = {
        labels: ['New', 'Learning', 'Mature'],
        datasets: [{
            label: 'Card Count',
            data: [
                stats.newCards || 0,
                stats.learning || 0,
                stats.mature || 0
            ],
            backgroundColor: [
                'rgba(255, 107, 107, 0.7)',  // New - Red
                'rgba(254, 202, 87, 0.7)',   // Learning - Yellow
                'rgba(29, 209, 161, 0.7)'    // Mature - Green
            ],
            borderColor: [
                'rgba(255, 107, 107, 1)',
                'rgba(254, 202, 87, 1)',
                'rgba(29, 209, 161, 1)'
            ],
            borderWidth: 2
        }]
    };

    if (progressChart) {
        progressChart.data = data;
        progressChart.update();
    } else {
        progressChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',  // Horizontal bars
                scales: {
                    x: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Card Maturity Progress',
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    }
                }
            }
        });
    }
}

/**
 * Update detailed statistics section
 */
function updateDetailedStats(stats) {
    const detailsContainer = document.getElementById('detailedStats');
    if (!detailsContainer) return;

    detailsContainer.innerHTML = `
        <div class="stat-row">
            <span class="stat-label">📊 Total Vocabulary:</span>
            <span class="stat-value">${stats.total || 0}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">🆕 New Cards:</span>
            <span class="stat-value">${stats.newCards || 0}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">📚 Learning:</span>
            <span class="stat-value">${stats.learning || 0} (interval < 21 days)</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">✅ Mature:</span>
            <span class="stat-value">${stats.mature || 0} (interval ≥ 21 days)</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-row">
            <span class="stat-label">⚡ Average Ease Factor:</span>
            <span class="stat-value">${stats.averageEaseFactor || '2.50'}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">📅 Average Interval:</span>
            <span class="stat-value">${stats.averageInterval || 0} days</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">❌ Total Lapses:</span>
            <span class="stat-value">${stats.totalLapses || 0}</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">🔴 Leeches:</span>
            <span class="stat-value">${stats.leechCount || 0} (lapses ≥ 8)</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">📈 Retention Rate:</span>
            <span class="stat-value">${stats.retentionRate || 'N/A'}</span>
        </div>
    `;
}

/**
 * Load and display due cards for review
 */
async function loadDueCards() {
    try {
        const response = await fetch(`${API_BASE_URL}/vocabulary/review/due`);
        if (!response.ok) throw new Error('Failed to fetch due cards');

        const data = await response.json();
        const dueCards = data.vocabulary || data; // Handle both formats
        console.log(`📋 Due Cards: ${Array.isArray(dueCards) ? dueCards.length : 0}`);

        updateReviewQueue(dueCards);

    } catch (error) {
        console.error('Error loading due cards:', error);
        updateReviewQueue([]); // Show empty state on error
    }
}

/**
 * Update review queue display
 */
function updateReviewQueue(cards) {
    const queueContainer = document.getElementById('reviewQueue');
    if (!queueContainer) return;

    // Ensure cards is an array
    if (!Array.isArray(cards)) {
        cards = [];
    }

    if (cards.length === 0) {
        queueContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✨</div>
                <p>No cards due for review!</p>
                <p class="empty-subtitle">Great job staying on top of your reviews!</p>
            </div>
        `;
        return;
    }

    queueContainer.innerHTML = cards.slice(0, 10).map(card => `
        <div class="queue-item" onclick="reviewCard('${card.id}')">
            <div class="queue-word">
                <span class="japanese">${card.japanese}</span>
                <span class="romaji">${card.romaji || ''}</span>
            </div>
            <div class="queue-meta">
                <span class="level-badge">${card.level || 'N5'}</span>
                ${card.lapses > 0 ? `<span class="lapse-badge">${card.lapses} lapses</span>` : ''}
                ${card.nextReviewDate ? `<span class="due-time">${formatDueTime(card.nextReviewDate)}</span>` : '<span class="new-badge">New</span>'}
            </div>
        </div>
    `).join('');

    if (cards.length > 10) {
        queueContainer.innerHTML += `
            <div class="queue-more">
                +${cards.length - 10} more cards
            </div>
        `;
    }
}

/**
 * Format due time relative to now
 */
function formatDueTime(dateString) {
    const now = new Date();
    const dueDate = new Date(dateString);
    const diffMs = dueDate - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
        return 'Overdue';
    } else if (diffHours < 24) {
        return `${diffHours}h`;
    } else {
        return `${diffDays}d`;
    }
}

/**
 * Load and display leech cards
 */
async function loadLeeches() {
    try {
        const response = await fetch(`${API_BASE_URL}/vocabulary/leeches`);
        if (!response.ok) throw new Error('Failed to fetch leeches');

        const data = await response.json();
        const leeches = data.leeches || data.vocabulary || [];
        console.log(`🔴 Leeches: ${data.count || leeches.length}`);

        updateLeechDisplay(leeches);

    } catch (error) {
        console.error('Error loading leeches:', error);
        updateLeechDisplay([]); // Show empty state on error
    }
}

/**
 * Update leech cards display
 */
function updateLeechDisplay(leeches) {
    const leechContainer = document.getElementById('leechCards');
    if (!leechContainer) return;

    // Ensure leeches is an array
    if (!Array.isArray(leeches)) {
        leeches = [];
    }

    if (leeches.length === 0) {
        leechContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎉</div>
                <p>No leeches!</p>
                <p class="empty-subtitle">You're doing great with your reviews!</p>
            </div>
        `;
        return;
    }

    leechContainer.innerHTML = leeches.map(card => `
        <div class="leech-item">
            <div class="leech-header">
                <span class="japanese">${card.japanese}</span>
                <span class="lapse-count">${card.lapses} lapses</span>
            </div>
            <div class="leech-details">
                <span class="english">${card.english}</span>
                <span class="romaji">${card.romaji || ''}</span>
            </div>
            <div class="leech-actions">
                <button onclick="reviewCard('${card.id}')" class="btn-small btn-primary">Review</button>
                <button onclick="editCard('${card.id}')" class="btn-small btn-secondary">Edit</button>
                <button onclick="resetCard('${card.id}')" class="btn-small btn-warning">Reset</button>
            </div>
        </div>
    `).join('');
}

/**
 * Start spaced repetition practice session
 */
async function startSpacedRepetition() {
    try {
        const response = await fetch(`${API_BASE_URL}/vocabulary/review/due`);
        if (!response.ok) throw new Error('Failed to fetch due cards');

        const data = await response.json();
        const dueCards = data.vocabulary || data;

        if (!dueCards || dueCards.length === 0) {
            showNotification('No cards due for review!', 'info');
            return;
        }

        // TODO: Implement review session UI
        console.log(`Starting review session with ${dueCards.length} cards`);
        showNotification(`Starting review session with ${dueCards.length} cards`, 'success');

    } catch (error) {
        console.error('Error starting practice:', error);
        showNotification('Failed to start practice session', 'error');
    }
}

/**
 * Review a specific card
 */
function reviewCard(cardId) {
    console.log(`Reviewing card: ${cardId}`);
    // TODO: Implement card review UI
    showNotification('Card review UI coming soon!', 'info');
}

/**
 * Edit a card
 */
function editCard(cardId) {
    console.log(`Editing card: ${cardId}`);
    // This should integrate with existing edit functionality
}

/**
 * Reset a leech card (reset lapses and ease factor)
 */
async function resetCard(cardId) {
    if (!confirm('Reset this card? This will reset its ease factor and lapses.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/vocabulary/${cardId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                easeFactor: 2.5,
                lapses: 0,
                interval: 0
            })
        });

        if (!response.ok) throw new Error('Failed to reset card');

        showNotification('Card reset successfully!', 'success');
        await initializeReviewDashboard();  // Refresh dashboard

    } catch (error) {
        console.error('Error resetting card:', error);
        showNotification('Failed to reset card', 'error');
    }
}

/**
 * Refresh dashboard statistics
 */
async function refreshDashboard() {
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<span class="spinner">⟳</span> Refreshing...';
    }

    try {
        await initializeReviewDashboard();
        showNotification('Dashboard refreshed!', 'success');
    } catch (error) {
        showNotification('Failed to refresh dashboard', 'error');
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '🔄 Refresh';
        }
    }
}

// Auto-refresh dashboard every 60 seconds
setInterval(() => {
    if (document.getElementById('repetition-section')?.classList.contains('active')) {
        loadVocabularyStats().catch(console.error);
    }
}, 60000);

// Notebook API Module
// Functions for communicating with notebook backend API

// ========================================
// HEALTH CHECK
// ========================================

/**
 * Check if notebook services are healthy
 * @returns {Promise<boolean>} True if services are ready
 */
async function healthCheck() {
    try {
        const response = await fetch('/api/notebooks/health');
        const data = await response.json();
        return response.ok && data.status === 'healthy';
    } catch (error) {
        console.warn('Health check failed:', error);
        return false;
    }
}

// ========================================
// VOCABULARY API FUNCTIONS
// ========================================
// VOCABULARY API FUNCTIONS
// ========================================

/**
 * Add new vocabulary entry
 * @param {Object} vocabData - Vocabulary data
 * @returns {Promise<Object>} API response
 */
async function addVocabulary(vocabData) {
    try {
        const response = await fetch('/api/notebooks/vocabulary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vocabData)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to add vocabulary');
        }

        return data;
    } catch (error) {
        console.error('Error adding vocabulary:', error);
        throw error;
    }
}

/**
 * Get all vocabulary entries with optional filtering
 * @param {Object} filters - Filter options (level, type, search, tags)
 * @returns {Promise<Array>} Array of vocabulary entries
 */
async function getVocabulary(filters = {}) {
    try {
        const params = new URLSearchParams();
        
        if (filters.level && filters.level !== 'all') params.append('level', filters.level);
        if (filters.type && filters.type !== 'all') params.append('type', filters.type);
        if (filters.search) params.append('search', filters.search);
        if (filters.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','));

        const url = `/api/notebooks/vocabulary${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get vocabulary');
        }

        return data.vocabulary;
    } catch (error) {
        console.error('Error getting vocabulary:', error);
        throw error;
    }
}

/**
 * Get specific vocabulary entry
 * @param {string} id - Vocabulary ID
 * @returns {Promise<Object>} Vocabulary entry
 */
async function getVocabularyById(id) {
    try {
        const response = await fetch(`/api/notebooks/vocabulary/${id}`);
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get vocabulary');
        }

        return data.vocabulary;
    } catch (error) {
        console.error('Error getting vocabulary by ID:', error);
        throw error;
    }
}

/**
 * Update vocabulary entry
 * @param {string} id - Vocabulary ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated vocabulary entry
 */
async function updateVocabulary(id, updates) {
    try {
        const response = await fetch(`/api/notebooks/vocabulary/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update vocabulary');
        }

        return data.vocabulary;
    } catch (error) {
        console.error('Error updating vocabulary:', error);
        throw error;
    }
}

/**
 * Delete vocabulary entry
 * @param {string} id - Vocabulary ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteVocabulary(id) {
    try {
        const response = await fetch(`/api/notebooks/vocabulary/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete vocabulary');
        }

        return data.success;
    } catch (error) {
        console.error('Error deleting vocabulary:', error);
        throw error;
    }
}

/**
 * Update vocabulary mastery after review
 * @param {string} id - Vocabulary ID
 * @param {number} score - Review score (1-5)
 * @returns {Promise<Object>} Updated vocabulary entry
 */
async function updateVocabularyMastery(id, score) {
    try {
        const response = await fetch(`/api/notebooks/vocabulary/${id}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update mastery');
        }

        return data.vocabulary;
    } catch (error) {
        console.error('Error updating vocabulary mastery:', error);
        throw error;
    }
}

/**
 * Get vocabulary due for review
 * @returns {Promise<Array>} Array of vocabulary entries due for review
 */
async function getVocabularyForReview() {
    try {
        const response = await fetch('/api/notebooks/vocabulary/review/due');
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get vocabulary for review');
        }

        return data.vocabulary;
    } catch (error) {
        console.error('Error getting vocabulary for review:', error);
        throw error;
    }
}

// ========================================
// NOTEBOOK API FUNCTIONS
// ========================================

/**
 * Create new notebook entry
 * @param {Object} entryData - Notebook entry data
 * @returns {Promise<Object>} Created notebook entry
 */
async function createNotebookEntry(entryData) {
    try {
        const response = await fetch('/api/notebooks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entryData)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create notebook entry');
        }

        return data.notebook;
    } catch (error) {
        console.error('Error creating notebook entry:', error);
        throw error;
    }
}

/**
 * Get all notebook entries with optional filtering
 * @param {Object} filters - Filter options (type, category, difficulty, search, tags)
 * @returns {Promise<Array>} Array of notebook entries
 */
async function getNotebookEntries(filters = {}) {
    try {
        const params = new URLSearchParams();
        
        if (filters.type && filters.type !== 'all') params.append('type', filters.type);
        if (filters.category && filters.category !== 'all') params.append('category', filters.category);
        if (filters.difficulty && filters.difficulty !== 'all') params.append('difficulty', filters.difficulty);
        if (filters.search) params.append('search', filters.search);
        if (filters.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','));

        const url = `/api/notebooks${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get notebook entries');
        }

        return data.notebooks;
    } catch (error) {
        console.error('Error getting notebook entries:', error);
        throw error;
    }
}

/**
 * Get specific notebook entry
 * @param {string} id - Notebook entry ID
 * @returns {Promise<Object>} Notebook entry
 */
async function getNotebookEntryById(id) {
    try {
        const response = await fetch(`/api/notebooks/${id}`);
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get notebook entry');
        }

        return data.notebook;
    } catch (error) {
        console.error('Error getting notebook entry by ID:', error);
        throw error;
    }
}

/**
 * Update notebook entry
 * @param {string} id - Notebook entry ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated notebook entry
 */
async function updateNotebookEntry(id, updates) {
    try {
        const response = await fetch(`/api/notebooks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update notebook entry');
        }

        return data.notebook;
    } catch (error) {
        console.error('Error updating notebook entry:', error);
        throw error;
    }
}

/**
 * Delete notebook entry
 * @param {string} id - Notebook entry ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteNotebookEntry(id) {
    try {
        const response = await fetch(`/api/notebooks/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete notebook entry');
        }

        return data.success;
    } catch (error) {
        console.error('Error deleting notebook entry:', error);
        throw error;
    }
}

/**
 * Link vocabulary to notebook entry
 * @param {string} notebookId - Notebook entry ID
 * @param {Array<string>} vocabularyIds - Vocabulary IDs to link
 * @returns {Promise<Object>} Updated notebook entry
 */
async function linkVocabularyToNotebook(notebookId, vocabularyIds) {
    try {
        const response = await fetch(`/api/notebooks/${notebookId}/link-vocabulary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vocabularyIds })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to link vocabulary');
        }

        return data.notebook;
    } catch (error) {
        console.error('Error linking vocabulary to notebook:', error);
        throw error;
    }
}

/**
 * Unlink vocabulary from notebook entry
 * @param {string} notebookId - Notebook entry ID
 * @param {Array<string>} vocabularyIds - Vocabulary IDs to unlink
 * @returns {Promise<Object>} Updated notebook entry
 */
async function unlinkVocabularyFromNotebook(notebookId, vocabularyIds) {
    try {
        const response = await fetch(`/api/notebooks/${notebookId}/link-vocabulary`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vocabularyIds })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to unlink vocabulary');
        }

        return data.notebook;
    } catch (error) {
        console.error('Error unlinking vocabulary from notebook:', error);
        throw error;
    }
}

/**
 * Get vocabulary linked to notebook entry
 * @param {string} notebookId - Notebook entry ID
 * @returns {Promise<Array<string>>} Array of vocabulary IDs
 */
async function getNotebookVocabulary(notebookId) {
    try {
        const response = await fetch(`/api/notebooks/${notebookId}/vocabulary`);
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get notebook vocabulary');
        }

        return data.vocabularyIds;
    } catch (error) {
        console.error('Error getting notebook vocabulary:', error);
        throw error;
    }
}

/**
 * Update notebook entry after practice
 * @param {string} id - Notebook entry ID
 * @param {number} score - Practice score (1-5)
 * @returns {Promise<Object>} Updated notebook entry
 */
async function updateNotebookPractice(id, score) {
    try {
        const response = await fetch(`/api/notebooks/${id}/practice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to update practice');
        }

        return data.notebook;
    } catch (error) {
        console.error('Error updating notebook practice:', error);
        throw error;
    }
}

// ========================================
// EXERCISE & GUIDE API FUNCTIONS
// ========================================

/**
 * Create exercise entry
 * @param {Object} exerciseData - Exercise data
 * @returns {Promise<Object>} Created exercise entry
 */
async function createExercise(exerciseData) {
    try {
        const response = await fetch('/api/notebooks/exercises', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(exerciseData)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create exercise');
        }

        return data.notebook;
    } catch (error) {
        console.error('Error creating exercise:', error);
        throw error;
    }
}

/**
 * Create guide entry
 * @param {Object} guideData - Guide data
 * @returns {Promise<Object>} Created guide entry
 */
async function createGuide(guideData) {
    try {
        const response = await fetch('/api/notebooks/guides', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(guideData)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create guide');
        }

        return data.notebook;
    } catch (error) {
        console.error('Error creating guide:', error);
        throw error;
    }
}

/**
 * Get all exercise entries
 * @returns {Promise<Array>} Array of exercise entries
 */
async function getExercises() {
    try {
        const response = await fetch('/api/notebooks/exercises');
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get exercises');
        }

        return data.exercises;
    } catch (error) {
        console.error('Error getting exercises:', error);
        throw error;
    }
}

/**
 * Get all guide entries
 * @returns {Promise<Array>} Array of guide entries
 */
async function getGuides() {
    try {
        const response = await fetch('/api/notebooks/guides');
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get guides');
        }

        return data.guides;
    } catch (error) {
        console.error('Error getting guides:', error);
        throw error;
    }
}

// ========================================
// ANALYTICS API FUNCTIONS
// ========================================

/**
 * Get vocabulary statistics
 * @returns {Promise<Object>} Vocabulary statistics
 */
async function getVocabularyStats() {
    try {
        const response = await fetch('/api/notebooks/stats/vocabulary');
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get vocabulary stats');
        }

        return data.stats;
    } catch (error) {
        console.error('Error getting vocabulary stats:', error);
        throw error;
    }
}

/**
 * Get notebook statistics
 * @returns {Promise<Object>} Notebook statistics
 */
async function getNotebookStats() {
    try {
        const response = await fetch('/api/notebooks/stats/notebooks');
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get notebook stats');
        }

        return data.stats;
    } catch (error) {
        console.error('Error getting notebook stats:', error);
        throw error;
    }
}

/**
 * Get combined learning overview
 * @returns {Promise<Object>} Learning overview statistics
 */
async function getLearningOverview() {
    try {
        const response = await fetch('/api/notebooks/stats/overview');
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get learning overview');
        }

        return data.overview;
    } catch (error) {
        console.error('Error getting learning overview:', error);
        throw error;
    }
}

// ========================================
// EXPORT API FUNCTIONS
// ========================================

/**
 * Export vocabulary data
 * @param {string} format - Export format ('json' or 'csv')
 * @returns {Promise<Blob>} Export data as blob
 */
async function exportVocabulary(format = 'json') {
    try {
        const response = await fetch(`/api/notebooks/export/vocabulary?format=${format}`);
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to export vocabulary');
        }

        return await response.blob();
    } catch (error) {
        console.error('Error exporting vocabulary:', error);
        throw error;
    }
}

/**
 * Export notebook data
 * @param {string} format - Export format ('json' or 'csv')
 * @returns {Promise<Blob>} Export data as blob
 */
async function exportNotebooks(format = 'json') {
    try {
        const response = await fetch(`/api/notebooks/export/notebooks?format=${format}`);
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to export notebooks');
        }

        return await response.blob();
    } catch (error) {
        console.error('Error exporting notebooks:', error);
        throw error;
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Download blob as file
 * @param {Blob} blob - Data to download
 * @param {string} filename - Filename for download
 */
function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

/**
 * Handle API errors consistently
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 */
function handleApiError(error, context) {
    console.error(`API Error in ${context}:`, error);
    
    // Show user-friendly notification
    const message = error.message || `An error occurred in ${context}`;
    if (typeof showNotification === 'function') {
        showNotification(message, 'error');
    } else {
        alert(message);
    }
}

// Export all functions for use in other modules
window.NotebookAPI = {
    // Health Check
    healthCheck,
    
    // Vocabulary
    addVocabulary,
    getVocabulary,
    getVocabularyById,
    updateVocabulary,
    deleteVocabulary,
    updateVocabularyMastery,
    getVocabularyForReview,
    
    // Notebook
    createNotebookEntry,
    getNotebookEntries,
    getNotebookEntryById,
    updateNotebookEntry,
    deleteNotebookEntry,
    linkVocabularyToNotebook,
    unlinkVocabularyFromNotebook,
    getNotebookVocabulary,
    updateNotebookPractice,
    
    // Exercises & Guides
    createExercise,
    createGuide,
    getExercises,
    getGuides,
    
    // Analytics
    getVocabularyStats,
    getNotebookStats,
    getLearningOverview,
    
    // Export
    exportVocabulary,
    exportNotebooks,
    
    // Utilities
    downloadBlob,
    handleApiError
};
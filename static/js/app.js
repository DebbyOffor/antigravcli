// State Management
let appState = {
    updates: [],
    filteredUpdates: [],
    selectedUpdateId: null,
    searchTerm: '',
    activeFilterType: 'all',
    lastRefreshed: null
};

// DOM Elements
const notesList = document.getElementById('notes-list');
const searchInput = document.getElementById('search-input');
const refreshBtn = document.getElementById('refresh-btn');
const typeFilterTags = document.getElementById('type-filter-tags');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const emptyState = document.getElementById('empty-state');
const errorMessage = document.getElementById('error-message');
const errorRetryBtn = document.getElementById('error-retry-btn');

const tweetTextarea = document.getElementById('tweet-text');
const charCounter = document.getElementById('char-counter');
const progressCircle = document.getElementById('progress-ring-circle');
const copyBtn = document.getElementById('copy-btn');
const tweetBtn = document.getElementById('tweet-btn');
const toast = document.getElementById('toast');
const hashtagsList = document.getElementById('hashtags-list');

const statTotalCount = document.getElementById('stat-total-count');
const lastRefreshedTime = document.getElementById('last-refreshed-time');

// Config
const MAX_TWEET_CHARS = 280;
const CIRCLE_CIRCUMFERENCE = 87.96; // 2 * pi * r (r=14)

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    setupEventListeners();
});

// Setup Events
function setupEventListeners() {
    // Refresh & Retry
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    errorRetryBtn.addEventListener('click', fetchReleaseNotes);

    // Search and Filter
    searchInput.addEventListener('input', (e) => {
        appState.searchTerm = e.target.value.toLowerCase().stripOrTrim();
        filterAndRenderUpdates();
    });

    // Tag Filter Buttons
    typeFilterTags.addEventListener('click', (e) => {
        const tag = e.target.closest('.filter-tag');
        if (!tag) return;

        // Toggle Active Class
        document.querySelectorAll('.filter-tag').forEach(btn => btn.classList.remove('active'));
        tag.classList.add('active');

        appState.activeFilterType = tag.dataset.type;
        filterAndRenderUpdates();
    });

    // Composer Characters Counter
    tweetTextarea.addEventListener('input', updateCharCounter);

    // Hashtags injection
    hashtagsList.addEventListener('click', (e) => {
        const btn = e.target.closest('.tag-btn');
        if (!btn) return;
        
        const hashtag = btn.dataset.tag;
        const currentText = tweetTextarea.value;
        
        // Add hashtag with proper spacing
        if (currentText.trim() === '') {
            tweetTextarea.value = hashtag;
        } else if (currentText.endsWith(' ') || currentText.endsWith('\n')) {
            tweetTextarea.value = currentText + hashtag;
        } else {
            tweetTextarea.value = currentText + ' ' + hashtag;
        }
        
        // Trigger input event to update counts
        updateCharCounter();
        tweetTextarea.focus();
    });

    // Clipboard Copy
    copyBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        if (!text.trim()) return;
        
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showToast('Failed to copy text', true);
        });
    });

    // Send to Twitter/X
    tweetBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        if (!text.trim()) return;

        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    });
}

// Helper: Trim/clean search inputs
String.prototype.stripOrTrim = function() {
    return this.trim().replace(/\s+/g, ' ');
};

// Fetch Notes from Flask API
async function fetchReleaseNotes() {
    // Show Loading
    setLoadingState(true);
    setErrorState(false);
    setEmptyState(false);

    try {
        const response = await fetch('/api/releases');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            appState.updates = data.updates;
            appState.lastRefreshed = new Date();
            
            // Render
            filterAndRenderUpdates();
            updateStats();
        } else {
            throw new Error(data.message || 'Unknown server error');
        }
    } catch (error) {
        console.error('Error fetching release notes:', error);
        errorMessage.textContent = error.message || 'Could not connect to the server.';
        setErrorState(true);
    } finally {
        setLoadingState(false);
    }
}

// Filter and Render UI
function filterAndRenderUpdates() {
    const { updates, searchTerm, activeFilterType } = appState;

    // Filter logic
    appState.filteredUpdates = updates.filter(update => {
        // Filter by Type
        const matchesType = activeFilterType === 'all' || update.type.toLowerCase() === activeFilterType.toLowerCase();
        
        // Filter by search query
        const matchesSearch = searchTerm === '' || 
            update.date.toLowerCase().includes(searchTerm) ||
            update.type.toLowerCase().includes(searchTerm) ||
            update.text.toLowerCase().includes(searchTerm);

        return matchesType && matchesSearch;
    });

    renderUpdatesList();
}

// Render the updates in the main notes list container
function renderUpdatesList() {
    notesList.innerHTML = '';
    const { filteredUpdates, selectedUpdateId } = appState;

    if (filteredUpdates.length === 0) {
        setEmptyState(true);
        return;
    } else {
        setEmptyState(false);
    }

    filteredUpdates.forEach(update => {
        const isSelected = update.id === selectedUpdateId;
        const card = document.createElement('article');
        card.className = `note-card glass ${isSelected ? 'selected' : ''}`;
        card.dataset.id = update.id;

        // Map types to badges
        const typeClass = `badge-${update.type.toLowerCase().replace(/\s+/g, '')}`;

        card.innerHTML = `
            <div class="note-header">
                <div class="note-type-date">
                    <span class="type-badge ${typeClass}">${update.type}</span>
                    <span class="note-date">${update.date}</span>
                </div>
            </div>
            <div class="note-body">
                ${update.html}
            </div>
            <div class="note-footer">
                <a href="${update.link}" target="_blank" class="btn btn-secondary btn-icon-only" title="View official release notes">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
                <button class="btn btn-primary select-tweet-btn">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Draft Tweet
                </button>
            </div>
        `;

        // Add event listener for selection
        card.querySelector('.select-tweet-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            selectUpdateForTweet(update);
        });

        notesList.appendChild(card);
    });
}

// Select update and populate composer
function selectUpdateForTweet(update) {
    appState.selectedUpdateId = update.id;
    
    // Highlight active card
    document.querySelectorAll('.note-card').forEach(card => {
        if (card.dataset.id === update.id) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });

    // Auto-generate tweet draft
    const draftText = generateTweetText(update);
    tweetTextarea.value = draftText;
    updateCharCounter();
    
    // Scroll composer into view if on mobile
    if (window.innerWidth <= 900) {
        document.querySelector('.sidebar').scrollIntoView({ behavior: 'smooth' });
    }
}

// Generate the initial tweet text draft
function generateTweetText(update) {
    const typeTag = update.type !== 'General' ? ` [${update.type}]` : '';
    const header = `BigQuery${typeTag} (${update.date}):\n`;
    const hashtags = `\n\n#BigQuery #GoogleCloud #DataEng`;
    
    // Compute remaining characters. URLs count as 23 characters on X.
    // Prefix: header text length
    // Link: 23 characters
    // Suffix: hashtags + spacer length
    const linkStr = `\n\nRead details: ${update.link}`;
    const fixedLength = header.length + 23 + hashtags.length + 14; // Approximate overhead characters
    
    const maxDescLength = MAX_TWEET_CHARS - fixedLength;
    
    let description = update.text;
    if (description.length > maxDescLength) {
        description = description.substring(0, maxDescLength - 4) + '...';
    }

    return `${header}${description}${linkStr}${hashtags}`;
}

// Update character counter and progress ring
function updateCharCounter() {
    const text = tweetTextarea.value;
    const length = calculateTwitterLength(text);
    const remaining = MAX_TWEET_CHARS - length;

    // Update Text Counter
    charCounter.textContent = remaining;

    // Visual indicators classes
    charCounter.classList.remove('warning', 'danger');
    if (remaining <= 40 && remaining > 0) {
        charCounter.classList.add('warning');
    } else if (remaining <= 0) {
        charCounter.classList.add('danger');
    }

    // Disable tweet button if empty or over limit
    tweetBtn.disabled = text.trim() === '' || remaining < 0;

    // Update Circular Progress
    const percentage = Math.min(length / MAX_TWEET_CHARS, 1);
    const strokeDashoffset = CIRCLE_CIRCUMFERENCE - (percentage * CIRCLE_CIRCUMFERENCE);
    progressCircle.style.strokeDashoffset = strokeDashoffset;

    // Change circle color based on character counts
    if (remaining <= 0) {
        progressCircle.style.stroke = '#f43f5e'; // red
    } else if (remaining <= 40) {
        progressCircle.style.stroke = '#f59e0b'; // orange
    } else {
        progressCircle.style.stroke = '#6366f1'; // indigo/violet
    }
}

// Compute accurate length as Twitter counts it (URLs count as 23 characters)
function calculateTwitterLength(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    let length = text.length;

    urls.forEach(url => {
        length = length - url.length + 23;
    });

    return length;
}

// Stats panel rendering
function updateStats() {
    statTotalCount.textContent = appState.updates.length;
    if (appState.lastRefreshed) {
        const timeStr = appState.lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        lastRefreshedTime.textContent = timeStr;
    }
}

// UI State Toggles
function setLoadingState(isLoading) {
    if (isLoading) {
        loadingState.classList.remove('hidden');
        refreshBtn.classList.add('loading');
        refreshBtn.disabled = true;
    } else {
        loadingState.classList.add('hidden');
        refreshBtn.classList.remove('loading');
        refreshBtn.disabled = false;
    }
}

function setErrorState(isError) {
    if (isError) {
        errorState.classList.remove('hidden');
        notesList.classList.add('hidden');
    } else {
        errorState.classList.add('hidden');
        notesList.classList.remove('hidden');
    }
}

function setEmptyState(isEmpty) {
    if (isEmpty) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }
}

// Show feedback toasts
function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.background = isError ? '#f43f5e' : '#10b981';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Modal Elements
const modal = document.getElementById('playerModal');
const modalContent = document.getElementById('modalContent');
const modalContentInner = document.getElementById('modalContentInner');
const loadingState = document.getElementById('loadingState');
const openBtn = document.getElementById('openModalBtn');
const closeBtn = document.getElementById('closeModalBtn');
const usernameInput = document.getElementById('usernameInput');
const btnText = document.getElementById('btnText');

// Comment Elements
const commentAuthorInput = document.getElementById('commentAuthor');
const commentInput = document.getElementById('commentInput');
const submitCommentBtn = document.getElementById('submitComment');
const commentsList = document.getElementById('commentsList');

// Player Elements
const playerName = document.getElementById('playerName');
const playerUUID = document.getElementById('playerUUID');
const playerSkin = document.getElementById('playerSkin');

// Chart and data
let performanceChart = null;
let currentPlayer = null;

// Fetch player UUID from Mojang API with CORS proxy fallback
async function fetchPlayerData(username) {
    try {
        // First try direct API call
        let response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
        
        // If direct call fails, try with CORS proxy
        if (!response.ok) {
            console.log('Direct API failed, trying CORS proxy...');
            response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.mojang.com/users/profiles/minecraft/${username}`)}`);
        }
        
        if (!response.ok) {
            throw new Error('Player not found');
        }
        
        const data = await response.json();
        return {
            name: data.name,
            uuid: data.id
        };
    } catch (error) {
        console.error('Error fetching player data:', error);
        
        // Fallback to demo data for testing
        
        throw error;
    }
}

// Alternative UUID fetching using different API
async function fetchPlayerDataAlternative(username) {
    try {
        // Try using minecraft-api.com as alternative
        const response = await fetch(`https://playerdb.co/api/player/minecraft/${username}`);
        
        if (!response.ok) {
            throw new Error('Player not found');
        }
        
        const data = await response.json();
        if (data.success && data.data && data.data.player) {
            return {
                name: data.data.player.username,
                uuid: data.data.player.id
            };
        }
        
        throw new Error('Invalid response format');
    } catch (error) {
        console.error('Alternative API error:', error);
        throw error;
    }
}

// Format UUID with dashes
function formatUUID(uuid) {
    // Remove any existing dashes first
    const cleanUUID = uuid.replace(/-/g, '');
    return cleanUUID.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

// Modal Controls
async function openModal() {
    const username = usernameInput.value.trim();
    
    if (!username) {
        alert('Please enter a Minecraft username');
        return;
    }
    
    // Disable button and show loading
    openBtn.disabled = true;
    btnText.textContent = 'Loading...';
    
    try {
        let playerData;
        
        // Try primary method first
        try {
            playerData = await fetchPlayerData(username);
        } catch (primaryError) {
            console.log('Primary method failed, trying alternative...');
            // Try alternative method
            try {
                playerData = await fetchPlayerDataAlternative(username);
            } catch (altError) {
                throw new Error('Could not fetch player data from any source');
            }
        }
        
        currentPlayer = playerData;
        
        // Open modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Show loading state
        loadingState.classList.remove('hidden');
        modalContentInner.style.display = 'none';
        
        // Update player info
        playerName.textContent = playerData.name;
        playerUUID.textContent = formatUUID(playerData.uuid);
        
        // Try multiple skin render services
        const skinUrls = [
            `https://render.crafty.gg/3d/bust/${playerData.uuid}`,
            `https://crafatar.com/renders/body/${playerData.uuid}`,
            `https://mc-heads.net/body/${playerData.uuid}/100`
        ];
        
        playerSkin.src = skinUrls[0];
        
        // Setup fallback for skin loading
        let skinIndex = 0;
        playerSkin.onerror = () => {
            skinIndex++;
            if (skinIndex < skinUrls.length) {
                playerSkin.src = skinUrls[skinIndex];
            }
        };
        
        // Wait for skin to load or timeout
        await new Promise((resolve) => {
            playerSkin.onload = resolve;
            // Timeout after 5 seconds
            setTimeout(resolve, 5000);
        });
        
        // Hide loading and show content
        setTimeout(() => {
            loadingState.classList.add('hidden');
            modalContentInner.style.display = 'block';
            
            // Initialize chart
            initChart();
            
            // Load comments for this player
            loadComments();
            
            // Animate modal content
            modalContent.style.animation = 'modalBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }, 500);
        
    } catch (error) {
        console.error('Failed to load player:', error);
        alert(`Failed to load player data for "${username}". This might be due to:\n\n1. Invalid username\n2. API rate limiting\n3. Network issues\n\nPlease try again or try a different username.`);
        modal.classList.remove('active');
    } finally {
        // Re-enable button
        openBtn.disabled = false;
        btnText.textContent = 'Open Player Card';
    }
}

function closeModal() {
    modal.classList.add('closing');
    document.body.style.overflow = '';
    
    setTimeout(() => {
        modal.classList.remove('active', 'closing');
        
        // Destroy chart to prevent memory leaks
        if (performanceChart) {
            performanceChart.destroy();
            performanceChart = null;
        }
        
        // Reset current player
        currentPlayer = null;
    }, 250);
}

// Event Listeners
openBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);

// Enter key on username input
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        openModal();
    }
});

// Close modal when clicking backdrop
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
});

// Initialize Performance Chart
function initChart() {
    const canvas = document.getElementById('performanceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Sample data points
    const data = [
        { month: 'Jan', rank: 45 },
        { month: 'Feb', rank: 38 },
        { month: 'Mar', rank: 32 },
        { month: 'Apr', rank: 28 },
        { month: 'May', rank: 22 },
        { month: 'Jun', rank: 19 }
    ];
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw simple line chart
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Calculate positions
    const padding = 40;
    const width = canvas.width - (padding * 2);
    const height = canvas.height - (padding * 2);
    const maxRank = Math.max(...data.map(d => d.rank));
    
    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
        const y = padding + (height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
    }
    
    // Draw chart line
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((point, index) => {
        const x = padding + (width / (data.length - 1)) * index;
        const y = padding + height - (height * (1 - point.rank / maxRank));
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        
        // Draw points
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.stroke();
    
    // Draw labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    data.forEach((point, index) => {
        const x = padding + (width / (data.length - 1)) * index;
        ctx.fillText(point.month, x, canvas.height - 10);
    });
}

// Comments Functionality with localStorage
function getCommentsKey() {
    return currentPlayer ? `comments_${currentPlayer.uuid}` : null;
}

function loadComments() {
    const key = getCommentsKey();
    if (!key) return;
    
    const savedComments = localStorage.getItem(key);
    const comments = savedComments ? JSON.parse(savedComments) : [];
    
    renderComments(comments);
}

function saveComments(comments) {
    const key = getCommentsKey();
    if (!key) return;
    
    localStorage.setItem(key, JSON.stringify(comments));
}

function renderComments(comments) {
    if (comments.length === 0) {
        commentsList.innerHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 py-8">
                <i class="fas fa-comments text-3xl mb-2"></i>
                <p>No comments yet. Be the first to comment!</p>
            </div>
        `;
        return;
    }
    
    commentsList.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-author">${escapeHtml(comment.author)}</span>
                <span class="comment-time">${formatTime(comment.timestamp)}</span>
            </div>
            <p class="comment-text">${escapeHtml(comment.text)}</p>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
        return 'just now';
    } else if (diff < 3600000) {
        return `${Math.floor(diff / 60000)} minutes ago`;
    } else if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)} hours ago`;
    } else if (diff < 604800000) {
        return `${Math.floor(diff / 86400000)} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

// Submit Comment
submitCommentBtn.addEventListener('click', () => {
    const author = commentAuthorInput.value.trim();
    const text = commentInput.value.trim();
    
    if (!author) {
        commentAuthorInput.focus();
        commentAuthorInput.style.borderColor = '#ef4444';
        setTimeout(() => {
            commentAuthorInput.style.borderColor = '';
        }, 2000);
        return;
    }
    
    if (!text) {
        commentInput.focus();
        commentInput.style.borderColor = '#ef4444';
        setTimeout(() => {
            commentInput.style.borderColor = '';
        }, 2000);
        return;
    }
    
    // Get existing comments
    const key = getCommentsKey();
    const savedComments = localStorage.getItem(key);
    const comments = savedComments ? JSON.parse(savedComments) : [];
    
    // Add new comment
    const newComment = {
        id: Date.now(),
        author: author,
        text: text,
        timestamp: new Date().toISOString()
    };
    
    comments.unshift(newComment);
    
    // Save and render
    saveComments(comments);
    renderComments(comments);
    
    // Clear inputs
    commentInput.value = '';
    
    // Success animation
    submitCommentBtn.style.transform = 'scale(0.95)';
    commentInput.style.borderColor = '#10b981';
    commentAuthorInput.style.borderColor = '#10b981';
    
    setTimeout(() => {
        submitCommentBtn.style.transform = '';
        commentInput.style.borderColor = '';
        commentAuthorInput.style.borderColor = '';
    }, 300);
});

// Dark mode detection
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
}

// Save author name for convenience
commentAuthorInput.addEventListener('blur', () => {
    const author = commentAuthorInput.value.trim();
    if (author) {
        localStorage.setItem('comment_author', author);
    }
});

// Load saved author name
window.addEventListener('load', () => {
    const savedAuthor = localStorage.getItem('comment_author');
    if (savedAuthor) {
        commentAuthorInput.value = savedAuthor;
    }
});

// Log to help debug
console.log('Player card script loaded. Try usernames like "Notch" or "shyxuu"');
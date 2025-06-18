document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURATION ---
    const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT22H5wwzzf6X_cvbJlFMNkIVUQRKBjoJ1uGyNC-v-53emu-qR85Oux8uUJ8BAsklwclbmv2y-PGUjY/pub?output=csv';

    // --- DOM ELEMENTS ---
    const gridContainer = document.getElementById('ranks-grid');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    // Modal Elements
    const modal = document.getElementById('playerModal');
    const modalContent = document.getElementById('modalContent');
    const modalContentInner = document.getElementById('modalContentInner');
    const loadingState = document.getElementById('loadingState');
    const closeModalBtn = document.getElementById('closeModalBtn');
    
    // Modal Content Elements
    const playerNameEl = document.getElementById('playerName');
    const playerUUIDEl = document.getElementById('playerUUID');
    const playerSkinEl = document.getElementById('playerSkin');
    const globalRankEl = document.getElementById('globalRank');
    const tierRankEl = document.getElementById('tierRank');

    // Comment Elements
    const commentAuthorInput = document.getElementById('commentAuthor');
    const commentInput = document.getElementById('commentInput');
    const submitCommentBtn = document.getElementById('submitCommentBtn');
    const commentsList = document.getElementById('commentsList');

    let currentPlayer = null;

    // --- DATA FETCHING & PROCESSING ---

    /**
     * Fetches, processes, and displays the ranks from the Google Sheet.
     */
    async function fetchAndDisplayRanks() {
        try {
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(GOOGLE_SHEET_URL)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`Network error: ${response.statusText}`);

            const csvText = await response.text();
            const rawRanks = parseCSV(csvText);
            const processedRanks = processRanks(rawRanks);
            
            displayRanks(processedRanks);
            setupEventListeners();

        } catch (error) {
            console.error("Failed to load ranks:", error);
            gridContainer.innerHTML = `<p class="text-red-400 text-center col-span-full">Error: Could not load data. Please check the Google Sheet URL and its sharing settings.</p>`;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    /**
     * Parses raw CSV text into a structured object.
     * @param {string} csvText - The raw CSV content.
     * @returns {object} - Tiers as keys, array of player names as values.
     */
    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const ranks = {};
        headers.forEach(header => ranks[header] = []);

        for (let i = 1; i < lines.length; i++) {
            const cells = lines[i].split(',').map(c => c.trim());
            cells.forEach((cell, index) => {
                if (cell) {
                    ranks[headers[index]].push(cell);
                }
            });
        }
        return ranks;
    }

    /**
     * Processes raw rank data to calculate global and tier-specific ranks.
     * @param {object} rawRanks - The object from parseCSV.
     * @returns {object} - A structured object with player details including ranks.
     */
    function processRanks(rawRanks) {
        const processedData = {};
        let globalRankCounter = 1;

        const sortedTiers = Object.keys(rawRanks).sort((a, b) => {
            const numA = parseInt(a.match(/\d+/) || 0);
            const numB = parseInt(b.match(/\d+/) || 0);
            return numA - numB;
        });

        for (const tierName of sortedTiers) {
            processedData[tierName] = rawRanks[tierName].map((playerName, index) => {
                const isSpecial = playerName.startsWith('*') && playerName.endsWith('*');
                const cleanName = isSpecial ? playerName.slice(1, -1) : playerName;
                
                const playerObject = {
                    originalName: playerName,
                    cleanName: cleanName,
                    isSpecial: isSpecial,
                    tierRank: index + 1,
                    globalRank: globalRankCounter,
                };
                globalRankCounter++;
                return playerObject;
            });
        }
        return processedData;
    }

    /**
     * Renders the processed rank data into the DOM.
     * @param {object} ranksData - The fully processed data with ranks.
     */
    function displayRanks(ranksData) {
        gridContainer.innerHTML = ''; 
        
        const tierIcons = {
            "Tier 1": '<i class="fa-sharp-duotone fa-solid fa-trophy-star" style="--fa-primary-color: #2bbfca; --fa-secondary-color: #007bff;"></i>',
            "Tier 2": '<i class="fa-sharp-duotone fa-solid fa-trophy" style="--fa-primary-color: #2bca68; --fa-secondary-color: #00ffbf;"></i>',
            "Tier 3": '<i class="fa-sharp-duotone fa-solid fa-trophy" style="--fa-primary-color: #cabd2b; --fa-secondary-color: #eeff00;"></i>',
            "Tier 4": '<i class="fa-sharp-duotone fa-solid fa-trophy" style="--fa-primary-color: #ca2b2b; --fa-secondary-color: #ff0000;"></i>',
            "Tier 5": '<i class="fa-sharp-duotone fa-solid fa-trophy" style="--fa-primary-color: #c2c2c2; --fa-secondary-color: #ffffff;"></i>'
        };
        
        for (const tierName in ranksData) {
            const players = ranksData[tierName];
            
            const tierColumn = document.createElement('div');
            tierColumn.className = 'bg-gray-800 rounded-lg p-4 shadow-lg flex flex-col w-[200px]';

            const iconHTML = tierIcons[tierName] || '<i class="fa-solid fa-circle"></i>';
            
            const playerListHTML = players.map(player => {
                const bgClass = player.isSpecial ? 'bg-emerald-700' : 'bg-emerald-900';
                return `
                    <li class="player-item cursor-pointer text-white ${bgClass} border border-black/50 p-2 hover:translate-x-2 transition-transform duration-200 ease-in-out rounded-md flex items-center justify-start"
                        data-username="${player.cleanName}"
                        data-global-rank="${player.globalRank}"
                        data-tier-rank="${player.tierRank}"
                        data-tier-name="${tierName}">
                        <span class="font-semibold">#${player.tierRank}</span>
                        <span class="ml-2">${player.cleanName}</span>
                        <img class="mx-[5px] flex justify-self-end ml-auto" src="https://mc-heads.net/avatar/${player.cleanName}/25"></img>
                    </li>
                    
                `;
            }).join('');

            tierColumn.innerHTML = `
                <h2 class="text-xl font-semibold border-b border-gray-700 pb-3 mb-4 flex items-center gap-3">
                    ${iconHTML} ${tierName}
                </h2>
                <ul class="space-y-2">
                    ${playerListHTML || '<li class="text-gray-500 italic">No players in this tier.</li>'}
                </ul>
`;
            gridContainer.appendChild(tierColumn);
        }
    }


    // --- MODAL LOGIC ---

    /**
     * Opens the modal and initiates fetching of player-specific data.
     * @param {object} playerData - Contains username, globalRank, tierRank.
     */
    async function openModal(playerData) {
        currentPlayer = null; // Reset current player
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Show loading state and pre-fill known data
        loadingState.classList.remove('hidden');
        modalContentInner.classList.add('hidden');
        globalRankEl.textContent = `#${playerData.globalRank}`;
        tierRankEl.textContent = `#${playerData.tierRank} (${playerData.tierName})`;
        playerNameEl.textContent = playerData.username;
        playerUUIDEl.textContent = 'Loading...';
        playerSkinEl.src = ''; // Clear previous skin

        try {
            const mojangData = await fetchPlayerData(playerData.username);
            currentPlayer = mojangData; // Set current player for comments
            
            // Update modal with fetched data
            playerNameEl.textContent = mojangData.name;
            playerUUIDEl.textContent = formatUUID(mojangData.uuid);
            
            const skinUrl = `https://render.crafty.gg/3d/bust/${mojangData.uuid}`;
            playerSkinEl.src = skinUrl;
            playerSkinEl.onerror = () => {
                // Fallback if crafatar fails
                playerSkinEl.src = `https://crafatar.com/renders/body/${mojangData.uuid}?overlay`;
            };

            loadComments();

        } catch (error) {
            console.error("Failed to load player details:", error);
            playerUUIDEl.textContent = 'Player not found';
        } finally {
            // Reveal content
            loadingState.classList.add('hidden');
            modalContentInner.classList.remove('hidden');
        }
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        currentPlayer = null;
    }

    /**
     * Fetches player UUID and name from Mojang API.
     * @param {string} username - The Minecraft username.
     * @returns {Promise<object>} - A promise resolving to { name, uuid }.
     */
    async function fetchPlayerData(username) {
        try {
            const url = `https://api.mojang.com/users/profiles/minecraft/${username}`;
            // Using a proxy to bypass CORS issues
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error('Player not found or API error');
            }
            const data = await response.json();
            return { name: data.name, uuid: data.id };
        } catch (error) {
            console.warn("Mojang API failed, trying fallback. Error:", error);
            // Fallback for demonstration if main API fails
            return { name: username, uuid: "00000000-0000-0000-0000-000000000000" };
        }
    }

    /**
     * Formats a UUID string by adding dashes.
     * @param {string} uuid - The UUID without dashes.
     * @returns {string} The formatted UUID.
     */
    function formatUUID(uuid) {
        if (!uuid || uuid.length !== 32) return uuid;
        return uuid.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
    }

    
    // --- COMMENTS LOGIC (localStorage-based) ---

    function getCommentsKey() {
        return currentPlayer ? `comments_${currentPlayer.uuid}` : null;
    }

    function loadComments() {
        const key = getCommentsKey();
        if (!key) {
            commentsList.innerHTML = `<p class="text-gray-500 text-center">Could not load comments.</p>`;
            return;
        }
        
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
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-comments text-3xl mb-2"></i>
                    <p>No comments yet. Be the first!</p>
                </div>`;
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

    submitCommentBtn.addEventListener('click', () => {
        if (!currentPlayer) {
            alert("Cannot post comment: current player data is not loaded.");
            return;
        }
        const author = commentAuthorInput.value.trim();
        const text = commentInput.value.trim();

        if (!author || !text) {
            alert("Please provide both your name and a comment.");
            return;
        }

        const key = getCommentsKey();
        const savedComments = localStorage.getItem(key);
        const comments = savedComments ? JSON.parse(savedComments) : [];

        const newComment = {
            author: author,
            text: text,
            timestamp: new Date().toISOString()
        };
        
        comments.unshift(newComment);
        saveComments(comments);
        renderComments(comments);
        
        commentInput.value = ''; // Clear comment text
        commentInput.focus();
    });

    // Helper functions for comments
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }


    // --- EVENT LISTENERS ---

    function setupEventListeners() {
        // Event delegation for opening the modal
        gridContainer.addEventListener('click', (e) => {
            const playerItem = e.target.closest('.player-item');
            if (playerItem) {
                const playerData = {
                    username: playerItem.dataset.username,
                    globalRank: playerItem.dataset.globalRank,
                    tierRank: playerItem.dataset.tierRank,
                    tierName: playerItem.dataset.tierName
                };
                openModal(playerData);
            }
        });
        
        // Modal closing events
        closeModalBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });

        // Load saved author name for convenience
        const savedAuthor = localStorage.getItem('comment_author');
        if (savedAuthor) {
            commentAuthorInput.value = savedAuthor;
        }
        commentAuthorInput.addEventListener('blur', () => {
            localStorage.setItem('comment_author', commentAuthorInput.value.trim());
        });
    }

    // --- INITIALIZATION ---
    fetchAndDisplayRanks();
});

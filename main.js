// Pixel Palace Main JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle Logic
    const hamburger = document.querySelector('.hamburger-menu');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const body = document.body;

    function toggleMenu() {
        const isOpening = !sidebar.classList.contains('open');
        sidebar.classList.toggle('open');
        if (hamburger) hamburger.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
        
        if (isOpening) {
            body.classList.add('menu-open');
            if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
        } else {
            body.classList.remove('menu-open');
            if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
        }
    }

    function closeMenu() {
        if (sidebar) sidebar.classList.remove('open');
        if (hamburger) hamburger.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        body.classList.remove('menu-open');
        if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    }

    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
    }
    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }

    // Close menu when clicking a nav link
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
            closeMenu();
        }
    });

    // Global Search & Filter Logic
    const searchInput = document.getElementById('game-search');
    
    function filterGames() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const activeFilterBtn = document.querySelector('.filter-btn.active');
        const activeFilter = activeFilterBtn ? (activeFilterBtn.dataset.filter || 'all').toLowerCase().trim() : 'all';
        
        const games = document.querySelectorAll('.game-card');
        
        games.forEach(game => {
            // Do not filter out dynamically inserted recently played items
            if (game.closest('#recently-played-section')) return;

            const title = game.querySelector('h3, .game-title')?.textContent.toLowerCase() || '';
            const desc = game.querySelector('.description, .game-description, p')?.textContent.toLowerCase() || '';
            const gameCat = (game.dataset.category || '').toLowerCase().trim();
            const categoryTokens = gameCat ? gameCat.split(/\s+/) : [];

            // Match Search
            const matchesSearch = !searchTerm || title.includes(searchTerm) || desc.includes(searchTerm);
            
            // Match Category Filter
            let matchesFilter = false;
            if (activeFilter === 'all') {
                matchesFilter = true;
            } else if (categoryTokens.includes(activeFilter)) {
                matchesFilter = true;
            } else {
                // Fallback smart keyword matching
                if (activeFilter === 'action' && (title.includes('smash') || title.includes('flight') || title.includes('rescue') || title.includes('blaster') || title.includes('sprint') || title.includes('chase') || title.includes('slither') || title.includes('typing') || title.includes('scripted') || title.includes('arcade'))) {
                    matchesFilter = true;
                } else if (activeFilter === 'puzzle' && (title.includes('2048') || title.includes('memory') || title.includes('reflex') || title.includes('mystery') || title.includes('puzzle') || title.includes('simon') || title.includes('sudoku') || title.includes('word') || title.includes('math') || title.includes('quiz') || title.includes('brain') || title.includes('match'))) {
                    matchesFilter = true;
                } else if (activeFilter === 'classic' && (title.includes('chess') || title.includes('blackjack') || title.includes('tic-tac') || title.includes('dice') || title.includes('bingo') || title.includes('rps') || title.includes('classic') || title.includes('counter') || title.includes('pokedex') || title.includes('gitlab'))) {
                    matchesFilter = true;
                }
            }

            if (matchesSearch && matchesFilter) {
                game.classList.remove('hidden-card');
                game.style.removeProperty('display');
            } else {
                game.classList.add('hidden-card');
                game.style.setProperty('display', 'none', 'important');
            }
        });

        // Hide/Show empty sections
        const sections = document.querySelectorAll('.category-section, .game-section');
        sections.forEach(section => {
            if (section.id === 'recently-played-section') return;
            
            if (activeFilter === 'all' && !searchTerm) {
                section.classList.remove('hidden-section');
                section.style.removeProperty('display');
            } else {
                const visibleCards = section.querySelectorAll('.game-card:not(.hidden-card)');
                if (visibleCards.length > 0) {
                    section.classList.remove('hidden-section');
                    section.style.removeProperty('display');
                } else {
                    section.classList.add('hidden-section');
                    section.style.setProperty('display', 'none', 'important');
                }
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterGames);
    }
    
    // Attach event listeners directly to filter buttons AND document click delegation
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterGames();
        });
    });

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (btn) {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterGames();
        }
    });

    // Run filter initially on page load
    filterGames();

    // Recently Played History Logic
    function saveRecentGame(title, url, iconHtml) {
        if (!title || !url) return;
        
        let recentGames = JSON.parse(localStorage.getItem('pixelPalaceRecents')) || [];
        recentGames = recentGames.filter(g => g.title !== title);
        recentGames.unshift({ title, url, iconHtml });
        
        if (recentGames.length > 4) recentGames.pop();
        localStorage.setItem('pixelPalaceRecents', JSON.stringify(recentGames));
    }

    function loadRecentGames() {
        const recentContainer = document.getElementById('recent-games-grid');
        const recentSection = document.getElementById('recently-played-section');
        
        if (!recentContainer || !recentSection) return;
        
        const recentGames = JSON.parse(localStorage.getItem('pixelPalaceRecents')) || [];
        
        if (recentGames.length === 0) {
            recentSection.style.display = 'none';
            return;
        }
        
        recentSection.style.display = 'block';
        recentContainer.innerHTML = '';
        
        recentGames.forEach(game => {
            const article = document.createElement('article');
            article.className = 'game-card';
            article.innerHTML = `
                <a href="${game.url}">
                    <div class="image-container">
                        ${game.iconHtml}
                    </div>
                    <div class="card-content">
                        <h3>${game.title}</h3>
                        <span class="play-button">Play Again</span>
                    </div>
                </a>
            `;
            recentContainer.appendChild(article);
        });
    }

    // Attach listeners to all game links to save history
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.game-card');
        if (card && !e.target.closest('.filter-btn')) {
            const link = card.querySelector('a');
            const title = card.querySelector('h3, .game-title')?.textContent;
            const iconContainer = card.querySelector('.image-container');
            const iconHtml = iconContainer ? iconContainer.innerHTML : '';
            const url = link ? link.getAttribute('href') : '';

            if (title && url && !url.startsWith('#')) {
                saveRecentGame(title, url, iconHtml);
            }
        }
    });

    // Load recents on page load
    loadRecentGames();

    // Leaderboard UI Modal Logic
    const leaderboardModal = document.getElementById('leaderboard-modal');
    const closeLeaderboard = document.querySelector('.close-modal');
    
    document.querySelectorAll('.trophy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const gameId = btn.dataset.game;
            const card = btn.closest('.game-card');
            const gameTitle = card ? card.querySelector('h3, .game-title').textContent : 'Leaderboard';
            
            showLeaderboard(gameId, gameTitle);
        });
    });
    
    function showLeaderboard(gameId, title) {
        if (!leaderboardModal) return;
        const modalTitle = leaderboardModal.querySelector('.modal-title');
        const scoresContainer = leaderboardModal.querySelector('.scores-list');
        
        if (modalTitle) modalTitle.textContent = `${title} - Top Scores`;
        
        if (scoresContainer) {
            scoresContainer.innerHTML = `
                <table class="leaderboard-table" style="width:100%; border-collapse:collapse; margin-top:15px;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--secondary-color); color: var(--accent-color);">
                            <th style="padding:8px; text-align:left;">Rank</th>
                            <th style="padding:8px; text-align:left;">Player</th>
                            <th style="padding:8px; text-align:right;">Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid rgba(0,255,255,0.2);">
                            <td style="padding:8px;">🥇 1st</td>
                            <td style="padding:8px;">CyberKing</td>
                            <td style="padding:8px; text-align:right; font-weight:bold; color:var(--secondary-color);">9,850</td>
                        </tr>
                        <tr style="border-bottom: 1px solid rgba(0,255,255,0.2);">
                            <td style="padding:8px;">🥈 2nd</td>
                            <td style="padding:8px;">PixelPro</td>
                            <td style="padding:8px; text-align:right; font-weight:bold; color:var(--secondary-color);">8,420</td>
                        </tr>
                        <tr>
                            <td style="padding:8px;">🥉 3rd</td>
                            <td style="padding:8px;">RetroGamer</td>
                            <td style="padding:8px; text-align:right; font-weight:bold; color:var(--secondary-color);">7,110</td>
                        </tr>
                    </tbody>
                </table>
            `;
        }
        
        leaderboardModal.classList.add('active');
        leaderboardModal.style.display = 'flex';
    }

    if (closeLeaderboard) {
        closeLeaderboard.addEventListener('click', () => {
            if (leaderboardModal) {
                leaderboardModal.classList.remove('active');
                leaderboardModal.style.display = 'none';
            }
        });
    }

    window.addEventListener('click', (e) => {
        if (leaderboardModal && e.target === leaderboardModal) {
            leaderboardModal.classList.remove('active');
            leaderboardModal.style.display = 'none';
        }
    });
});

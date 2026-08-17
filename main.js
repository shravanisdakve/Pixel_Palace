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
    var leaderboardModal = document.getElementById('leaderboard-modal');
    
    // Dynamically create leaderboard modal if it doesn't exist in the HTML
    if (!leaderboardModal) {
        leaderboardModal = document.createElement('div');
        leaderboardModal.id = 'leaderboard-modal';
        leaderboardModal.className = 'modal';
        leaderboardModal.style.display = 'none';
        leaderboardModal.innerHTML = '<div class="modal-content"><span class="close-modal close-button">&times;</span><h2 class="modal-title">Leaderboard</h2><div class="scores-list"></div></div>';
        document.body.appendChild(leaderboardModal);
    }
    
    var closeLeaderboard = leaderboardModal.querySelector('.close-modal');
    
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
        
        if (modalTitle) modalTitle.textContent = `${title} - Your Scores`;
        
        if (scoresContainer) {
            // Use real PixelPalace data instead of fake hardcoded data
            let html = '';
            
            if (typeof window.PixelPalace !== 'undefined') {
                // Personal Best
                var pb = window.PixelPalace.getPersonalBest(gameId);
                if (pb) {
                    html += '<div style="margin-bottom:15px; padding:12px; border:1px solid var(--secondary-color); border-radius:6px; background:rgba(0,255,255,0.05);">';
                    html += '<div style="color:var(--accent-color); font-size:11px; margin-bottom:6px;">PERSONAL BEST</div>';
                    html += '<div style="font-size:18px; font-weight:bold; color:var(--secondary-color);">' + pb.score + '</div>';
                    html += '<div style="font-size:9px; color:#888; margin-top:4px;">Achieved ' + new Date(pb.achievedAt).toLocaleDateString() + '</div>';
                    html += '</div>';
                }

                // Recent Scores
                var scores = window.PixelPalace.getScores(gameId);
                if (scores && scores.length > 0) {
                    // Sort by score descending (higher is better for most games)
                    var game = window.PixelPalace.getGame(gameId);
                    var sorted = scores.slice().sort(function(a, b) {
                        if (game && game.scoreDirection === 'lower') {
                            return a.score - b.score;
                        }
                        return b.score - a.score;
                    });
                    
                    html += '<div style="color:var(--accent-color); font-size:11px; margin-bottom:8px;">RECENT SCORES</div>';
                    html += '<table class="leaderboard-table" style="width:100%; border-collapse:collapse;">';
                    html += '<thead><tr style="border-bottom:2px solid var(--secondary-color); color:var(--accent-color);">';
                    html += '<th style="padding:6px; text-align:left; font-size:10px;">#</th>';
                    html += '<th style="padding:6px; text-align:right; font-size:10px;">Score</th>';
                    html += '<th style="padding:6px; text-align:right; font-size:10px;">Date</th>';
                    html += '</tr></thead><tbody>';
                    
                    var displayScores = sorted.slice(0, 10);
                    for (var i = 0; i < displayScores.length; i++) {
                        var s = displayScores[i];
                        var dateStr = '';
                        try {
                            dateStr = new Date(s.achievedAt).toLocaleDateString();
                        } catch (e) {}
                        var medals = ['🥇', '🥈', '🥉'];
                        var rank = i < 3 ? medals[i] : (i + 1);
                        html += '<tr style="border-bottom:1px solid rgba(0,255,255,0.15);">';
                        html += '<td style="padding:6px; font-size:11px;">' + rank + '</td>';
                        html += '<td style="padding:6px; text-align:right; font-weight:bold; color:var(--secondary-color); font-size:12px;">' + s.score + '</td>';
                        html += '<td style="padding:6px; text-align:right; color:#888; font-size:10px;">' + dateStr + '</td>';
                        html += '</tr>';
                    }
                    html += '</tbody></table>';
                } else if (!pb) {
                    html += '<div style="text-align:center; padding:20px; color:#888; font-size:11px;">';
                    html += 'No scores recorded yet.<br>Play this game to set a record!';
                    html += '</div>';
                }
            } else {
                html += '<div style="text-align:center; padding:20px; color:#888; font-size:11px;">';
                html += 'Score system unavailable.';
                html += '</div>';
            }
            
            scoresContainer.innerHTML = html;
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

    // Also close leaderboard on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && leaderboardModal && leaderboardModal.style.display === 'flex') {
            leaderboardModal.classList.remove('active');
            leaderboardModal.style.display = 'none';
        }
    });
});

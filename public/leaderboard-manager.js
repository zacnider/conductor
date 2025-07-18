class LeaderboardManager {
    constructor() {
        this.leaderboardData = [];
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.createLeaderboardHTML();
        this.bindEvents();
        this.startAutoRefresh();
        this.loadLeaderboard();
    }

    createLeaderboardHTML() {
        const existingLeaderboard = document.querySelector('.leaderboard-panel');
        if (existingLeaderboard) {
            existingLeaderboard.remove();
        }

        const leaderboardHTML = `
            <div class="leaderboard-panel">
                <div class="panel-header">
                    <h3>🏆 Global Leaderboard</h3>
                    <button class="refresh-btn" id="refresh-leaderboard">
                        🔄 Yenile
                    </button>
                </div>
                <div class="leaderboard-content">
                    <div class="leaderboard-list" id="leaderboard-list">
                        <div class="loading-message">Liderlik tablosu yükleniyor...</div>
                    </div>
                </div>
            </div>
        `;

        // Game layout'un sonuna ekle
        const gameLayout = document.querySelector('.game-layout');
        if (gameLayout) {
            gameLayout.insertAdjacentHTML('afterend', leaderboardHTML);
        } else {
            // Fallback: body'nin sonuna ekle
            document.body.insertAdjacentHTML('beforeend', leaderboardHTML);
        }
    }

    bindEvents() {
        const refreshBtn = document.getElementById('refresh-leaderboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshLeaderboard();
            });
        }
    }

    startAutoRefresh() {
        // Her 30 saniyede bir otomatik yenile
        this.refreshInterval = setInterval(() => {
            this.loadLeaderboard();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async loadLeaderboard() {
        try {
            // Blockchain'den veya local storage'dan oyuncu verilerini al
            const players = this.getPlayersData();
            this.leaderboardData = this.processLeaderboardData(players);
            this.renderLeaderboard();
        } catch (error) {
            console.error('Leaderboard yüklenirken hata:', error);
            this.showError('Liderlik tablosu yüklenemedi');
        }
    }

    getPlayersData() {
        // Local storage'dan oyuncu verilerini al
        const savedPlayers = localStorage.getItem('chaosPlayers');
        let players = savedPlayers ? JSON.parse(savedPlayers) : [];

        // Aktif oyuncuları da ekle
        const activeRooms = JSON.parse(localStorage.getItem('chaosRooms') || '[]');
        activeRooms.forEach(room => {
            if (room.players) {
                room.players.forEach(player => {
                    const existingPlayer = players.find(p => p.address === player.address);
                    if (!existingPlayer) {
                        players.push({
                            address: player.address,
                            name: player.name || `Player ${player.address.slice(0, 6)}...`,
                            totalScore: player.score || 0,
                            gamesPlayed: 1,
                            wins: 0,
                            lastActive: Date.now()
                        });
                    } else {
                        // Mevcut oyuncuyu güncelle
                        existingPlayer.totalScore = Math.max(existingPlayer.totalScore, player.score || 0);
                        existingPlayer.lastActive = Date.now();
                    }
                });
            }
        });

        return players;
    }

    processLeaderboardData(players) {
        // Oyuncuları puana göre sırala
        return players
            .filter(player => player.totalScore > 0) // Sadece puan alan oyuncular
            .sort((a, b) => {
                // Önce toplam puana göre sırala
                if (b.totalScore !== a.totalScore) {
                    return b.totalScore - a.totalScore;
                }
                // Eşit puanda kazanma sayısına göre
                if (b.wins !== a.wins) {
                    return b.wins - a.wins;
                }
                // Son olarak oyun sayısına göre (az oynayan üstte)
                return a.gamesPlayed - b.gamesPlayed;
            })
            .slice(0, 50); // En iyi 50 oyuncu
    }

    renderLeaderboard() {
        const leaderboardList = document.getElementById('leaderboard-list');
        if (!leaderboardList) return;

        if (this.leaderboardData.length === 0) {
            leaderboardList.innerHTML = `
                <div class="no-data-message">
                    <p>🎮 Henüz liderlik tablosunda oyuncu yok</p>
                    <p>İlk oyunu oynayarak liderlik tablosuna gir!</p>
                </div>
            `;
            return;
        }

        const leaderboardHTML = this.leaderboardData.map((player, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
            
            return `
                <div class="leaderboard-item ${isTop3 ? 'top-3' : ''}">
                    <div class="leaderboard-rank ${rankClass}">
                        ${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                    </div>
                    <div class="leaderboard-name" title="${player.address}">
                        ${player.name}
                    </div>
                    <div class="leaderboard-score">
                        ${player.totalScore.toLocaleString()} CP
                    </div>
                </div>
            `;
        }).join('');

        leaderboardList.innerHTML = leaderboardHTML;
    }

    refreshLeaderboard() {
        const refreshBtn = document.getElementById('refresh-leaderboard');
        if (refreshBtn) {
            refreshBtn.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                refreshBtn.style.transform = '';
            }, 500);
        }

        this.loadLeaderboard();
    }

    showError(message) {
        const leaderboardList = document.getElementById('leaderboard-list');
        if (leaderboardList) {
            leaderboardList.innerHTML = `
                <div class="error-message">
                    <p>❌ ${message}</p>
                    <button onclick="leaderboardManager.refreshLeaderboard()" class="retry-btn">
                        Tekrar Dene
                    </button>
                </div>
            `;
        }
    }

    updatePlayerScore(playerAddress, newScore, gameResult = null) {
        // Oyuncu puanını güncelle
        let players = this.getPlayersData();
        let player = players.find(p => p.address === playerAddress);
        
        if (!player) {
            player = {
                address: playerAddress,
                name: `Player ${playerAddress.slice(0, 6)}...`,
                totalScore: 0,
                gamesPlayed: 0,
                wins: 0,
                lastActive: Date.now()
            };
            players.push(player);
        }

        // Puanı güncelle
        player.totalScore += newScore;
        player.gamesPlayed += 1;
        player.lastActive = Date.now();

        if (gameResult === 'win') {
            player.wins += 1;
        }

        // Local storage'a kaydet
        localStorage.setItem('chaosPlayers', JSON.stringify(players));
        
        // Leaderboard'u yenile
        this.loadLeaderboard();
    }

    getPlayerRank(playerAddress) {
        const playerIndex = this.leaderboardData.findIndex(p => p.address === playerAddress);
        return playerIndex >= 0 ? playerIndex + 1 : null;
    }

    destroy() {
        this.stopAutoRefresh();
        const leaderboardPanel = document.querySelector('.leaderboard-panel');
        if (leaderboardPanel) {
            leaderboardPanel.remove();
        }
    }
}

// Global leaderboard manager instance
let leaderboardManager = null;

// Sayfa yüklendiğinde leaderboard'u başlat
document.addEventListener('DOMContentLoaded', () => {
    if (!leaderboardManager) {
        leaderboardManager = new LeaderboardManager();
    }
});

// Sayfa kapatılırken temizle
window.addEventListener('beforeunload', () => {
    if (leaderboardManager) {
        leaderboardManager.destroy();
    }
});
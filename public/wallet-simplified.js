// Simplified Wallet Integration for Chaos Conductor
// Works with Multisynq + Simplified Blockchain

let currentWalletAddress = null;
let currentUsername = null;

// Global değişkenler
window.userAddress = null;
window.userName = null;

// Multisynq session management
window.chaosSession = null;
window.chaosView = null;

// Legacy function - now handled by new integration system
async function joinMultisynqRoom(roomCode = "chaos-main", password = "chaos2025") {
    console.log("Legacy joinMultisynqRoom called - using new integration system");
    return null;
}
// Initialize wallet integration when script loads
function initializeWalletIntegration() {
    console.log('Initializing wallet integration...');
    
    // Connect wallet button handlers
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const connectWalletMainBtn = document.getElementById('connectWalletMainBtn');
    
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', handleWalletConnect);
        console.log('Connect wallet button handler attached');
    }
    
    if (connectWalletMainBtn) {
        connectWalletMainBtn.addEventListener('click', handleWalletConnect);
        console.log('Connect wallet main button handler attached');
    }
    
    // User registration handler
    const registerUserBtn = document.getElementById('registerUserBtn');
    if (registerUserBtn) {
        registerUserBtn.addEventListener('click', handleUserRegistration);
    }
    
    // Game controls
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            if (window.chaosView) {
                window.chaosView.startGame("mini-game");
            }
        });
    }
    
    // Setup wallet event listeners
    setupWalletEventListeners();
}

// Enhanced wallet event listeners
function setupWalletEventListeners() {
    // Wallet connected event
    window.addEventListener('wallet-connected', (event) => {
        console.log('Wallet connected event:', event.detail);
        updateWalletUI(event.detail.address);
        checkUserRegistration(event.detail.address);
    });
    
    // Wallet disconnected event
    window.addEventListener('wallet-disconnected', (event) => {
        console.log('Wallet disconnected event');
        handleWalletDisconnected();
    });
    
    // Account changed event
    window.addEventListener('wallet-accountChanged', (event) => {
        console.log('Account changed event:', event.detail);
        currentWalletAddress = event.detail.newAddress;
        updateWalletUI(event.detail.newAddress);
        checkUserRegistration(event.detail.newAddress);
    });
    
    // Network changed event
    window.addEventListener('wallet-networkChanged', (event) => {
        console.log('Network changed event:', event.detail);
        showNetworkChangeNotification();
    });
}

// Handle wallet disconnection
function handleWalletDisconnected() {
    currentWalletAddress = null;
    currentUsername = null;
    window.userAddress = null; // Global değişkenleri temizle
    window.userName = null;
    
    // Reset UI to initial state
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const walletInfo = document.getElementById('walletInfo');
    const walletPrompt = document.getElementById('walletPrompt');
    const userRegistration = document.getElementById('userRegistration');
    const gameReady = document.getElementById('gameReady');
    
    if (connectWalletBtn) {
        connectWalletBtn.style.display = 'block';
        connectWalletBtn.textContent = '🔗 Connect Wallet';
    }
    
    if (walletInfo) walletInfo.style.display = 'none';
    if (walletPrompt) walletPrompt.style.display = 'block';
    if (userRegistration) userRegistration.style.display = 'none';
    if (gameReady) gameReady.style.display = 'none';
    
    // Disconnect from Multisynq if connected
    if (window.chaosMultisynq) {
        window.chaosMultisynq.disconnect();
    }
    
    showNotification('Cüzdan bağlantısı kesildi', 'info');
}

// Show network change notification
function showNetworkChangeNotification() {
    showNotification('Ağ değişti, sayfa yeniden yüklenecek...', 'warning');
}

// Enhanced notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : type === 'warning' ? '#ffaa44' : '#4444ff'};
        color: white;
        border-radius: 8px;
        z-index: 1000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 4000);
}

// Initialize immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWalletIntegration);
} else {
    initializeWalletIntegration();
}

async function handleWalletConnect() {
    console.log('Wallet connect clicked');
    
    try {
        // Check for ethereum provider with better error handling
        if (typeof window.ethereum === 'undefined') {
            alert('Please install MetaMask to connect your wallet!');
            return;
        }
        
        // Handle multiple wallet providers to avoid conflicts
        let provider = window.ethereum;
        if (window.ethereum.providers && window.ethereum.providers.length > 0) {
            // If multiple providers, try to find MetaMask
            provider = window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum.providers[0];
            console.log('Multiple providers detected, using:', provider.isMetaMask ? 'MetaMask' : 'First available');
        }
        
        // Show loading state
        const connectBtn = document.getElementById('connectWalletBtn');
        if (connectBtn) {
            connectBtn.disabled = true;
            connectBtn.textContent = 'Connecting...';
        }
        
        // Initialize blockchain manager
        if (!window.blockchainManager) {
            alert('Blockchain manager not loaded. Please refresh the page.');
            return;
        }
        
        if (!window.blockchainManager.isConnected) {
            const result = await window.blockchainManager.connectWallet();
            if (!result.success) {
                alert('Failed to connect wallet: ' + result.error);
                return;
            }
            
            // Update UI
            updateWalletUI(result.address);
            
            // Check if user is registered
            await checkUserRegistration(result.address);
        }
        
    } catch (error) {
        console.error('Wallet connection error:', error);
        alert('Failed to connect wallet: ' + error.message);
    } finally {
        // Reset button state
        const connectBtn = document.getElementById('connectWalletBtn');
        if (connectBtn) {
            connectBtn.disabled = false;
            connectBtn.textContent = '🔗 Connect Wallet';
        }
    }
}

function updateWalletUI(address) {
    if (!address) return;
    
    currentWalletAddress = address;
    window.userAddress = address; // Global değişken güncelle
    
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const walletInfo = document.getElementById('walletInfo');
    const userAddress = document.getElementById('userAddress');
    
    if (connectWalletBtn) {
        connectWalletBtn.style.display = 'none';
    }
    
    if (walletInfo) {
        walletInfo.style.display = 'block';
        
        // Add disconnect button if not exists
        let disconnectBtn = document.getElementById('disconnectWalletBtn');
        if (!disconnectBtn) {
            disconnectBtn = document.createElement('button');
            disconnectBtn.id = 'disconnectWalletBtn';
            disconnectBtn.className = 'wallet-btn disconnect';
            disconnectBtn.innerHTML = '🔌 Disconnect';
            disconnectBtn.style.cssText = `
                background: #ff4444;
                margin-left: 10px;
                font-size: 12px;
                padding: 5px 10px;
                border: none;
                border-radius: 4px;
                color: white;
                cursor: pointer;
                transition: background 0.3s;
            `;
            disconnectBtn.addEventListener('click', handleWalletDisconnect);
            disconnectBtn.addEventListener('mouseenter', () => {
                disconnectBtn.style.background = '#cc3333';
            });
            disconnectBtn.addEventListener('mouseleave', () => {
                disconnectBtn.style.background = '#ff4444';
            });
            
            // Add to wallet info section
            const walletAddress = walletInfo.querySelector('.wallet-address');
            if (walletAddress) {
                walletAddress.appendChild(disconnectBtn);
            } else {
                walletInfo.appendChild(disconnectBtn);
            }
        }
    }
    
    if (userAddress) {
        userAddress.textContent = address.slice(0, 6) + '...' + address.slice(-4);
        userAddress.title = address; // Show full address on hover
    }
    
    // Load balances
    loadBalances();
}

// Handle wallet disconnect button click
async function handleWalletDisconnect() {
    try {
        const result = await window.blockchainManager.disconnectWallet();
        if (result.success) {
            console.log('Wallet disconnected successfully');
        } else {
            console.error('Disconnect failed:', result.error);
        }
    } catch (error) {
        console.error('Disconnect error:', error);
        // Force disconnect even if there's an error
        handleWalletDisconnected();
    }
}

async function loadBalances() {
    if (!currentWalletAddress) return;
    
    try {
        // Get MON balance
        const monBalance = await window.blockchainManager.getMONBalance();
        if (monBalance.success) {
            const monBalanceEl = document.getElementById('monBalance');
            if (monBalanceEl) {
                monBalanceEl.textContent = parseFloat(monBalance.balance).toFixed(4);
            }
        }
        
        // Get CP balance
        const cpBalance = await window.blockchainManager.getCPTokenBalance();
        if (cpBalance.success) {
            const cpBalanceEl = document.getElementById('cpBalance');
            if (cpBalanceEl) {
                cpBalanceEl.textContent = parseFloat(cpBalance.balance).toFixed(2);
            }
        }
        
    } catch (error) {
        console.error('Error loading balances:', error);
    }
}

async function checkUserRegistration(address) {
    try {
        const result = await window.blockchainManager.isUserRegistered(address);
        
        if (result.success && result.isRegistered) {
            // Load user data
            const userInfo = await window.blockchainManager.getUserInfo(address);
            if (userInfo.success) {
                currentUsername = userInfo.data.username;
                window.userName = currentUsername; // Global değişken güncelle
                const usernameEl = document.getElementById('username');
                if (usernameEl) usernameEl.textContent = currentUsername;
            }
            
            showMainMenu();
            await loadUserData();
            
            // Initialize Multisynq with user data
            if (window.initializeChaosMultisynq && currentUsername) {
                const user = {
                    username: currentUsername,
                    address: currentWalletAddress
                };
                window.initializeChaosMultisynq(user).then(result => {
                    if (result.success && result.view && result.view.setPlayerName) {
                        result.view.setPlayerName(currentUsername);
                    }
                });
            }
        } else {
            showUserRegistration();
        }
    } catch (error) {
        console.error('Check registration error:', error);
        showUserRegistration();
    }
}

function showUserRegistration() {
    const walletPrompt = document.getElementById('walletPrompt');
    const userRegistration = document.getElementById('userRegistration');
    const gameReady = document.getElementById('gameReady');
    
    if (walletPrompt) walletPrompt.style.display = 'none';
    if (userRegistration) userRegistration.style.display = 'block';
    if (gameReady) gameReady.style.display = 'none';
}

function showMainMenu() {
    const walletPrompt = document.getElementById('walletPrompt');
    const userRegistration = document.getElementById('userRegistration');
    const gameReady = document.getElementById('gameReady');
    
    if (walletPrompt) walletPrompt.style.display = 'none';
    if (userRegistration) userRegistration.style.display = 'none';
    if (gameReady) gameReady.style.display = 'block';
    
    // Initialize Multisynq and room manager with user data
    if (currentUsername && currentWalletAddress) {
        const user = {
            username: currentUsername,
            address: currentWalletAddress
        };
        
        // Initialize Multisynq integration
        if (window.initializeChaosMultisynq) {
            window.initializeChaosMultisynq(user).then(result => {
                if (result.success) {
                    console.log('Multisynq initialized successfully');
                    
                    // Set player name in Multisynq
                    if (result.view && result.view.setPlayerName) {
                        result.view.setPlayerName(user.username);
                    }
                } else {
                    console.error('Multisynq initialization failed:', result.error);
                }
            });
        }
    }
    
    // Update game status
    updateGameStatus();
}

function updateGameStatus() {
    const statusDisplay = document.getElementById('gameStatusDisplay');
    const roomDisplay = document.getElementById('currentRoomDisplay');
    
    if (statusDisplay) {
        if (window.chaosSession && window.chaosView) {
            statusDisplay.textContent = 'Connected';
            statusDisplay.className = 'status-connected';
        } else {
            statusDisplay.textContent = 'Connecting...';
            statusDisplay.className = 'status-connecting';
        }
    }
    
    if (roomDisplay) {
        roomDisplay.textContent = 'chaos-main';
    }
}

async function handleUserRegistration() {
    const usernameInput = document.getElementById('usernameInput');
    const username = usernameInput.value.trim();
    
    if (!username) {
        alert('Please enter a username');
        return;
    }
    
    if (!currentWalletAddress) {
        alert('Please connect your wallet first');
        return;
    }
    
    try {
        // Show loading state
        const registerBtn = document.getElementById('registerUserBtn');
        if (registerBtn) {
            registerBtn.disabled = true;
            registerBtn.textContent = 'Registering...';
        }
        
        // Register user on blockchain
        const result = await window.blockchainManager.registerUser(username);
        if (result.success) {
            alert('User registered successfully!');
            
            currentUsername = username;
            window.userName = username; // Global değişken güncelle
            const usernameEl = document.getElementById('username');
            if (usernameEl) usernameEl.textContent = username;
            
            showMainMenu();
            await loadUserData();
            
            // Initialize Multisynq with new user data
            if (window.initializeChaosMultisynq) {
                const user = {
                    username: username,
                    address: currentWalletAddress
                };
                window.initializeChaosMultisynq(user).then(result => {
                    if (result.success && result.view && result.view.setPlayerName) {
                        result.view.setPlayerName(username);
                    }
                });
            }
        } else {
            alert('Registration failed: ' + result.error);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed: ' + error.message);
    } finally {
        // Reset button state
        const registerBtn = document.getElementById('registerUserBtn');
        if (registerBtn) {
            registerBtn.disabled = false;
            registerBtn.textContent = 'Register';
        }
    }
}

async function loadUserData() {
    try {
        // Load user stats
        const stats = await window.blockchainManager.getPlayerStats();
        if (stats.success) {
            const playerRank = document.getElementById('playerRank');
            const playerScore = document.getElementById('playerScore');
            const playerGames = document.getElementById('playerGames');
            
            if (playerRank) playerRank.textContent = `#${stats.stats.rank || '-'}`;
            if (playerScore) playerScore.textContent = stats.stats.totalScore || '0';
            if (playerGames) playerGames.textContent = stats.stats.gamesPlayed || '0';
        }
        
        // Leaderboard manager'ı güncelle
        if (window.leaderboardManager) {
            window.leaderboardManager.loadLeaderboard();
        }
        
    } catch (error) {
        console.error('Load user data error:', error);
    }
}

function populateLeaderboard(leaderboard) {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return;
    
    leaderboardList.innerHTML = '';
    
    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<div class="no-data">No leaderboard data</div>';
        return;
    }
    
    leaderboard.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <span class="rank">#${index + 1}</span>
            <span class="player">${player.username || 'Anonymous'}</span>
            <span class="score">${player.score}</span>
        `;
        leaderboardList.appendChild(item);
    });
}

// Auto-connect if previously connected
window.addEventListener('load', async () => {
    // Wait for blockchain manager to be ready
    setTimeout(async () => {
        if (typeof window.ethereum !== 'undefined' && window.blockchainManager && window.blockchainManager.connectWallet) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    // Connect blockchain manager first
                    const result = await window.blockchainManager.connectWallet();
                    if (result.success) {
                        updateWalletUI(result.address);
                        await checkUserRegistration(result.address);
                    }
                }
            } catch (error) {
                console.log('Auto-connect failed:', error);
            }
        }
    }, 1500); // Biraz daha uzun bekle
});

// Periodic updates
setInterval(async () => {
    if (currentWalletAddress) {
        await loadBalances();
        await loadUserData();
    }
}, 30000); // Update every 30 seconds

console.log("Simplified wallet integration loaded");
class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.currentRoom = null;
        this.currentUser = null;
        this.multisynqSession = null;
        this.multisynqView = null;
        this.globalRooms = new Map(); // Global rooms from Multisynq
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
        });
        
        // If DOM is already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
            });
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Create Room button
        const createRoomBtn = document.getElementById('createRoomBtn');
        if (createRoomBtn) {
            createRoomBtn.addEventListener('click', () => {
                this.showCreateRoomDialog();
            });
        }

        // Refresh Rooms button
        const refreshRoomsBtn = document.getElementById('refreshRooms');
        if (refreshRoomsBtn) {
            refreshRoomsBtn.addEventListener('click', () => {
                this.refreshRoomsList();
            });
        }

        // Leave Room button
        const leaveRoomBtn = document.getElementById('leaveRoomBtn');
        if (leaveRoomBtn) {
            leaveRoomBtn.addEventListener('click', () => {
                this.leaveCurrentRoom();
            });
        }

        // Start Game button - CRITICAL FOR 5-GAME SERIES
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                this.startGameSeries();
            });
            console.log('✅ Start Game button event listener attached in Room Manager');
        }
    }

    startGameSeries() {
        console.log('🚀 Start Game Series clicked in Room Manager');
        
        if (!this.currentRoom) {
            console.warn('Cannot start game - not in a room');
            return;
        }
        
        if (!this.multisynqView) {
            console.warn('Cannot start game - Multisynq view not ready');
            return;
        }
        
        // Delegate to Multisynq View
        this.multisynqView.startGame();
        console.log('✅ Game series start delegated to Multisynq View');
    }

    setUser(user) {
        this.currentUser = user;
        console.log('Room manager user set:', user);
        
        // Refresh room list to update join button states
        this.refreshRoomsList();
    }
    
    async setMultisynqSession(session, view) {
        this.multisynqSession = session;
        this.multisynqView = view;
        
        console.log('Multisynq session set for room manager:', session.id);
        
        // Room events are now handled by the view directly
        // Request current room list
        if (view && view.requestRoomList) {
            view.requestRoomList();
        }
    }

    // Global room event handlers - Legacy methods for compatibility
    onGlobalRoomCreated(data) {
        console.log('Global room created:', data);
        this.globalRooms.set(data.roomId, data.roomData);
        this.refreshRoomsList();
    }

    onGlobalRoomUpdated(data) {
        console.log('Global room updated:', data);
        this.globalRooms.set(data.roomId, data.roomData);
        this.refreshRoomsList();
    }

    onGlobalRoomDeleted(data) {
        console.log('Global room deleted:', data);
        this.globalRooms.delete(data.roomId);
        this.refreshRoomsList();
    }

    onRoomListUpdate(data) {
        console.log('Room list update received:', data);
        this.globalRooms.clear();
        if (data.rooms) {
            data.rooms.forEach(room => {
                this.globalRooms.set(room.id, room);
            });
        }
        this.refreshRoomsList();
    }

    requestRoomList() {
        if (this.multisynqView && this.multisynqView.requestRoomList) {
            this.multisynqView.requestRoomList();
        }
    }

    showCreateRoomDialog() {
        this.createRoomModal();
    }

    createRoomModal() {
        // Create modal HTML
        const modalHTML = `
            <div id="createRoomModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🏠 Create New Room</h3>
                        <button class="close-btn" onclick="window.roomManager.closeCreateRoomModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="roomNameInput">Room Name:</label>
                            <input type="text" id="roomNameInput" placeholder="Enter room name..." maxlength="20" required>
                        </div>
                        <div class="form-group">
                            <label for="maxPlayersSelect">Max Players:</label>
                            <select id="maxPlayersSelect">
                                <option value="2">2 Players</option>
                                <option value="3">3 Players</option>
                                <option value="4">4 Players</option>
                                <option value="5">5 Players</option>
                                <option value="6">6 Players</option>
                                <option value="7">7 Players</option>
                                <option value="8" selected>8 Players</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="roomPasswordInput">Password (Optional):</label>
                            <input type="password" id="roomPasswordInput" placeholder="Leave empty for public room">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="action-btn secondary" onclick="window.roomManager.closeCreateRoomModal()">Cancel</button>
                        <button class="action-btn primary" onclick="window.roomManager.confirmCreateRoom()">Create Room</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Focus on room name input
        setTimeout(() => {
            document.getElementById('roomNameInput').focus();
        }, 100);

        // Handle Enter key
        document.getElementById('roomNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.confirmCreateRoom();
            }
        });
    }

    closeCreateRoomModal() {
        const modal = document.getElementById('createRoomModal');
        if (modal) {
            modal.remove();
        }
    }

    confirmCreateRoom() {
        const roomName = document.getElementById('roomNameInput').value.trim();
        const maxPlayers = parseInt(document.getElementById('maxPlayersSelect').value);
        const password = document.getElementById('roomPasswordInput').value.trim();

        if (!roomName) {
            alert('Please enter a room name');
            return;
        }

        if (roomName.length > 20) {
            alert('Room name must be 20 characters or less');
            return;
        }

        this.closeCreateRoomModal();
        this.createRoom(roomName, maxPlayers, password || null);
    }

    async createRoom(roomName, maxPlayers = 8, password = null) {
        try {
            if (!this.multisynqView) {
                alert('Multisynq connection not ready. Please try again.');
                return;
            }

            // Use Multisynq View to create room
            this.multisynqView.createRoom(roomName, maxPlayers, password);

            console.log('Room creation request sent:', roomName);
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
        }
    }

    async joinRoom(roomId, roomData = null) {
        try {
            if (!this.multisynqView) {
                alert('Multisynq connection not ready. Please try again.');
                return;
            }

            let password = null;
            
            // Check if room requires password
            if (roomData && roomData.password) {
                password = prompt('This room is password protected. Enter password:');
                if (!password) {
                    return; // User cancelled
                }
            }

            // Use Multisynq View to join room
            this.multisynqView.joinRoom(roomId, password);

            console.log('Room join request sent:', roomId);
        } catch (error) {
            console.error('Error joining room:', error);
            alert('Failed to join room. Please try again.');
        }
    }

    async leaveCurrentRoom() {
        if (!this.currentRoom) return;

        try {
            if (!this.multisynqView) {
                alert('Multisynq connection not ready.');
                return;
            }

            // Use Multisynq View to leave room
            this.multisynqView.leaveRoom();

            console.log('Room leave request sent');
        } catch (error) {
            console.error('Error leaving room:', error);
            alert('Failed to leave room. Please try again.');
        }
    }

    refreshRoomsList() {
        const roomsList = document.getElementById('roomsList');
        if (!roomsList) return;
        
        roomsList.innerHTML = '';

        // Combine local and global rooms (Multisynq'dan gelen)
        const allRooms = new Map();
        
        // Add local rooms
        this.rooms.forEach((room, roomId) => {
            allRooms.set(roomId, room);
        });
        
        // Add global rooms (from other users via Multisynq)
        this.globalRooms.forEach((room, roomId) => {
            if (!allRooms.has(roomId)) {
                allRooms.set(roomId, room);
            }
        });

        if (allRooms.size === 0) {
            roomsList.innerHTML = `
                <div class="no-rooms">
                    <p>No active rooms</p>
                    <p>Create the first room!</p>
                </div>
            `;
            return;
        }

        allRooms.forEach((room, roomId) => {
            const roomElement = this.createRoomElement(room);
            roomsList.appendChild(roomElement);
        });
    }

    createRoomElement(room) {
        const roomDiv = document.createElement('div');
        roomDiv.className = 'room-item';
        roomDiv.innerHTML = `
            <div class="room-header">
                <h4 class="room-name">${room.name}</h4>
                <span class="room-status ${room.status}">${room.status}</span>
            </div>
            <div class="room-info">
                <div class="room-creator">👤 ${room.creator || room.creatorName || 'Unknown'}</div>
                <div class="room-players">👥 ${room.players ? room.players.length : 0}/${room.maxPlayers}</div>
            </div>
            <div class="room-actions">
                <button class="join-room-btn" data-room-id="${room.id}" 
                        ${this.shouldDisableJoinButton(room) ? 'disabled' : ''}>
                    ${this.getJoinButtonText(room)}
                </button>
            </div>
        `;

        // Add join button event listener
        const joinBtn = roomDiv.querySelector('.join-room-btn');
        if (joinBtn && !joinBtn.disabled) {
            joinBtn.addEventListener('click', () => {
                this.joinRoom(room.id, room);
            });
        }

        return roomDiv;
    }

    shouldDisableJoinButton(room) {
        // Room full mu?
        if (room.players && room.players.length >= room.maxPlayers) {
            return true;
        }
        
        // Kullanıcı zaten bu odada mı? (viewId kullan)
        const currentViewId = this.multisynqView ? this.multisynqView.viewId : null;
        if (currentViewId && room.players && room.players.includes(currentViewId)) {
            return true;
        }
        
        // Oyun devam ediyor mu?
        if (room.status === 'playing') {
            return true;
        }
        
        return false;
    }

    getJoinButtonText(room) {
        // Room full mu?
        if (room.players && room.players.length >= room.maxPlayers) {
            return '🔒 Full';
        }
        
        // Kullanıcı zaten bu odada mı? (viewId kullan)
        const currentViewId = this.multisynqView ? this.multisynqView.viewId : null;
        if (currentViewId && room.players && room.players.includes(currentViewId)) {
            return '✅ Joined';
        }
        
        // Oyun devam ediyor mu?
        if (room.status === 'playing') {
            return '🎮 Playing';
        }
        
        return '🚪 Join';
    }

    updateUI() {
        if (this.currentRoom) {
            // Update room info in right panel
            const playersCount = document.getElementById('playersCount');
            if (playersCount) {
                playersCount.textContent = this.currentRoom.players ? this.currentRoom.players.length : 0;
            }
            
            // Show leave button
            const leaveRoomBtn = document.getElementById('leaveRoomBtn');
            if (leaveRoomBtn) {
                leaveRoomBtn.style.display = 'block';
            }
            
            // Update players list
            this.updatePlayersList();
            
            // Update game area room info
            const currentRoomId = document.getElementById('currentRoomId');
            if (currentRoomId) {
                currentRoomId.textContent = this.currentRoom.name;
            }
        } else {
            // Hide leave button
            const leaveRoomBtn = document.getElementById('leaveRoomBtn');
            if (leaveRoomBtn) {
                leaveRoomBtn.style.display = 'none';
            }
            
            // Clear players list
            const roomPlayersList = document.getElementById('roomPlayersList');
            const playersCount = document.getElementById('playersCount');
            
            if (roomPlayersList) roomPlayersList.innerHTML = '';
            if (playersCount) playersCount.textContent = '0';
        }
    }

    updatePlayersList() {
        if (!this.currentRoom) return;

        // Update total player count
        const totalPlayers = this.currentRoom.players ? this.currentRoom.players.length : 0;
        const playersCount = document.getElementById('playersCount');
        if (playersCount) {
            playersCount.textContent = totalPlayers;
        }

        // Update Start Game button based on player count
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            if (totalPlayers >= 2) {
                startGameBtn.disabled = false;
                startGameBtn.textContent = '🚀 Start Game';
            } else {
                startGameBtn.disabled = true;
                startGameBtn.textContent = `🚀 Start Game (${totalPlayers}/2)`;
            }
        }

        // Update room players (in-game)
        const roomPlayersList = document.getElementById('roomPlayersList');
        if (roomPlayersList) {
            roomPlayersList.innerHTML = '';

            const inGamePlayers = this.currentRoom.inGamePlayers || [];
            inGamePlayers.forEach((player) => {
                const playerDiv = document.createElement('div');
                playerDiv.className = 'player-item in-game';
                const playerName = player.username || player.name || player.playerName || 'Unknown Player';
                const isCreator = (playerName === this.currentRoom.creator) ||
                                 (player.id === this.currentRoom.creatorId) ||
                                 (player.address === this.currentRoom.creatorAddress);
                
                playerDiv.innerHTML = `
                    <div class="player-info">
                        <span class="player-name">${playerName}</span>
                        ${isCreator ? '<span class="creator-badge">👑</span>' : ''}
                    </div>
                    <div class="player-status">
                        <span class="status-indicator online"></span>
                    </div>
                `;
                roomPlayersList.appendChild(playerDiv);
            });
        }

        // Update waiting players
        const waitingPlayersList = document.getElementById('waitingPlayersList');
        if (waitingPlayersList) {
            waitingPlayersList.innerHTML = '';

            const waitingPlayers = this.currentRoom.waitingPlayers || this.currentRoom.players || [];
            waitingPlayers.forEach((player) => {
                const playerDiv = document.createElement('div');
                playerDiv.className = 'player-item waiting';
                const playerName = player.username || player.name || player.playerName || 'Unknown Player';
                const isCreator = (playerName === this.currentRoom.creator) ||
                                 (player.id === this.currentRoom.creatorId) ||
                                 (player.address === this.currentRoom.creatorAddress);
                
                playerDiv.innerHTML = `
                    <div class="player-info">
                        <span class="player-name">${playerName}</span>
                        ${isCreator ? '<span class="creator-badge">👑</span>' : ''}
                    </div>
                    <div class="player-status">
                        <span class="status-indicator online"></span>
                    </div>
                `;
                waitingPlayersList.appendChild(playerDiv);
            });
        }

        // Update section headers with counts
        const inRoomHeader = document.querySelector('#roomPlayersSection h4');
        if (inRoomHeader) {
            const inGameCount = this.currentRoom.inGamePlayers ? this.currentRoom.inGamePlayers.length : 0;
            inRoomHeader.textContent = `🎮 In Game (${inGameCount})`;
        }

        const waitingHeader = document.querySelector('#waitingPlayersSection h4');
        if (waitingHeader) {
            const waitingCount = this.currentRoom.waitingPlayers ? this.currentRoom.waitingPlayers.length : (this.currentRoom.players ? this.currentRoom.players.length : 0);
            waitingHeader.textContent = `⏳ Waiting (${waitingCount})`;
        }
    }

    hideWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const gameArea = document.getElementById('gameArea');
        
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        if (gameArea) gameArea.style.display = 'block';
    }

    showWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const gameArea = document.getElementById('gameArea');
        
        if (welcomeScreen) welcomeScreen.style.display = 'block';
        if (gameArea) gameArea.style.display = 'none';
        
        // Show the game ready section
        const walletPrompt = document.getElementById('walletPrompt');
        const userRegistration = document.getElementById('userRegistration');
        const gameReady = document.getElementById('gameReady');
        
        if (walletPrompt) walletPrompt.style.display = 'none';
        if (userRegistration) userRegistration.style.display = 'none';
        if (gameReady) gameReady.style.display = 'block';
    }

    // Get current room data
    getCurrentRoom() {
        return this.currentRoom;
    }

    // Get all rooms
    getAllRooms() {
        return Array.from(this.rooms.values());
    }

    // Check if user is in a room
    isInRoom() {
        return this.currentRoom !== null;
    }

    // Sayfa görünürlük değişikliklerinde oyun durumunu yenile
    refreshCurrentState() {
        console.log('🔄 Refreshing room manager state after page visibility change');
        
        if (this.currentRoom) {
            // Mevcut oda durumunu koru
            console.log('📱 Maintaining current room state:', this.currentRoom.name);
            
            // UI'yi güncelle
            this.updateUI();
            this.updatePlayersList();
            
            // Room listesini yenile
            this.refreshRoomsList();
            
            // Multisynq view'dan güncel room listesi iste
            if (this.multisynqView && this.multisynqView.requestRoomList) {
                this.multisynqView.requestRoomList();
            }
        } else {
            // Oda yoksa room listesini yenile
            this.refreshRoomsList();
        }
    }
}

// Initialize room manager
function initializeRoomManager() {
    if (!window.roomManager) {
        window.roomManager = new RoomManager();
        console.log('Room manager initialized');
    }
}

// Initialize immediately if DOM is ready, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRoomManager);
} else {
    initializeRoomManager();
}

// Chaos Conductor - Multisynq ile Real-time Multiplayer Game

// Multisynq Configuration
const MULTISYNQ_API_KEY = '2w50KMtf6bYpOyVg3jtAai19FM2IrsaWuDCu9hzgHx';
const MULTISYNQ_USER_ID = '6876a905e273b89ce27dd663';
const APP_ID = 'com.chaosconductor.game';

// Sabitler - 5 oyunluk oda sistemi
const GAME_DURATION = 30000; // 30 saniye
const GAMES_PER_ROOM = 5; // Her odada 5 oyun
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;

// Görev tipleri
const TASK_TYPES = {
    CLICK: 'click',
    TYPE: 'type',
    DRAW: 'draw',
    FAKE: 'fake'
};

// Oyun durumu factory - 10 oyunluk sistem
function createGameState() {
    return {
        players: {},
        scores: {},
        currentGame: null,
        currentGameIndex: 0,
        totalGames: GAMES_PER_ROOM,
        gameStarted: false,
        gameEnded: false,
        roomId: null,
        gameResults: [], // Her oyunun sonuçları
        finalRankings: [], // Final sıralama
        gameTimer: null,
        gameStartTime: null
    };
}

// Room durumu factory
function createRoomState() {
    return {
        id: null,
        name: '',
        creator: '',
        creatorId: '',
        players: [],
        maxPlayers: 8,
        password: null,
        status: 'waiting', // waiting, playing, finished
        currentGameIndex: 0,
        gameResults: [],
        gameSequence: [], // 5 farklı oyun sırası
        createdAt: null,
        gameState: createGameState()
    };
}

// Multisynq Model - Room ve oyun durumunu yönetir
class ChaosGameModel extends Multisynq.Model {
    init(props) {
        super.init(props);
        this.gameState = createGameState();
        this.rooms = new Map(); // Global room storage - ALL USERS CAN SEE
        this.lastBroadcastMessage = ''; // Multiple broadcast prevention
        this.gameTimers = {}; // Game timer tracking
        
        console.log('ChaosGameModel initialized:', this.sessionId);
        
        // Multisynq standard event handlers
        this.subscribe(this.sessionId, "view-join", this.onViewJoin);
        this.subscribe(this.sessionId, "view-exit", this.onViewExit);
        
        // Room management handlers - ROOM SISTEMI
        this.subscribe(this.sessionId, "createRoom", this.handleCreateRoom);
        this.subscribe(this.sessionId, "joinRoom", this.handleJoinRoom);
        this.subscribe(this.sessionId, "leaveRoom", this.handleLeaveRoom);
        this.subscribe(this.sessionId, "requestRoomList", this.handleRoomListRequest);
        
        // Player management
        this.subscribe(this.sessionId, "setPlayerName", this.handleSetPlayerName);
        
        // Game series handlers - 10 oyunluk sistem
        this.subscribe(this.sessionId, "startGameSeries", this.handleStartGameSeries);
        this.subscribe(this.sessionId, "gameComplete", this.handleGameComplete);
        this.subscribe(this.sessionId, "nextGame", this.handleNextGame);
        this.subscribe(this.sessionId, "seriesComplete", this.handleSeriesComplete);
        
        // Custom message handlers
        this.subscribe(this.sessionId, "taskComplete", this.handleTaskCompleted);
        this.subscribe(this.sessionId, "gameStateUpdate", this.handleGameStateUpdate);
        this.subscribe(this.sessionId, "newTask", this.handleNewTask);
        this.subscribe(this.sessionId, "sabotageUse", this.handleSabotageUsed);
        this.subscribe(this.sessionId, "chatMessage", this.handleChatMessage);
        
        // Make this model globally accessible
        this.beWellKnownAs("ChaosGame");
    }
    onViewJoin(viewId) {
        console.log(`Player ${viewId} joined the session`);
        
        // Server dolu mu kontrol et
        if (Object.keys(this.gameState.players).length >= MAX_PLAYERS) {
            this.publish(viewId, "connection-refused", {
                reason: "Server is full",
                maxPlayers: MAX_PLAYERS,
                currentPlayers: Object.keys(this.gameState.players).length
            });
            console.log(`Player ${viewId} refused - server full`);
            return;
        }
        
        // Oyuncuyu oluştur - BLOCKCHAIN'DEN İSİM ALINACAK
        this.gameState.players[viewId] = {
            id: viewId,
            name: null, // Blockchain'den alınacak
            ready: false,
            combo: 0,
            currentRoom: null
        };
        this.gameState.scores[viewId] = 0;
        
        const playerCount = Object.keys(this.gameState.players).length;
        console.log('Player joined:', viewId, 'Total players:', playerCount);
        
        // Broadcast player update
        this.publish(this.sessionId, "playersUpdate", {
            players: this.gameState.players,
            scores: this.gameState.scores,
            playerCount: playerCount
        });
        
        // Send current room list to new player
        this.sendRoomListToPlayer(viewId);
    }

    onViewExit(viewId) {
        console.log(`Player ${viewId} left`);
        
        if (this.gameState.players[viewId]) {
            const player = this.gameState.players[viewId];
            
            // ENHANCED: Check if player is a room creator before removing
            if (player.currentRoom) {
                const room = this.rooms.get(player.currentRoom);
                if (room && room.creatorId === viewId) {
                    console.log(`🚨 ROOM CREATOR DISCONNECTED: ${player.name} left without using leave button`);
                    // Force remove from room (this will trigger room deletion)
                    this.removePlayerFromRoom(viewId, player.currentRoom);
                } else if (player.currentRoom) {
                    // Normal player leaving
                    this.removePlayerFromRoom(viewId, player.currentRoom);
                }
            }
            
            delete this.gameState.players[viewId];
            delete this.gameState.scores[viewId];
            
            const playerCount = Object.keys(this.gameState.players).length;
            
            // Broadcast player update
            this.publish(this.sessionId, "playersUpdate", {
                players: this.gameState.players,
                scores: this.gameState.scores,
                playerCount: playerCount
            });
            
            console.log('Player left, remaining players:', playerCount);
        }
    }

    // ROOM MANAGEMENT - MODEL'DE TUTULUR Kİ TÜM KULLANICILAR GÖREBİLSİN
    handleCreateRoom(data) {
        const { viewId, roomName, maxPlayers, password } = data;
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const player = this.gameState.players[viewId];
        if (!player) {
            console.error('Player not found for room creation:', viewId);
            this.publish(viewId, "roomCreateFailed", { error: "Player not found" });
            return;
        }
        
        // Ensure player has a valid name
        if (!player.name || player.name.trim() === '' || player.name === 'undefined') {
            player.name = `Player${Math.floor(Math.random() * 1000)}`;
            console.log('Fixed undefined player name to:', player.name);
        }
        
        // Yeni room state kullan
        const roomData = createRoomState();
        roomData.id = roomId;
        roomData.name = roomName;
        roomData.creator = player.name;
        roomData.creatorId = viewId;
        roomData.players = [viewId]; // Creator otomatik olarak eklendi
        roomData.maxPlayers = maxPlayers || 8;
        roomData.password = password || null;
        roomData.status = 'waiting';
        roomData.createdAt = Date.now();
        roomData.gameState.roomId = roomId;
        
        // Store room in model - ALL USERS CAN SEE
        this.rooms.set(roomId, roomData);
        
        // Set player's current room - AUTO JOIN
        player.currentRoom = roomId;
        
        console.log('✅ Room created successfully:', {
            roomId,
            roomName,
            creator: player.name,
            creatorId: viewId,
            autoJoined: true
        });
        
        // Broadcast room list update to ALL users
        this.broadcastRoomList();
        
        // Broadcast player update so creator appears in room
        this.publish(this.sessionId, "playersUpdate", {
            players: this.gameState.players,
            scores: this.gameState.scores,
            playerCount: Object.keys(this.gameState.players).length
        });
        
        // Notify room creator - auto joined
        this.publish(viewId, "roomJoined", {
            roomId: roomId,
            roomData: roomData,
            success: true,
            autoJoined: true,
            message: `Room ${roomName} created and auto-joined!`
        });
        
        console.log('✅ Room creator auto-joined successfully');
    }

    handleJoinRoom(data) {
        const { viewId, roomId, password } = data;
        const room = this.rooms.get(roomId);
        const player = this.gameState.players[viewId];
        
        if (!room || !player) {
            this.publish(viewId, "roomJoinFailed", { error: "Room not found" });
            return;
        }
        
        // Check password
        if (room.password && room.password !== password) {
            this.publish(viewId, "roomJoinFailed", { error: "Incorrect password" });
            return;
        }
        
        // Check if room is full
        if (room.players.length >= room.maxPlayers) {
            this.publish(viewId, "roomJoinFailed", { error: "Room is full" });
            return;
        }
        
        // Check if already in room
        if (room.players.includes(viewId)) {
            this.publish(viewId, "roomJoined", { roomId, roomData: room, success: true });
            return;
        }
        
        // Add player to room
        room.players.push(viewId);
        player.currentRoom = roomId;
        
        console.log(`Player ${player.name} joined room ${room.name}`);
        
        // Update room in storage
        this.rooms.set(roomId, room);
        
        // Broadcast room list update
        this.broadcastRoomList();
        
        // Notify player
        this.publish(viewId, "roomJoined", {
            roomId: roomId,
            roomData: room,
            success: true
        });
        // Notify other players in room
        room.players.forEach(playerId => {
            if (playerId !== viewId) {
                this.publish(playerId, "playerJoinedRoom", {
                    roomId: roomId,
                    playerId: viewId,
                    playerName: player.name
                });
            }
        });
        
        // Broadcast updated player list to trigger UI refresh
        this.publish(this.sessionId, "playersUpdate", {
            players: this.gameState.players,
            scores: this.gameState.scores,
            playerCount: Object.keys(this.gameState.players).length
        });
    }

    handleLeaveRoom(data) {
        const { viewId } = data;
        const player = this.gameState.players[viewId];
        
        if (!player || !player.currentRoom) return;
        
        this.removePlayerFromRoom(viewId, player.currentRoom);
    }

    removePlayerFromRoom(viewId, roomId) {
        const room = this.rooms.get(roomId);
        const player = this.gameState.players[viewId];
        
        if (!room || !player) return;
        
        const isCreator = room.creatorId === viewId;
        const wasPlaying = room.status === 'playing';
        
        // Remove player from room
        room.players = room.players.filter(id => id !== viewId);
        player.currentRoom = null;
        
        console.log(`Player ${player.name} left room ${room.name} (Creator: ${isCreator})`);
        
        // CREATOR ÇIKMA KONTROLÜ - Oda kurucusu çıkarsa oda SİLİNİR
        if (isCreator) {
            console.log(`🚨 ROOM CREATOR LEFT! Deleting room ${room.name} permanently`);
            
            // Tüm oyunculara oda silindiğini bildir
            room.players.forEach(playerId => {
                this.publish(playerId, "roomDeleted", {
                    roomId: roomId,
                    reason: "creator_left",
                    message: "Room deleted because creator left the game!"
                });
                
                // Oyuncuları ana menüye gönder
                const remainingPlayer = this.gameState.players[playerId];
                if (remainingPlayer) {
                    remainingPlayer.currentRoom = null;
                }
            });
            
            // Odayı kalıcı olarak sil
            this.rooms.delete(roomId);
            console.log(`Room ${room.name} permanently deleted due to creator leaving`);
            
            // Oyun devam ediyorsa, tüm oyunları durdur
            if (wasPlaying) {
                console.log(`Stopping ongoing game series in deleted room ${room.name}`);
            }
            
        } else if (room.players.length === 0) {
            // Oda boşsa sil (normal durum)
            this.rooms.delete(roomId);
            console.log(`Room ${room.name} deleted - empty room`);
            
        } else {
            // Oda devam ediyor, sadece güncelle
            this.rooms.set(roomId, room);
            console.log(`Room ${room.name} updated - ${room.players.length} players remaining`);
            
            // Kalan oyunculara bildir
            room.players.forEach(playerId => {
                this.publish(playerId, "playerLeftRoom", {
                    roomId: roomId,
                    playerId: viewId,
                    playerName: player.name,
                    remainingPlayers: room.players.length
                });
            });
        }
        
        // Broadcast room list update
        this.broadcastRoomList();
        
        // Notify leaving player
        this.publish(viewId, "roomLeft", {
            roomId,
            reason: isCreator ? "creator_left" : "normal_leave"
        });
    }

    handleRoomListRequest(data) {
        const { viewId } = data;
        this.sendRoomListToPlayer(viewId);
    }

    sendRoomListToPlayer(viewId) {
        const roomList = Array.from(this.rooms.values()).map(room => ({
            ...room,
            playerNames: room.players.map(id => this.gameState.players[id]?.name || 'Unknown')
        }));
        this.publish(viewId, "roomListUpdate", {
            rooms: roomList,
            timestamp: Date.now()
        });
    }

    broadcastRoomList() {
        const roomList = Array.from(this.rooms.values()).map(room => ({
            ...room,
            playerNames: room.players.map(id => this.gameState.players[id]?.name || 'Unknown')
        }));
        this.publish(this.sessionId, "roomListUpdate", {
            rooms: roomList,
            timestamp: Date.now()
        });
    }

    handleSetPlayerName(data) {
        const { viewId, name } = data;
        
        // Player var mı kontrol et
        if (!this.gameState.players[viewId]) {
            console.error(`❌ Player not found: ${viewId}`);
            this.publish(viewId, "playerNameSet", {
                success: false,
                error: "Player not found"
            });
            return;
        }
        
        // Name validation - daha esnek
        if (!name || typeof name !== 'string' || name.trim() === '' || name === 'undefined' || name === 'null') {
            console.error(`❌ Invalid player name: ${viewId} -> ${name}`);
            this.publish(viewId, "playerNameSet", {
                success: false,
                error: "Invalid name"
            });
            return;
        }
        
        // Name'i temizle ve ayarla
        const cleanName = name.trim().substring(0, 15);
        this.gameState.players[viewId].name = cleanName;
        
        console.log(`✅ Player name set: ${viewId} -> ${cleanName}`);
        
        // Broadcast player update - TÜM OYUNCULARA
        this.publish(this.sessionId, "playersUpdate", {
            players: this.gameState.players,
            scores: this.gameState.scores,
            playerCount: Object.keys(this.gameState.players).length
        });
        
        // Update room list (names changed) - TÜM OYUNCULARA
        this.broadcastRoomList();
        
        // Özel olarak bu oyuncuya da gönder
        this.publish(viewId, "playerNameSet", {
            success: true,
            name: cleanName
        });
    }

    handleTaskCompleted(data) {
        const { playerId, taskId, timeLeft, success } = data;
        
        if (this.gameState.currentTask && this.gameState.currentTask.id === taskId) {
            const player = this.gameState.players[playerId];
            if (player && success) {
                let points = this.gameState.currentTask.points;
                
                // Hız bonusu
                const speedBonus = Math.floor(timeLeft / 1000) * 10;
                points += speedBonus;
                
                // Combo bonusu
                player.combo = (player.combo || 0) + 1;
                if (player.combo >= 3) {
                    points *= 1.5;
                    player.combo = 0;
                    this.publish("powerUp", { playerId, type: "combo" });
                }
                
                const currentScore = this.gameState.scores[playerId] || 0;
                this.gameState.scores[playerId] = currentScore + points;
                
                this.publish("scoreUpdate", {
                    playerId,
                    points,
                    speedBonus,
                    totalScore: currentScore + points
                });
            }
        }
    }

    handleGameStateUpdate(data) {
        Object.assign(this.gameState, data);
        this.publish("gameStateChanged", this.gameState);
    }

    handleNewTask(data) {
        this.gameState.currentTask = data.task;
        this.gameState.round = data.round;
        this.publish("taskUpdate", data);
    }

    handleSabotageUsed(data) {
        this.publish("sabotageActivated", data);
    }

    handleChatMessage(data) {
        // ÇOKLU BROADCAST ENGELLEMESİ
        const messageKey = `${data.playerId}_${data.message}_${data.timestamp}`;
        
        if (this.lastBroadcastMessage === messageKey) {
            console.log('❌ Duplicate broadcast blocked:', messageKey);
            return;
        }
        
        this.lastBroadcastMessage = messageKey;
        
        // Ensure data is properly formatted for Multisynq
        const chatData = {
            playerId: data.playerId || data.viewId,
            playerName: data.playerName || 'Unknown',
            message: String(data.message || ''),
            timestamp: data.timestamp || Date.now()
        };
        
        console.log('📡 Broadcasting chat message ONCE:', chatData);
        this.publish(this.sessionId, "chatUpdate", chatData);
    }
    handleStartGameSeries(data) {
        const { roomId, totalGames, gameDuration, players } = data;
        const room = this.rooms.get(roomId);
        
        if (!room) return;
        
        // Room durumunu güncelle
        room.status = 'playing';
        room.currentGameIndex = 0;
        room.gameResults = [];
        room.gameSequence = []; // Yeni seri için oyun sırasını sıfırla
        room.gameState.gameStarted = true;
        room.gameState.currentGameIndex = 0;
        room.gameState.totalGames = totalGames;
        
        console.log(`Starting game series in room ${room.name}: ${totalGames} games`);
        
        // İlk oyunu başlat
        this.startNextGame(roomId);
        
        // Room listesini güncelle
        this.broadcastRoomList();
    }

    startNextGame(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            console.log('Room not found for startNextGame:', roomId);
            return;
        }
        
        const gameIndex = room.currentGameIndex;
        
        // PREVENT INFINITE LOOPS - Check game limits
        if (gameIndex >= room.gameState.totalGames) {
            console.log(`Game series completed: ${gameIndex}/${room.gameState.totalGames}`);
            this.future(0).handleSeriesComplete({ roomId });
            return;
        }
        
        // SAFETY CHECK - Prevent too many games
        if (gameIndex >= 10) {
            console.error('SAFETY: Too many games, stopping at', gameIndex);
            this.future(0).handleSeriesComplete({ roomId });
            return;
        }
        
        // ENHANCED LOGGING for debugging
        console.log(`🎮 Starting game ${gameIndex + 1}/${room.gameState.totalGames} in room ${room.name}`);
        
        // 5 FARKLI OYUN SİSTEMİ - Her oyun farklı olacak
        const allGameTypes = [
            'tetris-blocks',    // Gerçek Tetris oyunu
            'snake-classic',    // Breakout Classic oyunu (Snake yerine)
            'pac-man-dots',     // Gerçek Pac-Man oyunu
            'space-invaders',   // Gerçek Space Invaders oyunu (Astro War)
            'bubble-shooter'    // Gerçek Bubble Shooter oyunu
        ];
        
        // Room'da oyun sırası tutulacak - her seri için karıştırılmış liste
        if (!room.gameSequence || room.gameSequence.length === 0) {
            // İlk oyun serisi - listeyi karıştır
            room.gameSequence = [...allGameTypes].sort(() => Math.random() - 0.5);
            console.log('🎲 New game sequence created:', room.gameSequence);
        }
        
        // Sıradaki oyunu al
        const selectedGame = room.gameSequence[gameIndex];
        console.log(`🎯 Selected game for round ${gameIndex + 1}: ${selectedGame} (from sequence)`);
        
        const currentTime = Date.now();
        const gameData = {
            id: `game_${gameIndex + 1}_${currentTime}`,
            type: selectedGame,
            index: gameIndex + 1,
            totalGames: room.gameState.totalGames,
            duration: GAME_DURATION,
            startTime: currentTime,
            roomId: roomId,
            players: room.players.slice(),
            scores: {}
        };
        
        // Room'daki oyun durumunu güncelle
        room.gameState.currentGame = gameData;
        room.gameState.currentGameIndex = gameIndex;
        room.gameState.gameStartTime = currentTime;
        
        console.log(`Starting game ${gameIndex + 1}/${room.gameState.totalGames}: ${selectedGame}`);
        
        // Tüm oyunculara oyun başlangıcını bildir - future ile sarmalayalım
        this.future(0).notifyGameStarted(roomId, gameData);
        
        // Oyun timer'ını başlat
        this.scheduleGameEnd(roomId, gameData.id, GAME_DURATION);
    }

    notifyGameStarted(roomId, gameData) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        // Tüm oyunculara oyun başlangıcını bildir
        room.players.forEach(playerId => {
            this.publish(playerId, "gameStarted", gameData);
        });
        
        console.log(`✅ Game started notification sent to ${room.players.length} players`);
    }

    notifyGameCompleted(roomId, gameResult, currentGameIndex, totalGames) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        // Tüm oyunculara sonucu bildir
        room.players.forEach(playerId => {
            this.publish(playerId, "gameCompleted", {
                gameResult: gameResult,
                currentGameIndex: currentGameIndex,
                totalGames: totalGames
            });
        });
        
        console.log(`✅ Game completed notification sent to ${room.players.length} players`);
    }

    notifySeriesCompleted(roomId, finalRankings, gameResults, totalGames) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        // Tüm oyunculara seri bitişini bildir
        room.players.forEach(playerId => {
            this.publish(playerId, "seriesCompleted", {
                roomId: roomId,
                finalRankings: finalRankings,
                gameResults: gameResults,
                totalGames: totalGames
            });
        });
        
        console.log(`✅ Series completed notification sent to ${room.players.length} players`);
    }

    continueGameSeries(roomId) {
        // Double check room still exists and game index is valid
        const room = this.rooms.get(roomId);
        if (room && room.currentGameIndex < room.gameState.totalGames) {
            console.log(`Continuing game series: ${room.currentGameIndex}/${room.gameState.totalGames}`);
            this.startNextGame(roomId);
        } else {
            console.log('Game series completed or room deleted');
            this.handleSeriesComplete({ roomId });
        }
    }

    completeGameFromTimeout(roomId, gameId, currentScores) {
        // Handle game completion from timeout in model context
        this.handleGameComplete({
            roomId: roomId,
            gameId: gameId,
            winner: null, // Nobody won due to timeout
            results: currentScores // Preserve current scores for progression
        });
    }

    scheduleGameEnd(roomId, gameId, duration) {
        // PREVENT MULTIPLE TIMERS - Clear existing timer first
        if (this.gameTimers && this.gameTimers[gameId]) {
            clearTimeout(this.gameTimers[gameId]);
            delete this.gameTimers[gameId];
            console.log(`Cleared existing timer for game ${gameId}`);
        }
        
        // Initialize timers map if not exists
        if (!this.gameTimers) {
            this.gameTimers = {};
        }
        
        // ENHANCED TIMER - More reliable auto-transition
        const startTime = Date.now();
        
        // Use future to schedule timeout in model context
        this.future(30000).handleGameTimeout(roomId, gameId);
        
        console.log(`✅ Enhanced timer set for game ${gameId}: 30000ms (30 seconds) at ${startTime}`);
    }

    handleGameTimeout(roomId, gameId) {
        const room = this.rooms.get(roomId);
        if (!room || !room.gameState.currentGame || room.gameState.currentGame.id !== gameId) {
            console.log(`Game timeout ignored - game already finished: ${gameId}`);
            return; // Game already finished or changed
        }
        
        // PREVENT MULTIPLE TIMEOUTS
        if (room.gameState.currentGame.timedOut) {
            console.log(`Game timeout ignored - already timed out: ${gameId}`);
            return;
        }
        
        room.gameState.currentGame.timedOut = true;
        console.log(`⏰ Model: Game ${gameId} timed out in room ${room.name} - AUTO TRANSITION`);
        
        // Collect current scores from all players for auto-transition
        const currentScores = room.gameState.currentGame.scores || {};
        console.log('📊 Preserving current scores for auto-transition:', currentScores);
        
        // Force finish game with current scores (no winner, but preserve progress)
        // Use future to stay in model context
        this.future(0).completeGameFromTimeout(roomId, gameId, currentScores);
    }

    handleGameComplete(data) {
        const { roomId, gameId, winner, results } = data;
        const room = this.rooms.get(roomId);
        
        if (!room) return;
        
        const currentGame = room.gameState.currentGame;
        if (!currentGame || currentGame.id !== gameId) {
            console.log(`Game complete ignored - wrong game: ${gameId}`);
            return; // Wrong game
        }
        
        // PREVENT MULTIPLE COMPLETIONS
        if (currentGame.completed) {
            console.log(`Game complete ignored - already completed: ${gameId}`);
            return;
        }
        
        currentGame.completed = true;
        
        // Oyun sonucunu kaydet
        const currentTime = Date.now();
        const gameResult = {
            gameIndex: room.currentGameIndex + 1,
            gameType: currentGame.type,
            winner: winner,
            results: results,
            completedAt: currentTime,
            duration: currentTime - currentGame.startTime
        };
        
        room.gameResults.push(gameResult);
        room.currentGameIndex++;
        
        console.log(`Game ${gameResult.gameIndex} completed in room ${room.name}`, gameResult);
        
        // Tüm oyunculara sonucu bildir - future ile sarmalayalım
        this.future(0).notifyGameCompleted(roomId, gameResult, room.currentGameIndex, room.gameState.totalGames);
        // Short wait before next game - PREVENT INFINITE LOOPS
        if (room.currentGameIndex < room.gameState.totalGames) {
            console.log(`Scheduling next game: ${room.currentGameIndex}/${room.gameState.totalGames}`);
            // Use future instead of setTimeout to stay in model context
            this.future(1000).continueGameSeries(roomId); // Reduced to 1 second for faster transitions
        } else {
            console.log('All games completed, finishing series');
            this.future(0).handleSeriesComplete({ roomId }); // Use future for consistency
        }
    }

    handleNextGame(data) {
        const { roomId } = data;
        this.startNextGame(roomId);
    }

    handleSeriesComplete(data) {
        const { roomId } = data;
        const room = this.rooms.get(roomId);
        
        if (!room) return;
        
        // Final sıralamasını hesapla
        const finalRankings = this.calculateFinalRankings(room);
        
        // Room durumunu güncelle
        room.status = 'finished';
        room.gameState.gameEnded = true;
        room.gameState.finalRankings = finalRankings;
        
        console.log(`Game series completed in room ${room.name}`, finalRankings);
        
        // BLOCKCHAIN KAYDI KALDIRILD - Sadece claim butonunda yapılacak
        // this.future(0).recordSeriesResultsToBlockchain(roomId, finalRankings);
        
        // Tüm oyunculara seri bitişini bildir - future ile sarmalayalım
        this.future(0).notifySeriesCompleted(roomId, finalRankings, room.gameResults, room.gameState.totalGames);
        
        // Room listesini güncelle
        this.broadcastRoomList();
    }

    recordSeriesResultsToBlockchain(roomId, finalRankings) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        console.log('🔗 Recording series results to blockchain for pending rewards...');
        
        // Her oyuncu için blockchain'e kaydet
        finalRankings.forEach(async (ranking) => {
            try {
                // Multiplier'ı kontrat formatına çevir (150 = 1.5x)
                const contractMultiplier = Math.floor(ranking.multiplier * 100);
                
                console.log(`📝 Recording result for ${ranking.playerName}: score=${ranking.score}, multiplier=${contractMultiplier}, rank=${ranking.rank}`);
                
                // Tüm oyunculara blockchain kayıt işlemini bildir
                room.players.forEach(playerId => {
                    this.publish(playerId, "blockchainRecording", {
                        playerId: ranking.playerId,
                        playerName: ranking.playerName,
                        score: ranking.score,
                        multiplier: ranking.multiplier,
                        rank: ranking.rank,
                        status: 'recording'
                    });
                });
                
                // Blockchain'e kaydet - recordGameResultWithPendingReward kullan
                // Bu işlem client-side yapılacak çünkü private key gerekli
                room.players.forEach(playerId => {
                    if (playerId === ranking.playerId) {
                        this.publish(playerId, "recordToBlockchain", {
                            score: ranking.score,
                            multiplier: contractMultiplier,
                            won: ranking.rank === 1, // Sadece 1. sıra kazanan
                            gameType: "5-game-series",
                            rank: ranking.rank
                        });
                    }
                });
                
            } catch (error) {
                console.error(`❌ Error recording result for ${ranking.playerName}:`, error);
                
                // Hata durumunda oyunculara bildir
                room.players.forEach(playerId => {
                    this.publish(playerId, "blockchainRecording", {
                        playerId: ranking.playerId,
                        playerName: ranking.playerName,
                        status: 'error',
                        error: error.message
                    });
                });
            }
        });
    }

    calculateFinalRankings(room) {
        const playerScores = {};
        
        // Her oyuncunun toplam puanını hesapla - BAŞLANGIÇ SIFIR
        room.players.forEach(playerId => {
            playerScores[playerId] = 0;
        });
        
        console.log('🎯 Calculating final rankings for 5-game series...');
        console.log('📋 Game results to process:', room.gameResults.length);
        
        // Her oyun sonucunu işle - 5 OYUNUN TOPLAM PUANI
        room.gameResults.forEach((gameResult, index) => {
            console.log(`🎮 Processing game ${index + 1}:`, gameResult);
            
            // Kazanan oyuncuya bonus puan (100 puan)
            if (gameResult.winner) {
                playerScores[gameResult.winner] = (playerScores[gameResult.winner] || 0) + 100;
                console.log(`🏆 Winner bonus: ${gameResult.winner} gets +100 points`);
            }
            
            // TÜM oyuncuların skorlarını topla (5 oyun boyunca)
            Object.entries(gameResult.results || {}).forEach(([playerId, score]) => {
                const gameScore = score || 0;
                playerScores[playerId] = (playerScores[playerId] || 0) + gameScore;
                console.log(`📊 Player ${playerId} gets +${gameScore} points from game ${index + 1}`);
            });
        });
        
        console.log('📊 TOTAL SCORES after 5 games:', playerScores);
        
        // Sıralama yap - 5 OYUNUN TOPLAM PUANI İLE
        const rankings = Object.entries(playerScores)
            .map(([playerId, totalScore]) => ({
                playerId: playerId,
                playerName: this.gameState.players[playerId]?.name || 'Unknown',
                score: totalScore, // 5 oyunun toplam puanı
                gamesWon: room.gameResults.filter(r => r.winner === playerId).length
            }))
            .sort((a, b) => b.score - a.score)
            .map((player, index) => ({
                ...player,
                rank: index + 1,
                // MULTIPLIER: 1. sıra 5x, 2. sıra 2x, 3. sıra 1.5x, diğerleri 1x
                multiplier: index === 0 ? 5 : index === 1 ? 2 : index === 2 ? 1.5 : 1
            }));
        
        console.log('🏆 FINAL RANKINGS with 5-game total scores:', rankings);
        
        // Her oyuncunun claim edeceği CP miktarını göster - DETAYLI LOG
        console.log('💰 CP TOKEN CALCULATION DETAILS:');
        rankings.forEach(ranking => {
            const claimAmount = ranking.score * ranking.multiplier;
            console.log(`   • ${ranking.playerName} (Rank ${ranking.rank}):`);
            console.log(`     - Total Score (5 games): ${ranking.score} points`);
            console.log(`     - Rank Multiplier: ${ranking.multiplier}x`);
            console.log(`     - CP Tokens to Claim: ${ranking.score} × ${ranking.multiplier} = ${claimAmount} CP`);
            console.log(`     - Games Won: ${ranking.gamesWon}/5`);
        });
        
        return rankings;
    }
}

// Multisynq View - UI güncellemelerini yönetir
class ChaosGameView extends Multisynq.View {
    constructor(model) {
        super(model);
        this.model = model;
        this.gameState = createGameState();
        this.currentPlayerId = this.viewId;
        this.playerName = '';
        this.currentRoom = null;
        this.isFrozen = false;
        this.lastChatMessage = '';
        this.lastChatTime = 0;
        
        console.log('ChaosGameView initialized:', this.sessionId, this.viewId);
        
        // Connection events
        this.subscribe(this.viewId, "connection-refused", (data) => this.onConnectionRefused(data));
        
        // Room events
        this.subscribe(this.viewId, "roomJoined", (data) => this.onRoomJoined(data));
        this.subscribe(this.viewId, "roomJoinFailed", (data) => this.onRoomJoinFailed(data));
        this.subscribe(this.viewId, "roomLeft", (data) => this.onRoomLeft(data));
        this.subscribe(this.sessionId, "roomListUpdate", (data) => this.updateRoomList(data));
        
        // Player events
        this.subscribe(this.sessionId, "playersUpdate", (data) => this.updatePlayers(data));
        this.subscribe(this.sessionId, "gameStateChanged", (data) => this.updateGameState(data));
        this.subscribe(this.sessionId, "taskUpdate", (data) => this.updateTask(data));
        this.subscribe(this.sessionId, "scoreUpdate", (data) => this.updateScore(data));
        this.subscribe(this.sessionId, "powerUp", (data) => this.showPowerUp(data));
        this.subscribe(this.sessionId, "sabotageActivated", (data) => this.handleSabotage(data));
        this.subscribe(this.sessionId, "chatUpdate", (data) => this.updateChat(data));
        
        // 10 oyunluk sistem events
        this.subscribe(this.viewId, "gameStarted", (data) => this.onGameStarted(data));
        this.subscribe(this.viewId, "gameCompleted", (data) => this.onGameCompleted(data));
        this.subscribe(this.viewId, "seriesCompleted", (data) => this.onSeriesCompleted(data));
        
        // Room deletion event
        this.subscribe(this.viewId, "roomDeleted", (data) => this.onRoomDeleted(data));
        
        // Blockchain recording events
        this.subscribe(this.viewId, "recordToBlockchain", (data) => this.handleBlockchainRecord(data));
        this.subscribe(this.viewId, "blockchainRecording", (data) => this.onBlockchainRecording(data));
        
        // Request initial room list
        this.requestRoomList();
        
        // Start game button event listener
        this.setupStartGameButton();
    }

    onConnectionRefused({ reason, maxPlayers, currentPlayers }) {
        console.log('Connection refused:', reason);
        this.showNotification(`Server full! (${currentPlayers}/${maxPlayers})`, 'error');
    }

    onRoomJoined(data) {
        console.log('Joined room:', data);
        this.currentRoom = data.roomData;
        
        // Show notification based on auto-join or manual join
        if (data.autoJoined) {
            this.showNotification(`Room "${data.roomData.name}" created and joined!`, 'success');
        } else {
            this.showNotification(`Joined room: ${data.roomData.name}!`, 'success');
        }
        
        // FORCE UI UPDATE - Room creator should see room immediately
        if (window.roomManager) {
            window.roomManager.currentRoom = data.roomData;
            window.roomManager.updateUI();
            window.roomManager.hideWelcomeScreen();
            
            // Force refresh room list to show updated room
            window.roomManager.refreshRoomsList();
        }
        
        // FORCE PLAYER RENDERING - Show creator in room immediately
        this.renderPlayers();
        
        // Initialize chat system for this room
        if (window.initializeChatSystem) {
            const user = {
                id: this.viewId,
                username: this.playerName,
                address: window.currentWalletAddress
            };
            window.initializeChatSystem(data.roomData, user, this);
        }
        
        console.log('✅ Room joined successfully, UI updated, creator auto-joined');
    }

    onRoomJoinFailed(data) {
        console.log('Failed to join room:', data);
        this.showNotification(`Failed to join room: ${data.error}`, 'error');
    }

    onRoomLeft(data) {
        console.log('Left room:', data);
        this.currentRoom = null;
        
        const message = data.reason === 'creator_left' ?
            'Room creator left, you were removed from room' :
            'Left room';
        
        this.showNotification(message, 'info');
        
        // Update UI
        if (window.roomManager) {
            window.roomManager.currentRoom = null;
            window.roomManager.updateUI();
            window.roomManager.showWelcomeScreen();
        }
        
        // Clean up chat system
        if (window.chatSystem) {
            window.chatSystem.cleanup();
        }
    }

    onRoomDeleted(data) {
        console.log('Room deleted:', data);
        
        const { reason, message } = data;
        
        // Stop any ongoing games
        this.stopGameTimer();
        this.currentGameData = null;
        this.currentRoom = null;
        
        // Show appropriate notification
        if (reason === 'creator_left') {
            this.showNotification('🚨 ' + message, 'error');
        } else {
            this.showNotification(message || 'Room deleted', 'warning');
        }
        
        // Force return to welcome screen
        if (window.roomManager) {
            window.roomManager.currentRoom = null;
            window.roomManager.updateUI();
            window.roomManager.showWelcomeScreen();
        }
        
        // Hide game area if visible
        const welcomeScreen = document.getElementById('welcomeScreen');
        const gameArea = document.getElementById('gameArea');
        
        if (welcomeScreen) welcomeScreen.style.display = 'block';
        if (gameArea) gameArea.style.display = 'none';
        
        // Clean up chat system
        if (window.chatSystem) {
            window.chatSystem.cleanup();
        }
    }

    updateRoomList(data) {
        console.log('Room list update received:', data);
        
        // Update room manager
        if (window.roomManager) {
            window.roomManager.globalRooms.clear();
            if (data.rooms) {
                data.rooms.forEach(room => {
                    window.roomManager.globalRooms.set(room.id, room);
                });
            }
            window.roomManager.refreshRoomsList();
        }
    }

    updatePlayers(data) {
        console.log('View updatePlayers called:', data);
        
        if (!data || !data.players) {
            console.warn('updatePlayers called with invalid data:', data);
            return;
        }
        
        // Ensure gameState exists
        if (!this.gameState) {
            this.gameState = createGameState();
        }
        
        this.gameState.players = data.players;
        this.gameState.scores = data.scores || {};
        
        const playerCount = Object.keys(this.gameState.players).length;
        console.log('Updating UI with player count:', playerCount);
        
        this.renderPlayers();
        this.renderScores();
    }

    updateGameState(gameState) {
        Object.assign(this.gameState, gameState);
        this.renderGameState();
    }

    updateTask(data) {
        this.gameState.currentTask = data.task;
        this.gameState.round = data.round;
        this.renderTask();
        this.startTaskTimer();
    }

    updateScore(data) {
        if (data.playerId === this.currentPlayerId) {
            this.showScoreNotification(data.points, data.speedBonus);
        }
        this.gameState.scores[data.playerId] = data.totalScore;
        this.renderScores();
    }

    showPowerUp(data) {
        if (data.playerId === this.currentPlayerId) {
            this.showNotification('🔥 COMBO BONUS! 🔥', 'success');
        }
    }

    handleSabotage(data) {
        if (data.targetId === this.currentPlayerId) {
            this.freezePlayer(data.duration);
        }
        this.showNotification(`${data.playerName} sabotaj kullandı!`, 'warning');
    }

    updateChat(data) {
        // Chat system'e mesajı ilet
        if (window.handleChatMessage) {
            window.handleChatMessage(data);
        } else {
            this.addChatMessage(data);
        }
    }

    renderPlayers() {
        const roomPlayersList = document.getElementById('roomPlayersList');
        const waitingPlayersList = document.getElementById('waitingPlayersList');
        const playersCount = document.getElementById('playersCount');
        
        if (!this.gameState || !this.gameState.players) {
            console.warn('gameState or players is undefined');
            this.gameState = this.gameState || createGameState();
            this.gameState.players = this.gameState.players || {};
        }

        // Clear existing lists
        if (roomPlayersList) roomPlayersList.innerHTML = '';
        if (waitingPlayersList) waitingPlayersList.innerHTML = '';
        
        const playerCount = Object.keys(this.gameState.players).length;
        
        // Odadaki oyuncuları göster (currentRoom'dan al)
        let roomPlayerCount = 0;
        
        if (this.currentRoom && this.currentRoom.players) {
            roomPlayerCount = this.currentRoom.players.length;
            
            console.log('Rendering players for room:', this.currentRoom.name, 'Players:', this.currentRoom.players);
            
            this.currentRoom.players.forEach((playerId, index) => {
                const player = this.gameState.players[playerId];
                if (!player) {
                    console.warn('Player not found in gameState:', playerId);
                    return;
                }
                
                // Fix undefined player names
                if (!player.name || player.name === 'undefined' || player.name.trim() === '') {
                    player.name = `Player${Math.floor(Math.random() * 1000)}`;
                    console.log('Fixed undefined player name to:', player.name);
                }
                
                const playerCard = document.createElement('div');
                playerCard.className = 'player-item';
                if (player.ready) playerCard.classList.add('ready');
                
                playerCard.innerHTML = `
                    <div class="player-info">
                        <span class="player-name">${player.name}</span>
                        ${playerId === this.currentRoom.creatorId ? '<span class="creator-badge">👑</span>' : ''}
                    </div>
                    <div class="player-status">
                        <span class="status-indicator online"></span>
                    </div>
                `;
                
                // TÜM OYUNCULAR WAITING LİSTESİNDE GÖRÜNÜR
                if (waitingPlayersList) {
                    waitingPlayersList.appendChild(playerCard);
                    console.log('✅ Added player to waiting list:', player.name || 'Unknown');
                }
            });
        }

        // Oyuncu sayısını güncelle
        if (playersCount) {
            playersCount.textContent = roomPlayerCount;
        }
        // Start Game button - sadece room creator için ve oyun bitmişse
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            const isCreator = this.currentRoom && this.currentRoom.creatorId === this.viewId;
            const hasEnoughPlayers = roomPlayerCount >= 2;
            const roomWaiting = this.currentRoom && this.currentRoom.status === 'waiting';
            const roomFinished = this.currentRoom && this.currentRoom.status === 'finished';
            const canStart = isCreator && hasEnoughPlayers && roomWaiting;
            
            console.log('🎮 Start Game Button Check:', {
                isCreator,
                hasEnoughPlayers,
                roomWaiting,
                roomFinished,
                canStart,
                viewId: this.viewId,
                creatorId: this.currentRoom?.creatorId,
                roomPlayerCount,
                currentRoomStatus: this.currentRoom?.status,
                currentRoomName: this.currentRoom?.name
            });
            
            if (canStart) {
                startGameBtn.disabled = false;
                startGameBtn.textContent = '🚀 Start Game';
                startGameBtn.style.display = 'block';
                // Remove old event listeners and add new one
                startGameBtn.replaceWith(startGameBtn.cloneNode(true));
                const newBtn = document.getElementById('startGameBtn');
                newBtn.addEventListener('click', () => {
                    console.log('Start game clicked by creator');
                    this.startGame();
                });
            } else {
                startGameBtn.disabled = true;
                if (this.currentRoom && this.currentRoom.status === 'playing') {
                    startGameBtn.textContent = '🎮 5-Game Series Running...';
                    startGameBtn.style.display = 'block';
                } else if (roomFinished) {
                    startGameBtn.textContent = '✅ Series Completed - Check Results';
                    startGameBtn.style.display = 'block';
                } else if (!isCreator) {
                    startGameBtn.textContent = '👑 Only room creator can start';
                    startGameBtn.style.display = 'block';
                } else if (!hasEnoughPlayers) {
                    startGameBtn.textContent = `🚀 Start Game (${roomPlayerCount}/2)`;
                    startGameBtn.style.display = 'block';
                } else {
                    startGameBtn.style.display = 'none';
                }
            }
        }
        console.log('✅ Players rendered successfully:', {
            roomPlayerCount,
            roomStatus: this.currentRoom?.status,
            gameStarted: this.gameState.gameStarted
        });
    }

    renderScores() {
        // Update leaderboard if exists
        const leaderboardList = document.getElementById('leaderboardList');
        if (!leaderboardList || !this.gameState.scores) return;

        const sortedScores = Object.entries(this.gameState.scores)
            .sort((a, b) => b[1] - a[1]);

        leaderboardList.innerHTML = '';
        sortedScores.forEach(([playerId, score], index) => {
            const player = this.gameState.players[playerId];
            if (!player) return;

            const scoreItem = document.createElement('div');
            scoreItem.className = 'leaderboard-item';
            if (playerId === this.currentPlayerId) {
                scoreItem.classList.add('current-player');
            }

            scoreItem.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span class="player">${player.name}</span>
                <span class="score">${score}</span>
            `;

            leaderboardList.appendChild(scoreItem);
        });
    }

    renderGameState() {
        // Update game status display
        const statusDisplay = document.getElementById('gameStatusDisplay');
        if (statusDisplay) {
            if (this.gameState.gameStarted) {
                statusDisplay.textContent = 'In Game';
                statusDisplay.className = 'status-ingame';
            } else {
                statusDisplay.textContent = 'Connected';
                statusDisplay.className = 'status-connected';
            }
        }
    }

    renderTask() {
        // This would render the current task UI
        console.log('Rendering task:', this.gameState.currentTask);
    }

    startTaskTimer() {
        // This would start the task timer
        console.log('Starting task timer for round:', this.gameState.round);
    }

    showScoreNotification(points, speedBonus) {
        let message = `+${points} puan!`;
        if (speedBonus > 0) {
            message += ` (Hız bonusu: +${speedBonus})`;
        }
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}]: ${message}`);
        
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
            color: white;
            border-radius: 5px;
            z-index: 1000;
            font-size: 14px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }

    addChatMessage(data) {
        console.log(`[${data.playerName}]: ${data.message}`);
        // Chat UI implementation would go here
    }

    freezePlayer(duration) {
        this.isFrozen = true;
        document.body.classList.add('frozen');
        
        const overlay = document.createElement('div');
        overlay.className = 'sabotage-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 150, 255, 0.3);
            z-index: 999;
            pointer-events: none;
        `;
        document.body.appendChild(overlay);
        
        this.showNotification('🧊 DONDURULDUN! 🧊', 'warning');
        
        setTimeout(() => {
            this.isFrozen = false;
            document.body.classList.remove('frozen');
            if (document.body.contains(overlay)) {
                overlay.remove();
            }
        }, duration);
    }

    async setPlayerName(playerName) {
        // Blockchain'den kullanıcı adını al - fallback ile
        let finalPlayerName = null;
        
        try {
            if (window.blockchainManager && window.userAddress) {
                const userInfo = await window.blockchainManager.getUserInfo(window.userAddress);
                if (userInfo.success && userInfo.data && userInfo.data.username && userInfo.data.username.trim() !== '') {
                    finalPlayerName = userInfo.data.username;
                    console.log('✅ Player name loaded from blockchain:', finalPlayerName);
                } else {
                    console.warn('⚠️ No blockchain username found, using fallback');
                    finalPlayerName = playerName || `Player${Math.floor(Math.random() * 1000)}`;
                }
            } else {
                console.warn('⚠️ Blockchain not available, using fallback');
                finalPlayerName = playerName || `Player${Math.floor(Math.random() * 1000)}`;
            }
        } catch (error) {
            console.error('❌ Error loading player name from blockchain:', error);
            finalPlayerName = playerName || `Player${Math.floor(Math.random() * 1000)}`;
        }
        
        // Ensure name is valid
        if (!finalPlayerName || finalPlayerName.trim() === '' || finalPlayerName === 'undefined') {
            finalPlayerName = `Player${Math.floor(Math.random() * 1000)}`;
        }
        
        this.playerName = finalPlayerName;
        window.userName = finalPlayerName;
        
        console.log(`🎯 Setting player name: ${finalPlayerName}`);
        
        this.publish(this.sessionId, "setPlayerName", {
            viewId: this.viewId,
            name: finalPlayerName
        });
        
        console.log(`✅ Player name set: ${finalPlayerName}`);
        return finalPlayerName;
    }

    createRoom(roomName, maxPlayers = 8, password = null) {
        this.publish(this.sessionId, "createRoom", {
            viewId: this.viewId,
            roomName: roomName,
            maxPlayers: maxPlayers,
            password: password
        });
        
        console.log(`Creating room: ${roomName}`);
    }

    joinRoom(roomId, password = null) {
        this.publish(this.sessionId, "joinRoom", {
            viewId: this.viewId,
            roomId: roomId,
            password: password
        });
        
        console.log(`Joining room: ${roomId}`);
    }

    leaveRoom() {
        if (this.currentRoom) {
            this.publish(this.sessionId, "leaveRoom", {
                viewId: this.viewId
            });
            
            console.log('Leaving current room');
        }
    }

    requestRoomList() {
        this.publish(this.sessionId, "requestRoomList", {
            viewId: this.viewId
        });
    }

    startGame(gameType = "mini-game") {
        if (!this.currentRoom) {
            console.warn('Cannot start game - not in a room');
            return;
        }
        
        // Only room creator can start game
        if (this.currentRoom.creatorId !== this.viewId) {
            this.showNotification('Only room creator can start the game!', 'warning');
            return;
        }
        
        // At least 2 players required
        if (!this.currentRoom.players || this.currentRoom.players.length < 2) {
            this.showNotification('At least 2 players required to start game!', 'warning');
            return;
        }
        
        // Start 5-game series
        this.publish(this.sessionId, "startGameSeries", {
            roomId: this.currentRoom.id,
            totalGames: GAMES_PER_ROOM,
            gameDuration: GAME_DURATION,
            players: this.currentRoom.players
        });
        
        console.log(`Starting ${GAMES_PER_ROOM}-game series in room: ${this.currentRoom.name}`);
        this.showNotification(`Starting ${GAMES_PER_ROOM}-game series...`, 'success');
    }

    sendChatMessage(message) {
        // SADECE 1 KEZ GÖNDER - çoklu publish engelleme
        if (this.lastChatMessage === message && (Date.now() - this.lastChatTime) < 3000) {
            console.log('❌ Duplicate chat message blocked:', message);
            return;
        }
        
        this.lastChatMessage = message;
        this.lastChatTime = Date.now();
        
        console.log('📤 Publishing single chat message:', message);
        
        this.publish(this.sessionId, "chatMessage", {
            playerId: this.currentPlayerId,
            playerName: this.playerName,
            message: message,
            timestamp: Date.now()
        });
    }

    completeTask(success, timeLeft = 0) {
        if (!this.gameState.currentTask) return;
        
        this.publish(this.sessionId, "taskComplete", {
            playerId: this.currentPlayerId,
            taskId: this.gameState.currentTask.id,
            timeLeft: timeLeft,
            success: success
        });
    }

    // 10 OYUNLUK SİSTEM EVENT HANDLER'LARI
    onGameStarted(gameData) {
        console.log('Game started:', gameData);
        
        this.currentGameData = gameData;
        this.gameStartTime = Date.now();
        
        // UI'yi oyun moduna geçir
        this.showGameArea();
        this.updateGameProgress(gameData.index, gameData.totalGames);
        this.showGameInstruction(gameData.type);
        
        // Oyun timer'ını başlat
        this.startGameTimer(gameData.duration);
        
        // Oyun tipine göre UI hazırla
        this.prepareGameUI(gameData.type);
        
        this.showNotification(`Game ${gameData.index}/${gameData.totalGames}: ${this.getGameTypeName(gameData.type)}`, 'info');
    }

    onGameCompleted(data) {
        console.log('Game completed:', data);
        
        const { gameResult, currentGameIndex, totalGames } = data;
        
        // Timer'ı durdur
        this.stopGameTimer();
        
        // Sonucu göster
        this.showGameResult(gameResult);
        
        // Progress güncelle
        this.updateGameProgress(currentGameIndex, totalGames);
        
        // Short wait before next game
        setTimeout(() => {
            if (currentGameIndex < totalGames) {
                this.showNotification(`Prepare for next game... (${currentGameIndex}/${totalGames})`, 'warning');
            }
        }, 2000);
    }

    onSeriesCompleted(data) {
        console.log('Series completed:', data);
        
        const { finalRankings, gameResults, totalGames } = data;
        
        // Timer'ı durdur
        this.stopGameTimer();
        
        // Final sonuçları göster
        this.showFinalResults(finalRankings, gameResults, totalGames);
        
        // CP claim butonunu göster
        this.showClaimButton(finalRankings);
        
        this.showNotification(`${totalGames}-game series completed!`, 'success');
    }

    // UI HELPER METODLARI
    showGameArea() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const gameArea = document.getElementById('gameArea');
        
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        if (gameArea) gameArea.style.display = 'block';
    }

    updateGameProgress(current, total) {
        const currentRound = document.getElementById('currentRound');
        if (currentRound) {
            currentRound.textContent = `Round ${current}/${total}`;
        }
    }

    showGameInstruction(gameType) {
        const taskInstruction = document.getElementById('taskInstruction');
        if (taskInstruction) {
            taskInstruction.textContent = this.getGameInstruction(gameType);
        }
    }

    startGameTimer(duration = 30000) {
        // Önceki timer'ı temizle
        this.stopGameTimer();
        
        // SADECE UI TIMER - Model timer ile koordinasyon
        this.gameTimer = setInterval(() => {
            const elapsed = Date.now() - this.gameStartTime;
            const remaining = Math.max(0, 30000 - elapsed); // Sabit 30 saniye
            const seconds = (remaining / 1000).toFixed(1);
            
            const timeLeft = document.getElementById('timeLeft');
            if (timeLeft) {
                timeLeft.textContent = seconds;
            }
            
            // UI timer sadece gösterim için - timeout Model'de handle edilir
            if (remaining <= 0) {
                this.stopGameTimer();
                // Model timer zaten çalışıyor, sadece UI'yi güncelle
                console.log('⏰ View: UI timer finished - waiting for Model timeout');
            }
        }, 100);
        
        console.log('View UI timer started: 30 seconds (Model handles timeout)');
    }

    stopGameTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    handleGameTimeout() {
        console.log('⏰ View: Game timeout - submitting current score for auto-transition');
        this.showNotification('Time up! Moving to next game...', 'warning');
        
        // Get current score from game engine if available
        let currentScore = 0;
        if (window.gameEngine && window.gameEngine.gameData && window.gameEngine.gameData.score) {
            currentScore = window.gameEngine.gameData.score;
            console.log('📊 Current score from game engine:', currentScore);
        }
        
        // Submit current score for auto-transition (not a win, but preserve score)
        this.submitGameResult(false, currentScore);
    }

    prepareGameUI(gameType) {
        // Tüm oyun UI'larını gizle
        const gameUIs = ['typingTask', 'sequenceTask', 'memoryTask'];
        gameUIs.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
        
        // Game Engine ile oyunu başlat
        if (window.gameEngine) {
            window.gameEngine.startGame(gameType, (success, score, timeElapsed) => {
                this.onGameEngineComplete(success, score, timeElapsed);
            });
        } else {
            console.error('Game Engine not loaded!');
            this.submitGameResult(false, 0);
        }
    }

    onGameEngineComplete(success, score, timeElapsed) {
        console.log(`🎮 Game Engine Complete: success=${success}, score=${score}, time=${timeElapsed}ms`);
        
        // Stop the view timer to prevent double completion
        this.stopGameTimer();
        
        // Oyun sonucunu Multisynq'a gönder - ALWAYS preserve score for progression
        this.submitGameResult(success, score || 0);
        
        // UI feedback
        if (success) {
            this.showNotification(`🎉 You won the game! (+${score} points)`, 'success');
        } else {
            this.showNotification(`⏰ Game finished with ${score} points`, 'info');
        }
        
        console.log('✅ Game result submitted to Multisynq for auto-transition');
    }

    getGameTypeName(gameType) {
        const names = {
            'asteroid-shooter': 'Asteroid Shooter',
            'dxball-breakout': 'DX-Ball Breakout',
            'snake-classic': 'Breakout Classic',
            'tetris-blocks': 'Tetris Blocks',
            'pac-man-dots': 'Pac-Man Dots',
            'space-invaders': 'Space Invaders',
            'frogger-cross': 'Frogger Cross',
            'centipede-shoot': 'Centipede Shooter',
            'missile-command': 'Missile Command',
            'defender-ship': 'Defender Ship',
            'galaga-fighter': 'Galaga Fighter',
            'dig-dug': 'Dig Dug',
            'qbert-jump': 'Q*bert Jump',
            'donkey-kong': 'Donkey Kong',
            'mario-jump': 'Mario Jump',
            'sonic-run': 'Sonic Run',
            'bubble-shooter': 'Bubble Shooter',
            'zuma-balls': 'Zuma Balls',
            'bejeweled-match': 'Bejeweled Match',
            'candy-crush': 'Candy Crush',
            'fruit-ninja': 'Fruit Ninja',
            'angry-birds': 'Angry Birds',
            'flappy-bird': 'Flappy Bird',
            'doodle-jump': 'Doodle Jump',
            'temple-run': 'Temple Run',
            'subway-surfers': 'Subway Surfers',
            'crossy-road': 'Crossy Road',
            'piano-tiles': 'Piano Tiles',
            '2048-merge': '2048 Merge',
            'color-switch': 'Color Switch'
        };
        return names[gameType] || gameType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    getGameInstruction(gameType) {
        const instructions = {
            'asteroid-shooter': 'Destroy asteroids with your spaceship!',
            'dxball-breakout': 'Break all bricks with the ball!',
            'snake-classic': 'Break bricks with the bouncing ball!',
            'tetris-blocks': 'Complete lines by fitting blocks!',
            'pac-man-dots': 'Collect all dots while avoiding ghosts!',
            'space-invaders': 'Shoot down the alien invaders!',
            'frogger-cross': 'Cross the road safely!',
            'centipede-shoot': 'Destroy the centipede segments!',
            'missile-command': 'Defend cities from missiles!',
            'defender-ship': 'Protect humanoids from aliens!',
            'galaga-fighter': 'Fight against the Galaga fleet!',
            'dig-dug': 'Inflate and pop underground enemies!',
            'qbert-jump': 'Jump on cubes to change their colors!',
            'donkey-kong': 'Climb ladders and avoid barrels!',
            'mario-jump': 'Jump over obstacles and enemies!',
            'sonic-run': 'Run fast and collect rings!',
            'bubble-shooter': 'Match 3+ bubbles to pop them!',
            'zuma-balls': 'Match colored balls before they reach the end!',
            'bejeweled-match': 'Match 3+ gems in a row!',
            'candy-crush': 'Match candies to clear the board!',
            'fruit-ninja': 'Slice fruits but avoid bombs!',
            'angry-birds': 'Launch birds to destroy pig structures!',
            'flappy-bird': 'Tap to fly through pipes!',
            'doodle-jump': 'Jump on platforms to reach higher!',
            'temple-run': 'Run and avoid obstacles!',
            'subway-surfers': 'Surf on trains and collect coins!',
            'crossy-road': 'Cross roads and rivers safely!',
            'piano-tiles': 'Tap black tiles, avoid white ones!',
            '2048-merge': 'Merge numbers to reach 2048!',
            'color-switch': 'Pass through matching colored obstacles!'
        };
        return instructions[gameType] || 'Complete the challenge to win!';
    }

    showGameResult(gameResult) {
        const winner = gameResult.winner === this.viewId;
        const message = winner ?
            `🎉 You won game ${gameResult.gameIndex}!` :
            `Game ${gameResult.gameIndex} finished. Winner: ${gameResult.winner ? this.gameState.players[gameResult.winner]?.name : 'Nobody'}`;
        
        this.showNotification(message, winner ? 'success' : 'info');
    }

    showFinalResults(rankings, gameResults, totalGames) {
        // Show final results modal or panel
        console.log('🏆 FINAL RESULTS - 5 Game Series Complete:');
        console.log('📊 Rankings:', rankings);
        console.log('🎮 Game Results:', gameResults);
        
        const myRanking = rankings.find(r => r.playerId === this.viewId);
        if (myRanking) {
            const claimAmount = myRanking.score * myRanking.multiplier;
            const message = `🏆 Final Ranking: #${myRanking.rank} (${myRanking.score} total points from ${totalGames} games, ${myRanking.gamesWon} wins) - ${claimAmount} CP tokens ready to claim!`;
            this.showNotification(message, myRanking.rank <= 3 ? 'success' : 'info');
            
            console.log('🎯 MY FINAL RESULTS:');
            console.log(`   • Rank: #${myRanking.rank}`);
            console.log(`   • Total Score (${totalGames} games): ${myRanking.score} points`);
            console.log(`   • Games Won: ${myRanking.gamesWon}/${totalGames}`);
            console.log(`   • Multiplier: ${myRanking.multiplier}x`);
            console.log(`   • CP Tokens to Claim: ${claimAmount}`);
        }
    }

    showClaimButton(rankings) {
        const myRanking = rankings.find(r => r.playerId === this.viewId);
        if (myRanking && myRanking.score > 0) {
            const claimAmount = myRanking.score * myRanking.multiplier;
            
            console.log('🎯 CLAIM BUTTON DETAILS:');
            console.log(`   • Player: ${myRanking.playerName}`);
            console.log(`   • Total Score (5 games): ${myRanking.score} points`);
            console.log(`   • Rank: #${myRanking.rank}`);
            console.log(`   • Multiplier: ${myRanking.multiplier}x`);
            console.log(`   • Claim Amount: ${claimAmount} CP tokens`);
            console.log(`   • Games Won: ${myRanking.gamesWon}/5`);
            
            // CP claim butonu oluştur
            const claimBtn = document.createElement('button');
            claimBtn.id = 'claimRewardsBtn';
            claimBtn.className = 'action-btn primary claim-btn';
            claimBtn.innerHTML = `🏆 Claim ${claimAmount.toFixed(0)} CP Tokens (5-Game Total)`;
            claimBtn.style.cssText = `
                background: linear-gradient(45deg, #FFD700, #FFA500);
                color: #000;
                font-weight: bold;
                margin: 10px auto;
                padding: 15px 25px;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                font-size: 18px;
                box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
                transition: all 0.3s ease;
                display: block;
                width: 90%;
                max-width: 300px;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 10000;
                animation: claimButtonPulse 2s infinite;
            `;
            
            // CSS animasyonu ekle
            if (!document.getElementById('claimButtonStyles')) {
                const style = document.createElement('style');
                style.id = 'claimButtonStyles';
                style.textContent = `
                    @keyframes claimButtonPulse {
                        0%, 100% { transform: translate(-50%, -50%) scale(1); }
                        50% { transform: translate(-50%, -50%) scale(1.05); }
                    }
                    .claim-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        z-index: 9999;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Overlay oluştur
            const overlay = document.createElement('div');
            overlay.className = 'claim-overlay';
            overlay.id = 'claimOverlay';
            
            // Sonuç paneli oluştur
            const resultPanel = document.createElement('div');
            resultPanel.style.cssText = `
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border: 2px solid #FFD700;
                border-radius: 15px;
                padding: 30px;
                text-align: center;
                color: white;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            `;
            
            resultPanel.innerHTML = `
                <h2 style="color: #FFD700; margin-bottom: 20px;">🎉 5-Game Series Complete!</h2>
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 24px; margin-bottom: 10px;">Final Rank: #${myRanking.rank}</div>
                    <div style="font-size: 18px; margin-bottom: 10px;">Total Score (5 games): ${myRanking.score} points</div>
                    <div style="font-size: 16px; margin-bottom: 10px;">Games Won: ${myRanking.gamesWon}/5</div>
                    <div style="font-size: 20px; color: #FFD700;">Rank Multiplier: ${myRanking.multiplier}x</div>
                    <div style="font-size: 16px; color: #90EE90; margin-top: 10px;">= ${(myRanking.score * myRanking.multiplier).toFixed(0)} CP Tokens</div>
                </div>
            `;
            
            claimBtn.addEventListener('click', () => this.handleClaimRewards(myRanking));
            claimBtn.addEventListener('mouseenter', () => {
                claimBtn.style.transform = 'translate(-50%, -50%) scale(1.1)';
                claimBtn.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.6)';
            });
            claimBtn.addEventListener('mouseleave', () => {
                claimBtn.style.transform = 'translate(-50%, -50%) scale(1)';
                claimBtn.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.4)';
            });
            
            // Overlay'e tıklayınca kapatma
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                }
            });
            
            // Eski claim butonunu ve overlay'i kaldır
            const oldBtn = document.getElementById('claimRewardsBtn');
            const oldOverlay = document.getElementById('claimOverlay');
            if (oldBtn) oldBtn.remove();
            if (oldOverlay) oldOverlay.remove();
            
            // Panel'e butonu ekle
            resultPanel.appendChild(claimBtn);
            overlay.appendChild(resultPanel);
            
            // Body'ye ekle
            document.body.appendChild(overlay);
            
            console.log(`✅ Claim button created for ${claimAmount} CP tokens (rank ${myRanking.rank})`);
            this.showNotification(`🎉 Game series completed! Rank #${myRanking.rank} - Click to claim ${claimAmount} CP tokens!`, 'success');
        }
    }

    async handleClaimRewards(ranking) {
        try {
            const claimBtn = document.getElementById('claimRewardsBtn');
            if (claimBtn) {
                claimBtn.disabled = true;
                claimBtn.innerHTML = '⏳ Processing claim...';
            }
            
            console.log('🏆 Manual claim started - using claimSeriesRewards for 5-game total...');
            
            // Parametreleri hazırla - 5 OYUNUN TOPLAM PUANI
            const totalScore = ranking.score || 0; // Bu zaten 5 oyunun toplamı
            const rank = ranking.rank || 1;
            const gamesWon = ranking.gamesWon || 0;
            const multiplier = ranking.multiplier || 1;
            const expectedClaimAmount = totalScore * multiplier;
            
            if (totalScore <= 0) {
                throw new Error('No score to claim rewards for');
            }
            
            console.log('📊 CLAIM DETAILS:');
            console.log(`   • Total Score (5 games): ${totalScore} points`);
            console.log(`   • Rank: #${rank}`);
            console.log(`   • Games Won: ${gamesWon}/5`);
            console.log(`   • Multiplier: ${multiplier}x`);
            console.log(`   • Expected CP Tokens: ${expectedClaimAmount}`);
            
            if (claimBtn) {
                claimBtn.innerHTML = '⏳ Recording to blockchain...';
            }
            
            // YENİ SİSTEM: claimSeriesRewards kullan - hem leaderboard hem CP token
            const result = await window.blockchainManager.claimSeriesRewards(totalScore, rank, gamesWon);
            
            if (result.success) {
                // Ödül miktarını ranking'den al (zaten hesaplanmış)
                const rewardAmount = expectedClaimAmount; // ranking.score * ranking.multiplier
                const message = `🎉 ${rewardAmount} CP tokens successfully claimed!`;
                this.showNotification(message, 'success');
                
                // Butonu güncelle
                if (claimBtn) {
                    claimBtn.innerHTML = '✅ Rewards Claimed!';
                    claimBtn.style.background = '#44ff44';
                    setTimeout(() => {
                        claimBtn.remove();
                        // Overlay'i de kapat
                        const overlay = document.getElementById('claimOverlay');
                        if (overlay) overlay.remove();
                    }, 3000);
                }
                
                // Bakiyeyi güncelle
                if (window.loadBalances) {
                    window.loadBalances();
                }
                
                // Leaderboard'u güncelle
                if (window.leaderboardManager) {
                    window.leaderboardManager.loadLeaderboard();
                }
                
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('Claim rewards error:', error);
            this.showNotification(`❌ Claim failed: ${error.message}`, 'error');
            
            // Butonu eski haline getir
            const claimBtn = document.getElementById('claimRewardsBtn');
            if (claimBtn) {
                claimBtn.disabled = false;
                claimBtn.innerHTML = `🏆 Claim ${(ranking.score * ranking.multiplier).toFixed(0)} CP Tokens`;
            }
        }
    }

    submitGameResult(success, score) {
        if (!this.currentGameData) {
            console.warn('⚠️ No current game data for result submission');
            return;
        }
        
        console.log(`📤 Submitting game result: success=${success}, score=${score}, gameId=${this.currentGameData.id}`);
        
        // Update current game scores in Model for real-time tracking
        if (!this.currentGameData.scores) {
            this.currentGameData.scores = {};
        }
        this.currentGameData.scores[this.viewId] = score || 0;
        
        this.publish(this.sessionId, "gameComplete", {
            roomId: this.currentGameData.roomId,
            gameId: this.currentGameData.id,
            winner: success ? this.viewId : null,
            results: {
                [this.viewId]: score || 0
            }
        });
        
        console.log('✅ Game result submitted to Model for processing');
    }

    // OYUN TİPİ HAZIRLIK METODLARI (basit implementasyonlar)
    prepareTypingGame() {
        const typingTask = document.getElementById('typingTask');
        if (typingTask) {
            typingTask.style.display = 'block';
            const input = document.getElementById('typingInput');
            if (input) {
                input.focus();
                input.value = '';
            }
        }
    }

    prepareSequenceGame() {
        const sequenceTask = document.getElementById('sequenceTask');
        if (sequenceTask) {
            sequenceTask.style.display = 'block';
        }
    }

    prepareMemoryGame() {
        const memoryTask = document.getElementById('memoryTask');
        if (memoryTask) {
            memoryTask.style.display = 'block';
        }
    }

    prepareColorMatchGame() {
        // Canvas kullanarak renk eşleştirme oyunu
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Renk kutularını çiz
        }
    }

    prepareSpeedClickGame() {
        // Canvas kullanarak hızlı tıklama oyunu
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Tıklama hedeflerini çiz
        }
    }

    setupStartGameButton() {
        // Start game button event listener'ını kur
        setTimeout(() => {
            const startGameBtn = document.getElementById('startGameBtn');
            if (startGameBtn) {
                startGameBtn.addEventListener('click', () => {
                    console.log('Start game button clicked');
                    this.startGame();
                });
                console.log('Start game button event listener attached');
            }
        }, 1000);
    }

    // BLOCKCHAIN RECORDING HANDLERS
    async handleBlockchainRecord(data) {
        const { score, multiplier, won, gameType, rank } = data;
        
        try {
            console.log(`🔗 Recording game result to blockchain: score=${score}, multiplier=${multiplier}, won=${won}, rank=${rank}`);
            
            if (!window.blockchainManager || !window.blockchainManager.isConnected) {
                throw new Error('Blockchain not connected');
            }
            
            // recordGameResultWithPendingReward kullan - pending rewards oluşturmak için
            const result = await window.blockchainManager.recordGameResultWithPendingReward(
                score,
                multiplier, // Zaten kontrat formatında (150 = 1.5x)
                won,
                gameType
            );
            
            if (result.success) {
                console.log(`✅ Blockchain record confirmed in block: ${result.blockNumber}`);
                
                // Başarılı kayıt bildirimi
                this.showNotification(`🔗 Game result recorded on blockchain! (Rank #${rank})`, 'success');
                
                // Pending rewards'u kontrol et
                setTimeout(async () => {
                    const pendingResult = await window.blockchainManager.getClaimableRewards();
                    if (pendingResult.success && pendingResult.claimableAmount > 0) {
                        console.log(`💰 Pending rewards updated: ${pendingResult.claimableAmount} CP`);
                        this.showNotification(`💰 ${pendingResult.claimableAmount} CP tokens ready to claim!`, 'info');
                    }
                }, 2000);
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('❌ Blockchain record error:', error);
            
            let errorMessage = error.message;
            if (error.message.includes('insufficient funds')) {
                errorMessage = 'Insufficient MON balance for gas fees';
            } else if (error.message.includes('user rejected')) {
                errorMessage = 'Transaction cancelled by user';
            }
            
            this.showNotification(`❌ Blockchain record failed: ${errorMessage}`, 'error');
        }
    }
    onBlockchainRecording(data) {
        const { playerId, playerName, status, error } = data;
        
        if (status === 'recording') {
            console.log(`📝 Recording ${playerName}'s result to blockchain...`);
            if (playerId === this.viewId) {
                this.showNotification(`📝 Recording your result to blockchain...`, 'info');
            }
        } else if (status === 'error') {
            console.error(`❌ Blockchain record error for ${playerName}:`, error);
            if (playerId === this.viewId) {
                this.showNotification(`❌ Blockchain record failed: ${error}`, 'error');
            }
        }
    }
}


// Model sınıfını register et - Multisynq API'ye göre zorunlu
ChaosGameModel.register('ChaosGameModel');

// Export for global use - ÖNCE EXPORT SONRA LOG
window.ChaosGameModel = ChaosGameModel;
window.ChaosGameView = ChaosGameView;

console.log("Chaos Conductor Multisynq integration loaded - Model registered:", ChaosGameModel);
console.log("ChaosGameModel available:", typeof window.ChaosGameModel);
console.log("ChaosGameView available:", typeof window.ChaosGameView);

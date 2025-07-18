// ULTRA SIMPLE Chat System - Çoklu mesaj sorunu YOK
// Sadece 1 mesaj gönderir, sadece 1 kez gösterir

class SimpleChatSystem {
    constructor() {
        this.currentRoom = null;
        this.currentUser = null;
        this.multisynqView = null;
        this.isBlocked = false; // Tek engelleme sistemi
        this.receivedMessages = new Set(); // Alınan mesajları takip et
        
        console.log('🚀 Simple Chat System initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // DOM hazır olduğunda çalış
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeUI());
        } else {
            this.initializeUI();
        }
    }

    initializeUI() {
        console.log('🔧 Setting up chat UI...');
        
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendChatBtn');
        
        if (chatInput && sendBtn) {
            // Eski listener'ları temizle
            const newChatInput = chatInput.cloneNode(true);
            const newSendBtn = sendBtn.cloneNode(true);
            
            chatInput.parentNode.replaceChild(newChatInput, chatInput);
            sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
            
            // Yeni listener'lar ekle
            newChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            newSendBtn.addEventListener('click', () => this.sendMessage());
            
            console.log('✅ Chat UI initialized');
        }
        
        // Emoji picker'ı da initialize et
        this.initializeEmojiPicker();
    }
    
    initializeEmojiPicker() {
        const toggleEmojiBtn = document.getElementById('toggleEmojiBtn');
        const emojiPicker = document.getElementById('emojiPicker');
        const emojiCategories = document.querySelectorAll('.emoji-category');
        const emojiButtons = document.querySelectorAll('.emoji-btn');
        const chatInput = document.getElementById('chatInput');
        
        if (!toggleEmojiBtn || !emojiPicker) {
            console.warn('Emoji picker elements not found');
            return;
        }
        
        // Toggle emoji picker
        toggleEmojiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isVisible = emojiPicker.style.display !== 'none';
            emojiPicker.style.display = isVisible ? 'none' : 'block';
            console.log('Emoji picker toggled:', !isVisible);
        });
        
        // Category switching
        emojiCategories.forEach(categoryBtn => {
            categoryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const category = categoryBtn.dataset.category;
                
                // Update active category
                emojiCategories.forEach(btn => btn.classList.remove('active'));
                categoryBtn.classList.add('active');
                
                // Show/hide category content
                const categoryContents = document.querySelectorAll('.emoji-category-content');
                categoryContents.forEach(content => {
                    if (content.dataset.category === category) {
                        content.style.display = 'block';
                    } else {
                        content.style.display = 'none';
                    }
                });
                
                console.log('Emoji category switched to:', category);
            });
        });
        
        // Emoji selection
        emojiButtons.forEach(emojiBtn => {
            emojiBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const emoji = emojiBtn.textContent;
                
                if (chatInput) {
                    // Insert emoji at cursor position
                    const cursorPos = chatInput.selectionStart;
                    const textBefore = chatInput.value.substring(0, cursorPos);
                    const textAfter = chatInput.value.substring(chatInput.selectionEnd);
                    
                    chatInput.value = textBefore + emoji + textAfter;
                    chatInput.focus();
                    
                    // Set cursor position after emoji
                    const newPos = cursorPos + emoji.length;
                    chatInput.setSelectionRange(newPos, newPos);
                    
                    console.log('Emoji inserted:', emoji);
                }
                
                // Hide emoji picker after selection
                emojiPicker.style.display = 'none';
            });
        });
        
        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            if (!emojiPicker.contains(e.target) && !toggleEmojiBtn.contains(e.target)) {
                emojiPicker.style.display = 'none';
            }
        });
        
        console.log('✅ Emoji picker initialized with', emojiButtons.length, 'emojis');
    }

    setRoom(room) {
        this.currentRoom = room;
        this.clearMessages();
        
        if (room) {
            this.showChatSection();
            this.addSystemMessage(`${room.name} you joined the room`);
        } else {
            this.hideChatSection();
        }
    }

    setUser(user) {
        this.currentUser = user;
    }

    setMultisynqView(view) {
        this.multisynqView = view;
    }

    sendMessage() {
        // Engelleme kontrolü
        if (this.isBlocked) {
            console.log('❌ Message blocked - already sending');
            return;
        }

        const chatInput = document.getElementById('chatInput');
        if (!chatInput) return;

        const message = chatInput.value.trim();
        if (!message || !this.currentRoom || !this.multisynqView) return;

        // Engelle
        this.isBlocked = true;
        console.log('🔒 Message sending blocked for 2 seconds');

        // Input'u temizle
        chatInput.value = '';

        try {
            // Mesajı gönder
            this.multisynqView.sendChatMessage(message);
            console.log('📤 Message sent:', message);
        } catch (error) {
            console.error('❌ Send error:', error);
            chatInput.value = message; // Geri koy
        }

        // 2 saniye sonra engeli kaldır
        setTimeout(() => {
            this.isBlocked = false;
            console.log('🔓 Message sending unblocked');
        }, 2000);
    }

    receiveMessage(data) {
        console.log('📥 Receiving message:', data);
        
        const { playerId, playerName, message, timestamp } = data;
        if (!message) return;

        // UNIQUE MESSAGE ID oluştur
        const messageId = `${playerId}_${message}_${timestamp}`;
        
        // Daha önce alındı mı kontrol et
        if (this.receivedMessages.has(messageId)) {
            console.log('❌ DUPLICATE MESSAGE BLOCKED:', messageId);
            return;
        }
        
        // Mesajı kaydet
        this.receivedMessages.add(messageId);
        console.log('✅ NEW MESSAGE ACCEPTED:', messageId);

        const messageData = {
            playerId: playerId,
            playerName: playerName || 'Unknown',
            message: String(message),
            timestamp: timestamp || Date.now(),
            isOwn: playerId === (this.currentUser?.id || this.multisynqView?.viewId)
        };

        this.displayMessage(messageData);
        
        // Set'i temizle (100 mesajdan fazla olmasın)
        if (this.receivedMessages.size > 100) {
            const firstItem = this.receivedMessages.values().next().value;
            this.receivedMessages.delete(firstItem);
        }
    }

    displayMessage(messageData) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${messageData.isOwn ? 'own' : 'other'}`;
        
        const timeStr = new Date(messageData.timestamp).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageElement.innerHTML = `
            ${!messageData.isOwn ? `<div class="sender">${messageData.playerName}</div>` : ''}
            <div class="content">${this.escapeHtml(messageData.message)}</div>
            <div class="timestamp">${timeStr}</div>
        `;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Mesaj limitini koru (son 30 mesaj)
        const messages = chatMessages.querySelectorAll('.chat-message');
        if (messages.length > 30) {
            messages[0].remove();
        }
    }

    addSystemMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const systemMessage = document.createElement('div');
        systemMessage.className = 'chat-message system';
        
        const timestamp = new Date().toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        systemMessage.innerHTML = `
            <div class="content">
                <span class="system-time">${timestamp}</span>
                <em>🤖 ${message}</em>
            </div>
        `;

        chatMessages.appendChild(systemMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showChatSection() {
        const chatSection = document.getElementById('chatSection');
        if (chatSection) {
            chatSection.style.display = 'flex';
        }
    }

    hideChatSection() {
        const chatSection = document.getElementById('chatSection');
        if (chatSection) {
            chatSection.style.display = 'none';
        }
    }

    clearMessages() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        // Alınan mesaj takibini de temizle
        this.receivedMessages.clear();
        console.log('🧹 Messages and tracking cleared');
    }

    cleanup() {
        this.currentRoom = null;
        this.clearMessages();
        this.hideChatSection();
    }
}

// Global instance - SADECE 1 KEZ
if (!window.simpleChatSystem) {
    window.simpleChatSystem = new SimpleChatSystem();
    console.log('✅ Simple Chat System created');
}

// Global fonksiyonlar
window.initializeChatSystem = function(room, user, multisynqView) {
    console.log('🔧 Initializing simple chat system');
    
    if (window.simpleChatSystem) {
        window.simpleChatSystem.setRoom(room);
        window.simpleChatSystem.setUser(user);
        window.simpleChatSystem.setMultisynqView(multisynqView);
    }
};

window.handleChatMessage = function(data) {
    console.log('📨 Handling chat message');
    if (window.simpleChatSystem) {
        window.simpleChatSystem.receiveMessage(data);
    }
};

// Eski chat system'i temizle
window.chatSystem = window.simpleChatSystem;

console.log("🚀 ULTRA SIMPLE Chat System loaded - NO DUPLICATE MESSAGES!");
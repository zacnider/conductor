// Chaos Conductor - Multisynq Integration
// Bu dosya Multisynq session'ını başlatır ve room manager ile entegre eder

const MULTISYNQ_CONFIG = {
    apiKey: '2dNJ78OxelBvHA8vNqKR3r8Sf1W2RKELUYsuZo0whf',
    appId: 'com.chaosconductor.game',
    userId: '6876a905e273b89ce27dd663'
};

class ChaosMultisynqIntegration {
    constructor() {
        this.session = null;
        this.view = null;
        this.isConnected = false;
        this.currentUser = null;
    }

    async initializeMultisynq(user) {
        try {
            this.currentUser = user;
            
            console.log('Initializing Multisynq session...');
            
            // Check if Multisynq classes are available
            if (typeof window.ChaosGameModel === 'undefined' || typeof window.ChaosGameView === 'undefined') {
                console.error('ChaosGameModel or ChaosGameView not available');
                throw new Error('Multisynq classes not loaded. Please refresh the page.');
            }
            
            console.log('✅ ChaosGameModel available:', typeof window.ChaosGameModel);
            console.log('✅ ChaosGameView available:', typeof window.ChaosGameView);
            
            // Multisynq session'ını başlat - TÜM KULLANICILAR AYNI SESSION'A BAĞLANMALI
            this.session = await Multisynq.Session.join({
                apiKey: MULTISYNQ_CONFIG.apiKey,
                appId: MULTISYNQ_CONFIG.appId,
                name: 'chaos-main-room', // SABIT session name - tüm kullanıcılar aynı session'a bağlanır
                password: 'chaos2025', // Required password
                model: window.ChaosGameModel,
                view: window.ChaosGameView,
                debug: ["session", "messages"],
                tps: 30,
                eventRateLimit: 30
            });

            this.view = this.session.view;
            this.isConnected = true;

            console.log('Multisynq session initialized:', this.session.id);

            // Room manager'ı Multisynq ile entegre et
            if (window.roomManager) {
                await window.roomManager.setMultisynqSession(this.session, this.view);
                window.roomManager.setUser(user);
            }

            // View'a kullanıcı bilgilerini gönder ve blockchain'den username'i al
            if (this.view && this.view.setPlayerName) {
                await this.view.setPlayerName(user.username);
            }

            return {
                session: this.session,
                view: this.view,
                success: true
            };

        } catch (error) {
            console.error('Failed to initialize Multisynq:', error);
            this.isConnected = false;
            
            return {
                session: null,
                view: null,
                success: false,
                error: error.message
            };
        }
    }

    async disconnect() {
        try {
            if (this.session) {
                await this.session.leave();
                this.session = null;
                this.view = null;
                this.isConnected = false;
                console.log('Multisynq session disconnected');
            }
        } catch (error) {
            console.error('Error disconnecting from Multisynq:', error);
        }
    }

    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            sessionId: this.session ? this.session.id : null,
            viewId: this.view ? this.view.viewId : null
        };
    }

    // Utility method to send events to the model
    publishToModel(eventName, data) {
        if (this.view && this.session) {
            this.view.publish(this.session.id, eventName, data);
        }
    }

    // Utility method to subscribe to model events
    subscribeToModel(eventName, handler) {
        if (this.view && this.session) {
            this.view.subscribe(this.session.id, eventName, handler);
        }
    }
}

// Global instance
window.chaosMultisynq = new ChaosMultisynqIntegration();

// Helper function to initialize Multisynq when user is ready
window.initializeChaosMultisynq = async function(user) {
    if (!user || !user.username || !user.address) {
        console.error('Invalid user data for Multisynq initialization');
        return { success: false, error: 'Invalid user data' };
    }

    return await window.chaosMultisynq.initializeMultisynq(user);
};

// Helper function to disconnect
window.disconnectChaosMultisynq = async function() {
    await window.chaosMultisynq.disconnect();
};

console.log('Chaos Multisynq Integration loaded');
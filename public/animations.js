// Framer Motion Animations for Chaos Conductor
// Since we're using vanilla JS, we'll create CSS-based animations with JS triggers

class AnimationManager {
    constructor() {
        this.initializeAnimations();
    }

    initializeAnimations() {
        // Add CSS animations dynamically
        this.addAnimationStyles();
        
        // Setup intersection observer for scroll animations
        this.setupScrollAnimations();
        
        // Setup hover animations
        this.setupHoverAnimations();
    }

    addAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Fade In Animation */
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* Slide In From Left */
            @keyframes slideInLeft {
                from { opacity: 0; transform: translateX(-50px); }
                to { opacity: 1; transform: translateX(0); }
            }

            /* Slide In From Right */
            @keyframes slideInRight {
                from { opacity: 0; transform: translateX(50px); }
                to { opacity: 1; transform: translateX(0); }
            }

            /* Scale In Animation */
            @keyframes scaleIn {
                from { opacity: 0; transform: scale(0.8); }
                to { opacity: 1; transform: scale(1); }
            }

            /* Bounce Animation */
            @keyframes bounce {
                0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
                40%, 43% { transform: translate3d(0, -30px, 0); }
                70% { transform: translate3d(0, -15px, 0); }
                90% { transform: translate3d(0, -4px, 0); }
            }

            /* Pulse Animation */
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            /* Shake Animation */
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
                20%, 40%, 60%, 80% { transform: translateX(10px); }
            }

            /* Glow Animation */
            @keyframes glow {
                0% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
                50% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 30px rgba(255, 215, 0, 0.6); }
                100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
            }

            /* Animation Classes */
            .animate-fade-in {
                animation: fadeIn 0.6s ease-out forwards;
            }

            .animate-slide-in-left {
                animation: slideInLeft 0.8s ease-out forwards;
            }

            .animate-slide-in-right {
                animation: slideInRight 0.8s ease-out forwards;
            }

            .animate-scale-in {
                animation: scaleIn 0.5s ease-out forwards;
            }

            .animate-bounce {
                animation: bounce 1s ease-in-out;
            }

            .animate-pulse {
                animation: pulse 2s ease-in-out infinite;
            }

            .animate-shake {
                animation: shake 0.5s ease-in-out;
            }

            .animate-glow {
                animation: glow 2s ease-in-out infinite;
            }

            /* Hover Effects */
            .hover-lift {
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }

            .hover-lift:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            }

            .hover-scale {
                transition: transform 0.3s ease;
            }

            .hover-scale:hover {
                transform: scale(1.05);
            }

            /* Loading Spinner */
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .loading-spinner {
                animation: spin 1s linear infinite;
            }

            /* Stagger Animation Delays */
            .stagger-1 { animation-delay: 0.1s; }
            .stagger-2 { animation-delay: 0.2s; }
            .stagger-3 { animation-delay: 0.3s; }
            .stagger-4 { animation-delay: 0.4s; }
            .stagger-5 { animation-delay: 0.5s; }

            /* Initially hidden for scroll animations */
            .scroll-animate {
                opacity: 0;
                transform: translateY(30px);
                transition: opacity 0.6s ease, transform 0.6s ease;
            }

            .scroll-animate.visible {
                opacity: 1;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);
    }

    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements that should animate on scroll
        document.querySelectorAll('.scroll-animate').forEach(el => {
            observer.observe(el);
        });
    }

    setupHoverAnimations() {
        // Add hover effects to buttons and interactive elements
        document.querySelectorAll('button, .room-item, .user-item').forEach(el => {
            el.classList.add('hover-lift');
        });

        // Add scale effect to game cards
        document.querySelectorAll('.game-card, .leaderboard-item').forEach(el => {
            el.classList.add('hover-scale');
        });
    }

    // Animation trigger methods
    animateElement(element, animationType, delay = 0) {
        setTimeout(() => {
            element.classList.add(`animate-${animationType}`);
        }, delay);
    }

    animateWalletConnection() {
        const walletSection = document.querySelector('.wallet-section');
        if (walletSection) {
            this.animateElement(walletSection, 'scale-in');
        }
    }

    animateRoomJoin() {
        const roomList = document.querySelector('.room-list');
        if (roomList) {
            this.animateElement(roomList, 'fade-in');
        }
    }

    animateGameStart() {
        const gameArea = document.querySelector('#gameArea');
        if (gameArea) {
            this.animateElement(gameArea, 'bounce');
        }
    }

    animateScoreUpdate(scoreElement) {
        if (scoreElement) {
            scoreElement.classList.add('animate-pulse');
            setTimeout(() => {
                scoreElement.classList.remove('animate-pulse');
            }, 2000);
        }
    }

    animateTokenReward(amount) {
        // Create floating token animation
        const tokenFloat = document.createElement('div');
        tokenFloat.innerHTML = `+${amount} CP`;
        tokenFloat.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ffd700;
            font-size: 24px;
            font-weight: bold;
            pointer-events: none;
            z-index: 1000;
            animation: tokenFloat 2s ease-out forwards;
        `;

        // Add token float animation
        const tokenStyle = document.createElement('style');
        tokenStyle.textContent = `
            @keyframes tokenFloat {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -150px) scale(1.2); }
            }
        `;
        document.head.appendChild(tokenStyle);
        document.body.appendChild(tokenFloat);

        setTimeout(() => {
            document.body.removeChild(tokenFloat);
            document.head.removeChild(tokenStyle);
        }, 2000);
    }

    animateLeaderboardUpdate() {
        const leaderboard = document.querySelector('.leaderboard');
        if (leaderboard) {
            const items = leaderboard.querySelectorAll('.leaderboard-item');
            items.forEach((item, index) => {
                item.classList.add(`stagger-${Math.min(index + 1, 5)}`);
                this.animateElement(item, 'slide-in-left', index * 100);
            });
        }
    }

    animateError(element) {
        if (element) {
            element.classList.add('animate-shake');
            setTimeout(() => {
                element.classList.remove('animate-shake');
            }, 500);
        }
    }

    animateSuccess(element) {
        if (element) {
            element.classList.add('animate-glow');
            setTimeout(() => {
                element.classList.remove('animate-glow');
            }, 2000);
        }
    }

    // Stagger animation for lists
    staggerAnimate(elements, animationType, delay = 100) {
        elements.forEach((element, index) => {
            this.animateElement(element, animationType, index * delay);
        });
    }

    // Page transition animations
    pageTransition(fromElement, toElement) {
        if (fromElement) {
            fromElement.style.animation = 'fadeOut 0.3s ease-out forwards';
        }
        
        setTimeout(() => {
            if (toElement) {
                toElement.style.animation = 'fadeIn 0.3s ease-out forwards';
            }
        }, 300);
    }

    // Loading animation
    showLoading(element) {
        element.innerHTML = '<div class="loading-spinner">⟳</div>';
    }

    hideLoading(element, originalContent) {
        element.innerHTML = originalContent;
    }
}

// Initialize animation manager
const animationManager = new AnimationManager();

// Export for use in other files
window.animationManager = animationManager;

// Auto-animate elements on page load
document.addEventListener('DOMContentLoaded', () => {
    // Animate header
    const header = document.querySelector('.top-banner');
    if (header) {
        animationManager.animateElement(header, 'slide-in-left');
    }

    // Animate main sections with stagger
    const sections = document.querySelectorAll('.wallet-section, .game-lobby, .leaderboard');
    animationManager.staggerAnimate(sections, 'fade-in', 200);

    // Add scroll animation class to appropriate elements
    document.querySelectorAll('.room-item, .user-item, .leaderboard-item').forEach(el => {
        el.classList.add('scroll-animate');
    });

    // Re-setup scroll animations after DOM changes
    setTimeout(() => {
        animationManager.setupScrollAnimations();
    }, 100);
});

// Export animation functions for global use
window.animateWalletConnection = () => animationManager.animateWalletConnection();
window.animateRoomJoin = () => animationManager.animateRoomJoin();
window.animateGameStart = () => animationManager.animateGameStart();
window.animateScoreUpdate = (element) => animationManager.animateScoreUpdate(element);
window.animateTokenReward = (amount) => animationManager.animateTokenReward(amount);
window.animateLeaderboardUpdate = () => animationManager.animateLeaderboardUpdate();
window.animateError = (element) => animationManager.animateError(element);
window.animateSuccess = (element) => animationManager.animateSuccess(element);
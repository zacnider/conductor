// Enhanced Wallet Manager for Chaos Conductor
// Multi-wallet support with MetaMask, WalletConnect, and other providers

class EnhancedWalletManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.chainId = null;
        this.isConnected = false;
        this.walletType = null;
        
        // Supported wallets
        this.supportedWallets = {
            metamask: {
                name: 'MetaMask',
                icon: '🦊',
                check: () => typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask
            },
            coinbase: {
                name: 'Coinbase Wallet',
                icon: '🔵',
                check: () => typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet
            },
            walletconnect: {
                name: 'WalletConnect',
                icon: '🔗',
                check: () => true // Always available as fallback
            }
        };
        
        this.monadTestnet = {
            chainId: '0x279F', // 10143 in hex
            chainName: 'Monad Testnet',
            nativeCurrency: {
                name: 'MON',
                symbol: 'MON',
                decimals: 18
            },
            rpcUrls: ['https://testnet-rpc.monad.xyz'],
            blockExplorerUrls: ['https://testnet.monadexplorer.com']
        };
        
        this.setupEventListeners();
    }
    
    // Get available wallets
    getAvailableWallets() {
        const available = [];
        for (const [key, wallet] of Object.entries(this.supportedWallets)) {
            if (wallet.check()) {
                available.push({
                    id: key,
                    name: wallet.name,
                    icon: wallet.icon
                });
            }
        }
        return available;
    }
    
    // Connect to specific wallet
    async connectWallet(walletType = 'metamask') {
        try {
            this.walletType = walletType;
            
            switch (walletType) {
                case 'metamask':
                    return await this.connectMetaMask();
                case 'coinbase':
                    return await this.connectCoinbase();
                case 'walletconnect':
                    return await this.connectWalletConnect();
                default:
                    throw new Error('Unsupported wallet type');
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async connectMetaMask() {
        if (!window.ethereum || !window.ethereum.isMetaMask) {
            throw new Error('MetaMask not found. Please install MetaMask.');
        }
        
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        this.account = accounts[0];
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        
        await this.checkAndSwitchNetwork();
        
        this.isConnected = true;
        this.walletType = 'metamask';
        
        return {
            success: true,
            account: this.account,
            walletType: this.walletType
        };
    }
    
    async connectCoinbase() {
        if (!window.ethereum || !window.ethereum.isCoinbaseWallet) {
            throw new Error('Coinbase Wallet not found. Please install Coinbase Wallet.');
        }
        
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        this.account = accounts[0];
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        
        await this.checkAndSwitchNetwork();
        
        this.isConnected = true;
        this.walletType = 'coinbase';
        
        return {
            success: true,
            account: this.account,
            walletType: this.walletType
        };
    }
    
    async connectWalletConnect() {
        // For now, fallback to MetaMask if available
        if (window.ethereum) {
            return await this.connectMetaMask();
        }
        
        throw new Error('No wallet provider found. Please install a Web3 wallet.');
    }
    
    async checkAndSwitchNetwork() {
        const network = await this.provider.getNetwork();
        this.chainId = Number(network.chainId);
        
        if (this.chainId !== 10143) {
            await this.switchToMonadTestnet();
        }
    }
    
    async switchToMonadTestnet() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: this.monadTestnet.chainId }],
            });
        } catch (switchError) {
            // If network doesn't exist, add it
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [this.monadTestnet]
                });
            } else {
                throw switchError;
            }
        }
    }
    
    async disconnect() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.chainId = null;
        this.isConnected = false;
        this.walletType = null;
        
        // Clear any stored connection data
        localStorage.removeItem('walletconnect');
        localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
        
        return { success: true };
    }
    
    async getBalance(address = null) {
        if (!this.provider) {
            return { success: false, error: 'No provider available' };
        }
        
        try {
            const targetAddress = address || this.account;
            const balance = await this.provider.getBalance(targetAddress);
            
            return {
                success: true,
                balance: ethers.formatEther(balance),
                formatted: `${parseFloat(ethers.formatEther(balance)).toFixed(4)} MON`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    setupEventListeners() {
        if (typeof window !== 'undefined' && window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnect();
                    this.onAccountsChanged([]);
                } else {
                    this.account = accounts[0];
                    this.onAccountsChanged(accounts);
                }
            });
            
            window.ethereum.on('chainChanged', (chainId) => {
                this.chainId = parseInt(chainId, 16);
                this.onChainChanged(chainId);
            });
            
            window.ethereum.on('disconnect', () => {
                this.disconnect();
                this.onDisconnect();
            });
        }
    }
    
    // Event callbacks (can be overridden)
    onAccountsChanged(accounts) {
        console.log('Accounts changed:', accounts);
        // Trigger UI update
        if (window.updateWalletUI) {
            window.updateWalletUI();
        }
    }
    
    onChainChanged(chainId) {
        console.log('Chain changed:', chainId);
        // Reload page to reset state
        window.location.reload();
    }
    
    onDisconnect() {
        console.log('Wallet disconnected');
        // Trigger UI update
        if (window.updateWalletUI) {
            window.updateWalletUI();
        }
    }
    
    // Utility methods
    isValidAddress(address) {
        try {
            return ethers.isAddress(address);
        } catch {
            return false;
        }
    }
    
    shortenAddress(address, chars = 4) {
        if (!address) return '';
        return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
    }
    
    async signMessage(message) {
        if (!this.signer) {
            throw new Error('No signer available');
        }
        
        return await this.signer.signMessage(message);
    }
    
    // Auto-reconnect on page load
    async autoConnect() {
        // Check if user was previously connected
        const lastWallet = localStorage.getItem('lastConnectedWallet');
        if (lastWallet && this.supportedWallets[lastWallet]?.check()) {
            try {
                await this.connectWallet(lastWallet);
                return true;
            } catch (error) {
                console.log('Auto-connect failed:', error);
                localStorage.removeItem('lastConnectedWallet');
            }
        }
        return false;
    }
    
    // Save connection preference
    saveConnectionPreference() {
        if (this.walletType) {
            localStorage.setItem('lastConnectedWallet', this.walletType);
        }
    }
}

// Create global instance
window.enhancedWalletManager = new EnhancedWalletManager();

// Auto-connect on page load
document.addEventListener('DOMContentLoaded', async () => {
    await window.enhancedWalletManager.autoConnect();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedWalletManager;
}
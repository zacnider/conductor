// RainbowKit Configuration for Monad Testnet
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';

// Monad Testnet Chain Configuration
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
};

export const config = getDefaultConfig({
  appName: 'Chaos Conductor',
  projectId: 'YOUR_PROJECT_ID', // Get this from WalletConnect Cloud
  chains: [monadTestnet, mainnet, polygon, optimism, arbitrum, base],
  ssr: false, // If your dApp uses server side rendering (SSR)
});

// Enhanced Wallet Connection Manager with RainbowKit
class RainbowKitWalletManager {
    constructor() {
        this.isConnected = false;
        this.account = null;
        this.chainId = null;
        this.provider = null;
    }

    async initialize() {
        // RainbowKit will be initialized when the page loads
        console.log('RainbowKit Wallet Manager initialized');
    }

    async connectWallet() {
        try {
            // This will be handled by RainbowKit's connect button
            // But we can also programmatically trigger connection
            if (typeof window.ethereum !== 'undefined') {
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                
                this.account = accounts[0];
                this.isConnected = true;
                
                // Check if we're on Monad Testnet
                const chainId = await window.ethereum.request({
                    method: 'eth_chainId'
                });
                
                this.chainId = parseInt(chainId, 16);
                
                if (this.chainId !== 10143) {
                    await this.switchToMonadTestnet();
                }
                
                return {
                    success: true,
                    account: this.account,
                    chainId: this.chainId
                };
            } else {
                throw new Error('No wallet found');
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async switchToMonadTestnet() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x279F' }], // 10143 in hex
            });
        } catch (switchError) {
            // If network doesn't exist, add it
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x279F',
                        chainName: 'Monad Testnet',
                        nativeCurrency: {
                            name: 'MON',
                            symbol: 'MON',
                            decimals: 18
                        },
                        rpcUrls: ['https://testnet-rpc.monad.xyz'],
                        blockExplorerUrls: ['https://testnet.monadexplorer.com']
                    }]
                });
            }
        }
    }

    async disconnect() {
        this.isConnected = false;
        this.account = null;
        this.chainId = null;
        this.provider = null;
    }

    onAccountsChanged(accounts) {
        if (accounts.length === 0) {
            this.disconnect();
        } else {
            this.account = accounts[0];
        }
    }

    onChainChanged(chainId) {
        this.chainId = parseInt(chainId, 16);
        if (this.chainId !== 10143) {
            console.warn('Please switch to Monad Testnet');
        }
    }

    setupEventListeners() {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', this.onAccountsChanged.bind(this));
            window.ethereum.on('chainChanged', this.onChainChanged.bind(this));
        }
    }
}

// Export the enhanced wallet manager
export const rainbowKitWalletManager = new RainbowKitWalletManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    rainbowKitWalletManager.initialize();
    rainbowKitWalletManager.setupEventListeners();
});
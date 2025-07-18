// Simplified Blockchain Integration for Chaos Conductor
// Works with Multisynq for multiplayer functionality

class SimplifiedBlockchainManager {
    constructor() {
        this.web3Provider = null;
        this.signer = null;
        this.userAddress = null;
        this.contracts = {};
        this.isConnected = false;
        
        // Simplified contract addresses (updated after deployment)
        this.contractAddresses = {
            cpToken: '0x0fCCda7a7447E82bf51e36166489706441E709f5',
            chaosCore: '0xBe5d5A054Bbbc1729e1a1199eAaea3cb993321c8'
        };
        
        // Simplified contract ABIs
        this.contractABIs = {
            cpToken: [
                "function balanceOf(address account) external view returns (uint256)",
                "function name() external view returns (string memory)",
                "function symbol() external view returns (string memory)",
                "function decimals() external view returns (uint8)"
            ],
            chaosCore: [
                "function registerUser(string memory _username) external",
                "function getUser(address _user) external view returns (string memory username, uint256 totalScore, uint256 gamesPlayed, uint256 gamesWon, uint256 totalEarnings, uint256 registrationTime, bool registered)",
                "function getLeaderboard(uint256 _limit) external view returns (address[] memory addresses, string[] memory usernames, uint256[] memory scores)",
                "function getUserRank(address _user) external view returns (uint256 rank)",
                "function recordGameResult(address _player, uint256 _score, uint256 _multiplier, bool _won, string memory _gameType) external",
                "function recordGameResultWithPendingReward(address _player, uint256 _score, uint256 _multiplier, bool _won, string memory _gameType) external",
                "function claimGameRewards() external",
                "function getPendingRewards(address _user) external view returns (uint256)",
                "function getTotalUsers() external view returns (uint256)",
                "function setBaseReward(uint256 _baseReward) external",
                "function setMultiplier(uint256 _multiplier, uint256 _percentage) external",
                "function claimSeriesRewards(uint256 _totalScore, uint256 _rank, uint256 _gamesWon) external"
            ],
            cpToken: [
                "function balanceOf(address account) external view returns (uint256)",
                "function name() external view returns (string memory)",
                "function symbol() external view returns (string memory)",
                "function decimals() external view returns (uint8)",
                "function mint(address to, uint256 amount) external",
                "function transfer(address to, uint256 amount) external returns (bool)"
            ]
        };
    }
    
    // Enhanced wallet connection with multi-EVM support
    async connectWallet(walletType = 'auto') {
        try {
            let provider = null;
            
            // Auto-detect or specific wallet selection
            if (walletType === 'auto' || walletType === 'metamask') {
                if (typeof window.ethereum !== 'undefined') {
                    // Handle multiple wallet providers
                    if (window.ethereum.providers && window.ethereum.providers.length > 0) {
                        // Find MetaMask if available
                        provider = window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum.providers[0];
                    } else {
                        provider = window.ethereum;
                    }
                }
            }
            
            // WalletConnect support
            if (walletType === 'walletconnect' && window.WalletConnect) {
                // WalletConnect implementation would go here
                throw new Error("WalletConnect not implemented yet");
            }
            
            // Coinbase Wallet support
            if (walletType === 'coinbase' && window.ethereum?.isCoinbaseWallet) {
                provider = window.ethereum;
            }
            
            if (!provider) {
                throw new Error("No compatible wallet found. Please install MetaMask or another EVM wallet.");
            }
            
            // Request account access
            const accounts = await provider.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length === 0) {
                throw new Error("No accounts found");
            }
            
            this.userAddress = accounts[0];
            this.web3Provider = new ethers.BrowserProvider(provider);
            this.signer = await this.web3Provider.getSigner();
            
            await this.checkNetwork();
            await this.initializeContracts();
            
            this.isConnected = true;
            
            console.log("Wallet connected:", this.userAddress);
            
            // Trigger wallet connected event
            this.dispatchWalletEvent('connected', {
                address: this.userAddress,
                provider: provider.isMetaMask ? 'MetaMask' : 'Unknown'
            });
            
            return {
                success: true,
                address: this.userAddress,
                provider: provider.isMetaMask ? 'MetaMask' : 'Unknown'
            };
            
        } catch (error) {
            console.error("Wallet connection error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Enhanced disconnect function
    async disconnectWallet() {
        try {
            // Clear all connection data
            this.web3Provider = null;
            this.signer = null;
            this.userAddress = null;
            this.contracts = {};
            this.isConnected = false;
            
            // Trigger wallet disconnected event
            this.dispatchWalletEvent('disconnected', {});
            
            console.log("Wallet disconnected successfully");
            
            return {
                success: true,
                message: "Wallet disconnected successfully"
            };
            
        } catch (error) {
            console.error("Wallet disconnect error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Wallet event dispatcher
    dispatchWalletEvent(eventType, data) {
        const event = new CustomEvent(`wallet-${eventType}`, {
            detail: data
        });
        window.dispatchEvent(event);
    }
    
    async checkNetwork() {
        const network = await this.web3Provider.getNetwork();
        const monadTestnetChainId = 10143;
        
        if (Number(network.chainId) !== monadTestnetChainId) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x279F' }],
                });
            } catch (switchError) {
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
    }
    
    async initializeContracts() {
        if (this.contractAddresses.cpToken) {
            this.contracts.cpToken = new ethers.Contract(
                this.contractAddresses.cpToken,
                this.contractABIs.cpToken,
                this.signer
            );
        }
        
        if (this.contractAddresses.chaosCore) {
            this.contracts.chaosCore = new ethers.Contract(
                this.contractAddresses.chaosCore,
                this.contractABIs.chaosCore,
                this.signer
            );
        }
    }
    
    // User Management
    async registerUser(username) {
        try {
            if (!this.contracts.chaosCore) {
                throw new Error("ChaosCore contract not initialized");
            }
            
            const tx = await this.contracts.chaosCore.registerUser(username);
            await tx.wait();
            
            return {
                success: true,
                txHash: tx.hash
            };
        } catch (error) {
            console.error("User registration error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async getUserInfo(address = null) {
        try {
            const userAddress = address || this.userAddress;
            if (!this.contracts.chaosCore) {
                throw new Error("ChaosCore contract not initialized");
            }
            
            const userInfo = await this.contracts.chaosCore.getUser(userAddress);
            
            return {
                success: true,
                data: {
                    username: userInfo[0],
                    totalScore: Number(userInfo[1]),
                    gamesPlayed: Number(userInfo[2]),
                    gamesWon: Number(userInfo[3]),
                    totalEarnings: ethers.formatEther(userInfo[4]),
                    registrationTime: Number(userInfo[5]),
                    isRegistered: userInfo[6]
                }
            };
        } catch (error) {
            console.error("Get user info error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async isUserRegistered(address = null) {
        try {
            const userAddress = address || this.userAddress;
            if (!this.contracts.chaosCore) {
                return { success: true, isRegistered: false };
            }
            
            const userInfo = await this.contracts.chaosCore.getUser(userAddress);
            
            return {
                success: true,
                isRegistered: userInfo[6] // registered field
            };
        } catch (error) {
            console.error("Check user registration error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Token Management
    async getCPTokenBalance(address = null) {
        try {
            const userAddress = address || this.userAddress;
            if (!this.contracts.cpToken) {
                return { success: true, balance: "0" };
            }
            
            const balance = await this.contracts.cpToken.balanceOf(userAddress);
            
            return {
                success: true,
                balance: ethers.formatEther(balance)
            };
        } catch (error) {
            console.warn("Get CP token balance error (returning 0):", error);
            return {
                success: true,
                balance: "0"
            };
        }
    }
    
    async getMONBalance(address = null) {
        try {
            const userAddress = address || this.userAddress;
            if (!this.web3Provider) {
                return { success: true, balance: "0" };
            }
            
            const balance = await this.web3Provider.getBalance(userAddress);
            
            return {
                success: true,
                balance: ethers.formatEther(balance)
            };
        } catch (error) {
            console.error("Get MON balance error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Leaderboard
    async getLeaderboard(limit = 20) {
        try {
            if (!this.contracts.chaosCore) {
                return { success: true, leaderboard: [] };
            }
            
            const leaderboardData = await this.contracts.chaosCore.getLeaderboard(limit);
            
            const leaderboard = [];
            for (let i = 0; i < leaderboardData[0].length; i++) {
                leaderboard.push({
                    rank: i + 1,
                    address: leaderboardData[0][i],
                    username: leaderboardData[1][i],
                    score: Number(leaderboardData[2][i])
                });
            }
            
            return {
                success: true,
                leaderboard: leaderboard
            };
        } catch (error) {
            console.warn("Get leaderboard error (returning empty list):", error);
            return {
                success: true,
                leaderboard: []
            };
        }
    }
    
    async getPlayerRank(address = null) {
        try {
            const userAddress = address || this.userAddress;
            if (!this.contracts.chaosCore) {
                return { success: true, rank: 0 };
            }
            
            const rank = await this.contracts.chaosCore.getUserRank(userAddress);
            
            return {
                success: true,
                rank: Number(rank)
            };
        } catch (error) {
            console.warn("Get player rank error (returning 0):", error);
            return {
                success: true,
                rank: 0
            };
        }
    }
    
    async getPlayerStats(address = null) {
        try {
            const userAddress = address || this.userAddress;
            const userInfo = await this.getUserInfo(userAddress);
            const rankResult = await this.getPlayerRank(userAddress);
            
            if (userInfo.success) {
                return {
                    success: true,
                    stats: {
                        totalEarnings: userInfo.data.totalEarnings,
                        username: userInfo.data.username,
                        totalScore: userInfo.data.totalScore,
                        gamesPlayed: userInfo.data.gamesPlayed,
                        gamesWon: userInfo.data.gamesWon,
                        rank: rankResult.success ? rankResult.rank : 0
                    }
                };
            } else {
                throw new Error(userInfo.error);
            }
        } catch (error) {
            console.warn("Get player stats error (returning defaults):", error);
            return {
                success: true,
                stats: {
                    totalEarnings: "0",
                    username: "Anonymous",
                    totalScore: 0,
                    gamesPlayed: 0,
                    gamesWon: 0,
                    rank: 0
                }
            };
        }
    }
    
    // REAL CLAIM SYSTEM - Uses contract's claimGameRewards function
    async claimGameRewards(baseScore, multiplier, rank, gameType = "series") {
        try {
            if (!this.contracts.chaosCore) {
                throw new Error("ChaosCore contract not initialized");
            }
            
            console.log(`🏆 Claiming pending rewards from contract...`);
            
            // Check pending rewards first
            const pendingAmount = await this.contracts.chaosCore.getPendingRewards(this.userAddress);
            const pendingAmountFormatted = ethers.formatEther(pendingAmount);
            
            console.log(`Pending rewards: ${pendingAmountFormatted} CP`);
            
            if (pendingAmount.toString() === "0") {
                return {
                    success: false,
                    error: "No pending rewards to claim"
                };
            }
            
            // Call the real claimGameRewards function
            const tx = await this.contracts.chaosCore.claimGameRewards({
                gasLimit: 100000
            });
            
            console.log(`Transaction sent: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
            
            // Get updated balance
            const balanceResult = await this.getCPTokenBalance();
            
            return {
                success: true,
                txHash: tx.hash,
                claimedAmount: parseFloat(pendingAmountFormatted),
                blockNumber: receipt.blockNumber,
                currentBalance: balanceResult.balance
            };
            
        } catch (error) {
            console.error("Claim rewards error:", error);
            
            let errorMessage = error.message;
            if (error.message.includes("No pending rewards")) {
                errorMessage = "No pending rewards to claim";
            } else if (error.message.includes("insufficient funds")) {
                errorMessage = "Insufficient MON balance for gas fees";
            } else if (error.message.includes("user rejected")) {
                errorMessage = "Transaction cancelled by user";
            }
            
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    
    async getClaimableRewards(address = null) {
        try {
            const userAddress = address || this.userAddress;
            if (!this.contracts.chaosCore) {
                return { success: true, claimableAmount: 0 };
            }
            
            // Use the real getPendingRewards function from contract
            const pendingAmount = await this.contracts.chaosCore.getPendingRewards(userAddress);
            const pendingAmountFormatted = ethers.formatEther(pendingAmount);
            
            return {
                success: true,
                claimableAmount: parseFloat(pendingAmountFormatted)
            };
        } catch (error) {
            console.warn("Get claimable rewards error (returning 0):", error);
            return {
                success: true,
                claimableAmount: 0
            };
        }
    }
    
    async recordGameResult(score, multiplier, won, gameType = "mini-game") {
        try {
            if (!this.contracts.chaosCore) {
                throw new Error("ChaosCore contract not initialized");
            }
            
            const tx = await this.contracts.chaosCore.recordGameResult(
                this.userAddress,
                score,
                Math.floor(multiplier * 100), // Convert to basis points
                won,
                gameType
            );
            
            await tx.wait();
            
            return {
                success: true,
                txHash: tx.hash
            };
            
        } catch (error) {
            console.error("Record game result error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async recordGameResultWithPendingReward(score, multiplier, won, gameType = "mini-game") {
        try {
            if (!this.contracts.chaosCore) {
                throw new Error("ChaosCore contract not initialized");
            }
            
            console.log(`🔗 Recording game result with pending reward: score=${score}, multiplier=${multiplier}, won=${won}`);
            
            const tx = await this.contracts.chaosCore.recordGameResultWithPendingReward(
                this.userAddress,
                score,
                multiplier, // Already in contract format (150 = 1.5x)
                won,
                gameType,
                {
                    gasLimit: 120000
                }
            );
            
            console.log(`Transaction sent: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
            
            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber
            };
            
        } catch (error) {
            console.error("Record game result with pending reward error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async mintCPTokens(amount) {
        try {
            if (!this.contracts.cpToken) {
                throw new Error("CP Token contract not initialized");
            }
            
            // Convert to wei (18 decimals)
            const amountInWei = ethers.parseEther(amount.toString());
            
            console.log(`🪙 Minting ${amount} CP tokens (${amountInWei} wei)`);
            
            const tx = await this.contracts.cpToken.mint(
                this.userAddress,
                amountInWei,
                {
                    gasLimit: 100000
                }
            );
            
            console.log(`Mint transaction sent: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`Mint confirmed in block: ${receipt.blockNumber}`);
            
            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                amount: amount
            };
            
        } catch (error) {
            console.error("Mint CP tokens error:", error);
            
            let errorMessage = error.message;
            if (error.message.includes('insufficient funds')) {
                errorMessage = 'Insufficient MON balance for gas fees';
            } else if (error.message.includes('user rejected')) {
                errorMessage = 'Transaction cancelled by user';
            } else if (error.message.includes('Ownable')) {
                errorMessage = 'Only contract owner can mint tokens';
            }
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    async claimSeriesRewards(totalScore, rank, gamesWon) {
        try {
            if (!this.contracts.chaosCore) {
                throw new Error("ChaosCore contract not initialized");
            }
            
            console.log(`🏆 Claiming series rewards: score=${totalScore}, rank=${rank}, gamesWon=${gamesWon}`);
            
            const tx = await this.contracts.chaosCore.claimSeriesRewards(
                totalScore,
                rank,
                gamesWon,
                {
                    gasLimit: 150000
                }
            );
            
            console.log(`Transaction sent: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
            
            // Get updated balance
            const balanceResult = await this.getCPTokenBalance();
            
            return {
                success: true,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                currentBalance: balanceResult.balance
            };
            
        } catch (error) {
            console.error("Claim series rewards error:", error);
            
            let errorMessage = error.message;
            if (error.message.includes('insufficient funds')) {
                errorMessage = 'Insufficient MON balance for gas fees';
            } else if (error.message.includes('user rejected')) {
                errorMessage = 'Transaction cancelled by user';
            } else if (error.message.includes('Player not registered')) {
                errorMessage = 'Player not registered on blockchain';
            }
            
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    
    // Utility functions
    setContractAddresses(addresses) {
        this.contractAddresses = { ...this.contractAddresses, ...addresses };
        if (this.isConnected) {
            this.initializeContracts();
        }
    }
    
    // Legacy disconnect method (kept for compatibility)
    disconnect() {
        this.disconnectWallet();
    }
    
    // Enhanced event listeners
    setupEventListeners() {
        if (window.ethereum) {
            // Account change handler
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    console.log("All accounts disconnected");
                    this.disconnectWallet();
                } else if (accounts[0] !== this.userAddress) {
                    console.log("Account changed from", this.userAddress, "to", accounts[0]);
                    this.userAddress = accounts[0];
                    
                    // Trigger account changed event
                    this.dispatchWalletEvent('accountChanged', {
                        newAddress: accounts[0],
                        oldAddress: this.userAddress
                    });
                    
                    // Reinitialize contracts with new account
                    if (this.isConnected) {
                        this.initializeContracts();
                    }
                }
            });
            
            // Network change handler
            window.ethereum.on('chainChanged', (chainId) => {
                console.log("Network changed to:", chainId);
                
                // Trigger network changed event
                this.dispatchWalletEvent('networkChanged', {
                    chainId: chainId
                });
                
                // Check if still on Monad Testnet
                const monadTestnetChainId = '0x279F';
                if (chainId !== monadTestnetChainId) {
                    console.warn("Not on Monad Testnet, some features may not work");
                }
                
                // Reload page to ensure clean state
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            });
            
            // Connection handler
            window.ethereum.on('connect', (connectInfo) => {
                console.log("Wallet connected to network:", connectInfo.chainId);
                this.dispatchWalletEvent('networkConnected', connectInfo);
            });
            
            // Disconnection handler
            window.ethereum.on('disconnect', (error) => {
                console.log("Wallet disconnected:", error);
                this.disconnectWallet();
            });
        }
    }
    
    // Get current connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            address: this.userAddress,
            hasContracts: Object.keys(this.contracts).length > 0,
            network: this.web3Provider ? 'Connected' : 'Disconnected'
        };
    }
    
    // Check if on correct network
    async isOnCorrectNetwork() {
        if (!this.web3Provider) return false;
        
        try {
            const network = await this.web3Provider.getNetwork();
            return Number(network.chainId) === 10143; // Monad Testnet
        } catch (error) {
            console.error("Network check error:", error);
            return false;
        }
    }
}

// Global simplified blockchain manager instance
window.blockchainManager = new SimplifiedBlockchainManager();

// Setup event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.blockchainManager.setupEventListeners();
});

console.log("Simplified Blockchain Manager loaded");
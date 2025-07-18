# 🎮 CHAOS CONDUCTOR

A real-time multiplayer chaos game built with Multisynq. Compete with other players to complete various tasks as quickly as possible!

## 🚀 Features

### 🎯 Game Modes
- **Click Tasks**: Click on colored shapes
- **Type Tasks**: Type words quickly
- **Draw Tasks**: Draw requested shapes
- **Sequence Tasks**: Click numbers in correct order
- **Memory Tasks**: Repeat color sequences
- **Asteroid Game**: Shoot asteroids in space!

### ⚡ Chaos Factors
- **Sabotage**: Slow down other players
- **Fake Tasks**: Misleading instructions
- **Reverse Control**: Controls are reversed
- **Speed Mode**: Shorter time limits

### 🏆 Scoring System
- Time-based scoring for most tasks
- Asteroid game: 10 points per asteroid destroyed
- Speed bonuses for quick completion
- Combo bonuses available

### 🌐 Multiplayer Features
- Real-time synchronization with Multisynq
- 2-8 players per room
- Live chat system
- Real-time leaderboard
- Room codes for easy joining

## 🛠 Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5 Canvas, CSS3
- **Multiplayer**: Multisynq client-side synchronization
- **Architecture**: Model-View pattern with Multisynq
- **Deployment**: Static hosting (no server required)

## 🎮 How to Play

1. **Create or Join Room**: Enter your name and create/join a room
2. **Wait for Players**: Minimum 2 players required to start
3. **Complete Tasks**: Various task types appear randomly
4. **Earn Points**: Faster completion = more points
5. **Win the Game**: Highest score after 5 rounds wins!

## 🚀 Quick Start

### Prerequisites
- Modern web browser with JavaScript enabled
- Internet connection for Multisynq synchronization

### Running Locally

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chaos-conductor
   ```

2. **Start a local server**
   ```bash
   # Using Python (recommended)
   python3 -m http.server 8080
   
   # Or using Node.js http-server
   npx http-server -p 8080
   ```

3. **Open in browser**
   ```
   http://localhost:8080
   ```

### Deployment

Since this is a client-side only application, you can deploy it to any static hosting service:

- **GitHub Pages**
- **Netlify**
- **Vercel**
- **Firebase Hosting**
- **AWS S3 + CloudFront**

Simply upload the `public/` folder contents to your hosting service.

## 🔧 Configuration

### Multisynq Settings

The game uses Multisynq for real-time multiplayer synchronization. Configuration is in `public/game.js`:

```javascript
Multisynq.Session.join({
    apiKey: "your-api-key-here",
    appId: "com.chaosconductor.game",
    name: "room-name",
    password: "room-password",
    model: ChaosGameModel,
    view: ChaosGameView
});
```

### Game Settings

You can modify game parameters in the `ChaosGameModel` class:

```javascript
// Game rounds
maxRounds: 5

// Task time limit
timeLimit: 15000 // 15 seconds

// Chaos factor probability
chaosChance: 0.3 // 30%
```

## 📁 Project Structure

```
chaos-conductor/
├── public/
│   ├── index.html          # Main HTML file
│   ├── game.js            # Multisynq Model & View classes
│   ├── styles.css         # Game styling
│   └── favicon.ico        # Game icon
├── README.md              # This file
├── package.json           # Project metadata
└── multisynq.txt         # Multisynq API documentation
```

## 🎨 Customization

### Adding New Task Types

1. **Add task to Model** (`ChaosGameModel.generateNewTask()`):
   ```javascript
   {
       type: 'newTask',
       instruction: 'Task instruction',
       data: { /* task data */ }
   }
   ```

2. **Add rendering to View** (`ChaosGameView.renderTask()`):
   ```javascript
   case 'newTask':
       this.renderNewTask();
       break;
   ```

3. **Implement task logic**:
   ```javascript
   renderNewTask() {
       // Task rendering logic
   }
   
   handleNewTaskInput() {
       // Input handling logic
   }
   ```

### Styling

Modify `public/styles.css` to customize:
- Color schemes
- Button sizes
- Layout responsiveness
- Animations

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check internet connection
   - Verify Multisynq API key is valid
   - Try refreshing the page

2. **Players Not Syncing**
   - Ensure all players are in the same room
   - Check browser console for errors
   - Verify Multisynq service status

3. **Game Not Starting**
   - Minimum 2 players required
   - All players must be connected
   - Check for JavaScript errors

### Debug Mode

Enable debug logging by modifying the session join:

```javascript
Multisynq.Session.join({
    // ... other options
    debug: ["session", "messages", "events"]
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Multisynq** for providing the real-time synchronization platform
- **HTML5 Canvas** for game rendering capabilities
- **Modern Web APIs** for responsive user experience

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check Multisynq documentation
- Review browser console for errors

---

**Have fun playing Chaos Conductor!** 🎮✨
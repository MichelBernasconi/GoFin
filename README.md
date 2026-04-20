# 💹 GoFin - Quantara GUI

GoFin is a professional-grade Desktop GUI for the **Quantara** algorithmic trading engine. Built with **Go** and **React**, it provides a stunning, high-performance interface to design, backtest, and analyze financial investment strategies.

![GoFin Dashboard](https://raw.githubusercontent.com/MichelBernasconi/GoFin/main/preview.png) *(Note: Placeholder link, replace with actual screenshot after push)*

## 🚀 Key Features

- **Strategy Lab (Mini IDE):** Write and save custom trading strategies using a Monaco-based editor with JSON syntax highlighting.
- **Advanced Analytics:** Interactive Equity Curve charts, Drawdown analysis, Volatility tracking, and Sharpe Ratio visualization.
- **Market Data Manager:** Connect to financial data APIs and manage your backtesting assets.
- **Docker-Ready:** Seamless integration with the Quantara Rust engine via Docker and Docker Compose.
- **Premium UI:** Dark mode aesthetics with glassmorphism effects, following modern fintech design standards.

## 🛠 Tech Stack

- **Backend:** Go (Wails framework)
- **Frontend:** React + Vite + Framer Motion
- **Charts:** Recharts (High-performance SVG charts)
- **Engine Bridge:** REST API (Axum) over Docker
- **Editor:** @monaco-editor/react

## 📦 Installation

### Prerequisites
- [Go](https://go.dev/) 1.21+
- [Node.js](https://nodejs.org/) & NPM
- [Docker](https://www.docker.com/) (to run the Quantara engine)
- [Wails CLI](https://wails.io/docs/gettingstarted/installation)

### 1. Setup the Engine (Quantara)
GoFin includes Quantara as a containerized service.
```bash
cd quantara-engine
docker-compose up -d --build
```

### 2. Setup the GUI
```bash
# Install frontend dependencies
cd frontend
npm install

# Run in development mode
cd ..
wails dev
```

## 📁 Project Structure
- `/frontend`: React dashboard source code.
- `/quantara-engine`: Subproject containing the Rust calculation engine.
- `app.go`: Go logic and Wails bridge.
- `main.go`: Application entry point.

## 📝 Configuration
Strategies follow the Quantara Domain Model:
```json
{
  "name": "Moving Average Cross",
  "entry_rules": [
    { "left": { "SMA": 50 }, "operator": "CrossesOver", "right": "Price" }
  ],
  "exit_rules": [
    { "left": "Price", "operator": "CrossesUnder", "right": { "SMA": 50 } }
  ]
}
```

## 🤝 Contributing
Feel free to fork this project and submit pull requests. For major changes, please open an issue first.

## 📄 License
MIT License - Copyright (c) 2024 Michel Bernasconi

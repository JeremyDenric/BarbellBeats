# 🎵 BarbellBeats 🏋️

> A real-time, social music platform that lets gym-goers collectively control their gym's playlist through democratic voting, building a community-driven music culture.

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)]()
[![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)]()
[![DynamoDB](https://img.shields.io/badge/DynamoDB-4053D6?style=for-the-badge&logo=amazon-dynamodb&logoColor=white)]()
[![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socket.io&logoColor=white)]()

[Architecture](./docs/ARCHITECTURE.md) | [API Docs](./docs/API_REFERENCE.md) | [Deployment](./docs/DEPLOYMENT.md)

---

## 📖 Overview

**BarbellBeats** transforms the gym experience by democratizing music selection. Users discover nearby gyms, vote on songs in real-time, and earn influence ranks based on their contributions to the community playlist.

### 🌟 Key Features

- **🗺️ Gym Discovery**: Find and join gyms near you with location-based search
- **🎧 Real-time Playlist**: Live-updating playlist with weighted democratic voting
- **🏆 Ranking System**: Progress through 6 ranks (Bronze → Legend) based on influence
- **⚡ Live Gym Vibes**: Real-time energy dashboard showing vote spikes, genre trends
- **🎤 Crowd DJ Sessions**: Platinum+ users can take over the playlist for 3 songs
- **💪 PR Tracking**: Log personal records with optional Apple Health sync
- **🏅 Achievements**: Unlock badges like "Hit Maker" and "DJ of the Month"
- **📊 Analytics**: Deep insights into gym music culture and trends

---

## 🏗️ Architecture

### High-Level System Design

```
┌─────────────┐
│  React      │
│  Native     │ ←──WebSocket──→ API Gateway WebSocket
│  (Expo)     │
└─────────────┘
       │
       │ HTTPS/REST
       ↓
┌─────────────────────────────────────────┐
│         AWS API Gateway                 │
└─────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│         AWS Lambda Functions            │
│  (Node.js / TypeScript)                 │
└─────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────┐
│         DynamoDB Tables                 │
│  Users | Gyms | Songs | Votes | Ranks  │
└─────────────────────────────────────────┘
```

**Tech Stack:**
- Frontend: React Native + Expo + TypeScript
- Backend: AWS Lambda + API Gateway + DynamoDB
- Real-time: WebSocket API
- Auth: AWS Cognito
- Storage: S3
- Music: Spotify API

📄 [Full Architecture Documentation](./docs/ARCHITECTURE.md)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- AWS Account
- Expo CLI: `npm install -g expo-cli`
- AWS CLI configured
- Spotify Developer Account

### Installation

```bash
# Install all dependencies
npm run install:all

# Configure environment variables
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
# Edit .env files with your credentials
```

### Frontend Setup

```bash
cd frontend
npm install
expo start
```

### Backend Setup

```bash
cd backend
npm install

# Configure AWS credentials
aws configure

# Deploy to AWS
npm run deploy
```

📄 [Full Deployment Guide](./docs/DEPLOYMENT.md)

---

## 📊 Project Structure

```
barbellbeats/
├── frontend/          # React Native app
├── backend/           # AWS Lambda functions
├── shared/            # Shared TypeScript types
├── infrastructure/    # Infrastructure as Code
├── docs/             # Documentation
└── .github/          # CI/CD workflows
```

---

## 🧮 The Ranking Algorithm

Users earn **influence points** based on:
1. **Song Quality** (40%): Avg net score of songs you add
2. **Voting Engagement** (30%): Total votes cast
3. **Community Reception** (25%): Upvotes received
4. **Special Activities** (5%): Crowd DJ sessions, achievements

| Rank     | Points | Vote Weight | Privileges        |
|----------|--------|-------------|-------------------|
| Bronze   | 0      | 1.0x        | Vote, Add Songs   |
| Silver   | 500    | 1.5x        | + Analytics       |
| Gold     | 1,500  | 2.0x        | + Skip Vote       |
| Platinum | 4,000  | 3.0x        | + Crowd DJ        |
| Diamond  | 10,000 | 4.0x        | + Veto Power      |
| Legend   | 25,000 | 5.0x        | + Gym Mod Tools   |

📄 [Algorithm Deep Dive](./docs/RANKING_ALGORITHM.md)

---

## 📝 License

MIT License - see [LICENSE](./LICENSE) file

---

## 👨‍💻 Author

Built to demonstrate full-stack serverless architecture with real-time features.

**⭐ If you found this project interesting, please star the repo!**

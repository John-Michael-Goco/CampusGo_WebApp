# CampusGo System Features & Database Reference

---

## 🎯 CampusGo System Features

### 👤 Identity and Access Management

- Student registration validation using masterlist records
- Professor registration validation
- Role-based authentication (student, professor, admin, gamemaster)
- Secure login system
- Leaderboard-ready user statistics tracking

### 🎮 Quest Management System

- Quest creation by gamemasters
- Quest approval workflow (pending → approved → active → completed → cancelled)
- Quest scheduling using start and end dates
- Progressive elimination competition model
- Global elimination rule (elimination always enabled)

### 🏆 Reward System

- Strict one quest → one reward relationship
- Reward configuration includes:
  - Reward title
  - Description
  - Reward value
  - Reward quantity tracking
- Reward distribution through inventory system
- Reward eligibility only for final survivors

### 🧩 Task Stage System

- Multi-stage quest progression
- Capacity-based survivor cutoff per stage (`max_survivors`)
- Task ordering controller
- Task lifecycle states:
  - Active
  - Locked
  - Completed
- QR-triggered task validation
- Human-readable AR/location hints

### ❓ Multi-Question Challenge Engine

- Multiple questions per task
- Question ordering support
- Server-side answer validation
- Anti-cheat protection

### 🔐 Anti-Cheat and Fairness Controls

- Exactly one attempt per question per user
- Response time tracking for ranking and fairness
- Unique submission constraints
- Server-side validation enforcement

### 👥 Participant Progression System

- Quest joining mechanism
- Current task stage tracking
- Capacity-triggered progression filtering
- Stage-based elimination tournament structure
- Completion status monitoring

### ⏱ Competitive Timing Mechanics

- First-come qualification model within capacity
- Response time ranking for tie-breaking
- Automatic stage locking when survivor quota is reached

### 🎁 Reward Distribution Module

- Automatic inventory insertion after quest completion
- Claimable reward tracking
- Quest-specific reward storage

### 📊 Performance Tracking

- Total points accumulation
- Quest completion counter
- Total participation time monitoring

### 👮 Governance and Moderation

- Quest approval system
- Gamemaster activity logging
- Administrative control over quest lifecycle

### 📍 AR / QR Interaction Layer

- QR code scanning triggers task validation
- AR-supported question presentation (implementation-dependent)
- Campus location hinting system

---
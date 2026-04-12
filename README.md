# PickleBall Manager

A full-stack application for managing pickleball games and tracking shared expenses.

## Features

- **Game Management**: Schedule games, track players, court fees, and attendance
- **Player Directory**: Manage player profiles with skill levels and contact info
- **Expense Ledger**: Track and split expenses (court fees, equipment, food, etc.)
- **Balance Calculator**: See who owes what with automatic settlement suggestions
- **Payment Tracking**: Mark players as paid for games and expenses

## Tech Stack

- **Frontend**: React 18 with React Router
- **Backend**: Node.js with Express
- **Database**: SQLite (file-based, no setup needed)
- **Styling**: Custom CSS with responsive design

## Quick Start

### Development Mode

```bash
# Install all dependencies (root + client)
npm run install-all

# Start both server and client concurrently
npm run dev
```

The app will be available at `http://localhost:3000` (React dev server with proxy to API).

### Production Build

```bash
# Install dependencies
npm run install-all

# Build the React app
npm run build

# Start the production server
npm start
```

The production app runs on `http://localhost:3001` (or your specified PORT).

## Self-Hosting on Your Domain

### Option 1: Traditional VPS/Dedicated Server

1. **Upload files** to your server
2. **Install Node.js** (v16 or higher)
3. **Install PM2** for process management: `npm install -g pm2`
4. **Install dependencies** and build:
   ```bash
   npm run install-all
   npm run build
   ```
5. **Start with PM2**:
   ```bash
   pm2 start server/index.js --name pickleball-app
   pm2 save
   pm2 startup
   ```
6. **Configure Nginx** as a reverse proxy:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 2: Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY client/package*.json ./client/
RUN npm run install-all

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t pickleball-app .
docker run -d -p 3001:3001 -v $(pwd)/server/data:/app/server/data pickleball-app
```

### Option 3: Cloud Platforms

**Railway/Render/Fly.io:**
1. Push to GitHub
2. Connect your repository
3. Set build command: `npm run install-all && npm run build`
4. Set start command: `npm start`
5. Add environment variable: `PORT=3001`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `NODE_ENV` | development | Environment mode |

## Database

SQLite database is automatically created at `server/pickleball.db`. The database includes:

- **players** - Player profiles
- **games** - Scheduled games
- **game_players** - Game participation and payments
- **expenses** - Shared expenses
- **expense_splits** - Expense distribution

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/players` | GET, POST | List/add players |
| `/api/players/:id` | PUT, DELETE | Update/delete player |
| `/api/games` | GET, POST | List/add games |
| `/api/games/:id` | PUT, DELETE | Update/delete game |
| `/api/games/:id/payment` | PUT | Toggle player payment |
| `/api/expenses` | GET, POST | List/add expenses |
| `/api/expenses/:id` | PUT, DELETE | Update/delete expense |
| `/api/expenses/:id/payment` | PUT | Mark split as paid |
| `/api/dashboard` | GET | Dashboard stats |
| `/api/balances` | GET | Player balance sheet |

## Project Structure

```
pickleball-app/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/                # Express backend
│   ├── index.js          # API routes
│   └── pickleball.db     # SQLite database
├── package.json
└── README.md
```

## Backup

The SQLite database file at `server/pickleball.db` contains all your data. Back it up regularly:

```bash
cp server/pickleball.db backup/pickleball-$(date +%Y%m%d).db
```

## License

MIT

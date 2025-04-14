# Xpense - Shared Expense Tracker

A modern expense tracking application built with Next.js, TypeScript, and Cloudflare Workers.

## Features

- 📱 Modern, responsive UI with shadcn/ui
- 📸 Bill image upload with OCR
- 🤖 AI-powered expense analysis
- 👥 Expense sharing and splitting
- 💰 Balance tracking
- 🔒 Secure authentication

## Tech Stack

- **Frontend**:
  - Next.js 14
  - TypeScript
  - Tailwind CSS
  - shadcn/ui
  - React Hook Form

- **Backend**:
  - Cloudflare Workers
  - TypeScript
  - Hono
  - D1 Database
  - Cloudflare R2
  - OpenRouter AI

## Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/xpense.git
cd xpense
```

2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Set up environment variables:
```bash
# Backend
cp backend/.env.example backend/.env
# Fill in the required values

# Frontend
cp frontend/.env.example frontend/.env
# Fill in the required values
```

4. Run development servers:
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

## Deployment

The project is automatically deployed using GitHub Actions:

1. Backend is deployed to Cloudflare Workers
2. Frontend is deployed to Cloudflare Pages
3. Database migrations are automatically applied

### Required Secrets

Add these secrets to your GitHub repository:

- `CF_API_TOKEN`: Cloudflare API token
- `CF_ACCOUNT_ID`: Cloudflare account ID
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `OPENROUTER_API_KEY`: OpenRouter API key
- `JWT_SECRET`: Secret for JWT tokens

## License

MIT

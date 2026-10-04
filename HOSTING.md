# StudyMate Hosting Guide

## 1. Local development

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export JWT_SECRET="replace-with-a-long-random-secret"
python3 -m uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`.

### Frontend

In a second terminal:

```bash
cd web
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

Copy `web/.env.example` to `web/.env` if you want to change the API URL:

```env
VITE_API_URL=http://127.0.0.1:8000
```

## 2. Production deployment

Deploy the FastAPI backend first. Set these environment variables on the backend host:

```env
JWT_SECRET=<long-random-secret>
JWT_EXPIRE_MINUTES=1440
CORS_ORIGINS=https://your-site.netlify.app
```

Then set this environment variable in the Vite/Netlify frontend build environment:

```env
VITE_API_URL=https://your-backend.example.com
```

Rebuild the frontend after changing `VITE_API_URL`.

## 3. Important project rules

Do not commit or upload:

- `web/node_modules/`
- `backend/venv/`
- `__pycache__/`
- `*.db`
- `.env` files
- `.DS_Store`

The frontend now sends the JWT returned by `/api/login` automatically with authenticated API requests. The backend derives the user from that token instead of trusting a client-supplied `user_id`.

# La 7 FastFood — Sistema de Control de Negocio y POS

> Sistema completo para gestión de un negocio de comida rápida: fichas técnicas, costos reales, POS táctil, stock inteligente, fidelización y reportería.

## 🏗️ Arquitectura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Frontend (PWA)  │────▶│  Backend (API)   │────▶│  PostgreSQL │
│  React + Vite   │     │  FastAPI          │     │  Supabase   │
│  Netlify        │     │  Render           │     │  Free Tier  │
└─────────────────┘     └──────────────────┘     └─────────────┘
```

## 🚀 Setup Local

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Configurar DATABASE_URL
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Base de datos
Configurar una instancia PostgreSQL en [Supabase](https://supabase.com) (free tier).
Usar el puerto **6543** (Supavisor pooler) en el connection string.

### Migraciones
```bash
cd backend
alembic upgrade head
```

## 📦 Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + PWA |
| Estilos | CSS Custom Properties (dark mode) |
| Backend | FastAPI + SQLAlchemy 2.0 (async) |
| BD | PostgreSQL 15 (Supabase) |
| CI/CD | GitHub Actions |

## 📋 Sprints

1. ✅ Setup + Infraestructura
2. 🔲 Insumos + Fichas Técnicas
3. 🔲 Compras + Stock
4. 🔲 POS (Punto de Venta)
5. 🔲 Dashboard + Reportes
6. 🔲 PWA + Pulido + Deploy

## 💰 Moneda

Pesos chilenos (CLP), sin decimales. Formato: `$1.500`

## 🔐 Autenticación

PIN de 4-6 dígitos (usuario único).

## 📄 Licencia

Proyecto privado — La 7 FastFood.

# One image for the whole app: the frontend is built to static files, then
# FastAPI serves both those files and the API on a single port.

# ---- Stage 1: build the React frontend ----
FROM node:22-alpine AS frontend
WORKDIR /app
COPY apps/frontend/package.json ./
# package-lock.json is not committed, so "npm ci" is not available here.
RUN npm install --no-audit --no-fund
COPY apps/frontend/ ./
RUN npm run build

# ---- Stage 2: Python backend + built frontend ----
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FRONTEND_DIST=/app/frontend
WORKDIR /app/backend

COPY apps/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/backend/*.py apps/backend/demo_data.json ./
COPY --from=frontend /app/dist /app/frontend

# Run as a normal user. It owns the backend folder because the SQLite file
# (app.db) is created there, and seeded, when the server starts.
RUN useradd --create-home appuser && chown appuser /app/backend
USER appuser

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health')"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

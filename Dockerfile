FROM node:20-alpine
WORKDIR /app

ENV NEXT_PUBLIC_SUPABASE_URL=https://yincycmdsdluueqsxtwn.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpbmN5Y21kc2RsdXVlcXN4dHduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDUzOTUsImV4cCI6MjA5MTY4MTM5NX0.GTAOSZChdqpQDsWsNuaqib7wDAY03HLNGu-Sy4JkOv0
ENV NEXT_PUBLIC_SITE_URL=https://dogclub-kaluga.ru
# Telegram бот — заполни в панели Amvera или здесь:
# ENV TELEGRAM_BOT_TOKEN=ваш_токен
# ENV TELEGRAM_CHAT_ID=ваш_chat_id

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000
CMD ["node", "node_modules/.bin/next", "start", "-p", "3000"]

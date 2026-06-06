FROM node:20-alpine
WORKDIR /app

ENV NEXT_PUBLIC_SITE_URL=https://lapaclub.ru
# Публичные значения Supabase (URL + anon) зашиты в src/lib/supabase/client.ts.
# Секреты (SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY) — в панели Amvera, этап «запуск».

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000
CMD ["node", "node_modules/.bin/next", "start", "-p", "3000"]

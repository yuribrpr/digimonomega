# Etapa 1: Construir o site (React/Vite)
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Injeta a variável de ambiente durante o build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Etapa 2: Servidor Nginx (Com a correção do 404)
FROM nginx:alpine

# Remove a config padrão antiga
RUN rm /etc/nginx/conf.d/default.conf

# Copia a nossa config nova (nginx.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o site construído
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
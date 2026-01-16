FROM nginx:alpine

# Remove a config padrão antiga
RUN rm /etc/nginx/conf.d/default.conf

# Copia a nossa config nova (nginx.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos do site
COPY . /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
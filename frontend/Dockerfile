# Usa nginx para servir archivos estáticos
FROM nginx:alpine

# Elimina la configuración por defecto
RUN rm -rf /usr/share/nginx/html/*

# Copia tu frontend al contenedor
COPY . /usr/share/nginx/html

# Expón el puerto 80
EXPOSE 80

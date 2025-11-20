# Usa una imagen base oficial de Node.js
FROM node:20

# Crea un directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencias del backend
COPY package*.json ./

# Instala las dependencias del backend
RUN npm install

# Copia todo el backend dentro del contenedor
COPY . .

# ✅ Copia el archivo .env al contenedor
COPY .env .env

# Establece la variable de entorno para producción
ENV NODE_ENV=production

# Expón el puerto donde corre tu app
EXPOSE 3000

# Comando para iniciar tu servidor
CMD ["node", "server.js"]

# Ronda de Yerbas
App de opiniones sobre yerbas para mate. Backend en Node.js + Express + MySQL, frontend en HTML/CSS/JS.

## Estructura

```
yerba-app/
├── backend/
│   ├── server.js        Servidor Express con los endpoints de la API
│   ├── package.json     Dependencias del backend
│   ├── schema.sql        Script para crear la base de datos y la tabla
│   └── .env.example     Plantilla de configuración (copiar a .env)
└── frontend/
    ├── index.html       Estructura de la página
    ├── style.css         Estilos
    └── script.js         Lógica que llama a la API
```

## 1. Preparar la base de datos MySQL

Necesitás un servidor MySQL corriendo (local, en tu hosting, o en un servicio como Railway/PlanetScale).

Conectate con tu cliente de MySQL (o phpMyAdmin) y ejecutá el contenido de `backend/schema.sql`. Esto crea la base `ronda_yerbas` y la tabla `opiniones`.

```bash
mysql -u tu_usuario -p < backend/schema.sql
```

## 2. Configurar el backend

```bash
cd backend
npm install
cp .env.example .env
```

Abrí `.env` y completá con tus datos reales:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=ronda_yerbas
ADMIN_PASSWORD=elegí-una-contraseña-segura
PORT=3000
```

**Importante:** cambiá `ADMIN_PASSWORD` por una contraseña tuya (es la que vas a usar en la web para entrar al modo administrador y ocultar opiniones).

## 3. Levantar el backend

```bash
npm start
```
Si todo está bien configurado, vas a ver en la consola:
```
✅ Conectado a MySQL correctamente
🧉 Servidor de Ronda de Yerbas corriendo en http://localhost:3000
```

## 4. Configurar el frontend (si se despliega, sino solo ejecutar en el localhost como está)
Abrí `frontend/script.js` y en la primera línea de código ajustá la URL del backend:

```js
const API_URL = 'http://localhost:3000/api';
```
- En desarrollo local, dejala así.
- Cuando subas el backend a un servidor real (Railway, Render, un VPS, etc.), reemplazá esa URL por la URL pública de tu backend, por ejemplo:
  ```js
  const API_URL = 'https://mi-backend.up.railway.app/api';
  ```

## 5. Abrir el frontend

Podés simplemente abrir `frontend/index.html` en el navegador, o servirlo con cualquier servidor estático. 
Mientras el backend esté corriendo y la URL en `script.js` apunte a él va a funcionar.

## Modo administrador

- Abajo de todo en la página hay un botón discreto (`·`).
- Al tocarlo, pide la contraseña configurada en `ADMIN_PASSWORD` (es una contraseña estática ya que es un programa de prueba y lo más simple posible).
- Una vez dentro, aparece una barra que indica "Modo administrador activo" y cada opinión muestra un botón para ocultarla o volver a mostrarla.
- Las opiniones ocultas dejan de verlas el público, pero seguís viéndolas vos (marcadas como "Oculta") para poder revertir si fue un error.
- La contraseña nunca se guarda en el código del frontend: se verifica contra el backend cada vez, y solo se guarda en la memoria del navegador mientras estás en modo admin (se borra si recargás la página).
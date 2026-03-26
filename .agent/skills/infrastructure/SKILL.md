---
name: Infrastructure & DevOps
description: Docker builds, Nginx config, docker-compose, environment management, MongoDB Atlas, and deployment for PIXLAYER
---

# Infrastructure & DevOps

## Docker — Client (React + Nginx)
```dockerfile
# client/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Docker — Server (Node.js)
```dockerfile
# server/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "index.js"]
```

## Nginx Configuration
```nginx
# client/nginx.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing — fallback all routes to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if running behind single domain)
    location /api/ {
        proxy_pass http://server:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WASM and model files — cache aggressively
    location ~* \.(wasm|onnx)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 7d;
        add_header Cache-Control "public";
    }

    # HTTPS redirect (production only)
    # Uncomment when SSL is configured:
    # if ($scheme != "https") {
    #     return 301 https://$host$request_uri;
    # }
}
```

## docker-compose.yml
```yaml
# docker-compose.yml (project root)
version: '3.8'

services:
  client:
    build: ./client
    ports:
      - "3000:80"
    depends_on:
      - server
    environment:
      - VITE_API_BASE_URL=http://localhost:5000

  server:
    build: ./server
    ports:
      - "5000:5000"
    depends_on:
      - mongo
    env_file: ./server/.env
    environment:
      - MONGODB_URI=mongodb://mongo:27017/pixlayer

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

## Environment Variables (.env.example)
```env
# Server
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/pixlayer
JWT_SECRET=your_jwt_secret_min_32_chars_here

# AI APIs
REPLICATE_API_TOKEN=r8_your_token_here

# Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Billing
LEMON_SQUEEZY_API_KEY=your_api_key
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret
LEMON_SQUEEZY_STORE_ID=your_store_id
LEMON_SQUEEZY_VARIANT_ID=your_variant_id

# Monitoring (optional)
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0

# Client (prefix with VITE_ for Vite access)
VITE_API_BASE_URL=http://localhost:5000
VITE_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

## Health Check Endpoint
```js
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage().rss,
  });
});
```

## MongoDB Atlas Setup
1. Create cluster at cloud.mongodb.com
2. Create database user with readWrite role
3. Whitelist IP addresses (or `0.0.0.0/0` for dev)
4. Get connection string → set as `MONGODB_URI`
5. Connection options:
```js
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

## Deployment Targets

### Vercel (Client)
- `vercel.json` with rewrites for SPA routing
- Set env vars in Vercel dashboard

### Cloud Run / Railway (Server)
- Push Docker image to container registry
- Set env vars via dashboard
- Enable auto-scaling (min 0, max 3 instances)

### Local Development
```bash
# Start everything
docker-compose up --build

# Or run individually:
cd client && npm run dev    # Port 5173
cd server && npm run dev    # Port 5000
```

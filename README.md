# WhatsApp API Server

This is a TypeScript Express-based REST API server for interacting with the WhatsApp Web API.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* Node.js (v16 or higher)
* Docker (for running Redis)

### Installing

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd whatsapp-api
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file from the example:
   ```sh
   cp .env.example .env
   ```
   Update the `.env` file with your specific configuration, especially the `REDIS_URL` for connecting to Redis.

### Running Redis with Docker

For local development, you can use the provided Docker Compose file to run Redis:

```sh
# Start Redis in background
npm run redis:up

# Stop Redis
npm run redis:down

# Test Redis connection
npm run test:redis
```

Alternatively, you can use Docker commands directly:

```sh
# Start Redis
docker-compose -f docker-compose.redis.yml up -d

# Stop Redis
docker-compose -f docker-compose.redis.yml down
```

### Running the Application

* **Development:**
  ```sh
  npm run dev
  ```
  This will start the server with hot-reloading using `ts-node-dev`.

* **Production:**
  First, build the application:
  ```sh
  npm run build
  ```
  Then, start the server:
  ```sh
  npm start
  ```

## API Documentation

The API is documented using Swagger. Once the server is running, you can access the documentation at:

`http://localhost:<PORT>/api-docs` (replace `<PORT>` with the port defined in your `.env` file, e.g., 3000).


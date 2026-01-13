# How to Run the Quiz Platform Application

This guide explains how to run the complete Quiz Platform microservices application.

## Prerequisites

Before running the application, ensure you have the following installed:

1. **Docker Desktop** (for Windows)
   - Download from: https://www.docker.com/products/docker-desktop
   - Ensure Docker is running before proceeding

2. **Java Development Kit (JDK) 17 or higher**
   - Download from: https://adoptium.net/

3. **Maven 3.8+**
   - Download from: https://maven.apache.org/download.cgi
   - Or use the included Maven wrapper

4. **Node.js 18+ and npm**
   - Download from: https://nodejs.org/

5. **PowerShell** (comes with Windows)

## Quick Start (Recommended)

The easiest way to run the entire application is using Docker Compose:

### Step 1: Build the Application

Open PowerShell in the project root directory and run:

```powershell
.\build.ps1
```

This script will:
- Build all Java microservices using Maven
- Build all React frontend applications
- Create Docker images for all services

**Note:** The first build may take 10-20 minutes as it downloads dependencies.

### Step 2: Start All Services

After the build completes, start all services:

```powershell
docker-compose up -d
```

The `-d` flag runs containers in detached mode (background).

### Step 3: Verify Services are Running

Check that all containers are running:

```powershell
docker-compose ps
```

You should see all services with status "Up".

### Step 4: Access the Application

Once all services are running, access the application at:

- **Main Application**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **RabbitMQ Management UI**: http://localhost:15672 (guest/guest)

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 3000 | Main React application (Shell) |
| **Dashboard MFE** | 3001 | Dashboard Micro-frontend |
| **Quiz MFE** | 3002 | Quiz Management Micro-frontend |
| **Admin MFE** | 3003 | Admin Panel Micro-frontend |
| **API Gateway** | 8080 | Central API entry point |
| **User Service** | 8081 | User authentication & management |
| **Quiz Service** | 8082 | Quiz CRUD operations |
| **Submission Service** | 8083 | Quiz submissions & grading |
| **Notification Service** | 8084 | WebSocket real-time notifications |
| **Analytics Service** | 8085 | Analytics & statistics |
| **Grading Function** | 9000 | Serverless auto-grading service |
| **PostgreSQL** | 5432 | Relational database |
| **MongoDB** | 27017 | Document database |
| **Redis** | 6379 | Cache & session store |
| **RabbitMQ** | 5672 | Message broker (AMQP) |
| **RabbitMQ Management** | 15672 | RabbitMQ web UI |
| **Kafka** | 9092 | Event streaming platform |
| **Zookeeper** | 2181 | Kafka coordination |
| **Nginx** | 80 | Load balancer |

## Architecture Components

### Message Brokers

**RabbitMQ** is used for:
- Grading queue: Submission Service → Grading Function
- Notification queue: Various services → Notification Service

**Kafka** is used for:
- Event streaming: submission-events, grading-events, analytics-events
- Real-time analytics processing

### Databases

- **PostgreSQL**: Stores users, quizzes, submissions
- **MongoDB**: Stores analytics data and quiz metadata
- **Redis**: Session storage and WebSocket scaling

### How Kafka Works in This App

1. **Producers (Writers)**:
   - **Submission Service** writes to `submission-events` topic when a quiz is submitted
   - **Quiz Service** writes to `quiz-events` topic when quizzes are created/updated
   - **Grading Function** writes to `grading-events` topic when grading is complete

2. **Consumers (Readers)**:
   - **Analytics Service** reads from all topics to generate statistics
   - **Kafka Consumer Service** processes events for various purposes
   - **Notification Service** reads grading events to send WebSocket notifications

3. **Event Flow Example**:
   ```
   Student submits quiz → Submission Service → Kafka (submission-events)
                                            ↓
                        Analytics Service reads event → Updates statistics
   ```

### How RabbitMQ Works in This App

1. **Grading Queue**:
   - **Producer**: Submission Service sends grading requests
   - **Consumer**: Grading Function receives and processes requests
   - **Flow**: 
     ```
     Submission Service → RabbitMQ (grading-queue) → Grading Function
     ```

2. **Notification Queue**:
   - **Producers**: Multiple services send notification events
   - **Consumer**: Notification Service broadcasts via WebSocket
   - **Flow**:
     ```
     Grading Function → RabbitMQ (notification-queue) → Notification Service → WebSocket → Client
     ```

### Serverless Grading Function

Yes! The `grading-function` service is designed as a **serverless function** (FaaS - Function as a Service).

**Current Setup**:
- Can run as a Docker container (for local development)
- Uses Spring Cloud Function (platform-agnostic)
- Includes AWS Lambda adapter for cloud deployment

**How It Works**:
1. Listens to RabbitMQ `grading-queue`
2. Receives submission data
3. Auto-grades answers against correct answers
4. Publishes results back via Kafka and RabbitMQ

**To Deploy as True Serverless** (AWS Lambda):
```powershell
cd grading-function
.\deploy-serverless.ps1
```

See `grading-function/SERVERLESS_DEPLOYMENT.md` for details.

## Useful Commands

### View Logs

View logs for all services:
```powershell
docker-compose logs -f
```

View logs for a specific service:
```powershell
docker-compose logs -f api-gateway
docker-compose logs -f user-service
docker-compose logs -f grading-function
```

### Stop Services

Stop all services:
```powershell
docker-compose down
```

Stop and remove volumes (clears database data):
```powershell
docker-compose down -v
```

### Restart a Single Service

```powershell
docker-compose restart user-service
```

### Rebuild a Service

If you make code changes to a specific service:
```powershell
# Example: rebuild user-service
docker-compose build user-service
docker-compose up -d user-service
```

### Check Service Health

```powershell
# Check if services are responding
curl http://localhost:8080/actuator/health  # API Gateway
curl http://localhost:8081/actuator/health  # User Service
curl http://localhost:8082/actuator/health  # Quiz Service
```

## Development Mode (Without Docker)

If you want to run services individually for development:

### 1. Start Infrastructure Services Only

```powershell
docker-compose up -d postgres mongodb redis rabbitmq kafka zookeeper
```

### 2. Run Java Services Manually

In separate PowerShell terminals:

```powershell
# User Service
cd user-service
mvn spring-boot:run

# Quiz Service
cd quiz-service
mvn spring-boot:run

# Submission Service
cd submission-service
mvn spring-boot:run

# Notification Service
cd notification-service
mvn spring-boot:run

# Analytics Service
cd analytics-service
mvn spring-boot:run

# Grading Function
cd grading-function
mvn spring-boot:run

# API Gateway
cd api-gateway
mvn spring-boot:run
```

### 3. Run Frontend in Development Mode

```powershell
# Main Frontend Shell
cd frontend
npm install
npm start

# Dashboard MFE
cd frontend/micro-frontends/dashboard
npm install
npm start

# Quiz MFE
cd frontend/micro-frontends/quiz
npm install
npm start

# Admin MFE
cd frontend/micro-frontends/admin
npm install
npm start
```

## Troubleshooting

### Issue: "Docker daemon not running"
**Solution**: Start Docker Desktop and wait for it to fully start.

### Issue: "Port already in use"
**Solution**: Check if another application is using the port:
```powershell
netstat -ano | findstr :8080
```
Stop the conflicting application or change the port in `docker-compose.yml`.

### Issue: "Build failed - out of memory"
**Solution**: Increase Docker memory in Docker Desktop settings:
- Docker Desktop → Settings → Resources → Memory (recommend 8GB+)

### Issue: Services fail to start
**Solution**: Check logs for specific errors:
```powershell
docker-compose logs [service-name]
```

### Issue: Cannot connect to database
**Solution**: Ensure PostgreSQL and MongoDB are fully started:
```powershell
docker-compose ps
docker-compose logs postgres
docker-compose logs mongodb
```

### Issue: Frontend shows errors
**Solution**: 
1. Check that all backend services are running
2. Verify API Gateway is accessible: http://localhost:8080
3. Check browser console for specific errors

## Testing the Application

### 1. Register a User

```powershell
curl -X POST http://localhost:8080/api/users/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com",
    "role": "STUDENT"
  }'
```

### 2. Login

```powershell
curl -X POST http://localhost:8080/api/users/auth/login `
  -H "Content-Type: application/json" `
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

Save the JWT token from the response.

### 3. Access Protected Endpoints

```powershell
curl -X GET http://localhost:8080/api/quizzes `
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Additional Resources

- **README.md**: Architecture overview and technical details
- **SECURING_REST_APIS_TUTORIAL.md**: JWT authentication guide
- **grading-function/SERVERLESS_DEPLOYMENT.md**: AWS Lambda deployment
- **grading-function/SERVERLESS_SUMMARY.md**: Serverless architecture overview

## Support

If you encounter issues not covered in this guide:
1. Check Docker logs: `docker-compose logs -f`
2. Verify all prerequisites are installed
3. Ensure Docker has sufficient resources (8GB+ RAM recommended)
4. Check that all required ports are available

---

**Happy coding! 🚀**


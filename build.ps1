# Build Quiz Platform Microservices
Write-Host "Building Quiz Platform Microservices..." -ForegroundColor Green

# Build all services with Maven
Write-Host "Building with Maven..." -ForegroundColor Yellow
mvn clean package -DskipTests

# Build Docker images for each service
Write-Host "Building Docker images..." -ForegroundColor Yellow

docker build -t quiz-platform/api-gateway:latest ./api-gateway
docker build -t quiz-platform/user-service:latest ./user-service
docker build -t quiz-platform/quiz-service:latest ./quiz-service
docker build -t quiz-platform/submission-service:latest ./submission-service
docker build -t quiz-platform/notification-service:latest ./notification-service
docker build -t quiz-platform/analytics-service:latest ./analytics-service
docker build -t quiz-platform/grading-function:latest ./grading-function

Write-Host "Build completed successfully!" -ForegroundColor Green


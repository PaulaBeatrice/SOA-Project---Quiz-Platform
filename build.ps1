# Build Quiz Platform - All Services, Frontend, and Micro-frontends
Write-Host "Building Quiz Platform - All Services..." -ForegroundColor Green

# Build all Java services with Maven
Write-Host "Building Java services with Maven..." -ForegroundColor Yellow
mvn clean package -DskipTests

# Build Shell Frontend
Write-Host "Building Shell Frontend..." -ForegroundColor Yellow
cd frontend
npm install
npm run build
cd ..

# Build Micro-frontends
Write-Host "Building Admin Micro-frontend..." -ForegroundColor Yellow
cd frontend/micro-frontends/admin
npm install
npm run build
cd ../../../

Write-Host "Building Dashboard Micro-frontend..." -ForegroundColor Yellow
cd frontend/micro-frontends/dashboard
npm install
npm run build
cd ../../../

Write-Host "Building Quiz Micro-frontend..." -ForegroundColor Yellow
cd frontend/micro-frontends/quiz
npm install
npm run build
cd ../../../

# Build Docker images for Java services
Write-Host "Building Docker images for Java services..." -ForegroundColor Yellow

docker build -t quizplatform-api-gateway:latest ./api-gateway
docker build -t quizplatform-user-service:latest ./user-service
docker build -t quizplatform-quiz-service:latest ./quiz-service
docker build -t quizplatform-submission-service:latest ./submission-service
docker build -t quizplatform-notification-service:latest ./notification-service
docker build -t quizplatform-analytics-service:latest ./analytics-service
docker build -t quizplatform-grading-function:latest ./grading-function

# Build Docker images for Frontend and Micro-frontends
Write-Host "Building Docker images for Frontend and Micro-frontends..." -ForegroundColor Yellow

docker build -t quizplatform-frontend:latest ./frontend
docker build -t quizplatform-admin-mfe:latest ./frontend/micro-frontends/admin
docker build -t quizplatform-dashboard-mfe:latest ./frontend/micro-frontends/dashboard
docker build -t quizplatform-quiz-mfe:latest ./frontend/micro-frontends/quiz

Write-Host "All builds completed successfully!" -ForegroundColor Green


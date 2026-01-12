#  Quiz Platform

A quiz platform demonstrating microservices architecture 

## System Architecture

### C4 Model - Level 1: System Context

```
┌────────────────────────────────────────────────────────────────┐
│                    Quiz Platform System                        │
│                                                                │
│  External Users (Admins, Students, Teachers)                   │
│           ↕                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Quiz Platform Microservices                            │   │
│  │  - Quiz Management                                      │   │
│  │  - Auto-Grading                                         │   │
│  │  - Real-time Notifications                              │   │
│  │  - Performance Analytics                                │   │
│  │  - Scalable Infrastructure                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### C4 Model - Level 2: Container Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Quiz Platform Deployment                          │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    External Users                              │  │
│  │              (Browser - HTTP/WebSocket)                        │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                              ▲                                       │
│                              │                                       │
│                    ┌─────────▼────────────┐                          │
│                    │   Nginx (Port 80)    │                          │
│                    │  Load Balancer       │                          │
│                    │  - Round-robin       │                          │
│                    │  - WebSocket upgrade │                          │
│                    └─────────┬────────────┘                          │
│                              │                                       │
│          ┌───────────────────┼───────────────────┐                   │
│          │                   │                   │                   │
│  ┌───────▼──────┐  ┌────────▼────────┐  ┌──────▼───────┐             │
│  │  Frontend    │  │  API Gateway    │  │ WebSocket    │             │
│  │  (React)     │  │  (8080)         │  │ Notification │             │
│  │  Port: 3000  │  │  - Routing      │  │ Service      │             │
│  │              │  │  - Auth Filter  │  │ (8084)       │             │
│  │ - Dashboard  │  │  - Rate limit   │  └──────────────┘             |
│  │ MicroFE(3001)│  └────────┬────────┘                               │
│  │ - Quiz       │           │                                        │
│  │ MicroFE(3002)│           │                                        │
│  │ - Admin      │           │                                        │
│  │ MicroFE(3003)│           │                                        │   
│  │ - WebSocket  │           │                                        │
│  └──────────────┘           │                                        │
│                             │                                        │
│          ┌──────────────────┼──────────────────┐                     │
│          │                  │                  │                     │
│   ┌──────▼──────┐   ┌───────▼────┐    ┌────────▼─────┐               │
│   │ User        │   │ Quiz       │    │ Submission   │               │
│   │ Service     │   │ Service    │    │ Service      │               │
│   │ (8081)      │   │ (8082)     │    │ (8083)       │               │
│   │             │   │            │    │              │               │
│   │ - Register  │   │ - CRUD     │    │ - Submit     │               │
│   │ - Login     │   │ - Questions│    │ - Grade      │               │
│   │ - Profile   │   │ - Validate │    │ - Analytics  │               │
│   └──────┬──────┘   └───────┬────┘    └────────┬─────┘               │
│          │                  │                  │                     │
│   ┌──────▼──────┐   ┌──────▼────┐    ┌───────▼──────┐                │
│   │ Analytics   │   │  Grading  │    │ Kafka        │                │
│   │ Service     │   │  Function │    │ Consumer     │                │
│   │ (8085)      │   │  (9000)   │    │              │                │
│   │             │   │           │    │ - Events     │                │
│   │ - Stats     │   │ - AutoGrade    │ - Streams    │                │
│   └─────────────┘   └───────────┘    └──────────────┘                │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │              Data & Messaging Infrastructure                   │  │
│  │                                                                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │  │
│  │  │PostgreSQL│  │ MongoDB  │  │  Redis   │  │   RabbitMQ    │   │  │
│  │  │(5432)    │  │(27017)   │  │(6379)    │  │   (5672)      │   │  │
│  │  │          │  │          │  │          │  │               │   │  │
│  │  │ - Users  │  │ - Quiz   │  │ - Cache  │  │ - Grading Q   │   │  │
│  │  │ - Submis.│  │ - Analyt.│  │ - Sess.  │  │ - Notifications│  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └───────────────┘   │  │
│  │                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │     Kafka + Zookeeper (Event Streaming)                  │  │  │
│  │  │                                                          │  │  │
│  │  │  Topics:                                                 │  │  │
│  │  │  - submission-events    (Quiz submissions)               │  │  │
│  │  │  - grading-events       (Auto-grading results)           │  │  │
│  │  │  - analytics-events     (User interactions)              │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Microservices 
1. **API Gateway** (Port 8080) - Request routing, JWT validation, rate limiting
2. **User Service** (Port 8081) - Authentication, user management, authorization
3. **Quiz Service** (Port 8082) - Quiz CRUD, question management
4. **Submission Service** (Port 8083) - Quiz attempts, records their answers, sends them for grading, stores results
5. **Notification Service** (Port 8084) - WebSocket real-time notifications 
6. **Analytics Service** (Port 8085) - Event processing from Kafka, statistics
7. **Grading Function** (Port 9000) - Serverless auto-grading (FaaS)
8. **Kafka Consumer** - Async event stream processing

### Infrastructure Components
- **PostgreSQL** (5432) - Relational databases (users, submissions)
- **MongoDB** (27017) - Document storage (quizzes, analytics)
- **Redis** (6379) - Session store, cache, WebSocket scaling
- **RabbitMQ** (5672/15672) - Message broker (grading, notifications)
- **Kafka** (9092) - Event streaming platform
- **Zookeeper** (2181) - Kafka coordination
- **Nginx** (80) - Load balancer, reverse proxy

---


###  **Secured REST API **

**1**: Expose secured REST services using JWT authentication

#### JWT Authentication Flow
```
Client Request → API Gateway → JWT Validation → Microservice → Database
                    ↓
            (Invalid Token)
                    ↓
                Return 401
```

#### Security Architecture
- **JWT Token Generation**: User Service creates signed tokens on login
- **Token Validation**: API Gateway validates all incoming requests
- **Role-Based Access Control**: STUDENT, TEACHER, ADMIN roles
- **Spring Security**: Integrated with all microservices


#### API Gateway (Validation)
```java
@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.csrf().disable()
            .authorizeRequests()
            .antMatchers("/api/users/auth/**").permitAll()
            .antMatchers("/api/quizzes/**").hasAnyRole("STUDENT", "TEACHER")
            .antMatchers("/api/admin/**").hasRole("ADMIN")
            .and()
            .addFilterBefore(new JwtAuthenticationFilter(), 
                UsernamePasswordAuthenticationFilter.class);
    }
}
```

#### Protected REST Endpoints
```bash
# Public endpoints (no auth required)
POST   /api/users/register
POST   /api/users/auth/login

# Protected endpoints (JWT required)
GET    /api/quizzes                       # STUDENT, TEACHER
POST   /api/quizzes                       # TEACHER
PUT    /api/quizzes/{id}                  # TEACHER
DELETE /api/quizzes/{id}                  # TEACHER

POST   /api/submissions/start             # STUDENT
POST   /api/submissions/{id}/submit        # STUDENT
GET    /api/submissions                   # STUDENT , TEACHER

GET    /api/analytics/dashboard           # TEACHER

DELETE /api/admin/users/{id}              # ADMIN
PUT    /api/admin/settings                # ADMIN
```

### **Load Balancer - Scalability **

**2**: Load balancers (e.g., nginx) or scalable WebSockets (e.g., Redis)

**Implementation**:

#### Nginx Load Balancer

```nginx
# nginx/nginx.conf
upstream api_gateway {
    server api-gateway:8080;
    keepalive 32;
}

upstream notification_service {
    server notification-service:8084;
}

server {
    listen 80;
    
    # HTTP/REST API Load Balancing 
    location /api/ {
        proxy_pass http://api_gateway;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
    }
    
    # WebSocket Load Balancing 
    location /ws/ {
        proxy_pass http://notification_service;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_buffering off;
    }
}
```

#### Redis-Backed WebSocket Scaling

```yaml
# application.yml - Notification Service
spring:
  session:
    store-type: redis
  redis:
    host: redis
    port: 6379
    timeout: 2000ms
  websocket:
    message-broker-enabled: true
    broker-relay-host: redis
```

#### Horizontal Scalability
```dockerfile
# Docker Compose - Scale services
services:
  notification-service:
    build: ./notification-service
    deploy:
      replicas: 3  # 3 instances
    ports:
      - "8084:8084"
    depends_on:
      - redis
```

### **Message Broker** 

**3**: Message brokers (RabbitMQ)

The Submission Service publishes grading requests to the queue, and the Grading Service consumes them, processes the submissions, and sends back the results. Port 5672 handles the actual messages, while 15672 provides a web UI for monitoring queues.

**Implementation**:

#### RabbitMQ Configuration
```yaml
# docker-compose.yml
rabbitmq:
  image: rabbitmq:3.12-management-alpine
  ports:
    - "5672:5672"    
    - "15672:15672"  
  environment:
    RABBITMQ_DEFAULT_USER: guest
    RABBITMQ_DEFAULT_PASS: guest
```

#### Message Producer (Submission Service)
```java
@Service
public class SubmissionService {
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    public void submitQuiz(Submission submission) {
        Submission saved = submissionRepository.save(submission);
        
        // Publish grading request to RabbitMQ
        GradingRequest request = new GradingRequest(
            saved.getId(),
            saved.getQuizId(),
            saved.getUserId(),
            saved.getAnswers()
        );
        
        rabbitTemplate.convertAndSend(
            "grading.exchange",
            "grading.submit",
            request
        );
        
        logger.info("Published to RabbitMQ: Submission {}", saved.getId());
    }
}
```

#### Message Consumer (Grading Function)
```java
@Service
public class GradingService {
    @RabbitListener(queues = "grading.queue")
    public void gradeSubmission(GradingRequest request) {
        logger.info("Received grading request: {}", request.getSubmissionId());
        
        GradingResult result = calculateGrade(request);
        gradingRepository.save(result);
        
        // Publish result back
        rabbitTemplate.convertAndSend(
            "grading.result.exchange",
            "grading.completed",
            result
        );
        
        logger.info("Grading completed: Score = {}", result.getScore());
    }
}
```

###  **Event Streaming - Kafka ** 

**4**: Event streaming (Kafka)

**Implementation**:

#### Kafka Infrastructure
```yaml
# docker-compose.yml
zookeeper:
  image: confluentinc/cp-zookeeper:latest
  environment:
    ZOOKEEPER_CLIENT_PORT: 2181

kafka:
  image: confluentinc/cp-kafka:latest
  environment:
    KAFKA_BROKER_ID: 1
    KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
    KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
    KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
```

#### Event Producer (Submission Service)
```java
@Service
public class SubmissionEventPublisher {
    @Autowired
    private KafkaTemplate<String, SubmissionEvent> kafkaTemplate;
    
    public void publishSubmissionEvent(Submission submission) {
        SubmissionEvent event = new SubmissionEvent(
            submission.getId(),
            submission.getUserId(),
            submission.getQuizId(),
            submission.getStatus(),
            System.currentTimeMillis()
        );
        
        kafkaTemplate.send(
            "submission-events",
            String.valueOf(submission.getId()),
            event
        );
        
        logger.info("Published to Kafka: submission-events");
    }
}
```

#### Event Consumer (Analytics Service)
```java
@Service
public class AnalyticsEventListener {
    
    @KafkaListener(
        topics = "submission-events",
        groupId = "analytics-group"
    )
    public void onSubmissionEvent(SubmissionEvent event) {
        logger.info("Received submission event: {}", event.getId());
        
        // Update analytics
        analyticsService.updateUserSubmissionCount(event.getUserId());
        analyticsService.updateQuizStatistics(event.getQuizId());
        
        auditService.logEvent(event);
    }
    
    @KafkaListener(
        topics = "grading-events",
        groupId = "analytics-group"
    )
    public void onGradingEvent(GradingEvent event) {
        logger.info("Received grading event: {}", event.getSubmissionId());
        
        // Update score statistics
        analyticsService.updateScoreStatistics(event.getScore(), event.getMaxScore());
        
        insightService.generatePerformanceInsights(event.getUserId());
    }
}
```

#### Kafka Topics & Events
```
Topic: submission-events
├─ Event: SUBMISSION_STARTED     → Quiz attempt initiated
├─ Event: SUBMISSION_SUBMITTED   → Quiz answers submitted
└─  Event: SUBMISSION_GRADED     → Auto-grading completed

Topic: grading-events
├─ Event: GRADING_STARTED        → Auto-grading process begins
├─ Event: GRADING_COMPLETED      → Grading finished
└─ Event: GRADING_FAILED         → Grading error occurred

Topic: analytics-events
├─ Event: QUIZ_CREATED           → New quiz created
└─  Event: QUIZ_TAKEN            → Quiz attempt recorded
```

### **FaaS - Serverless Function** 

**5**: Use FaaS (Function as a Service)

**Implementation**:

#### Grading Function Architecture
```
Submission Service ──> RabbitMQ ──> Grading Function ──> Update DB
                                   (Serverless FaaS)
```

#### Grading Function Service
```java

@RestController
@RequestMapping("/api/grade")
public class GradingController {
    @Autowired
    private GradingService gradingService;
    
    @PostMapping
    public ResponseEntity<GradingResult> grade(@RequestBody GradingRequest request) {
        logger.info("Processing grading request: {}", request.getSubmissionId());
        
        GradingResult result = gradingService.grade(request);
        
        return ResponseEntity.ok(result);
    }
}

@Service
public class GradingService {
    
    public GradingResult grade(GradingRequest request) {
        // Fetch quiz
        Quiz quiz = quizRepository.findById(request.getQuizId())
            .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        
        // Calculate score
        int score = 0;
        List<GradingDetail> details = new ArrayList<>();
        
        for (Question question : quiz.getQuestions()) {
            String studentAnswer = request.getAnswers().getOrDefault(question.getId(), "");
            String correctAnswer = question.getCorrectAnswers().get(0);
            
            boolean isCorrect = studentAnswer.equalsIgnoreCase(correctAnswer);
            
            if (isCorrect) {
                score += question.getPointValue();
            }
            
            details.add(new GradingDetail(
                question.getId(),
                studentAnswer,
                correctAnswer,
                isCorrect,
                question.getPointValue()
            ));
        }
        
        // Calculate percentage
        int maxScore = quiz.getQuestions().stream()
            .mapToInt(Question::getPointValue)
            .sum();
        
        double percentage = maxScore > 0 ? (score * 100.0) / maxScore : 0;
        
        GradingResult result = new GradingResult(
            request.getSubmissionId(),
            score,
            maxScore,
            percentage,
            percentage >= 60,  // passing score
            details,
            LocalDateTime.now()
        );
        
        logger.info("Grading completed: Score = {}/{}", score, maxScore);
        return result;
    }
}
```
-  **Single Responsibility**: Only grades submissions
-  **Event-Triggered**: Activated via RabbitMQ queue
-  **Stateless**: No persistent state between invocations
---

###  **Web App with Server-Side Notifications ** 

**6**: Web app consuming REST services and receiving server-side notifications

**Implementation**:

#### WebSocket Configuration (Notification Service)
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns("*")
            .withSockJS();  
    }
}

@RestController
public class NotificationController {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    public void notifySubmissionGraded(Long userId, GradingResult result) {
        SubmissionGradedNotification notification = new SubmissionGradedNotification(
            result.getSubmissionId(),
            result.getScore(),
            result.getMaxScore(),
            result.getPercentage(),
            result.isPassed(),
            LocalDateTime.now()
        );
        
        messagingTemplate.convertAndSendToUser(
            String.valueOf(userId),
            "/queue/grading-result",
            notification
        );
        
        logger.info("Sent notification to user: {}", userId);
    }
    
    public void broadcastQuizCreated(Quiz quiz) {
        QuizNotification notification = new QuizNotification(
            quiz.getId(),
            "QUIZ_CREATED",
            quiz.getTitle(),
            quiz.getCreatedBy()
        );
        
        messagingTemplate.convertAndSend(
            "/topic/quizzes",
            notification
        );
        
        logger.info("Broadcast: New quiz created - {}", quiz.getTitle());
    }
}
```

### **Micro-Frontend Architecture ** 

**7**: Use micro-frontend architecture

**Implementation**:

#### Webpack 5 Module Federation Configuration

#### Shell Application (Main App)
```jsx
// frontend/src/App.jsx
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';

// Lazy load remote micro-frontend modules
const DashboardModule = lazy(() => import('dashboard/Dashboard'));
const QuizModule = lazy(() => import('quiz/QuizManager'));
const AdminModule = lazy(() => import('admin/AdminDashboard'));

// Local pages
import Login from './components/Login';
import NotificationService from './services/NotificationService';

/**
 * Shell Application - Main App Container
 * Loads micro-frontends based on user role and route
 */
function App() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleNotification = useCallback((notification) => {
    console.log('[App] Notification received:', notification);
    const notifWithId = { ...notification, id: Date.now() };
    setNotifications(prev => [...prev, notifWithId]);
  }, []);

  // Restore user session on mount and connect to WebSocket
  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('userId');

    if (token && username && userId) {
      const userData = { 
        id: parseInt(userId), 
        username, 
        role,
        firstName: localStorage.getItem('firstName'),
        lastName: localStorage.getItem('lastName'),
        token 
      };
      setUser(userData);
      
      // Connect to notification service
      NotificationService.connect(username, handleNotification);
    }
    setLoading(false);
  }, [handleNotification]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Login onLogin={setUser} />;
}

export default App;
```

**Key Features:**
- **Lazy Loading**: Remote modules loaded only when needed
- **Unified Notification Handler**: Single callback manages all WebSocket notifications
- **Role-Based Access**: Dashboard access for all, Quizzes for TEACHERS, Admin panel for ADMINS
- **Session Persistence**: User session restored from localStorage

### **Containerization - Docker** 

**8**: Use containers (Docker)

#### Docker Compose Deployment

## Quick Start

### Prerequisites
- Java 17+
- Maven 3.8+
- Docker & Docker Compose
- Node.js 18+ 

### Docker Compose 

```bash
# Build all services
./build.ps1  # Windows

# Start all services
docker-compose up -d

```
## Service Details

### API Gateway (Spring Cloud Gateway)
- Secured entry point, load balancing, JWT validation
- **Port**: 8080
- **Key Features**:
  - JWT token validation on all routes
  - CORS configuration
  - Circuit breaker patterns
  - Request rate limiting

### User Service
- Authentication and user management
- **Port**: 8081
- **Database**: PostgreSQL (userdb)
- **Endpoints**:
  - `POST /users/auth/register` - User registration
  - `POST /users/auth/login` - User login (returns JWT)
  - `GET /users/{id}` - Get user by ID
  - `GET /users/username/{username}` - Get user by username

### Quiz Service
- Quiz and question management
- **Port**: 8082
- **Database**: PostgreSQL (quizdb)
- **Messaging**: Publishes to Kafka (quiz-events), RabbitMQ (notifications)
- **Endpoints**:
  - `POST /quizzes` - Create quiz
  - `GET /quizzes` - List all quizzes
  - `GET /quizzes/{id}` - Get quiz details
  - `PUT /quizzes/{id}` - Update quiz
  - `DELETE /quizzes/{id}` - Delete quiz

### Submission Service
- Handle quiz submissions and grading
- **Port**: 8083
- **Database**: PostgreSQL (submissiondb)
- **Messaging**: Kafka producer/consumer, RabbitMQ consumer
- **FaaS Integration**: Calls grading function for auto-grading
- **Endpoints**:
  - `POST /submissions/start` - Start quiz attempt
  - `POST /submissions/{id}/submit` - Submit answers
  - `GET /submissions/user/{userId}` - User's submissions

### Notification Service
- Real-time notifications via WebSocket
- **Port**: 8084
- **Storage**: Redis (for scalable WebSocket sessions)
- **Messaging**: RabbitMQ consumer
- **WebSocket Endpoint**: `/ws`
- **Topics**:
  - `/topic/quizzes` - Quiz updates
  - `/topic/notifications` - General notifications
  - `/queue/user-{userId}` - User-specific notifications

### Analytics Service
- Event streaming and analytics
- **Port**: 8085
- **Database**: MongoDB (analyticsdb)
- **Messaging**: Kafka consumer (all event topics)
- **Endpoints**:
  - `GET /analytics/dashboard` - Dashboard statistics
  - `GET /analytics/quiz-stats` - Quiz statistics
  - `GET /analytics/user-stats` - User statistics

### Grading Function (FaaS)
- Serverless auto-grading
- **Port**: 9000
- **Type**: Spring Cloud Function
- **Function**: `gradeSubmission(GradingRequest) -> GradingResponse`
- **Endpoint**: `POST /grade`
- **Logic**: Fetches quiz, compares answers, calculates score

## Micro-Frontend Architecture

The frontend uses Webpack Module Federation for true micro-frontend architecture:

### Shell Application (Port 3000)
- Main host application container
- Loads Dashboard, Quiz, and Admin micro-frontends dynamically
- Handles user authentication and session management
- Unified WebSocket notification handler
- Role-based routing and access control

### Micro-Frontends (Independently Deployed)
**Dashboard Module** (Port 3001)
- User dashboard with quiz statistics
- Performance analytics and results history

**Quiz Module** (Port 3002)
- Quiz creation and management (TEACHER role)
- Quiz-taking interface (STUDENT role)
- Question management and editing

**Admin Module** (Port 3003)
- System administration interface (ADMIN role)
- User management and monitoring
- Platform settings and configurations


## Project Structure

```
QuizPlatform/
├── api-gateway/          # Spring Cloud Gateway
├── user-service/         # User management & auth
├── quiz-service/         # Quiz CRUD
├── submission-service/   # Submissions & grading
├── notification-service/ # WebSocket notifications
├── analytics-service/    # Kafka consumer & analytics
├── grading-function/     # FaaS grading logic
├── frontend/             # React micro-frontend
├── docker-compose.yml    # Docker Compose config
├── nginx.conf            # Nginx load balancer config

```
---

## UML Class Diagrams

### User Domain Model

```
┌─────────────────────────────────────────┐
│             User (Entity)               │
├─────────────────────────────────────────┤
│ - id: Long                              │
│ - username: String (unique)             │
│ - email: String (unique)                │
│ - password: String                      │
│ - role: UserRole (ENUM)                 │
│ - createdAt: LocalDateTime              │            
├─────────────────────────────────────────┤
│ + getId(): Long                         │
│ + getFullName(): String                 │
│ + isStudent(): Boolean                  │
│ + isTeacher(): Boolean                  │
│ + isAdmin(): Boolean                    │
│ + validatePassword(raw): Boolean        │
└─────────────────────────────────────────┘
         △
         │ implements
         │
┌─────────────────────────────────────────┐
│      UserDetails (Spring Security)      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│    <<Enumeration>> UserRole             │
├─────────────────────────────────────────┤
│ STUDENT                                 │
│ TEACHER                                 │
│ ADMIN                                   │
└─────────────────────────────────────────┘
```

### Quiz Domain Model

```
┌─────────────────────────────────────────┐
│           Quiz (Entity)                 │
├─────────────────────────────────────────┤
│ - id: Long                              │
│ - title: String                         │
│ - description: String                   │
│ - createdBy: Long (userId, FK)          │
│ - timeLimit: Integer (minutes)          │
│ - passingScore: Integer                 │
│ - createdAt: LocalDateTime              │
│ - questions: List<Question>             │
├─────────────────────────────────────────┤
│ + addQuestion(q): void                  │
│ + removeQuestion(id): void              │
│ + getTotalPoints(): Integer             │
│ + validateQuiz(): Result                │
│ + publish(): void                       │
│ + canBeEdited(): Boolean                │
└─────────────────────────────────────────┘
         │
         │ contains (1..*)
         ▼
┌─────────────────────────────────────────┐
│        Question (Entity)                │
├─────────────────────────────────────────┤
│ - id: Long                              │
│ - quizId: Long (FK)                     │
│ - text: String                          │
│ - questionType: QuestionType            │
│ - options: List<String>                 │
│ - correctAnswers: List<String>          │
│ - points: Integer                       │
│ - correctOptionIndex: Integer           │
├─────────────────────────────────────────┤
│ + isAnswerCorrect(ans): Boolean         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  <<Enumeration>> QuestionType           │
├─────────────────────────────────────────┤
│ MULTIPLE_CHOICE                         │
│ SHORT_ANSWER                            │
│ TRUE_FALSE                              │
└─────────────────────────────────────────┘
```

### Submission & Grading Model

```
┌────────────────────────────────────────────────┐
│         Submission (Entity)                    │
├────────────────────────────────────────────────┤
│ - id: Long                                     │
│ - quizId: Long (FK)                            │
│ - userId: Long (FK)                            │
│ - answers: Map<Long, String> [questionId->ans] │
│ - score: Integer                               │
│ - maxScore: Integer                            │
│ - status: SubmissionStatus (ENUM)              │
│ - startedAt: LocalDateTime                     │
│ - submittedAt: LocalDateTime                   │
│ - gradedAt: LocalDateTime                      │
├────────────────────────────────────────────────┤
│ + getPercentage(): Double                      │
│ + isPassed(passingScore): Boolean              │
│ + submit(): void                               │
│ + grade(score, feedback): void                 │
└────────────────────────────────────────────────┘
         │
         │ triggers
         ▼
┌────────────────────────────────────────────────┐
│      GradingRequest (Message)                  │
├────────────────────────────────────────────────┤
│ - submissionId: Long                           │
│ - quizId: Long                                 │
│ - userId: Long                                 │
│ - answers: Map<Long, String>                   │
├────────────────────────────────────────────────┤
│ + hasAllAnswers(): Boolean                     │
└────────────────────────────────────────────────┘
         │
         │ produces
         ▼
┌────────────────────────────────────────────────┐
│      GradingResponse (Message)                 │
├────────────────────────────────────────────────┤
│ - submissionId: Long                           │
│ - score: Integer                               │
│ - maxScore: Integer                            │
├────────────────────────────────────────────────┤
│ + getPercentage(): Double                      │
│ + isPassed(): Boolean                          │
└────────────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  <<Enumeration>> SubmissionStatus       │
├─────────────────────────────────────────┤
│ STARTED                                 │
│ SUBMITTED                               │
│ GRADED                                  │
└─────────────────────────────────────────┘
```

### Service Architecture Model

```
┌───────────────────────────────────────────────┐
│         QuizService (Service)                 │
├───────────────────────────────────────────────┤
│ - quizRepository: QuizRepository              │
│ - questionRepository: QuestionRepository      │
| - kafkaTemplate: KafkaTemplate<String, Object>|
| - rabbitTemplate: RabbitTemplate              |
├───────────────────────────────────────────────┤
│ + createQuiz(quiz): Quiz                      │
│ + updateQuiz(id, quiz): Quiz                  │
│ + deleteQuiz(id): void                        │
│ + getQuizById(id): Quiz                       │
│ + getAllQuizzes(): List<Quiz>                 │
└───────────────────────────────────────────────┘
```

---

## C4 Level 3: Component Diagram (Submission Service)

```
┌──────────────────────────────────────────────────────┐
│        Submission Service (Spring Boot)              │
│                  Port: 8083                          │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │     SubmissionController (REST API)            │  │
│  │                                                │  │
│  │  POST   /api/submissions/start                 │  │
│  │  POST   /api/submissions/{id}/submit           │  │
│  │  GET    /api/submissions                       │  │
│  │  GET    /api/submissions/{id}                  │  │
│  └────────────────────────────────────────────────┘  │
│                    │                                 │
│                    ▼                                 │
│  ┌────────────────────────────────────────────────┐  │
│  │    SubmissionService                           │  │
│  │                                                │  │
│  │  - startSubmission(quizId)                     │  │
│  │  - submitAnswers(submissionId, answers)        │  │
│  │  - publishToRabbitMQ(submission)               │  │
│  │  - publishToKafka(event)                       │  │
│  │  - validateSubmission(submission)              │  │
│  └────────────────────────────────────────────────┘  │
│              │                        │              │
│              ▼                        ▼              │
│  ┌───────────────────┐    ┌──────────────────────┐   │
│  │ RabbitTemplate    │    │ KafkaTemplate        │   │
│  │ (Message Broker)  │    │ (Event Streaming)    │   │
│  └───────────────────┘    └──────────────────────┘   │
│              │                        │              │
│              ▼                        ▼              │
│         RabbitMQ                    Kafka            │
│      (grading.queue)           (submission-events)   │
│                                                      │
│  ┌───────────────────────────────────────────────┐   │
│  │  SubmissionRepository (Data Access)           │   │
│  │                                               │   │
│  │  + save(submission): Submission               │   │
│  │  + findById(id): Submission                   │   │
│  │  + findByUserId(userId): List<Submission>     │   │
│  │  + update(submission): Submission             │   │
│  └───────────────────────────────────────────────┘   │
│                    │                                 │
│                    ▼                                 │
│         PostgreSQL Database                          │
│       (submissiondb schema)                          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Quiz Submission & Grading Flow

```
┌────────┐
│Student │
│Browser │
└────┬───┘
     │ 1. Submit Quiz Answers
     │ POST /api/submissions/{id}/submit
     ▼
┌──────────────────┐
│  API Gateway     │
│  (Port 8080)     │ 2. Validate JWT Token
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│  Submission Service      │
│  (Port 8083)             │ 3. Save to DB
│                          │ 4. Publish to RabbitMQ
│                          │ 5. Publish to Kafka
└────┬──────────┬──────────┘
     │          │
 6.  │          │ 7.
     ▼          ▼
 RabbitMQ      Kafka
 Queue         Topic
     │          │
     │ 8.       │ 10.
     ▼          ▼
┌──────────────────────────┐
│  Grading Function        │
│  (Port 9000)             │ 11. Process & Calculate Score
└────┬─────────────────────┘
     │
     │ 12. Publish Result Event
     ▼
  Kafka Topic
     │
     │ 13. Consume Event
     ▼
┌──────────────────────────┐
│  Notification Service    │ 14. Send WebSocket Notification
│  (Port 8084)             │
└────┬─────────────────────┘
     │
     │ 15. WebSocket Message
     ▼
┌────────────────────┐
│  Student Browser   │ 16. Display Grade
│  (Dashboard)       │     Update UI
└────────────────────┘
```
---

```
QuizPlatform/
├── api-gateway/                    # Spring Cloud Gateway
│   ├── src/main/java/.../config/SecurityConfig.java
│   ├── src/main/java/.../filter/JwtAuthenticationFilter.java
│   ├── application.yml             # Route configuration
│   └── Dockerfile
│
├── user-service/                   # User Management
│   ├── src/main/java/.../security/JwtUtil.java
│   ├── src/main/java/.../controller/UserController.java
│   ├── src/main/java/.../service/UserService.java
│   ├── src/main/java/.../repository/UserRepository.java 
│   └── Dockerfile
│
├── quiz-service/                   # Quiz Management
│   ├── src/main/java/.../controller/QuizController.java
│   ├── src/main/java/.../service/QuizService.java
│   ├── src/main/java/.../repository/QuizRepository.java
│   ├── src/main/java/.../model/Quiz.java
│   ├── src/main/java/.../model/Question.java
│   └── Dockerfile
│
├── submission-service/             # Quiz Submissions
│   ├── src/main/java/.../controller/SubmissionController.java
│   ├── src/main/java/.../service/SubmissionService.java
│   ├── src/main/java/.../service/GradingScheduler.java
│   ├── src/main/java/.../model/Submission.java
│   └── Dockerfile
│
├── notification-service/           # WebSocket & Notifications
│   ├── src/main/java/.../config/WebSocketConfig.java
│   ├── src/main/java/.../config/RabbitMQConfig.java
│   ├── src/main/java/.../controller/NotificationController.java
│   ├── src/main/java/.../listener/NotificationListener.java
│   └── Dockerfile
│
├── analytics-service/              # Event Processing & Analytics
│   ├── src/main/java/.../listener/EventStreamListener.java
│   ├── src/main/java/.../service/AnalyticsService.java
│   ├── src/main/java/.../repository/AnalyticsEventRepository.java
│   └── Dockerfile
│
├── grading-function/               # Serverless Grading (FaaS)
│   ├── src/main/java/.../controller/GradingController.java
│   ├── src/main/java/.../function/GradingFunction.java
│   ├── src/main/java/.../listener/GradingListener.java
│   └── Dockerfile
│
├── kafka-consumer-service/         # Kafka Event Consumer
│   ├── src/main/java/.../listener/SubmissionEventListener.java
│   └── Dockerfile
│
├── frontend/                       # Shell Application (Webpack 5 Module Federation)
│   ├── src/
│   │   ├── components/
│   │   │   └── Login.jsx               # Authentication component
│   │   ├── services/
│   │   │   ├── api.js                  # Axios client with JWT interceptor
│   │   │   └── NotificationService.js  # WebSocket STOMP client
│   │   ├── App.jsx                     # Main shell application with role-based routing
│   │   ├── bootstrap.js                # Entry point
│   │   └── styles.css                  # Global styles
│   ├── public/
│   │   └── index.html                  # HTML template
│   ├── micro-frontends/                # Separate micro-frontend modules
│   │   ├── dashboard/                  # Dashboard micro-frontend
│   │   ├── quiz/                       # Quiz management micro-frontend
│   │   ├── admin/                      # Admin panel micro-frontend
│   │   └── shared-lib/                 # Shared utilities and constants
│   ├── webpack.config.js               # Webpack 5 Module Federation config
│   ├── package.json                    # Dependencies and scripts
│   └── Dockerfile                      # Container image
│
├── nginx/                          # Load Balancer & Reverse Proxy
│   ├── nginx.conf                 # Configuration
│   └── Dockerfile
│
├── docker-compose.yml             # Docker Compose orchestration
├── nginx.conf                     # Nginx configuration
├── init-db.sql                    # Database initialization
├── pom.xml                        # Parent Maven POM
├── build.ps1                      # PowerShell build script
├── build.sh                       # Bash build script
├── install-prerequisites.ps1      # Dependency installation
└── README.md                      # This file
```
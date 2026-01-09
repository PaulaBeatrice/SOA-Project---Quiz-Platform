# Securing REST APIs

1. [Introduction](#introduction)
2. [JWT Authentication](#jwt-authentication)
3. [API Gateway Pattern](#api-gateway-pattern)
4. [Role-Based Access Control (RBAC)](#role-based-access-control)
5. [Best Practices & Common Pitfalls](#best-practices--common-pitfalls)
6. [Implementation Examples from Quiz Platform](#implementation-examples-from-quiz-platform)

---

## Introduction

Securing REST APIs involves multiple layers of protection:

- **Authentication**: Verifying the identity of users (who you are)
- **Authorization**: Determining what authenticated users can access (what you're allowed to do)
- **Encryption**: Protecting data in transit and at rest
- **CORS Configuration**: Managing cross-origin requests safely


---

## JWT Authentication

### JWT Structure

A JWT consists of three parts separated by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

1. **Header**: Contains token type and hashing algorithm (HS256, RS256, etc.)
2. **Payload**: Contains claims (user data, roles, expiration time)
3. **Signature**: Cryptographic signature using a secret key

### JWT Generation Example

```java
// From user-service/src/main/java/org/example/user/security/JwtUtil.java
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    public String generateToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        return createToken(claims, username);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
```

**Key Points:**
- Secret key must be at least 256 bits for HS256 algorithm
- Token expiration is set server-side (typically 24 hours)
- Custom claims (e.g., `role`) are added for authorization
- Signature verifies token hasn't been tampered with

### JWT Validation

```java
public Boolean validateToken(String token, String username) {
    final String extractedUsername = extractUsername(token);
    return (extractedUsername.equals(username) && !isTokenExpired(token));
}

public String extractUsername(String token) {
    return extractAllClaims(token).getSubject();
}

private Claims extractAllClaims(String token) {
    return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
}

private Boolean isTokenExpired(String token) {
    return extractAllClaims(token).getExpiration().before(new Date());
}
```

### Authentication Flow

```
┌──────────────┐                          ┌──────────────┐
│   Client     │                          │  Auth Service│
└──────┬───────┘                          └──────┬───────┘
       │ POST /users/auth/login                  │
       │ username: "student@quiz.com"            │
       │ password: "secure_password"             │
       ├────────────────────────────────────────>│
       │                                         │
       │                                    [Verify credentials]
       │                                    [Hash password check]
       │                                    [Generate JWT]
       │                                         │
       │ 200 OK                                  │
       │ {token: "eyJhbGc..."}                   │
       |<────────────────────────────────────────┤
       │                                         │
       │ [Store token in localStorage]           │
       │                                         │
       │ GET /api/quizzes                        │
       │ Authorization: Bearer eyJhbGc...        │
       ├────────────────────────────────────────>│
       │                                         │
       │                                    [Validate JWT]
       │                                    [Extract claims]
       │                                    [Verify signature]
       │                                         │
       │ 200 OK [Quiz data]                      │
       |<────────────────────────────────────────┤
```

## API Gateway Pattern

The API Gateway is the single entry point for all client requests. It provides:
- Centralized authentication/authorization
- Request routing to microservices
- Rate limiting
- CORS handling
- Request/response filtering

### Gateway Architecture

```
┌────────────────┐
│     Client     │
└────────┬───────┘
         │
    HTTP/HTTPS
         │
         ▼
┌─────────────────────────────────────────┐
│        API Gateway (Port 8080)          │
├─────────────────────────────────────────┤
│  • JWT Validation Filter                │
│  • CORS Configuration                   │
│  • Rate Limiting                        │
│  • Request Routing                      │
└──────┬──────────────┬──────────────┬────┘
       │              │              │
   HTTP HTTP      HTTP HTTP      HTTP HTTP
       │              │              │
       ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌──────────────┐
│ User Service│ │Quiz Service │ │Submission Svc│
│  (8081)     │ │  (8082)     │ │   (8083)     │
└─────────────┘ └─────────────┘ └──────────────┘
```

### Gateway Configuration
Gateway configuration (application.yml) defines routing rules in Spring Cloud Gateway, forwarding incoming API requests to the correct microservices, handling path rewriting, CORS settings, and JWT-related properties
```yaml
# From api-gateway/src/main/resources/application.yml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: http://user-service:8081
          predicates:
            - Path=/api/users/**
          filters:
            - StripPrefix=1
        
        - id: quiz-service
          uri: http://quiz-service:8082
          predicates:
            - Path=/api/quiz-service/**
          filters:
            - StripPrefix=2
            
      globalcors:
        corsConfigurations:
          '[/**]':
            allowedOrigins:
              - "http://localhost:3000"
              - "http://localhost"
            allowedMethods:
              - GET
              - POST
              - PUT
              - DELETE
            allowedHeaders: "*"
            allowCredentials: false
            exposedHeaders:
              - "Authorization"

jwt:
  secret: your-secret-key-change-this-in-production-minimum-256-bits
  expiration: 86400000  # 24 hours in milliseconds
```

### JWT Authentication Filter
JwtAuthenticationFilter intercepts incoming requests at the gateway, extracts and validates the JWT from the Authorization header, and sets the authenticated user in the security context if the token is valid.
```java
// From api-gateway/src/main/java/org/example/gateway/security/JwtAuthenticationFilter.java
@Component
public class JwtAuthenticationFilter implements WebFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        
        // Skip auth for public endpoints
        String path = request.getPath().value();
        if (path.contains("/auth/") || path.contains("/health")) {
            return chain.filter(exchange);
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.extractUsername(token);
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(username, null, new ArrayList<>());

                return chain.filter(exchange)
                    .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication));
            }
        }

        return chain.filter(exchange);
    }
}
```

### Security Configuration
SecurityConfig configures security at the gateway level by disabling CSRF, enabling CORS, allowing public endpoints, and registering the JWT filter so authentication is enforced before requests reach downstream services.
```java
// From api-gateway/src/main/java/org/example/gateway/config/SecurityConfig.java
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        corsConfig.setAllowCredentials(false);
        corsConfig.addAllowedOriginPattern("*");
        corsConfig.addAllowedMethod("GET");
        corsConfig.addAllowedMethod("POST");
        corsConfig.addAllowedMethod("PUT");
        corsConfig.addAllowedMethod("DELETE");
        corsConfig.addAllowedMethod("OPTIONS");
        corsConfig.addAllowedHeader("*");
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);
        return source;
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers("/api/users/auth/**", "/actuator/**", "/health/**").permitAll()
                        .anyExchange().permitAll()  // JWT filter handles auth
                )
                .addFilterAt(jwtAuthenticationFilter, SecurityWebFiltersOrder.AUTHENTICATION)
                .build();
    }
}
```

**Key Concepts:**
- Public endpoints (`/auth/**`) bypass JWT validation
- All other endpoints require valid JWT in Authorization header
- Filter runs at AUTHENTICATION stage in security filter chain

---

## Role-Based Access Control (RBAC)

### Defining Roles

Roles represent sets of permissions. The Quiz Platform uses three roles:

| Role | Permissions                                            |
|------|--------------------------------------------------------|
| **STUDENT** | Take quizzes, view submissions, see scores             |
| **TEACHER** | Create/edit quizzes, view analytics, grade submissions |
| **ADMIN** | View all data                                          |

### Role Enforcement

Roles are embedded in JWT claims and checked before allowing access:

```java
// JWT includes role claim
public String generateToken(String username, String role) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("role", role);  // Store role in token
    return createToken(claims, username);
}

// Client sends Authorization header with token
// GET /api/analytics/dashboard
// Authorization: Bearer eyJhbGc...eyJyb2xlIjoiVEVBQ0hFUiJ9...
```

### Protected Endpoints

```
# Public endpoints - no auth required
POST   /api/users/register
POST   /api/users/auth/login

# Protected - any authenticated user (STUDENT, TEACHER)
GET    /api/quizzes
GET    /api/submissions

# Protected - TEACHER only
POST   /api/quizzes
PUT    /api/quizzes/{id}
DELETE /api/quizzes/{id}
GET    /api/analytics/dashboard
GET    /api/analytics/reports

# Protected - ADMIN only
DELETE /api/admin/users/{id}
PUT    /api/admin/settings
```

### Implementation in Microservices

While the gateway validates JWT signature, individual services can check specific roles:

```java
// Example in a service controller
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    
    // Accessible by any authenticated user
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(
            @RequestHeader("Authorization") String token) {
        // Gateway validates token before reaching here
        // Service can extract role from authenticated context if needed
        return ResponseEntity.ok(new DashboardData());
    }
    
    // For fine-grained control (if service handles authorization):
    @DeleteMapping("/admin/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        // Service could verify role from request context
        // if (userRole != ADMIN) throw UnauthorizedException();
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }
}
```

## Implementation Examples from Quiz Platform

### Complete Login Flow

```java
// 1. Client sends credentials
// POST /api/users/auth/login
// {
//   "username": "student@quiz.com",
//   "password": "secure_password"
// }

// 2. UserService processes login
@Service
public class UserService {
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;

    public AuthResponse login(LoginRequest request) {
        // Find user
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        // Check if account is active
        if (!user.isActive()) {
            throw new RuntimeException("Account is inactive");
        }

        // Generate JWT
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().toString());
        
        // Publish event to Kafka
        kafkaTemplate.send("user-events", Map.of(
            "eventType", "USER_LOGGED_IN",
            "userId", user.getId(),
            "username", user.getUsername()
        ));

        // Return response
        return new AuthResponse(token, user.getUsername(), user.getRole().toString(), user.getId());
    }
}

// 3. Client receives token and stores it
// Response: { token: "eyJhbGc...", username: "student@quiz.com", role: "STUDENT" }

// 4. Client includes token in subsequent requests
// GET /api/quizzes
// Authorization: Bearer eyJhbGc...

// 5. API Gateway validates token
@Component
public class JwtAuthenticationFilter implements WebFilter {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String authHeader = exchange.getRequest()
                .getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            
            if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.extractUsername(token);
                // Set authenticated context
                UsernamePasswordAuthenticationToken auth = 
                    new UsernamePasswordAuthenticationToken(username, null, new ArrayList<>());
                
                return chain.filter(exchange)
                    .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth));
            }
        }
        
        return chain.filter(exchange);
    }
}

// 6. Request reaches microservice
@RestController
@RequestMapping("/api/quizzes")
public class QuizController {
    @GetMapping
    public ResponseEntity<?> getQuizzes() {
        // Token already validated, user authenticated
        List<Quiz> quizzes = quizService.getAllQuizzes();
        return ResponseEntity.ok(quizzes);
    }
}
```

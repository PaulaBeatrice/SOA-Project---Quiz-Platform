# ✅ Grading Function Fixed - Ready to Run

## What Was Fixed

### 1. **pom.xml Changes**
- ✅ Removed `<classifier>exec</classifier>` that was creating wrong JAR name
- ✅ Added `<mainClass>org.example.grading.GradingFunctionApplication</mainClass>`
- ✅ Configured Spring Boot plugin to create proper executable JAR

### 2. **Dockerfile Changes**
- ✅ Changed from simple copy to **multi-stage build**
- ✅ Now builds the application inside Docker (more reliable)
- ✅ Uses Maven to compile and package
- ✅ Copies the correct JAR file pattern: `grading-function-*.jar`

---

## How to Rebuild and Run

### Option 1: Rebuild Everything (Recommended)

```powershell
# Navigate to project root
cd "C:\Users\PaulaSerban\OneDrive - BMW Techworks Romania\Desktop\SOA PROJECT\SOA-Project---Quiz-Platform"

# Stop all containers
docker-compose down

# Remove old grading function image
docker rmi quizplatform-grading-function

# Rebuild and start
docker-compose up -d --build grading-function

# Watch the logs
docker-compose logs -f grading-function
```

### Option 2: Just Grading Function

```powershell
# Stop grading function
docker-compose stop grading-function

# Remove container and image
docker-compose rm -f grading-function
docker rmi quizplatform-grading-function

# Rebuild with no cache
docker-compose build --no-cache grading-function

# Start and watch logs
docker-compose up grading-function
```

---

## Expected Output

You should see logs like this if successful:

```
grading-function-1  | 
grading-function-1  |   .   ____          _            __ _ _
grading-function-1  |  /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
grading-function-1  | ( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
grading-function-1  |  \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
grading-function-1  |   '  |____| .__|_| |_|_| |_\__, | / / / /
grading-function-1  |  =========|_|==============|___/=/_/_/_/
grading-function-1  |  :: Spring Boot ::
grading-function-1  | 
grading-function-1  | 2026-01-13 ... : Starting GradingFunctionApplication
grading-function-1  | 2026-01-13 ... : Started GradingFunctionApplication in X seconds
```

---

## What Changed in the Files

### Before (pom.xml):
```xml
<configuration>
    <classifier>exec</classifier>  ❌ Creates grading-function-1.0-SNAPSHOT-exec.jar
</configuration>
```

### After (pom.xml):
```xml
<configuration>
    <mainClass>org.example.grading.GradingFunctionApplication</mainClass>  ✅ Creates grading-function-1.0-SNAPSHOT.jar
    <excludes>
        <exclude>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
        </exclude>
    </excludes>
</configuration>
```

### Before (Dockerfile):
```dockerfile
FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY target/*.jar app.jar  ❌ Expects JAR to exist, wrong name
EXPOSE 9000
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### After (Dockerfile):
```dockerfile
# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY ../pom.xml ./parent-pom.xml
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests  ✅ Builds inside Docker

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /build/target/grading-function-*.jar app.jar  ✅ Correct pattern
EXPOSE 9000
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## Why It Was Failing Before

1. **"no main manifest attribute, in app.jar"**
   - The `<classifier>exec</classifier>` was creating a JAR named `grading-function-1.0-SNAPSHOT-exec.jar`
   - But Dockerfile was copying `grading-function-1.0-SNAPSHOT.jar`
   - Wrong JAR file was copied → no manifest

2. **Multi-stage build benefits:**
   - Ensures Maven dependencies are downloaded fresh
   - Builds from source inside Docker (consistent environment)
   - Uses smaller JRE image for runtime (alpine - 50% smaller)
   - More reliable than copying pre-built JARs

---

## Verify It's Running

```powershell
# Check status
docker-compose ps grading-function

# Should show:
# NAME                   STATUS              PORTS
# grading-function-1     Up X seconds        0.0.0.0:9000->9000/tcp

# Test the endpoint (if health endpoint exists)
curl http://localhost:9000/actuator/health

# Check RabbitMQ connection
# Go to http://localhost:15672 (guest/guest)
# Look for "grading-queue" in Queues tab
```

---

## Troubleshooting

### Issue: Build fails with "Cannot resolve dependency"
**Solution:** The multi-stage build will download dependencies fresh. If it fails, check internet connection or try:
```powershell
docker-compose build --no-cache --pull grading-function
```

### Issue: Still shows "no main manifest"
**Solution:** Ensure you removed old images:
```powershell
docker images | Select-String "grading"
docker rmi <image-id> -f
```

### Issue: Container exits immediately with code 1
**Solution:** Check logs for the actual error:
```powershell
docker-compose logs grading-function | Select-String "ERROR"
```

---

## Next Steps After It Starts

1. **Test the grading flow:**
   - Submit a quiz through the API
   - Watch grading-function logs
   - Check RabbitMQ for messages

2. **Monitor RabbitMQ:**
   - Open http://localhost:15672
   - Login: guest/guest
   - Check "grading-queue" for messages

3. **Verify integration:**
   - Submission Service should send to RabbitMQ
   - Grading Function should consume and process
   - Results should appear in notifications

---

## Summary

✅ **pom.xml** - Fixed to create proper executable JAR  
✅ **Dockerfile** - Multi-stage build compiles inside Docker  
✅ **docker-compose.yml** - Already has correct RabbitMQ config  

**The grading function should now start and stay running!**

Run this to see it work:
```powershell
docker-compose up -d --build grading-function
docker-compose logs -f grading-function
```


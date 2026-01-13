# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# Copy parent pom first for dependency resolution
COPY ../pom.xml ./parent-pom.xml

# Copy project files
COPY pom.xml .
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built jar from build stage
COPY --from=build /build/target/grading-function-*.jar app.jar

EXPOSE 9000

ENTRYPOINT ["java", "-jar", "app.jar"]


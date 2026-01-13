# Build stage
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# Copy parent pom from project root
COPY pom.xml ./
# Copy grading-function module
COPY grading-function/pom.xml ./grading-function/
COPY grading-function/src ./grading-function/src

# Build the grading-function module
WORKDIR /build/grading-function
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /build/grading-function/target/*.jar app.jar

EXPOSE 9000

ENTRYPOINT ["java", "-jar", "app.jar"]
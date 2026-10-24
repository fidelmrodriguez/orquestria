# Build Java 21; testes executados durante o deploy via Docker.
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml ./
COPY src ./src
RUN mvn -B -ntp clean verify

# Execução da API com JRE (sem Maven ou código-fonte na imagem final).
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/orquestria-api-0.1.0-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

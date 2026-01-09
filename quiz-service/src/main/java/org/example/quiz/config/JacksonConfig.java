package org.example.quiz.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.hibernate5.jakarta.Hibernate5JakartaModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        // Register Hibernate module for lazy loading support
        mapper.registerModule(new Hibernate5JakartaModule());
        // Register Java 8 date/time module for LocalDateTime support
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }
}

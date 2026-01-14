package org.example.gateway.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.ArrayList;

@Component
public class JwtAuthenticationFilter implements WebFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        // Skip authentication for public endpoints
        if (path.contains("/auth/") || path.contains("/health")) {
            return chain.filter(exchange);
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.extractUsername(token);
                String role = jwtUtil.extractRole(token);

                // Role-based path protection
                if (!isAuthorized(path, role)) {
                    exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                    return exchange.getResponse().setComplete();
                }

                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(username, null, new ArrayList<>());

                return chain.filter(exchange)
                    .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication));
            } else {
                // Invalid token
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
        }

        // No token provided
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    private boolean isAuthorized(String path, String role) {
        if (role == null) {
            return false;
        }

        // Analytics endpoints - only ADMIN and TEACHER
        if (path.contains("/analytics-service") || path.contains("/analytics")) {
            return role.equals("ADMIN") || role.equals("TEACHER");
        }

        // Admin-specific endpoints - only ADMIN
        if (path.contains("/admin") || path.contains("/user-service/users")) {
            return role.equals("ADMIN");
        }

        // Quiz management endpoints - ADMIN and TEACHER
        if ((path.contains("/quiz-service") && (path.contains("/create") || path.contains("/update") || path.contains("/delete")))) {
            return role.equals("ADMIN") || role.equals("TEACHER");
        }

        // Grading endpoints - ADMIN and TEACHER
        if (path.contains("/grading") || path.contains("/submission-service/grade")) {
            return role.equals("ADMIN") || role.equals("TEACHER");
        }

        // All other endpoints are accessible by all authenticated users
        return true;
    }
}


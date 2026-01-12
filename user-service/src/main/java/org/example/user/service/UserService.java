package org.example.user.service;

import org.example.user.dto.AuthResponse;
import org.example.user.dto.LoginRequest;
import org.example.user.dto.RegisterRequest;
import org.example.user.model.User;
import org.example.user.repository.UserRepository;
import org.example.user.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null ? request.getRole() : User.Role.STUDENT);

        user = userRepository.save(user);

        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "USER_REGISTERED");
            event.put("userId", user.getId());
            event.put("username", user.getUsername());
            event.put("email", user.getEmail());
            event.put("role", user.getRole().toString());
            kafkaTemplate.send("user-events", event);
        } catch (Exception e) {
            System.err.println("Failed to publish Kafka event: " + e.getMessage());
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().toString());
        return new AuthResponse(token, user.getUsername(), user.getRole().toString(), user.getId());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (!user.isActive()) {
            throw new RuntimeException("Account is inactive");
        }

        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "USER_LOGGED_IN");
            event.put("userId", user.getId());
            event.put("username", user.getUsername());
            kafkaTemplate.send("user-events", event);
        } catch (Exception e) {
            System.err.println("Failed to publish Kafka event: " + e.getMessage());
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().toString());
        return new AuthResponse(token, user.getUsername(), user.getRole().toString(), user.getId());
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<User> getUsersByRole(String role) {
        try {
            User.Role userRole = User.Role.valueOf(role);
            return userRepository.findAll().stream()
                    .filter(u -> u.getRole() == userRole)
                    .toList();
        } catch (IllegalArgumentException e) {
            return userRepository.findAll();
        }
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public User updateUserRole(Long id, String newRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        try {
            user.setRole(User.Role.valueOf(newRole));
            return userRepository.save(user);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role: " + newRole);
        }
    }
}


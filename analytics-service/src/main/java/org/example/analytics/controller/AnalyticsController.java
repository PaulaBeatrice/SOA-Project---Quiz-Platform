package org.example.analytics.controller;

import org.example.analytics.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(analyticsService.getDashboardStats());
    }

    @GetMapping("/quiz-stats")
    public ResponseEntity<Map<String, Object>> getQuizStats() {
        return ResponseEntity.ok(analyticsService.getQuizStats());
    }

    @GetMapping("/user-stats")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        return ResponseEntity.ok(analyticsService.getUserStats());
    }
}


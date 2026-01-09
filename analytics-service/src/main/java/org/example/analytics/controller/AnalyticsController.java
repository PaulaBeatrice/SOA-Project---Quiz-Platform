package org.example.analytics.controller;

import org.example.analytics.model.AnalyticsEvent;
import org.example.analytics.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/events")
    public ResponseEntity<List<AnalyticsEvent>> getAllEvents() {
        return ResponseEntity.ok(analyticsService.getAllEvents());
    }

    @GetMapping("/events/type/{eventType}")
    public ResponseEntity<List<AnalyticsEvent>> getEventsByType(@PathVariable String eventType) {
        return ResponseEntity.ok(analyticsService.getEventsByType(eventType));
    }

    @GetMapping("/events/date-range")
    public ResponseEntity<List<AnalyticsEvent>> getEventsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(analyticsService.getEventsByDateRange(start, end));
    }

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


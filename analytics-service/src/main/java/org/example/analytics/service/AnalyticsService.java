package org.example.analytics.service;

import org.example.analytics.model.AnalyticsEvent;
import org.example.analytics.repository.AnalyticsEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private AnalyticsEventRepository eventRepository;

    public List<AnalyticsEvent> getAllEvents() {
        return eventRepository.findAll();
    }

    public List<AnalyticsEvent> getEventsByType(String eventType) {
        return eventRepository.findByEventType(eventType);
    }

    public List<AnalyticsEvent> getEventsByDateRange(LocalDateTime start, LocalDateTime end) {
        return eventRepository.findByTimestampBetween(start, end);
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        List<AnalyticsEvent> allEvents = eventRepository.findAll();

        // Count events by type
        Map<String, Long> eventCounts = allEvents.stream()
            .collect(Collectors.groupingBy(
                AnalyticsEvent::getEventType,
                Collectors.counting()
            ));

        stats.put("totalEvents", allEvents.size());
        stats.put("eventCounts", eventCounts);
        stats.put("lastUpdated", LocalDateTime.now());

        return stats;
    }

    public Map<String, Object> getQuizStats() {
        List<AnalyticsEvent> quizEvents = eventRepository.findByEventType("QUIZ_CREATED");
        List<AnalyticsEvent> submissionEvents = eventRepository.findByEventType("SUBMISSION_SUBMITTED");

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalQuizzes", quizEvents.size());
        stats.put("totalSubmissions", submissionEvents.size());

        return stats;
    }

    public Map<String, Object> getUserStats() {
        List<AnalyticsEvent> userRegistrations = eventRepository.findByEventType("USER_REGISTERED");
        List<AnalyticsEvent> userLogins = eventRepository.findByEventType("USER_LOGGED_IN");

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRegistrations.size());
        stats.put("totalLogins", userLogins.size());

        return stats;
    }
}


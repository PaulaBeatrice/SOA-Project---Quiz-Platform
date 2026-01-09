package org.example.analytics.repository;

import org.example.analytics.model.AnalyticsEvent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnalyticsEventRepository extends MongoRepository<AnalyticsEvent, String> {
    List<AnalyticsEvent> findByEventType(String eventType);
    List<AnalyticsEvent> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
}


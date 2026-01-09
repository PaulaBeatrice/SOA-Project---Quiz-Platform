package org.example.analytics.listener;

import org.example.analytics.model.AnalyticsEvent;
import org.example.analytics.repository.AnalyticsEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class EventStreamListener {

    @Autowired
    private AnalyticsEventRepository eventRepository;

    @KafkaListener(topics = {"user-events", "quiz-events", "submission-events"}, groupId = "analytics-group")
    public void consumeEvent(Map<String, Object> eventData) {
        String eventType = (String) eventData.get("eventType");

        AnalyticsEvent event = new AnalyticsEvent();
        event.setEventType(eventType);
        event.setData(eventData);

        eventRepository.save(event);

        System.out.println("Stored analytics event: " + eventType);
    }
}


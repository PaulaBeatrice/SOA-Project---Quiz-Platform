package org.example.kafkaconsumer.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class SubmissionEventListener {
    private static final Logger logger = LoggerFactory.getLogger(SubmissionEventListener.class);

    @KafkaListener(topics = "submission-events", groupId = "submission-consumer-group")
    public void listenSubmissionEvents(Map<String, Object> message) {
        logger.info(" Received event from Kafka: {}", message);
        
        String eventType = (String) message.get("eventType");
        Long submissionId = ((Number) message.get("submissionId")).longValue();
        Long quizId = ((Number) message.get("quizId")).longValue();
        Long userId = ((Number) message.get("userId")).longValue();
        
        switch (eventType) {
            case "SUBMISSION_STARTED":
                handleSubmissionStarted(submissionId, quizId, userId);
                break;
            case "SUBMISSION_SUBMITTED":
                handleSubmissionSubmitted(submissionId, quizId, userId);
                break;
            case "SUBMISSION_GRADED":
                handleSubmissionGraded(submissionId, quizId, userId);
                break;
            default:
                logger.warn("Unknown event type: {}", eventType);
        }
    }

    private void handleSubmissionStarted(Long submissionId, Long quizId, Long userId) {
        logger.info(" SUBMISSION_STARTED - User {} started quiz {}", userId, quizId);
        // Could trigger notifications, logging, analytics, etc.
    }

    private void handleSubmissionSubmitted(Long submissionId, Long quizId, Long userId) {
        logger.info(" SUBMISSION_SUBMITTED - User {} submitted quiz {}", userId, quizId);
        // Could trigger grading notifications, status updates
    }

    private void handleSubmissionGraded(Long submissionId, Long quizId, Long userId) {
        logger.info(" SUBMISSION_GRADED - User {} submission {} graded", userId, submissionId);
        // Could trigger report generation, analytics updates, notifications
    }

    @KafkaListener(topics = "quiz-events", groupId = "quiz-consumer-group")
    public void listenQuizEvents(Map<String, Object> message) {
        logger.info(" Received quiz event: {}", message);
        
        String eventType = (String) message.get("eventType");
        
        switch (eventType) {
            case "QUIZ_CREATED":
                handleQuizCreated(message);
                break;
            case "QUIZ_UPDATED":
                handleQuizUpdated(message);
                break;
            case "QUIZ_DELETED":
                handleQuizDeleted(message);
                break;
            default:
                logger.warn("Unknown quiz event: {}", eventType);
        }
    }

    private void handleQuizCreated(Map<String, Object> message) {
        logger.info(" New quiz created: {}", message.get("title"));
        // Could cache quiz, update analytics, trigger notifications
    }

    private void handleQuizUpdated(Map<String, Object> message) {
        logger.info(" Quiz updated: {}", message.get("title"));
        // Could invalidate cache, update indexes
    }

    private void handleQuizDeleted(Map<String, Object> message) {
        logger.info(" Quiz deleted: {}", message.get("quizId"));
        // Could clean up related data, remove from cache
    }
}

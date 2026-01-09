package org.example.submission.service;

import org.example.submission.dto.GradingRequest;
import org.example.submission.dto.GradingResponse;
import org.example.submission.model.Submission;
import org.example.submission.repository.SubmissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SubmissionService {
    private static final Logger logger = LoggerFactory.getLogger(SubmissionService.class);

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private WebClient.Builder webClientBuilder;

    @Value("${grading.function.url}")
    private String gradingFunctionUrl;

    public Submission startSubmission(Long quizId, Long userId) {
        Submission submission = new Submission();
        submission.setQuizId(quizId);
        submission.setUserId(userId);
        submission.setStatus(Submission.Status.IN_PROGRESS);

        Submission savedSubmission = submissionRepository.save(submission);

        // Publish event to Kafka (wrapped in try-catch)
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "SUBMISSION_STARTED");
            event.put("submissionId", savedSubmission.getId());
            event.put("quizId", quizId);
            event.put("userId", userId);
            kafkaTemplate.send("submission-events", event);
        } catch (Exception e) {
            System.err.println("Failed to send Kafka event: " + e.getMessage());
        }

        return savedSubmission;
    }

    public Submission submitQuiz(Long submissionId, Map<Long, String> answers) {
        logger.info(" RECEIVED ANSWERS: {}", answers);
        for (Map.Entry<Long, String> entry : answers.entrySet()) {
            logger.info("   Question {} -> Answer: '{}' (type: {})", 
                entry.getKey(), 
                entry.getValue(), 
                entry.getValue() == null ? "null" : entry.getValue().getClass().getSimpleName());
        }
        
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        submission.setAnswers(answers);
        submission.setStatus(Submission.Status.SUBMITTED);
        submission.setSubmittedAt(LocalDateTime.now());

        Submission savedSubmission = submissionRepository.save(submission);

        // Send to RabbitMQ for async grading
        GradingRequest gradingRequest = new GradingRequest(
            savedSubmission.getId(),
            savedSubmission.getQuizId(),
            savedSubmission.getAnswers()
        );
        rabbitTemplate.convertAndSend("grading-queue", gradingRequest);

        // Publish event to Kafka (wrapped in try-catch)
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", "SUBMISSION_SUBMITTED");
            event.put("submissionId", savedSubmission.getId());
            event.put("quizId", savedSubmission.getQuizId());
            event.put("userId", savedSubmission.getUserId());
            kafkaTemplate.send("submission-events", event);
        } catch (Exception e) {
            System.err.println("Failed to send Kafka event: " + e.getMessage());
        }

        return savedSubmission;
    }

    public Submission gradeSubmission(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        // Call FaaS grading function
        GradingRequest request = new GradingRequest(
            submission.getId(),
            submission.getQuizId(),
            submission.getAnswers()
        );

        GradingResponse response = webClientBuilder.build()
            .post()
            .uri(gradingFunctionUrl)
            .bodyValue(request)
            .retrieve()
            .bodyToMono(GradingResponse.class)
            .block();

        if (response != null) {
            submission.setScore(response.getScore());
            submission.setMaxScore(response.getMaxScore());
            submission.setStatus(Submission.Status.GRADED);
            submission.setGradedAt(LocalDateTime.now());

            Submission gradedSubmission = submissionRepository.save(submission);

            // Publish event to Kafka (wrapped in try-catch)
            try {
                Map<String, Object> event = new HashMap<>();
                event.put("eventType", "SUBMISSION_GRADED");
                event.put("submissionId", gradedSubmission.getId());
                event.put("userId", gradedSubmission.getUserId());
                event.put("score", gradedSubmission.getScore());
                event.put("maxScore", gradedSubmission.getMaxScore());
                kafkaTemplate.send("submission-events", event);
            } catch (Exception e) {
                System.err.println("Failed to send Kafka event: " + e.getMessage());
            }

            // Send notification via RabbitMQ
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "SUBMISSION_GRADED");
            notification.put("userId", gradedSubmission.getUserId());
            notification.put("submissionId", gradedSubmission.getId());
            notification.put("score", gradedSubmission.getScore());
            rabbitTemplate.convertAndSend("notifications", notification);

            return gradedSubmission;
        }

        return submission;
    }

    public Submission getSubmissionById(Long id) {
        return submissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
    }

    public List<Submission> getSubmissionsByUser(Long userId) {
        return submissionRepository.findByUserId(userId);
    }

    public List<Submission> getSubmissionsByQuiz(Long quizId) {
        return submissionRepository.findByQuizId(quizId);
    }
}


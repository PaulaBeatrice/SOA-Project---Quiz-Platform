package org.example.submission.service;

import org.example.submission.model.Submission;
import org.example.submission.repository.SubmissionRepository;
import org.example.submission.dto.GradingRequest;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GradingScheduler {
    
    @Autowired
    private SubmissionRepository submissionRepository;
    
    @Autowired
    private WebClient.Builder webClientBuilder;
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    

    @Scheduled(fixedDelay = 5000) 
    public void gradeSubmissions() {
        try {
            // Find all submissions that have been submitted but not yet graded
            List<Submission> submissions = submissionRepository.findAll();
            
            for (Submission submission : submissions) {
                if (submission.getStatus() == Submission.Status.SUBMITTED) {
                    gradeSubmission(submission);
                }
            }
        } catch (Exception e) {
            System.err.println("Error in grading scheduler: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void gradeSubmission(Submission submission) {
        try {
            // Call the grading function to calculate the actual score
            GradingRequest gradingRequest = new GradingRequest(
                submission.getId(),
                submission.getQuizId(),
                submission.getAnswers()
            );

            try {
                org.example.submission.dto.GradingResponse gradingResponse = webClientBuilder.build()
                    .post()
                    .uri("http://grading-function:9000/grade")
                    .bodyValue(gradingRequest)
                    .retrieve()
                    .bodyToMono(org.example.submission.dto.GradingResponse.class)
                    .block();

                if (gradingResponse != null) {
                    submission.setStatus(Submission.Status.GRADED);
                    submission.setScore(gradingResponse.getScore());
                    submission.setMaxScore(gradingResponse.getMaxScore());
                } else {
                    System.err.println("No response from grading function for submission " + submission.getId());
                    return;
                }
            } catch (Exception e) {
                System.err.println("Error calling grading function: " + e.getMessage());
                return;
            }

            Submission gradedSubmission = submissionRepository.save(submission);
            
            System.out.println(" Graded submission " + submission.getId() + " with score: " + submission.getScore() + "/" + submission.getMaxScore());
            
            // Send notification via RabbitMQ to notify students and admins
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "SUBMISSION_GRADED");
            notification.put("userId", gradedSubmission.getUserId());
            notification.put("submissionId", gradedSubmission.getId());
            notification.put("score", gradedSubmission.getScore());
            notification.put("maxScore", gradedSubmission.getMaxScore());
            
            System.out.println(" Publishing SUBMISSION_GRADED notification for user " + gradedSubmission.getUserId());
            rabbitTemplate.convertAndSend("notifications", notification);
            
        } catch (Exception e) {
            System.err.println("Error grading submission " + submission.getId() + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}

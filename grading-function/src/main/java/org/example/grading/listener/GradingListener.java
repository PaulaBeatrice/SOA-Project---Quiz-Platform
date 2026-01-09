package org.example.grading.listener;

import org.example.grading.dto.GradingRequest;
import org.example.grading.dto.GradingResponse;
import org.example.grading.function.GradingFunction;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class GradingListener {

    @Autowired
    private GradingFunction gradingFunction;

    @Autowired
    private WebClient.Builder webClientBuilder;

    @RabbitListener(queues = "grading-queue")
    public void processGradingRequest(GradingRequest request) {
        try {
            System.out.println("Processing grading request for submission: " + request.getSubmissionId());
            
            // Call the grading function
            GradingResponse response = gradingFunction.gradeSubmission().apply(request);
            
            // Send the response back to update the submission
            updateSubmissionGrade(response);
            
        } catch (Exception e) {
            System.err.println("Error processing grading request: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void updateSubmissionGrade(GradingResponse response) {
        try {
            webClientBuilder.build()
                .post()
                .uri("http://submission-service:8083/submissions/" + response.getSubmissionId() + "/grade")
                .bodyValue(response)
                .retrieve()
                .toBodilessEntity()
                .block();
            
            System.out.println("Updated submission " + response.getSubmissionId() + 
                " with score: " + response.getScore() + "/" + response.getMaxScore());
        } catch (Exception e) {
            System.err.println("Failed to update submission grade: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

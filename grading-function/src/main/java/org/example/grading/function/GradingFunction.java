package org.example.grading.function;

import org.example.grading.dto.GradingRequest;
import org.example.grading.dto.GradingResponse;
import org.example.grading.model.Question;
import org.example.grading.model.Quiz;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.function.Function;

@Component
public class GradingFunction {
    private static final Logger logger = LoggerFactory.getLogger(GradingFunction.class);

    @Autowired
    private WebClient.Builder webClientBuilder;

    @Value("${quiz.service.url}")
    private String quizServiceUrl;

    @Bean
    public Function<GradingRequest, GradingResponse> gradeSubmission() {
        return request -> {
            logger.info("GRADING: Submission ID {}, Quiz ID {}", request.getSubmissionId(), request.getQuizId());
            logger.info("Student answers: {}", request.getAnswers());
            
            // Fetch quiz details from quiz service
            Quiz quiz = webClientBuilder.build()
                .get()
                .uri(quizServiceUrl + "/quizzes/" + request.getQuizId())
                .retrieve()
                .bodyToMono(Quiz.class)
                .block();

            if (quiz == null) {
                logger.error(" Quiz not found with ID {}", request.getQuizId());
                throw new RuntimeException("Quiz not found");
            }

            logger.info(" Fetched quiz: {} with {} questions", quiz.getTitle(), quiz.getQuestions().size());

            int score = 0;
            int maxScore = 0;

            // Grade each question
            for (Question question : quiz.getQuestions()) {
                maxScore += question.getPoints();

                String studentAnswer = request.getAnswers().get(question.getId());
                boolean isCorrect = studentAnswer != null && isCorrect(question, studentAnswer);
                
                logger.info("   Q{}: {} points | Student: '{}' | Correct answers: {} | Match: {}", 
                    question.getId(), question.getPoints(), studentAnswer, question.getCorrectAnswers(), isCorrect);
                
                if (isCorrect) {
                    score += question.getPoints();
                }
            }

            logger.info(" Final score: {}/{} ({} %)", score, maxScore, 
                maxScore > 0 ? (score * 100 / maxScore) : 0);

            return new GradingResponse(request.getSubmissionId(), score, maxScore);
        };
    }

    private boolean isCorrect(Question question, String answer) {
        if (question.getCorrectAnswers() == null || question.getCorrectAnswers().isEmpty()) {
            return false;
        }

        if ("MULTIPLE_CHOICE".equals(question.getType())) {
            return question.getCorrectAnswers().contains(answer);
        }

        return false;
    }
}


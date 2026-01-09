package org.example.quiz.service;

import org.example.quiz.model.Question;
import org.example.quiz.model.Quiz;
import org.example.quiz.repository.QuizRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class QuizService {
    private static final Logger logger = LoggerFactory.getLogger(QuizService.class);

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public Quiz createQuiz(Quiz quiz) {
        // Populate correctAnswers from correctOptionIndex if not already set
        if (quiz.getQuestions() != null) {
            for (Question question : quiz.getQuestions()) {
                if ((question.getCorrectAnswers() == null || question.getCorrectAnswers().isEmpty()) 
                    && question.getCorrectOptionIndex() != null 
                    && question.getOptions() != null) {
                    // Get the option text at the index and set it as the correct answer
                    if (question.getCorrectOptionIndex() < question.getOptions().size()) {
                        String correctAnswer = question.getOptions().get(question.getCorrectOptionIndex());
                        question.setCorrectAnswers(new ArrayList<>(List.of(correctAnswer)));
                        System.out.println("Set correctAnswers for Q" + question.getId() + ": [" + correctAnswer + "]");
                    }
                }
            }
        }

        Quiz savedQuiz = quizRepository.save(quiz);

        // Publish event to Kafka
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "QUIZ_CREATED");
        event.put("quizId", savedQuiz.getId());
        event.put("title", savedQuiz.getTitle());
        event.put("createdBy", savedQuiz.getCreatedBy());
        kafkaTemplate.send("quiz-events", event);

        // Send notification via RabbitMQ (for WebSocket broadcast)
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "QUIZ_CREATED");
        notification.put("eventType", "QUIZ_CREATED");
        notification.put("quizId", savedQuiz.getId());
        notification.put("title", savedQuiz.getTitle());
        notification.put("description", savedQuiz.getDescription());
        notification.put("active", savedQuiz.isActive());
        rabbitTemplate.convertAndSend("notifications", notification);

        System.out.println(" Quiz created and notification sent: " + savedQuiz.getTitle());

        return savedQuiz;
    }

    public Quiz getQuizById(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));
        // Force initialization of lazy-loaded collections for REST API response
        initializeLazyCollections(quiz);
        return quiz;
    }

    private void initializeLazyCollections(Quiz quiz) {
        if (quiz != null && quiz.getQuestions() != null) {
            logger.info(" Initializing lazy collections for quiz {}", quiz.getId());
            // Access the questions list to trigger lazy loading
            quiz.getQuestions().forEach(question -> {
                // Access the options and correctAnswers to trigger loading
                int optSize = question.getOptions().size();
                int ansSize = question.getCorrectAnswers().size();
                logger.info("  - Q{}: {} options, {} correct answers", question.getId(), optSize, ansSize);
            });
        }
    }

    public List<Quiz> getAllQuizzes() {
        List<Quiz> quizzes = quizRepository.findAll();
        quizzes.forEach(this::initializeLazyCollections);
        return quizzes;
    }

    public List<Quiz> getActiveQuizzes() {
        List<Quiz> quizzes = quizRepository.findByActiveTrue();
        quizzes.forEach(this::initializeLazyCollections);
        return quizzes;
    }

    public List<Quiz> getQuizzesByCreator(Long userId) {
        return quizRepository.findByCreatedBy(userId);
    }

    public Quiz updateQuiz(Long id, Quiz quiz) {
        Quiz existingQuiz = getQuizById(id);
        existingQuiz.setTitle(quiz.getTitle());
        existingQuiz.setDescription(quiz.getDescription());
        existingQuiz.setStartTime(quiz.getStartTime());
        existingQuiz.setEndTime(quiz.getEndTime());
        existingQuiz.setTimeLimit(quiz.getTimeLimit());
        existingQuiz.setPassingScore(quiz.getPassingScore());
        existingQuiz.setActive(quiz.isActive());

        Quiz updatedQuiz = quizRepository.save(existingQuiz);

        // Publish event to Kafka
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "QUIZ_UPDATED");
        event.put("quizId", updatedQuiz.getId());
        kafkaTemplate.send("quiz-events", event);

        // Send notification via RabbitMQ (for WebSocket broadcast)
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "QUIZ_UPDATED");
        notification.put("eventType", "QUIZ_UPDATED");
        notification.put("quizId", updatedQuiz.getId());
        notification.put("title", updatedQuiz.getTitle());
        notification.put("active", updatedQuiz.isActive());
        rabbitTemplate.convertAndSend("notifications", notification);

        System.out.println("✓ Quiz updated and notification sent: " + updatedQuiz.getTitle());

        return updatedQuiz;
    }

    public void deleteQuiz(Long id) {
        Quiz quiz = getQuizById(id);
        quizRepository.delete(quiz);

        // Publish event to Kafka
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", "QUIZ_DELETED");
        event.put("quizId", id);
        kafkaTemplate.send("quiz-events", event);

        // Send notification via RabbitMQ (for WebSocket broadcast)
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "QUIZ_DELETED");
        notification.put("eventType", "QUIZ_DELETED");
        notification.put("quizId", id);
        notification.put("title", quiz.getTitle());
        rabbitTemplate.convertAndSend("notifications", notification);

        System.out.println("✓ Quiz deleted and notification sent: " + quiz.getTitle());
    }

    public Question addQuestionToQuiz(Long quizId, Question question) {
        Quiz quiz = getQuizById(quizId);
        question.setQuiz(quiz);
        quiz.getQuestions().add(question);
        quizRepository.save(quiz);
        return question;
    }

    public void deleteQuestion(Long questionId) {
        for (Quiz quiz : quizRepository.findAll()) {
            quiz.getQuestions().removeIf(q -> q.getId().equals(questionId));
            quizRepository.save(quiz);
        }
    }
}


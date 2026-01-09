package org.example.quiz.controller;

import org.example.quiz.model.Question;
import org.example.quiz.model.Quiz;
import org.example.quiz.service.QuizService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/quizzes")
@CrossOrigin(origins = "*")
public class QuizController {
    private static final Logger logger = LoggerFactory.getLogger(QuizController.class);

    @Autowired
    private QuizService quizService;

    @PostMapping
    public ResponseEntity<Quiz> createQuiz(@RequestBody Quiz quiz) {
        // Ensure createdBy is set (default to 1 if not provided)
        if (quiz.getCreatedBy() == null) {
            quiz.setCreatedBy(1L);
        }
        return ResponseEntity.ok(quizService.createQuiz(quiz));
    }

    @GetMapping
    public ResponseEntity<List<Quiz>> getAllQuizzes() {
        return ResponseEntity.ok(quizService.getAllQuizzes());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Quiz>> getActiveQuizzes() {
        return ResponseEntity.ok(quizService.getActiveQuizzes());
    }

    @GetMapping("/creator/{userId}")
    public ResponseEntity<List<Quiz>> getQuizzesByCreator(@PathVariable Long userId) {
        return ResponseEntity.ok(quizService.getQuizzesByCreator(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Quiz> getQuizById(@PathVariable Long id) {
        logger.info(" REST API call: GET /quizzes/{}", id);
        Quiz quiz = quizService.getQuizById(id);
        logger.info(" Returning quiz {} with {} questions, options: {}, correctAnswers: {}", 
            id, quiz.getQuestions().size(),
            quiz.getQuestions().isEmpty() ? "N/A" : quiz.getQuestions().get(0).getOptions().size(),
            quiz.getQuestions().isEmpty() ? "N/A" : quiz.getQuestions().get(0).getCorrectAnswers().size());
        return ResponseEntity.ok(quiz);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Quiz> updateQuiz(@PathVariable Long id, @RequestBody Quiz quiz) {
        return ResponseEntity.ok(quizService.updateQuiz(id, quiz));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long id) {
        quizService.deleteQuiz(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{quizId}/questions")
    public ResponseEntity<Question> addQuestion(@PathVariable Long quizId, @RequestBody Question question) {
        logger.info(" Adding question to quiz {}: {}", quizId, question.getText());
        logger.info(" Options: {}", question.getOptions());
        logger.info(" Correct answers: {}", question.getCorrectAnswers());
        Question saved = quizService.addQuestionToQuiz(quizId, question);
        logger.info(" Question saved with ID {}, correctAnswers: {}", saved.getId(), saved.getCorrectAnswers());
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long questionId) {
        quizService.deleteQuestion(questionId);
        return ResponseEntity.noContent().build();
    }
}


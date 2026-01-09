package org.example.submission.controller;

import org.example.submission.model.Submission;
import org.example.submission.service.SubmissionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/submissions")
public class SubmissionController {
    private static final Logger logger = LoggerFactory.getLogger(SubmissionController.class);

    @Autowired
    private SubmissionService submissionService;

    @PostMapping("/start")
    public ResponseEntity<Submission> startSubmission(
            @RequestParam Long quizId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(submissionService.startSubmission(quizId, userId));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Submission> submitQuiz(
            @PathVariable Long id,
            @RequestBody Map<Long, String> answers) {
        return ResponseEntity.ok(submissionService.submitQuiz(id, answers));
    }

    @PostMapping("/{id}/grade")
    public ResponseEntity<Submission> gradeSubmission(@PathVariable Long id) {
        return ResponseEntity.ok(submissionService.gradeSubmission(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Submission> getSubmissionById(@PathVariable Long id) {
        return ResponseEntity.ok(submissionService.getSubmissionById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Submission>> getSubmissionsByUser(@PathVariable Long userId) {
        logger.info(" GET /user/{} - Fetching submissions", userId);
        List<Submission> submissions = submissionService.getSubmissionsByUser(userId);
        logger.info(" Returning {} submissions for user {}", submissions.size(), userId);
        for (Submission sub : submissions) {
            logger.info("   - Submission ID: {}, Status: {}, Score: {}, MaxScore: {}", 
                sub.getId(), sub.getStatus(), sub.getScore(), sub.getMaxScore());
        }
        return ResponseEntity.ok(submissions);
    }

    @GetMapping("/quiz/{quizId}")
    public ResponseEntity<List<Submission>> getSubmissionsByQuiz(@PathVariable Long quizId) {
        return ResponseEntity.ok(submissionService.getSubmissionsByQuiz(quizId));
    }
}


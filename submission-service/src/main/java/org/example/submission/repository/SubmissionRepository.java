package org.example.submission.repository;

import org.example.submission.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByUserId(Long userId);
    List<Submission> findByQuizId(Long quizId);
    List<Submission> findByUserIdAndQuizId(Long userId, Long quizId);
}


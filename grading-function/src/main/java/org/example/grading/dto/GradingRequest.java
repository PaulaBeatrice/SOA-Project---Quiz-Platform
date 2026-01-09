package org.example.grading.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GradingRequest {
    private Long submissionId;
    private Long quizId;
    private Map<Long, String> answers;
}


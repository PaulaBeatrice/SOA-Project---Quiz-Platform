package org.example.grading.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GradingResponse {
    private Long submissionId;
    private Integer score;
    private Integer maxScore;
}


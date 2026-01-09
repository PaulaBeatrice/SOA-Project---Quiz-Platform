package org.example.submission.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GradingRequest implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long submissionId;
    private Long quizId;
    private Map<Long, String> answers;
}


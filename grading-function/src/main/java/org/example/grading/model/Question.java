package org.example.grading.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    private Long id;
    private String text;
    private String type;
    private Integer points;
    private List<String> options = new ArrayList<>();
    private List<String> correctAnswers = new ArrayList<>();
}


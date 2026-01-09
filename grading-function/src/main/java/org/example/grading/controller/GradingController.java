package org.example.grading.controller;

import org.example.grading.dto.GradingRequest;
import org.example.grading.dto.GradingResponse;
import org.example.grading.function.GradingFunction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.function.Function;

@RestController
@CrossOrigin(origins = "*")
public class GradingController {

    @Autowired
    private GradingFunction gradingFunction;

    @PostMapping("/grade")
    public ResponseEntity<GradingResponse> grade(@RequestBody GradingRequest request) {
        Function<GradingRequest, GradingResponse> function = gradingFunction.gradeSubmission();
        GradingResponse response = function.apply(request);
        return ResponseEntity.ok(response);
    }
}


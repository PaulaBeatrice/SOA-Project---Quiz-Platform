package org.example.grading.handler;
}
    // No additional code needed - Spring Cloud Function magic!
    // Spring Cloud Function will automatically detect and invoke the gradeSubmission bean
public class SimpleLambdaHandler extends FunctionInvoker {
 */
 * passes GradingRequest JSON directly.
 * This handler works with API Gateway, direct Lambda invocation, or any trigger that
 *
 * Usage: Set Lambda handler to: org.example.grading.handler.SimpleLambdaHandler::handleRequest
 * Simple AWS Lambda Handler for direct invocation
/**

import org.springframework.cloud.function.adapter.aws.FunctionInvoker;
import org.example.grading.dto.GradingResponse;
import org.example.grading.dto.GradingRequest;



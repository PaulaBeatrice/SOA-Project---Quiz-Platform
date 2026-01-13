package org.example.grading.handler;

import org.springframework.cloud.function.adapter.aws.FunctionInvoker;

/**
 * Simple AWS Lambda Handler for direct invocation
 *
 * Usage: Set Lambda handler to: org.example.grading.handler.SimpleLambdaHandler::handleRequest
 * This handler works with API Gateway, direct Lambda invocation, or any trigger that
 * passes GradingRequest JSON directly.
 */
public class SimpleLambdaHandler extends FunctionInvoker {
    // No additional code needed - Spring Cloud Function magic!
    // Spring Cloud Function will automatically detect and invoke the gradeSubmission bean
}



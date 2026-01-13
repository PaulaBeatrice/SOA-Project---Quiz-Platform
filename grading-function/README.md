# Grading Function - Serverless

A serverless AWS Lambda function that automatically grades quiz submissions.

## Overview

This function:
- Receives grading requests from AWS SQS (replaces RabbitMQ)
- Fetches quiz details from Quiz Service
- Calculates scores based on correct answers
- Updates Submission Service with results
- Runs only when triggered (cost-effective)

## Quick Start

### Deploy to AWS Lambda
```bash
.\deploy-serverless.ps1 -Stage dev
```

### Test Locally
```bash
sam local invoke GradingFunction --event test-event.json
```

## Architecture

```
┌─────────────────┐      ┌──────────┐      ┌─────────────────┐
│ Submission      │      │          │      │ AWS Lambda      │
│ Service         │─────▶│ AWS SQS  │─────▶│ Grading         │
│                 │      │          │      │ Function        │
└─────────────────┘      └──────────┘      └────────┬────────┘
                                                     │
                                    ┌────────────────┼────────────┐
                                    ▼                ▼            ▼
                            ┌──────────────┐  ┌──────────┐  ┌────────────┐
                            │ Quiz Service │  │Submission│  │CloudWatch  │
                            │ (fetch quiz) │  │ Service  │  │  Logs      │
                            └──────────────┘  └──────────┘  └────────────┘
                                                (update score)
```

## Handler Classes

### SimpleLambdaHandler
- **Purpose**: Main AWS Lambda entry point
- **Handler**: `org.example.grading.handler.SimpleLambdaHandler::handleRequest`
- **Triggers**: SQS, API Gateway, or direct invocation
- **Uses**: Spring Cloud Function for automatic function discovery

## Configuration Files

### serverless.yml (Serverless Framework)
- Defines Lambda function configuration
- Creates SQS queue automatically
- Sets up event triggers
- Configures IAM permissions

### template.yaml (AWS SAM)
- Alternative to serverless.yml
- Same functionality
- Native AWS CloudFormation format

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPRING_PROFILES_ACTIVE` | Spring profile | `lambda` |
| `QUIZ_SERVICE_URL` | Quiz Service API endpoint | `https://api.yourquizplatform.com` |
| `SUBMISSION_SERVICE_URL` | Submission Service API endpoint | `https://api.yourquizplatform.com` |

## Input Format (SQS Message Body)

```json
{
  "submissionId": 123,
  "quizId": 45,
  "answers": {
    "1": "Option A",
    "2": "Option B",
    "3": "Option C"
  }
}
```

## Output Format

```json
{
  "submissionId": 123,
  "score": 85,
  "maxScore": 100
}
```

## Cost Analysis

**Traditional Docker Container (24/7)**
- EC2 t3.small: ~$15/month
- Always running, even with no submissions

**Serverless Lambda**
- 10,000 submissions/month: ~$0.42/month
- Only runs when needed
- **97% cost reduction** 🎉

## Development vs Production

### Local Development (Docker)
```bash
docker-compose up grading-function
```
- Uses RabbitMQ
- Easy debugging
- Fast iteration

### Production (AWS Lambda)
```bash
.\deploy-serverless.ps1 -Stage prod
```
- Uses AWS SQS
- Auto-scales
- Pay per use

## Monitoring

### View Logs
```bash
aws logs tail /aws/lambda/quiz-grading-function --follow
```

### CloudWatch Dashboard
- Invocations per minute
- Error rate
- Duration (avg, p99)
- Throttles

## Troubleshooting

### Function not triggered
- Check SQS event source mapping is enabled
- Verify IAM role has `sqs:ReceiveMessage` permission

### Can't reach Quiz Service
- Ensure Lambda has internet access (NAT Gateway if in VPC)
- Check security groups allow outbound HTTPS

### Timeout errors
- Increase timeout in `serverless.yml` (currently 30s)
- Optimize Quiz Service response time

## Files Structure

```
grading-function/
├── src/main/java/org/example/grading/
│   ├── function/
│   │   └── GradingFunction.java      # Core grading logic
│   ├── handler/
│   │   └── SimpleLambdaHandler.java  # Lambda entry point
│   ├── dto/
│   │   ├── GradingRequest.java
│   │   └── GradingResponse.java
│   └── model/
│       ├── Quiz.java
│       └── Question.java
├── serverless.yml                     # Serverless Framework config
├── template.yaml                      # AWS SAM config
├── deploy-serverless.ps1             # Deployment script
├── test-event.json                   # Test payload
└── SERVERLESS_DEPLOYMENT.md          # Full deployment guide
```

## Further Reading

- [SERVERLESS_DEPLOYMENT.md](./SERVERLESS_DEPLOYMENT.md) - Complete deployment guide
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Spring Cloud Function Docs](https://spring.io/projects/spring-cloud-function)


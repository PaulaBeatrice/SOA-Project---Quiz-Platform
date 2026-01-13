# Serverless Grading Function - Deployment Guide

This guide explains how to deploy the grading function as a **true serverless** AWS Lambda function.

## Architecture Change

### Before (Traditional Microservice)
```
Submission Service → RabbitMQ → Grading Service (always running in Docker)
```

### After (Serverless)
```
Submission Service → AWS SQS → AWS Lambda (runs only when triggered)
```

## Benefits of Serverless

1. **Pay per execution** - Only charged when grading happens (not 24/7)
2. **Auto-scaling** - Handles 1 or 1000 submissions automatically
3. **No server management** - AWS manages infrastructure
4. **High availability** - Built-in redundancy and fault tolerance

---

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
   ```bash
   aws configure
   ```
3. **Maven** for building the Java application
4. **Node.js** (for Serverless Framework) OR **AWS SAM CLI**

---

## Deployment Options

### Option 1: Serverless Framework (Recommended)

#### 1. Install Serverless Framework
```bash
npm install -g serverless
```

#### 2. Build the Application
```bash
cd grading-function
mvn clean package
```

#### 3. Deploy to AWS
```bash
serverless deploy --stage dev
```

#### 4. Get the SQS Queue URL (you'll need this for submission-service)
```bash
serverless info --stage dev
```

Look for output like:
```
GradingQueueUrl: https://sqs.us-east-1.amazonaws.com/123456789/quiz-grading-function-dev-grading-queue
```

---

### Option 2: AWS SAM (Serverless Application Model)

#### 1. Install AWS SAM CLI
```bash
# Windows (via MSI installer from AWS)
# Download from: https://aws.amazon.com/serverless/sam/
```

#### 2. Build the Application
```bash
cd grading-function
mvn clean package
sam build
```

#### 3. Deploy
```bash
sam deploy --guided
```

Follow the prompts:
- Stack Name: `quiz-grading-function`
- AWS Region: `us-east-1` (or your preferred region)
- Parameter QuizServiceUrl: Your Quiz Service API URL
- Parameter SubmissionServiceUrl: Your Submission Service API URL

#### 4. Get Outputs
```bash
sam list stack-outputs --stack-name quiz-grading-function
```

---

## Update Submission Service

After deploying the Lambda, update your `submission-service` to use **AWS SQS** instead of RabbitMQ:

### 1. Add AWS SDK Dependency to submission-service/pom.xml
```xml
<dependency>
    <groupId>com.amazonaws</groupId>
    <artifactId>aws-java-sdk-sqs</artifactId>
    <version>1.12.529</version>
</dependency>
```

### 2. Create SQS Publisher in SubmissionService.java
```java
import com.amazonaws.services.sqs.AmazonSQS;
import com.amazonaws.services.sqs.AmazonSQSClientBuilder;
import com.amazonaws.services.sqs.model.SendMessageRequest;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class SubmissionService {
    
    private final AmazonSQS sqsClient = AmazonSQSClientBuilder.defaultClient();
    
    @Value("${aws.sqs.grading.queue.url}")
    private String gradingQueueUrl;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    public Submission submitQuiz(Long submissionId, Map<Long, String> answers) {
        // ... existing code ...
        
        // Replace RabbitMQ with SQS
        try {
            String messageBody = objectMapper.writeValueAsString(gradingRequest);
            SendMessageRequest sendRequest = new SendMessageRequest()
                .withQueueUrl(gradingQueueUrl)
                .withMessageBody(messageBody);
            sqsClient.sendMessage(sendRequest);
            logger.info("Sent grading request to SQS");
        } catch (Exception e) {
            logger.error("Failed to send to SQS: {}", e.getMessage());
        }
        
        return savedSubmission;
    }
}
```

### 3. Update application.yml
```yaml
aws:
  sqs:
    grading:
      queue:
        url: https://sqs.us-east-1.amazonaws.com/YOUR-ACCOUNT/quiz-grading-function-dev-grading-queue
```

---

## Testing the Serverless Function

### 1. Test Locally with SAM
```bash
sam local invoke GradingFunction --event test-event.json
```

### 2. Test via AWS Console
1. Go to AWS Lambda Console
2. Find `quiz-grading-function`
3. Click "Test" tab
4. Create test event with this payload:
```json
{
  "Records": [
    {
      "body": "{\"submissionId\":1,\"quizId\":1,\"answers\":{\"1\":\"Option A\",\"2\":\"Option B\"}}"
    }
  ]
}
```
5. Click "Test"

### 3. Test via SQS
Send a message to the SQS queue:
```bash
aws sqs send-message \
  --queue-url YOUR_QUEUE_URL \
  --message-body '{"submissionId":1,"quizId":1,"answers":{"1":"Option A","2":"Option B"}}'
```

---

## Monitoring

### CloudWatch Logs
```bash
# View logs
aws logs tail /aws/lambda/quiz-grading-function --follow

# Or use AWS Console
# CloudWatch → Log groups → /aws/lambda/quiz-grading-function
```

### CloudWatch Metrics
Monitor:
- **Invocations** - Number of times function was called
- **Duration** - Execution time
- **Errors** - Failed invocations
- **Throttles** - Rate-limited requests

---

## Cost Estimation

AWS Lambda Pricing (us-east-1):
- **First 1M requests/month**: FREE
- **Additional requests**: $0.20 per 1M requests
- **Duration**: $0.0000166667 per GB-second

Example: 10,000 submissions/month with 512MB memory, 5s execution:
- Requests: FREE (under 1M)
- Duration: 10,000 × 5s × 0.5GB × $0.0000166667 ≈ **$0.42/month**

Compare to EC2 t3.small running 24/7: ~$15/month

---

## Rollback to Traditional Deployment

If you need to rollback, simply:
1. Deploy the original Docker image from `docker-compose.yml`
2. Update `submission-service` to use RabbitMQ again
3. Comment out AWS SQS configuration

---

## Hybrid Deployment (Best of Both Worlds)

You can run BOTH simultaneously:
- **Serverless Lambda** for production (cost-effective, scalable)
- **Docker container** for local development (easier debugging)

Use environment variables to switch between them in `submission-service`.

---

## Troubleshooting

### Lambda can't access Quiz Service
- Ensure Lambda has internet access (NAT Gateway if in VPC)
- Check security groups and network ACLs
- Verify QUIZ_SERVICE_URL environment variable

### SQS messages not triggering Lambda
- Check Lambda event source mapping is active
- Verify IAM role has SQS permissions
- Check SQS queue visibility timeout (should be > Lambda timeout)

### Function timing out
- Increase timeout in `serverless.yml` or `template.yaml`
- Optimize quiz service response time
- Consider caching quiz data in Lambda

---

## Next Steps

1. ✅ Deploy Lambda function
2. ✅ Update submission-service to use SQS
3. ✅ Test end-to-end flow
4. 🔄 Monitor CloudWatch metrics
5. 🔄 Set up CloudWatch alarms for errors
6. 🔄 Implement retry logic in submission-service
7. 🔄 Consider adding DynamoDB caching for quiz data

---

## Additional Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [Spring Cloud Function](https://spring.io/projects/spring-cloud-function)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [Serverless Framework Docs](https://www.serverless.com/framework/docs)


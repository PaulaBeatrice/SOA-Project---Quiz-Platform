# ✅ Grading Function - Now Serverless!

## What Changed?

Your grading function has been converted from a **traditional microservice** to a **true serverless AWS Lambda function**.

## Summary

### Before
```
🐳 Docker Container running 24/7
💰 Cost: ~$15/month (always running)
📦 RabbitMQ for messaging
🔧 Manual scaling
```

### After
```
⚡ AWS Lambda (runs only when needed)
💰 Cost: ~$0.42/month (10K submissions)
📨 AWS SQS for messaging
🚀 Auto-scales automatically
```

## Files Created

### 1. **SimpleLambdaHandler.java**
- Main AWS Lambda entry point
- Uses Spring Cloud Function magic
- Handler: `org.example.grading.handler.SimpleLambdaHandler::handleRequest`

### 2. **serverless.yml**
- Serverless Framework configuration
- Defines Lambda, SQS queue, IAM permissions
- Deploy with: `serverless deploy --stage dev`

### 3. **template.yaml**
- AWS SAM (Serverless Application Model) configuration
- Alternative to Serverless Framework
- Deploy with: `sam deploy --guided`

### 4. **deploy-serverless.ps1**
- One-click deployment script
- Checks prerequisites
- Builds and deploys automatically
- Run: `.\deploy-serverless.ps1 -Stage dev`

### 5. **SERVERLESS_DEPLOYMENT.md**
- Complete deployment guide
- Step-by-step instructions
- Troubleshooting tips

### 6. **README.md**
- Quick start guide
- Architecture diagrams
- Cost analysis

### 7. **test-event.json**
- Sample test payload
- For local testing: `sam local invoke --event test-event.json`

## Quick Start

### Deploy to AWS

```powershell
cd grading-function
.\deploy-serverless.ps1 -Stage dev
```

That's it! The script will:
1. ✅ Check prerequisites (Maven, AWS CLI, Serverless/SAM)
2. ✅ Build the application
3. ✅ Deploy to AWS Lambda
4. ✅ Create SQS queue
5. ✅ Set up triggers and permissions

### Update Submission Service

After deployment, copy the **SQS Queue URL** from the output and update `submission-service`:

```yaml
# submission-service/src/main/resources/application.yml
aws:
  sqs:
    grading:
      queue:
        url: https://sqs.us-east-1.amazonaws.com/123456789/quiz-grading-queue
```

Then add this to `SubmissionService.java`:

```java
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

@Service
public class SubmissionService {
    private final SqsClient sqsClient = SqsClient.builder().build();
    
    @Value("${aws.sqs.grading.queue.url}")
    private String queueUrl;
    
    public Submission submitQuiz(Long submissionId, Map<Long, String> answers) {
        // ... existing code ...
        
        // Send to SQS instead of RabbitMQ
        String messageBody = objectMapper.writeValueAsString(gradingRequest);
        sqsClient.sendMessage(SendMessageRequest.builder()
            .queueUrl(queueUrl)
            .messageBody(messageBody)
            .build());
    }
}
```

## Architecture Flow

```
┌─────────────┐
│   Student   │
│  Submits    │
│    Quiz     │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Submission       │
│ Service          │──────┐
└──────────────────┘      │
                          │ Sends message
                          ▼
                    ┌──────────┐
                    │ AWS SQS  │
                    │  Queue   │
                    └────┬─────┘
                         │ Triggers
                         ▼
                    ┌──────────────────┐
                    │  AWS Lambda      │
                    │  Grading         │◄───┐ Fetches quiz
                    │  Function        │    │
                    └────┬─────────────┘    │
                         │                  │
                         │            ┌─────┴──────┐
                         │            │Quiz Service│
                         │            └────────────┘
                         │ Updates score
                         ▼
                    ┌──────────────────┐
                    │ Submission       │
                    │ Service          │
                    └──────────────────┘
```

## Cost Comparison

| Scenario | Traditional | Serverless | Savings |
|----------|-------------|------------|---------|
| 1K submissions/month | $15 | $0.04 | 99.7% |
| 10K submissions/month | $15 | $0.42 | 97.2% |
| 100K submissions/month | $15 | $4.20 | 72.0% |
| 1M submissions/month | $15 | $42.00 | -180% * |

*At 1M+ submissions, consider reserved instances or containerized deployment

## Testing

### Local Test (with Docker)
```bash
docker-compose up grading-function
```

### AWS Lambda Test
```bash
sam local invoke GradingFunction --event test-event.json
```

### Production Test
```bash
aws lambda invoke \
  --function-name quiz-grading-function \
  --payload file://test-event.json \
  response.json
```

## Monitoring

```bash
# View live logs
aws logs tail /aws/lambda/quiz-grading-function --follow

# Check metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=quiz-grading-function \
  --start-time 2025-01-13T00:00:00Z \
  --end-time 2025-01-13T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

## Rollback Plan

If something goes wrong:

1. **Keep Docker version running** during transition
2. **Update submission-service** to send to both RabbitMQ AND SQS
3. **Monitor both paths** for a few days
4. **Gradually shift traffic** to serverless
5. **Decommission Docker** once confident

## Next Steps

1. ✅ Deploy Lambda function
2. ✅ Update submission-service configuration
3. ✅ Test with a sample quiz submission
4. 🔄 Monitor CloudWatch logs
5. 🔄 Set up CloudWatch alarms
6. 🔄 Update docker-compose.yml to make grading-function optional
7. 🔄 Document API Gateway endpoints (if using HTTP trigger)

## Troubleshooting

### "Dependency not found" errors
- Run `mvn dependency:resolve` to download dependencies
- Check internet connectivity
- Verify Maven settings.xml

### "AWS CLI not configured"
```bash
aws configure
# Enter your AWS Access Key, Secret Key, Region
```

### Lambda can't reach Quiz Service
- If Quiz Service is internal, Lambda needs VPC access
- Add VPC configuration to serverless.yml
- Ensure NAT Gateway for internet access

### SQS messages not processed
- Check Lambda event source mapping: `aws lambda list-event-source-mappings`
- Verify IAM role has `sqs:ReceiveMessage` permission
- Check dead-letter queue for failed messages

## Support

For detailed deployment instructions, see:
- **SERVERLESS_DEPLOYMENT.md** - Complete deployment guide
- **README.md** - Quick reference and architecture

For questions or issues, check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/quiz-grading-function --follow
```

---

**🎉 Congratulations! Your grading function is now serverless and cost-optimized!**


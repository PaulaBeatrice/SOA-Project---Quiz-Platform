import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def handle(req):
    """
    Generate a PDF report for a quiz submission.
    Receives submission data and generates a report.
    
    Expected input:
    {
        "submissionId": 123,
        "quizId": 456,
        "userId": 789,
        "score": 15,
        "maxScore": 20,
        "title": "Math Quiz",
        "submittedAt": "2026-01-08T10:30:00"
    }
    """
    try:
        # Parse request
        body = json.loads(req)
        
        submission_id = body.get("submissionId")
        quiz_id = body.get("quizId")
        user_id = body.get("userId")
        score = body.get("score", 0)
        max_score = body.get("maxScore", 100)
        title = body.get("title", "Quiz Report")
        submitted_at = body.get("submittedAt", "")
        
        # Calculate percentage
        percentage = (score * 100) // max_score if max_score > 0 else 0
        
        # Generate report metadata
        report_id = f"report-{submission_id}-{quiz_id}"
        timestamp = datetime.now().isoformat()
        
        logger.info(f"📄 Generating report {report_id} for submission {submission_id}")
        
        # In production, this would generate an actual PDF file
        # For now, we'll return report metadata
        report = {
            "status": "success",
            "reportId": report_id,
            "submissionId": submission_id,
            "quizId": quiz_id,
            "userId": user_id,
            "title": title,
            "score": f"{score}/{max_score}",
            "percentage": f"{percentage}%",
            "generatedAt": timestamp,
            "pdfUrl": f"https://reports.example.com/{report_id}.pdf",
            "message": f"Report generated for '{title}'. Score: {score}/{max_score} ({percentage}%)"
        }
        
        logger.info(f"✅ Report {report_id} generated successfully")
        
        return json.dumps(report)
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request")
        error_response = {
            "status": "error",
            "message": "Invalid JSON in request body"
        }
        return json.dumps(error_response)
    except Exception as e:
        logger.error(f"❌ Error generating report: {str(e)}")
        error_response = {
            "status": "error",
            "message": f"Error generating report: {str(e)}"
        }
        return json.dumps(error_response)

package handler

import (
	"fmt"
	"encoding/json"
	"log"
)

// SubmissionRequest represents the submission data
type SubmissionRequest struct {
	SubmissionID int64  `json:"submissionId"`
	QuizID       int64  `json:"quizId"`
	UserID       int64  `json:"userId"`
	Score        int    `json:"score"`
	MaxScore     int    `json:"maxScore"`
	Title        string `json:"title"`
	SubmittedAt  string `json:"submittedAt"`
}

// ReportResponse represents the generated report
type ReportResponse struct {
	Status   string `json:"status"`
	ReportID string `json:"reportId"`
	Message  string `json:"message"`
	PDF      string `json:"pdfUrl"`
}

// Handle generates a PDF report for a quiz submission
func Handle(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		var submission SubmissionRequest
		
		// Parse request body
		err := json.NewDecoder(r.Body).Decode(&submission)
		if err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		
		log.Printf("📄 Generating report for submission %d (Quiz: %s)", submission.SubmissionID, submission.Title)
		
		// Calculate percentage
		percentage := 0
		if submission.MaxScore > 0 {
			percentage = (submission.Score * 100) / submission.MaxScore
		}
		
		// Generate report (in production, this would create actual PDF)
		reportID := fmt.Sprintf("report-%d-%d", submission.SubmissionID, submission.QuizID)
		
		report := ReportResponse{
			Status:   "success",
			ReportID: reportID,
			Message:  fmt.Sprintf("Report generated for %s. Score: %d/%d (%d%%)", submission.Title, submission.Score, submission.MaxScore, percentage),
			PDF:      fmt.Sprintf("https://reports.example.com/%s.pdf", reportID),
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(report)
		
		log.Printf("✅ Report %s generated successfully", reportID)
	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

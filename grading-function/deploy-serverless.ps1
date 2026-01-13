# Build and Deploy Serverless Grading Function
# Usage: .\deploy-serverless.ps1 -Stage dev|prod

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev','prod')]
    [string]$Stage = 'dev'
)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Serverless Grading Function Deployment" -ForegroundColor Cyan
Write-Host "Stage: $Stage" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Check prerequisites
Write-Host "`nChecking prerequisites..." -ForegroundColor Yellow

# Check Maven
if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Maven not found. Please install Maven." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Maven found" -ForegroundColor Green

# Check AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: AWS CLI not found. Please install AWS CLI." -ForegroundColor Red
    exit 1
}
Write-Host "✓ AWS CLI found" -ForegroundColor Green

# Check if serverless or sam is installed
$hasServerless = Get-Command serverless -ErrorAction SilentlyContinue
$hasSam = Get-Command sam -ErrorAction SilentlyContinue

if (-not $hasServerless -and -not $hasSam) {
    Write-Host "ERROR: Neither Serverless Framework nor AWS SAM found." -ForegroundColor Red
    Write-Host "Please install one of them:" -ForegroundColor Yellow
    Write-Host "  - Serverless: npm install -g serverless" -ForegroundColor Yellow
    Write-Host "  - AWS SAM: https://aws.amazon.com/serverless/sam/" -ForegroundColor Yellow
    exit 1
}

if ($hasServerless) {
    Write-Host "✓ Serverless Framework found" -ForegroundColor Green
    $deployMethod = "serverless"
} else {
    Write-Host "✓ AWS SAM found" -ForegroundColor Green
    $deployMethod = "sam"
}

# Navigate to grading-function directory
Set-Location -Path $PSScriptRoot

# Clean and build
Write-Host "`nBuilding application..." -ForegroundColor Yellow
mvn clean package -DskipTests

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Maven build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build successful" -ForegroundColor Green

# Deploy
Write-Host "`nDeploying to AWS..." -ForegroundColor Yellow

if ($deployMethod -eq "serverless") {
    Write-Host "Using Serverless Framework..." -ForegroundColor Cyan
    serverless deploy --stage $Stage

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Deployment successful!" -ForegroundColor Green
        Write-Host "`nGetting deployment info..." -ForegroundColor Yellow
        serverless info --stage $Stage
    } else {
        Write-Host "ERROR: Deployment failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Using AWS SAM..." -ForegroundColor Cyan
    sam build

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: SAM build failed" -ForegroundColor Red
        exit 1
    }

    sam deploy --stack-name "quiz-grading-function-$Stage" --resolve-s3 --capabilities CAPABILITY_IAM

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Deployment successful!" -ForegroundColor Green
        Write-Host "`nGetting stack outputs..." -ForegroundColor Yellow
        sam list stack-outputs --stack-name "quiz-grading-function-$Stage"
    } else {
        Write-Host "ERROR: Deployment failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Copy the SQS Queue URL from the output above" -ForegroundColor White
Write-Host "2. Update submission-service/src/main/resources/application.yml" -ForegroundColor White
Write-Host "3. Add the queue URL under: aws.sqs.grading.queue.url" -ForegroundColor White
Write-Host "4. Rebuild and redeploy submission-service" -ForegroundColor White
Write-Host "`nFor more details, see SERVERLESS_DEPLOYMENT.md" -ForegroundColor Cyan


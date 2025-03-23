# StoryVerse CI/CD Pipeline for Public GitHub Repository

This directory contains CloudFormation templates for setting up the CI/CD pipeline for the StoryVerse application using a public GitHub repository.

## CI/CD Pipeline Overview

The CI/CD pipeline automatically builds and pushes Docker images to Amazon ECR whenever changes are pushed to the repository. The pipeline is fully contained within AWS services, requiring no external CI/CD tools.

### Components

- **AWS CodePipeline**: Orchestrates the CI/CD workflow
- **AWS CodeBuild**: Builds the Docker images
- **AWS CodeStar Connections**: Connects to GitHub without requiring tokens
- **Amazon ECR**: Stores the Docker images
- **Amazon S3**: Stores pipeline artifacts
- **AWS IAM**: Manages permissions for the pipeline components

### Pipeline Workflow

1. **Source Stage**: Pulls the source code from GitHub when changes are detected
2. **Build Stage**: Builds Docker images for all services and pushes them to ECR

## Deployment Instructions

### Prerequisites

- AWS CLI installed and configured
- GitHub repository with the StoryVerse code

### Deploying the Pipeline

1. Deploy the CloudFormation stack:

```bash
aws cloudformation create-stack \
  --stack-name storyverse-cicd-pipeline \
  --template-body file://cicd-pipeline-public.yaml \
  --parameters \
    ParameterKey=RepositoryName,ParameterValue=storyverse \
    ParameterKey=RepositoryOwner,ParameterValue=YOUR_GITHUB_USERNAME \
    ParameterKey=GitHubBranch,ParameterValue=main \
    ParameterKey=ECRRepositoryPrefix,ParameterValue=demo/storyverse \
  --capabilities CAPABILITY_IAM
```

2. After the stack is created, you need to complete the GitHub connection:

   a. Go to the AWS Management Console
   b. Navigate to Developer Tools > Settings > Connections
   c. Find the connection created by the stack (it will be named "storyverse-github-connection")
   d. Click "Update pending connection"
   e. Follow the prompts to connect to your GitHub account
   f. Authorize AWS Connector for GitHub to access your repositories

3. Once the connection is completed, the pipeline will be able to access your GitHub repository.

### Updating the Pipeline

To update the pipeline configuration:

```bash
aws cloudformation update-stack \
  --stack-name storyverse-cicd-pipeline \
  --template-body file://cicd-pipeline-public.yaml \
  --parameters \
    ParameterKey=RepositoryName,ParameterValue=storyverse \
    ParameterKey=RepositoryOwner,ParameterValue=YOUR_GITHUB_USERNAME \
    ParameterKey=GitHubBranch,ParameterValue=main \
    ParameterKey=ECRRepositoryPrefix,ParameterValue=demo/storyverse \
  --capabilities CAPABILITY_IAM
```

## Security Considerations

- No GitHub tokens are stored in AWS
- IAM roles follow the principle of least privilege
- S3 bucket for artifacts has encryption enabled
- ECR repositories have image scanning enabled

## How CodeStar Connections Works

AWS CodeStar Connections uses OAuth to connect to your GitHub account. When you complete the connection in the AWS Console:

1. You'll be redirected to GitHub to authorize the connection
2. GitHub will generate an OAuth token that is securely stored by AWS
3. AWS will use this token to access your repository
4. No tokens are exposed in your CloudFormation template or AWS resources

## Troubleshooting

If the pipeline fails, check the following:

1. Ensure the CodeStar Connection is in "Available" status
2. Check CodeBuild logs for build errors
3. Verify IAM permissions for CodeBuild and CodePipeline
4. Confirm the repository structure matches what's expected in the BuildSpec

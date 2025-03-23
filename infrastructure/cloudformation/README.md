# StoryVerse CI/CD Pipeline

This directory contains CloudFormation templates for setting up the CI/CD pipeline for the StoryVerse application.

## CI/CD Pipeline Overview

The CI/CD pipeline automatically builds and pushes Docker images to Amazon ECR whenever changes are pushed to the repository. The pipeline is fully contained within AWS services, requiring no external CI/CD tools.

### Components

- **AWS CodePipeline**: Orchestrates the CI/CD workflow
- **AWS CodeBuild**: Builds the Docker images
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
- GitHub personal access token with repo permissions

### Deploying the Pipeline

1. Deploy the CloudFormation stack:

```bash
aws cloudformation create-stack \
  --stack-name storyverse-cicd-pipeline \
  --template-body file://cicd-pipeline.yaml \
  --parameters \
    ParameterKey=RepositoryName,ParameterValue=storyverse \
    ParameterKey=RepositoryOwner,ParameterValue=YOUR_GITHUB_USERNAME \
    ParameterKey=GitHubBranch,ParameterValue=main \
    ParameterKey=GitHubToken,ParameterValue=YOUR_GITHUB_TOKEN \
    ParameterKey=ECRRepositoryPrefix,ParameterValue=demo/storyverse \
  --capabilities CAPABILITY_IAM
```

2. Monitor the stack creation:

```bash
aws cloudformation describe-stacks --stack-name storyverse-cicd-pipeline
```

3. Once the stack is created, you can view the pipeline in the AWS Management Console.

### Updating the Pipeline

To update the pipeline configuration:

```bash
aws cloudformation update-stack \
  --stack-name storyverse-cicd-pipeline \
  --template-body file://cicd-pipeline.yaml \
  --parameters \
    ParameterKey=RepositoryName,ParameterValue=storyverse \
    ParameterKey=RepositoryOwner,ParameterValue=YOUR_GITHUB_USERNAME \
    ParameterKey=GitHubBranch,ParameterValue=main \
    ParameterKey=GitHubToken,ParameterValue=YOUR_GITHUB_TOKEN \
    ParameterKey=ECRRepositoryPrefix,ParameterValue=demo/storyverse \
  --capabilities CAPABILITY_IAM
```

## Security Considerations

- The GitHub token is stored securely as a NoEcho parameter in CloudFormation
- IAM roles follow the principle of least privilege
- S3 bucket for artifacts has encryption enabled
- ECR repositories have image scanning enabled

## Customization

You can customize the pipeline by modifying the following:

- **BuildSpec**: Edit the build commands in the `BuildProject` resource
- **ECR Repositories**: Add or remove repositories as needed
- **Pipeline Stages**: Add additional stages for testing, deployment, etc.

## Troubleshooting

If the pipeline fails, check the following:

1. CodeBuild logs for build errors
2. IAM permissions for CodeBuild and CodePipeline
3. GitHub token permissions and validity
4. Repository structure matches what's expected in the BuildSpec

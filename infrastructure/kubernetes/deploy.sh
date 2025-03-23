#!/bin/bash

# Exit on error
set -e

echo "Deploying StoryVerse to Kubernetes..."

# Create namespace
kubectl apply -f namespace.yaml

# Deploy core infrastructure
echo "Deploying core infrastructure..."
kubectl apply -f api-gateway-deployment.yaml

# Deploy frontend
echo "Deploying frontend..."
kubectl apply -f frontend-deployment.yaml

# Deploy ingress resources
echo "Deploying ingress resources..."
kubectl apply -f ingress/alb-ingress-class-params.yaml
kubectl apply -f ingress/alb-ingress-class.yaml
kubectl apply -f ingress/frontend-ingress.yaml
kubectl apply -f ingress/api-gateway-ingress.yaml

# Deploy content generation services
echo "Deploying content generation services..."
kubectl apply -f text-generation-deployment.yaml
kubectl apply -f image-generation-deployment.yaml

# Wait for deployments to be ready
echo "Waiting for deployments to be ready..."
kubectl -n storyverse wait --for=condition=available --timeout=300s deployment/api-gateway
kubectl -n storyverse wait --for=condition=available --timeout=300s deployment/frontend
kubectl -n storyverse wait --for=condition=available --timeout=300s deployment/text-generation
kubectl -n storyverse wait --for=condition=available --timeout=300s deployment/image-generation

echo "StoryVerse deployment complete!"
echo "Access the application at: http://storyverse.example.com"
echo "API Gateway available at: http://api.storyverse.example.com"
echo ""
echo "For local development, you can use kubectl port-forward:"
echo "kubectl -n storyverse port-forward svc/frontend 8080:80"
echo "Then access the application at: http://localhost:8080"

#!/bin/bash

# Exit on error
set -e

echo "Deploying minimal StoryVerse to Kubernetes..."

# Create namespace if it doesn't exist
kubectl get namespace storyverse || kubectl create namespace storyverse

# Deploy MongoDB without PVC
echo "Deploying MongoDB (without PVC)..."
kubectl apply -f mongodb-deployment-no-pvc.yaml

# Deploy only the frontend and API gateway for testing
echo "Deploying Frontend and API Gateway..."
kubectl apply -f api-gateway-deployment.yaml
kubectl apply -f frontend-deployment.yaml

# Deploy ingress resources
echo "Deploying ingress resources..."
kubectl apply -f ingress/alb-ingress-class-params.yaml
kubectl apply -f ingress/alb-ingress-class.yaml
kubectl apply -f ingress/frontend-ingress.yaml
kubectl apply -f ingress/api-gateway-ingress.yaml

echo "Deployment initiated. Check status with:"
echo "kubectl -n storyverse get pods"
echo ""
echo "For local development, you can use kubectl port-forward:"
echo "kubectl -n storyverse port-forward svc/frontend 8080:80"
echo "Then access the application at: http://localhost:8080"

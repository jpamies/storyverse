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

echo "Deployment initiated. Check status with:"
echo "kubectl -n storyverse get pods"

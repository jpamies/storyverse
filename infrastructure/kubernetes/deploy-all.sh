#!/bin/bash

# Exit on error
set -e

echo "Deploying StoryVerse to Kubernetes..."

# Create namespace if it doesn't exist
kubectl get namespace storyverse || kubectl create namespace storyverse

# Deploy MongoDB first (database dependency)
echo "Deploying MongoDB..."
kubectl apply -f mongodb-deployment.yaml

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
kubectl -n storyverse wait --for=condition=ready pod -l app=mongodb --timeout=120s

# Deploy core story generation services
echo "Deploying Core Story Generation Layer..."
kubectl apply -f storyverse-deployment.yaml

# Deploy content generation services
echo "Deploying Content Generation Layer..."
kubectl apply -f content-generation-deployment.yaml

# Deploy storage and delivery services
echo "Deploying Storage and Delivery Layer..."
kubectl apply -f storage-delivery-deployment.yaml

# Deploy analytics and recommendation services
echo "Deploying Analytics and Recommendation Layer..."
kubectl apply -f analytics-recommendation-deployment.yaml

# Deploy API Gateway
echo "Deploying API Gateway Layer..."
kubectl apply -f api-gateway-deployment.yaml

# Deploy frontend
echo "Deploying Frontend Layer..."
kubectl apply -f frontend-deployment.yaml

# Wait for critical services to be ready
echo "Waiting for critical services to be ready..."
kubectl -n storyverse wait --for=condition=available --timeout=300s deployment/api-gateway
kubectl -n storyverse wait --for=condition=available --timeout=300s deployment/frontend
kubectl -n storyverse wait --for=condition=available --timeout=300s deployment/universe-management
kubectl -n storyverse wait --for=condition=available --timeout=300s deployment/character-database
kubectl -n storyverse wait --for=condition=available --timeout=300s deployment/text-generation
kubectl -n storyverse wait --for=condition=available --timeout=300s deployment/image-generation

# Get the frontend service URL
FRONTEND_URL=$(kubectl -n storyverse get service frontend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
if [ -z "$FRONTEND_URL" ]; then
  FRONTEND_URL=$(kubectl -n storyverse get service frontend -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
fi

echo "StoryVerse deployment complete!"
echo "Access the application at: http://$FRONTEND_URL"
echo "API Gateway available at: http://$(kubectl -n storyverse get service api-gateway -o jsonpath='{.spec.clusterIP}'):8080"
echo ""
echo "To check the status of all deployments:"
echo "kubectl -n storyverse get deployments"
echo ""
echo "To check the pods:"
echo "kubectl -n storyverse get pods"

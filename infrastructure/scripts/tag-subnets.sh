#!/bin/bash

# Script to tag subnets for EKS Auto Mode and AWS Load Balancer Controller
# Usage: ./tag-subnets.sh [cluster-name] [region]
# Default values: cluster-name=bender, region=eu-south-2

set -e

CLUSTER_NAME=${1:-bender}
REGION=${2:-eu-south-2}

echo "Using cluster name: $CLUSTER_NAME"
echo "Using region: $REGION"

echo "Tagging subnets for EKS cluster: $CLUSTER_NAME in region: $REGION"

# Get VPC ID from the EKS cluster
VPC_ID=$(aws eks describe-cluster --name $CLUSTER_NAME --region $REGION --query "cluster.resourcesVpcConfig.vpcId" --output text)

if [ -z "$VPC_ID" ]; then
  echo "Error: Could not determine VPC ID for cluster $CLUSTER_NAME"
  exit 1
fi

echo "Found VPC: $VPC_ID"

# Get all subnets in the VPC
echo "Retrieving subnets in VPC $VPC_ID..."
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --region $REGION --query "Subnets[*].{ID:SubnetId,Public:MapPublicIpOnLaunch,CIDR:CidrBlock,AZ:AvailabilityZone}" --output json)

# Process each subnet
echo "$SUBNETS" | jq -c '.[]' | while read -r subnet; do
  SUBNET_ID=$(echo $subnet | jq -r '.ID')
  IS_PUBLIC=$(echo $subnet | jq -r '.Public')
  CIDR=$(echo $subnet | jq -r '.CIDR')
  AZ=$(echo $subnet | jq -r '.AZ')
  
  echo "Processing subnet $SUBNET_ID ($CIDR) in $AZ - Public: $IS_PUBLIC"
  
  # Tag all subnets with cluster ownership
  aws ec2 create-tags --resources $SUBNET_ID --tags "Key=kubernetes.io/cluster/$CLUSTER_NAME,Value=shared" --region $REGION
  echo "  Tagged with kubernetes.io/cluster/$CLUSTER_NAME=shared"
  
  if [ "$IS_PUBLIC" = "true" ]; then
    # Tag public subnets for external load balancers
    aws ec2 create-tags --resources $SUBNET_ID --tags Key=kubernetes.io/role/elb,Value=1 --region $REGION
    echo "  Tagged with kubernetes.io/role/elb=1 (public subnet)"
  else
    # Tag private subnets for internal load balancers
    aws ec2 create-tags --resources $SUBNET_ID --tags Key=kubernetes.io/role/internal-elb,Value=1 --region $REGION
    echo "  Tagged with kubernetes.io/role/internal-elb=1 (private subnet)"
  fi
done

echo "Subnet tagging completed successfully!"

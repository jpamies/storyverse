# EKS AutoMode Demonstration Scenarios

This document outlines specific scenarios designed to showcase the capabilities of Amazon EKS AutoMode using the StoryVerse application. Each scenario demonstrates different aspects of AutoMode's scaling and resource management features.

## Scenario 1: Peak Usage Scaling

### Description
This scenario demonstrates how StoryVerse scales during evening hours (7-9 PM local time) when parents are creating bedtime stories for their children. During this period, the system experiences a 3-5x increase in traffic compared to daytime hours.

### Key Components
- **Frontend Layer**: Scales to handle increased user connections
- **Text Generation Service**: CPU-intensive workload scales based on queue depth
- **Image Generation Service**: GPU-intensive workload scales based on pending requests
- **Content Delivery Service**: Scales to handle increased content delivery

### AutoMode Configuration
```yaml
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: default
spec:
  amiFamily: AL2
  subnetSelector:
    kubernetes.io/cluster/storyverse: owned
  securityGroupSelector:
    kubernetes.io/cluster/storyverse: owned
  instanceTypes:
    - m5.large
    - m5.xlarge
    - m5.2xlarge
    - g4dn.xlarge  # For GPU workloads
    - g4dn.2xlarge # For GPU workloads
---
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: default
spec:
  template:
    spec:
      nodeClassRef:
        name: default
  limits:
    cpu: 1000
    memory: 1000Gi
    nvidia.com/gpu: 20
  disruption:
    consolidationPolicy: WhenEmpty
    consolidateAfter: 30s
```

### Metrics to Monitor
- CPU utilization across node types
- GPU utilization for image generation nodes
- Request latency for story creation
- Queue depths for generation services
- Node scaling events by time of day

### Expected Behavior
1. As evening approaches, request rate increases gradually
2. AutoMode adds CPU-optimized nodes for text generation workloads
3. GPU nodes scale up to handle increased image generation requests
4. Services maintain consistent performance despite 3-5x traffic increase
5. After peak hours, nodes consolidate as traffic decreases

## Scenario 2: Resource-Intensive Generation

### Description
This scenario demonstrates how complex crossover stories with many characters require more computational resources than simple single-universe tales, triggering different scaling patterns.

### Key Components
- **Crossover Logic Service**: CPU usage increases with complexity
- **Image Generation Service**: GPU usage increases with character count
- **Plot Generation Service**: Memory usage increases with story complexity

### Test Cases
1. **Simple Story**: Single universe (Toy Story), 2 characters, short length
2. **Medium Complexity**: Two universes (Dragon Ball + Monsters Inc), 3-4 characters
3. **High Complexity**: Three universes (Dragon Ball + Futurama + Lion King), 6+ characters

### AutoMode Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: image-generation-service
spec:
  template:
    spec:
      containers:
      - name: image-generation
        resources:
          requests:
            cpu: 2
            memory: 8Gi
            nvidia.com/gpu: 1
          limits:
            cpu: 4
            memory: 16Gi
            nvidia.com/gpu: 1
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crossover-logic-service
spec:
  template:
    spec:
      containers:
      - name: crossover-logic
        resources:
          requests:
            cpu: 0.5
            memory: 1Gi
          limits:
            cpu: 2
            memory: 3Gi
```

### Metrics to Monitor
- Processing time by story complexity
- Resource utilization correlation with character count
- Node scaling events triggered by complex stories
- Queue depth for different story types

### Expected Behavior
1. Simple stories process quickly with minimal resource usage
2. Medium complexity stories trigger moderate scaling
3. High complexity stories cause significant scaling of CPU and GPU resources
4. AutoMode efficiently allocates resources based on the specific workload profile
5. Resources scale down after processing complex stories

## Scenario 3: Cross-AZ Data Consistency

### Description
This scenario illustrates how user accounts, saved stories, and generation preferences remain consistent across availability zones, even during scaling events.

### Key Components
- **Story Database**: Distributed across AZs with replication
- **Media Asset Service**: Cross-AZ storage for images and audio
- **Authentication Service**: Session consistency across zones

### Test Procedure
1. Create user accounts and stories in one AZ
2. Simulate failure of that AZ
3. Verify access to accounts and stories from other AZs
4. Create new content during the "failure"
5. Restore the original AZ and verify data consistency

### AutoMode Configuration
```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: default
spec:
  template:
    spec:
      nodeClassRef:
        name: default
      requirements:
        - key: "topology.kubernetes.io/zone"
          operator: In
          values: ["us-west-2a", "us-west-2b", "us-west-2c"]
  disruption:
    consolidationPolicy: WhenEmpty
    consolidateAfter: 30s
```

### Metrics to Monitor
- Data replication lag between AZs
- Read/write latency during AZ failure
- Recovery time after AZ restoration
- Cross-AZ traffic during normal operation

### Expected Behavior
1. User data remains accessible despite AZ failure
2. New content created during failure is properly replicated
3. AutoMode redistributes pods across remaining AZs
4. System maintains performance with minimal disruption
5. Data consistency is maintained after recovery

## Scenario 4: Mixed Workload Handling

### Description
Demonstrates how EKS AutoMode efficiently allocates resources between CPU-bound services (text generation, API handling) and GPU-intensive tasks (image generation).

### Key Components
- **Text Generation Service**: CPU-intensive workload
- **Image Generation Service**: GPU-intensive workload
- **Audio Narration Service**: CPU-intensive but different profile
- **API Gateway Service**: Network-intensive but low compute

### Workload Simulation
1. Generate a mix of text-only, image-only, and combined stories
2. Vary the ratio between different story types over time
3. Introduce periodic batch processing tasks

### AutoMode Configuration
```yaml
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: cpu-optimized
spec:
  amiFamily: AL2
  subnetSelector:
    kubernetes.io/cluster/storyverse: owned
  securityGroupSelector:
    kubernetes.io/cluster/storyverse: owned
  instanceTypes:
    - c5.large
    - c5.xlarge
    - c5.2xlarge
---
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: gpu-optimized
spec:
  amiFamily: AL2
  subnetSelector:
    kubernetes.io/cluster/storyverse: owned
  securityGroupSelector:
    kubernetes.io/cluster/storyverse: owned
  instanceTypes:
    - g4dn.xlarge
    - g4dn.2xlarge
---
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: cpu-pool
spec:
  template:
    spec:
      nodeClassRef:
        name: cpu-optimized
      requirements:
        - key: "karpenter.sh/capacity-type"
          operator: In
          values: ["on-demand"]
---
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: gpu-pool
spec:
  template:
    spec:
      nodeClassRef:
        name: gpu-optimized
      requirements:
        - key: "karpenter.sh/capacity-type"
          operator: In
          values: ["on-demand"]
        - key: "node.kubernetes.io/instance-type"
          operator: In
          values: ["g4dn.xlarge", "g4dn.2xlarge"]
```

### Metrics to Monitor
- Node type distribution over time
- Resource utilization by service type
- Cost efficiency metrics
- Processing latency by story type

### Expected Behavior
1. AutoMode selects appropriate instance types for different workloads
2. CPU-intensive workloads run on compute-optimized instances
3. GPU workloads run on GPU-enabled instances
4. System maintains optimal cost-performance ratio
5. Resources scale independently based on specific service demands

## Scenario 5: Burst Capacity Management

### Description
Shows how the system handles viral content (e.g., a particularly popular universe combination) that creates sudden demand spikes.

### Key Components
- **API Gateway Layer**: Handles increased request volume
- **Rate Limiting Service**: Prevents system overload
- **Content Generation Layer**: Scales to process increased demand
- **Content Delivery Service**: Delivers cached content efficiently

### Simulation Procedure
1. Simulate a viral social media post about a specific story combination
2. Generate a 10x increase in requests for similar stories within minutes
3. Maintain elevated traffic for 1-2 hours, then gradually decrease

### AutoMode Configuration
```yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: default
spec:
  template:
    spec:
      nodeClassRef:
        name: default
  limits:
    cpu: 1000
    memory: 1000Gi
    nvidia.com/gpu: 20
  disruption:
    consolidationPolicy: WhenEmpty
    consolidateAfter: 30s
```

### Metrics to Monitor
- Time to scale up under sudden load
- Request success rate during traffic spike
- Resource utilization during peak
- Time to scale down after traffic normalizes
- Cost impact of burst capacity

### Expected Behavior
1. AutoMode rapidly scales resources to handle traffic spike
2. Rate limiting prevents system overload during scaling
3. Performance remains stable despite 10x traffic increase
4. Content caching reduces generation load for popular items
5. System efficiently scales down as viral traffic subsides

## Implementation Plan

### Infrastructure Setup
1. Deploy EKS cluster with AutoMode enabled
2. Configure node pools with appropriate instance types
3. Set up monitoring and logging infrastructure
4. Deploy StoryVerse application components

### Testing Tools
- Locust for load testing
- Prometheus for metrics collection
- Grafana for visualization
- AWS CloudWatch for cost monitoring

### Documentation
- Record scaling behavior under each scenario
- Capture metrics and graphs showing AutoMode performance
- Document cost implications and optimization opportunities
- Create comparison with traditional scaling approaches

### Presentation Materials
- Create demo videos of each scenario
- Prepare dashboards showing real-time scaling
- Develop slide deck explaining AutoMode benefits
- Prepare cost-benefit analysis

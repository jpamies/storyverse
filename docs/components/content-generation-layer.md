# Content Generation Layer

## Overview

The Content Generation Layer is responsible for producing the actual story content, including text narratives, illustrations, and audio narration. This layer contains some of the most resource-intensive services in the StoryVerse application, making it an excellent showcase for EKS AutoMode's scaling capabilities.

## Components

### Text Generation Service

Creates narrative text for stories using Large Language Models.

#### Features
- Age-appropriate vocabulary adjustment
- Character voice and personality consistency
- Plot coherence across story segments
- Support for different narrative styles
- Integration of selected moral lessons

#### Technologies
- LLM inference (e.g., Amazon Bedrock, Anthropic Claude)
- Prompt engineering framework
- Text post-processing pipeline
- Caching for common story elements

#### Resource Requirements
- CPU-intensive workload
- High memory requirements
- No GPU requirements
- Scales based on queue depth and CPU utilization

#### EKS AutoMode Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: text-generation-service
spec:
  selector:
    matchLabels:
      app: text-generation
  template:
    metadata:
      labels:
        app: text-generation
    spec:
      containers:
      - name: text-generation
        image: storyverse/text-generation:latest
        resources:
          requests:
            cpu: 1
            memory: 4Gi
          limits:
            cpu: 4
            memory: 8Gi
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: ScheduleAnyway
        labelSelector:
          matchLabels:
            app: text-generation
```

### Image Generation Service

Produces illustrations for stories using ComfyUI and other image generation models.

#### Features
- Character-consistent illustrations
- Scene composition based on story context
- Style adaptation for different universes
- Age-appropriate content filtering
- Support for different art styles

#### Technologies
- ComfyUI for image generation
- Stable Diffusion models
- CUDA acceleration
- Image post-processing pipeline
- Prompt optimization for character consistency

#### Resource Requirements
- GPU-intensive workload
- High memory requirements
- Scales based on queue depth

#### EKS AutoMode Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: image-generation-service
spec:
  selector:
    matchLabels:
      app: image-generation
  template:
    metadata:
      labels:
        app: image-generation
    spec:
      containers:
      - name: image-generation
        image: storyverse/image-generation:latest
        resources:
          requests:
            cpu: 2
            memory: 8Gi
            nvidia.com/gpu: 1
          limits:
            cpu: 4
            memory: 16Gi
            nvidia.com/gpu: 1
      nodeSelector:
        accelerator: nvidia
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: ScheduleAnyway
        labelSelector:
          matchLabels:
            app: image-generation
```

### Audio Narration Service

Converts story text into spoken narration with character-appropriate voices.

#### Features
- Text-to-speech conversion
- Character voice matching
- Emotional tone adaptation
- Background music integration
- Audio quality optimization

#### Technologies
- Amazon Polly or similar TTS service
- Voice customization pipeline
- Audio processing tools
- MP3/OGG encoding

#### Resource Requirements
- CPU-intensive workload
- Medium memory requirements
- Scales based on queue depth

#### EKS AutoMode Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: audio-narration-service
spec:
  selector:
    matchLabels:
      app: audio-narration
  template:
    metadata:
      labels:
        app: audio-narration
    spec:
      containers:
      - name: audio-narration
        image: storyverse/audio-narration:latest
        resources:
          requests:
            cpu: 1
            memory: 2Gi
          limits:
            cpu: 2
            memory: 4Gi
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: ScheduleAnyway
        labelSelector:
          matchLabels:
            app: audio-narration
```

### Content Moderation Service

Ensures all generated content is child-appropriate and meets quality standards.

#### Features
- Text content filtering
- Image safety verification
- Audio quality checking
- Content policy enforcement
- Manual review flagging

#### Technologies
- Amazon Rekognition for image moderation
- Text analysis for inappropriate content
- Audio quality assessment tools
- Rule-based filtering system

#### Resource Requirements
- Mixed CPU and memory requirements
- Scales based on content generation rate

#### EKS AutoMode Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: content-moderation-service
spec:
  selector:
    matchLabels:
      app: content-moderation
  template:
    metadata:
      labels:
        app: content-moderation
    spec:
      containers:
      - name: content-moderation
        image: storyverse/content-moderation:latest
        resources:
          requests:
            cpu: 0.5
            memory: 1Gi
          limits:
            cpu: 1
            memory: 2Gi
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: ScheduleAnyway
        labelSelector:
          matchLabels:
            app: content-moderation
```

## Workflow

1. Story parameters are received from the Core Story Generation Layer
2. Text Generation Service creates the narrative
3. Content Moderation Service verifies the text
4. Image Generation Service creates illustrations based on the text
5. Content Moderation Service verifies the images
6. Audio Narration Service creates spoken narration (if requested)
7. Content Moderation Service verifies the audio
8. All approved content is passed to the Storage and Delivery Layer

## Scaling Scenarios

### Peak Usage Scaling
During evening hours (7-9 PM local time), the system experiences higher demand as parents create bedtime stories. EKS AutoMode scales the Text Generation and Image Generation services differently based on their resource profiles.

### Resource-Intensive Generation
Complex crossover stories with many characters require more computational resources than simple single-universe tales. The Image Generation Service scales based on the complexity of the requested illustrations.

### Burst Capacity Management
When a particular universe combination becomes trending (e.g., Dragon Ball + Toy Story), the system experiences sudden demand spikes. EKS AutoMode rapidly scales the Content Generation Layer to handle these bursts.

## Monitoring Metrics

| Service | Key Metrics |
|---------|-------------|
| Text Generation | Generation time, token count, queue depth, error rate |
| Image Generation | Generation time, GPU utilization, queue depth, error rate |
| Audio Narration | Generation time, audio length, queue depth, error rate |
| Content Moderation | Processing time, rejection rate, false positive rate |

## Cross-AZ Considerations

- Content generation workloads are distributed across AZs for resilience
- Generation results are stored in S3 with cross-region replication
- Queue systems ensure work can be processed by any AZ
- Metadata is stored in DynamoDB with global tables for multi-region consistency

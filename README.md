# StoryVerse: Custom Tales for Kids

![StoryVerse Logo](docs/images/logo-placeholder.png)

## Project Overview

StoryVerse is an interactive platform where parents and children can create personalized stories by combining characters, settings, and themes from popular universes like Dragon Ball, Ninja Turtles, Futurama, Toy Story, Lion King, and Monsters Inc. The application generates illustrated storybooks with text and optional audio narration, tailored to the child's preferences and age-appropriate moral lessons.

This project serves as a demonstration of AWS EKS AutoMode capabilities, showcasing how a complex microservices architecture with varying resource requirements can efficiently scale across availability zones.

## Architecture

StoryVerse uses a microservices architecture deployed on Amazon EKS with AutoMode enabled:

![Architecture Diagram](docs/images/architecture-placeholder.png)

### Key Components

#### Frontend Layer
- **Story Creator UI**: Interactive web interface for building custom tales
- **Character Selection Interface**: Visual gallery of characters from different universes
- **Story Preview Service**: Real-time preview of story elements as they're selected
- **Parent Dashboard**: Controls for age settings, content filters, and saved stories

#### API Gateway Layer
- **API Gateway Service**: Routes requests to appropriate backend services
- **Authentication Service**: Manages user accounts and access control
- **Rate Limiting Service**: Prevents abuse and ensures fair resource allocation

#### Core Story Generation Layer
- **Universe Management Service**: Maintains catalog of available fictional universes
- **Character Database Service**: Stores character traits, relationships, and images
- **Plot Generation Service**: Creates story structures based on selected parameters
- **Moral Lesson Service**: Integrates age-appropriate lessons into storylines
- **Crossover Logic Service**: Handles interactions between characters from different universes

#### Content Generation Layer
- **Text Generation Service**: Creates story narrative using LLMs (CPU-intensive)
- **Image Generation Service**: Produces illustrations using ComfyUI (GPU-intensive)
- **Audio Narration Service**: Converts text to spoken narration (CPU-intensive)
- **Content Moderation Service**: Ensures all generated content is child-appropriate

#### Storage and Delivery Layer
- **Story Database**: Stores completed and in-progress stories (distributed across AZs)
- **Media Asset Service**: Manages images and audio files
- **Content Delivery Service**: Optimizes delivery of stories to different devices

#### Analytics and Recommendation Layer
- **Usage Analytics Service**: Tracks popular combinations and features
- **Recommendation Engine**: Suggests story elements based on preferences
- **Feedback Processing Service**: Analyzes user ratings and comments

## Story Creation Features

### Universe Selection
- **Single Universe**: Stories set entirely in one world (e.g., Dragon Ball)
- **Crossover Adventure**: Characters from different universes meet
- **Fusion World**: A blended setting combining elements from multiple universes
- **Universe Hopping**: Characters travel between different worlds during the story

### Character Options
- **Hero Selection**: Choose main protagonists from different universes
- **Sidekick Builder**: Select or create supporting characters
- **Friendly Rival**: Include characters who start as opponents but become allies
- **Mentor Character**: Include wise guides from universes (Master Roshi, Splinter, Professor Farnsworth)
- **Custom Character**: Create a new character to join the established heroes

### Story Themes
- **Adventure Quest**: Characters seek an important object or person
- **Friendship Tale**: Story about building relationships and teamwork
- **Overcoming Fears**: Characters help each other face their anxieties
- **Learning New Skills**: Characters teach each other abilities from their universes
- **Helping Others**: Focus on community service and assistance
- **Mystery Solving**: Characters work together to solve a puzzle or mystery

### Moral Lessons
- **Friendship & Teamwork**: Working together achieves more than working alone
- **Courage & Bravery**: Standing up for what's right even when it's difficult
- **Honesty & Truth**: The importance of being truthful
- **Kindness & Compassion**: Helping others without expecting rewards
- **Perseverance**: Continuing to try despite difficulties
- **Respect for Differences**: Appreciating unique qualities in others
- **Responsibility**: Taking care of duties and obligations

### Story Length Options
- **Bedtime Short**: 5-7 minute stories perfect for bedtime
- **Chapter Adventure**: Longer tales divided into chapters for multiple reading sessions
- **Mini Epic**: Extended adventures with multiple challenges and resolutions
- **Series Creator**: Connected stories that build on each other

### Customization Features
- **Age Adaptation**: Adjusts vocabulary and themes for different age groups (3-5, 6-8, 9-12)
- **Reading Level**: Modifies text complexity to match the child's reading abilities
- **Name Insertion**: Adds the child's name as a character in the story
- **Personalized Moral**: Focuses on specific values parents want to emphasize
- **Cultural Elements**: Incorporates traditions or values from the family's background

### Media Options
- **Illustrated Storybook**: Text with AI-generated illustrations
- **Audio Narration**: Professional-quality voice narration of the story
- **Character Voice Matching**: Different voices for different characters
- **Background Music**: Themed music that matches the story's mood
- **Interactive Elements**: Simple animations or interactive moments in digital versions
- **Print-Ready Format**: Option to generate a PDF for home printing

## EKS AutoMode Demonstration Scenarios

This project showcases several key capabilities of EKS AutoMode:

### 1. Peak Usage Scaling
Demonstrates how the system scales during evening hours when parents are creating bedtime stories, with the GPU-intensive image generation services scaling differently than the text generation services.

### 2. Resource-Intensive Generation
Shows how complex crossover stories with many characters require more computational resources than simple single-universe tales, triggering different scaling patterns.

### 3. Cross-AZ Data Consistency
Illustrates how user accounts, saved stories, and generation preferences remain consistent across availability zones, even during scaling events.

### 4. Mixed Workload Handling
Demonstrates how EKS AutoMode efficiently allocates resources between CPU-bound services (text generation, API handling) and GPU-intensive tasks (image generation).

### 5. Burst Capacity Management
Shows how the system handles viral content (e.g., a particularly popular universe combination) that creates sudden demand spikes.

## Getting Started

### Prerequisites
- AWS Account with EKS access
- kubectl configured for your EKS cluster
- Helm 3.0+
- Docker

### Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/storyverse.git
cd storyverse
```

2. Deploy the infrastructure:
```bash
cd infrastructure
terraform init
terraform apply
```

3. Deploy the application components:
```bash
cd ../kubernetes
./deploy.sh
```

4. Access the application:
```bash
# Access via the Ingress (DNS needs to be configured)
# The application will be available at http://storyverse.example.com

# For local development or testing, use port-forwarding
kubectl -n storyverse port-forward svc/frontend 8080:80
# Then access at http://localhost:8080
```

## Project Structure

```
storyverse/
├── docs/                      # Documentation
│   ├── architecture/          # Architecture diagrams and descriptions
│   ├── components/            # Component-specific documentation
│   └── images/                # Images for documentation
├── infrastructure/            # Infrastructure as Code
│   ├── terraform/             # Terraform modules for AWS resources
│   └── kubernetes/            # Kubernetes manifests and Helm charts
├── services/                  # Microservices source code
│   ├── frontend/              # Frontend application
│   ├── api-gateway/           # API Gateway service
│   ├── universe-management/   # Universe Management service
│   ├── text-generation/       # Text Generation service
│   ├── image-generation/      # Image Generation service
│   └── ...                    # Other services
├── scripts/                   # Utility scripts
├── tests/                     # Test suites
└── README.md                  # This file
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Implementation Status

### Completed Services

#### Frontend Layer
- **Story Creator UI**: Interactive web interface for building custom tales
- **Character Selection Interface**: Visual gallery of characters from different universes
- **Story Preview Service**: Real-time preview of story elements as they're selected
- **Parent Dashboard**: Controls for age settings, content filters, and saved stories

#### API Gateway Layer
- **API Gateway Service**: Routes requests to appropriate backend services
- **Authentication Service**: Manages user accounts and access control
- **Rate Limiting Service**: Prevents abuse and ensures fair resource allocation

#### Core Story Generation Layer
- **Universe Management Service**: Maintains catalog of available fictional universes
- **Character Database Service**: Stores character traits, relationships, and images
- **Plot Generation Service**: Creates story structures based on selected parameters
- **Moral Lesson Service**: Integrates age-appropriate lessons into storylines
- **Crossover Logic Service**: Handles interactions between characters from different universes

#### Content Generation Layer
- **Text Generation Service**: Creates story narrative using LLMs (CPU-intensive)
- **Image Generation Service**: Produces illustrations using ComfyUI (GPU-intensive)
- **Audio Narration Service**: Converts text to spoken narration (CPU-intensive)
- **Content Moderation Service**: Ensures all generated content is child-appropriate

#### Storage and Delivery Layer
- **Story Database**: Stores completed and in-progress stories (distributed across AZs)
- **Media Asset Service**: Manages images and audio files
- **Content Delivery Service**: Optimizes delivery of stories to different devices

#### Analytics and Recommendation Layer
- **Usage Analytics Service**: Tracks popular combinations and features
- **Recommendation Engine**: Suggests story elements based on preferences
- **Feedback Processing Service**: Analyzes user ratings and comments

### Implementation Priorities
1. Core Story Generation services (Universe Management, Character Database, Plot Generation)
2. Content Generation services (Text Generation, Image Generation)
3. Story Database service
4. API Gateway and Authentication services
5. Frontend components
6. Remaining services

## Acknowledgments

- Thanks to all the fictional universes that inspire children's imagination
- AWS EKS team for creating AutoMode capabilities

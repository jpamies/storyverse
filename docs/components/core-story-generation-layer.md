# Core Story Generation Layer

## Overview

The Core Story Generation Layer is responsible for managing the fundamental elements of story creation, including universes, characters, plot structures, moral lessons, and crossover logic. This layer serves as the brain of the StoryVerse application, coordinating the creative elements that make each story unique.

**Implementation Status: COMPLETED**

## Components

### Universe Management Service

Maintains the catalog of available fictional universes and their characteristics.

#### Features
- Universe metadata management
- Setting descriptions and rules
- Universe compatibility matrix
- Theme and tone definitions
- Visual style guidelines

#### Technologies
- Spring Boot microservice
- MongoDB for flexible schema storage
- Redis caching for frequently accessed universes
- GraphQL API for complex queries

#### Scaling Considerations
- Read-heavy workload
- Cacheable data
- Infrequent updates

#### EKS AutoMode Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: universe-management-service
spec:
  selector:
    matchLabels:
      app: universe-management
  template:
    metadata:
      labels:
        app: universe-management
    spec:
      containers:
      - name: universe-management
        image: storyverse/universe-management:latest
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
            app: universe-management
```

### Character Database Service

Stores and manages character information, traits, relationships, and images.

#### Features
- Character profile management
- Relationship mapping between characters
- Trait and ability definitions
- Character art and visual references
- Voice and personality guidelines

#### Technologies
- Node.js microservice
- PostgreSQL with JSON columns
- ElasticSearch for character search
- S3 for character artwork storage

#### Scaling Considerations
- Read-heavy workload
- Complex relationship queries
- Image retrieval performance

#### EKS AutoMode Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: character-database-service
spec:
  selector:
    matchLabels:
      app: character-database
  template:
    metadata:
      labels:
        app: character-database
    spec:
      containers:
      - name: character-database
        image: storyverse/character-database:latest
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
            app: character-database
```

### Plot Generation Service

Creates story structures based on selected parameters and narrative patterns.

#### Features
- Plot template management
- Story arc generation
- Scene sequencing
- Conflict and resolution patterns
- Adaptation for different story lengths

#### Technologies
- Python FastAPI service
- Graph database for plot structures
- Machine learning for plot recommendations
- Template engine for structure generation

#### Scaling Considerations
- CPU-intensive during plot generation
- Stateless operation
- Cacheable common patterns

#### EKS AutoMode Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: plot-generation-service
spec:
  selector:
    matchLabels:
      app: plot-generation
  template:
    metadata:
      labels:
        app: plot-generation
    spec:
      containers:
      - name: plot-generation
        image: storyverse/plot-generation:latest
        resources:
          requests:
            cpu: 0.5
            memory: 1Gi
          limits:
            cpu: 2
            memory: 4Gi
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: ScheduleAnyway
        labelSelector:
          matchLabels:
            app: plot-generation
```

### Moral Lesson Service

Integrates age-appropriate lessons into storylines based on parent preferences.

#### Features
- Moral lesson catalog
- Age-appropriate adaptation
- Integration techniques for different story types
- Cultural sensitivity adjustments
- Personalization based on parent preferences

#### Technologies
- Ruby on Rails microservice
- PostgreSQL database
- Redis for caching
- Natural language processing for integration

#### Scaling Considerations
- Lightweight processing
- Stateless operation
- Highly cacheable content

#### EKS AutoMode Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: moral-lesson-service
spec:
  selector:
    matchLabels:
      app: moral-lesson
  template:
    metadata:
      labels:
        app: moral-lesson
    spec:
      containers:
      - name: moral-lesson
        image: storyverse/moral-lesson:latest
        resources:
          requests:
            cpu: 0.2
            memory: 512Mi
          limits:
            cpu: 0.5
            memory: 1Gi
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: ScheduleAnyway
        labelSelector:
          matchLabels:
            app: moral-lesson
```

### Crossover Logic Service

Handles interactions between characters from different universes, ensuring narrative consistency.

#### Features
- Universe compatibility rules
- Character interaction patterns
- Power level balancing
- Logical consistency enforcement
- Crossover trope management

#### Technologies
- Go microservice
- Rule engine for compatibility logic
- Graph database for relationship mapping
- Redis for caching common interactions

#### Scaling Considerations
- CPU-intensive for complex crossovers
- Stateless operation
- Scales with story complexity

#### EKS AutoMode Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: crossover-logic-service
spec:
  selector:
    matchLabels:
      app: crossover-logic
  template:
    metadata:
      labels:
        app: crossover-logic
    spec:
      containers:
      - name: crossover-logic
        image: storyverse/crossover-logic:latest
        resources:
          requests:
            cpu: 0.5
            memory: 1Gi
          limits:
            cpu: 2
            memory: 3Gi
      topologySpreadConstraints:
      - maxSkew: 1
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: ScheduleAnyway
        labelSelector:
          matchLabels:
            app: crossover-logic
```

## Workflow

1. User selects story parameters (universes, characters, theme, moral lesson)
2. Universe Management Service provides setting information
3. Character Database Service provides character details
4. Crossover Logic Service validates the combination and establishes interaction rules
5. Plot Generation Service creates a story structure
6. Moral Lesson Service integrates the selected lesson
7. The complete story blueprint is passed to the Content Generation Layer

## API Endpoints

| Service | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Universe Management | `/api/universes` | GET | List available universes |
| Universe Management | `/api/universes/{id}` | GET | Get universe details |
| Character Database | `/api/characters` | GET | List characters (filterable) |
| Character Database | `/api/characters/{id}` | GET | Get character details |
| Character Database | `/api/characters/{id}/relationships` | GET | Get character relationships |
| Plot Generation | `/api/plots/generate` | POST | Generate a plot structure |
| Moral Lesson | `/api/lessons` | GET | List available moral lessons |
| Moral Lesson | `/api/lessons/{id}/integrate` | POST | Integrate lesson into plot |
| Crossover Logic | `/api/crossover/validate` | POST | Validate character combination |
| Crossover Logic | `/api/crossover/interactions` | POST | Generate interaction patterns |

## Scaling Scenarios

### Complex Crossover Stories
When users select characters from multiple universes, the Crossover Logic Service experiences increased load. EKS AutoMode scales this service based on CPU utilization and request queue depth.

### Popular Universe Combinations
Certain universe combinations (e.g., Dragon Ball + Toy Story) may become trending, creating higher demand on the Universe Management and Character Database services. AutoMode ensures these services scale to handle the increased query load.

### Story Complexity Variations
Different story types (short bedtime stories vs. chapter adventures) require different levels of plot complexity. The Plot Generation Service scales based on the complexity of requested stories.

## Monitoring Metrics

| Service | Key Metrics |
|---------|-------------|
| Universe Management | Query rate, cache hit ratio, response time |
| Character Database | Query rate, relationship depth, response time |
| Plot Generation | Generation time, plot complexity, error rate |
| Moral Lesson | Integration time, lesson applicability score |
| Crossover Logic | Validation time, interaction complexity, error rate |

## Cross-AZ Considerations

- Read replicas of databases are maintained across AZs
- Cache consistency is maintained through distributed caching mechanisms
- Service instances are distributed across AZs for high availability
- Data synchronization uses eventual consistency patterns for non-critical updates

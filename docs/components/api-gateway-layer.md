# API Gateway Layer

## Overview

The API Gateway Layer serves as the entry point for all client requests to the StoryVerse platform. It handles routing, authentication, rate limiting, and provides a unified interface for frontend applications to interact with backend services.

## Components

### API Gateway Service

Routes requests to appropriate backend services and handles API versioning.

#### Features
- Request routing based on path and method
- Service discovery integration
- Response transformation and aggregation
- API versioning support
- Error handling and standardization
- Request/response logging

#### Technologies
- Amazon API Gateway or Kong API Gateway
- OpenAPI/Swagger for API documentation
- AWS Lambda for request transformations
- CloudWatch for logging

#### Scaling Considerations
- Stateless design for horizontal scaling
- High availability across multiple AZs
- Caching for frequently accessed endpoints

#### EKS AutoMode Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway-service
spec:
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: storyverse/api-gateway:latest
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
            app: api-gateway
```

### Authentication Service

Manages user accounts, authentication, and access control.

#### Features
- User registration and login
- OAuth2/OpenID Connect support
- JWT token issuance and validation
- Role-based access control
- Parent/child account management
- Session management
- Password reset and account recovery

#### Technologies
- Spring Security or Auth0
- PostgreSQL for user data
- Redis for session storage
- HTTPS/TLS for secure communication

#### Scaling Considerations
- Session state management across instances
- Token validation performance
- Database connection pooling

#### EKS AutoMode Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: authentication-service
spec:
  selector:
    matchLabels:
      app: authentication
  template:
    metadata:
      labels:
        app: authentication
    spec:
      containers:
      - name: authentication
        image: storyverse/authentication:latest
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
            app: authentication
```

### Rate Limiting Service

Prevents abuse and ensures fair resource allocation across users.

#### Features
- Request rate limiting by IP and user
- Quota management for story generation
- Burst handling for premium users
- Throttling policies for different API endpoints
- Abuse detection and prevention
- Usage analytics for billing

#### Technologies
- Redis for rate counter storage
- Lua scripts for atomic operations
- Prometheus for metrics collection
- Custom rate limiting algorithms

#### Scaling Considerations
- Distributed counter synchronization
- Low latency requirements
- Redis cluster for high availability

#### EKS AutoMode Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rate-limiting-service
spec:
  selector:
    matchLabels:
      app: rate-limiting
  template:
    metadata:
      labels:
        app: rate-limiting
    spec:
      containers:
      - name: rate-limiting
        image: storyverse/rate-limiting:latest
        resources:
          requests:
            cpu: 0.3
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
            app: rate-limiting
```

## API Endpoints

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| Authentication | `/api/auth/register` | POST | Register new user |
| Authentication | `/api/auth/login` | POST | User login |
| Authentication | `/api/auth/refresh` | POST | Refresh access token |
| Authentication | `/api/auth/logout` | POST | User logout |
| Stories | `/api/stories` | GET | List user's stories |
| Stories | `/api/stories` | POST | Create new story |
| Stories | `/api/stories/{id}` | GET | Get story details |
| Stories | `/api/stories/{id}` | PUT | Update story |
| Stories | `/api/stories/{id}` | DELETE | Delete story |
| Characters | `/api/characters` | GET | List characters |
| Characters | `/api/characters/{id}` | GET | Get character details |
| Universes | `/api/universes` | GET | List universes |
| Universes | `/api/universes/{id}` | GET | Get universe details |
| Generation | `/api/generate/text` | POST | Generate story text |
| Generation | `/api/generate/image` | POST | Generate story image |
| Generation | `/api/generate/audio` | POST | Generate audio narration |

## Request Flow

1. Client sends request to API Gateway
2. Authentication Service validates the user's token
3. Rate Limiting Service checks if the request is within limits
4. API Gateway routes the request to the appropriate backend service
5. Backend service processes the request and returns a response
6. API Gateway transforms the response if needed
7. Response is returned to the client

## Security Considerations

### Authentication
- All endpoints except public documentation require authentication
- JWT tokens with short expiration times
- Refresh token rotation for enhanced security
- HTTPS/TLS for all communications

### Authorization
- Role-based access control (Parent vs. Child accounts)
- Resource ownership validation
- Content restrictions based on age settings

### Rate Limiting
- Basic tier: 5 stories per day
- Premium tier: 20 stories per day
- Burst allowance for special occasions
- API key requirements for high-volume access

## Scaling Scenarios

### User Registration Spikes
During marketing campaigns or media coverage, the Authentication Service may experience spikes in registration requests. EKS AutoMode scales this service based on CPU utilization and request rate.

### Evening Usage Patterns
The API Gateway experiences higher load during evening hours when parents are creating bedtime stories. AutoMode ensures adequate capacity across all AZs during these peak times.

### Viral Content Sharing
When users share their stories on social media, the platform may experience sudden traffic increases. The Rate Limiting Service helps manage these spikes while AutoMode scales resources appropriately.

## Monitoring Metrics

| Service | Key Metrics |
|---------|-------------|
| API Gateway | Request rate, latency, error rate, endpoint popularity |
| Authentication | Login rate, token issuance rate, failed attempts |
| Rate Limiting | Throttled requests, quota utilization, abuse detections |

## Cross-AZ Considerations

- API Gateway instances deployed across multiple AZs
- Session data replicated across AZs for authentication consistency
- Rate limiting counters synchronized across distributed Redis instances
- Automatic failover for high availability

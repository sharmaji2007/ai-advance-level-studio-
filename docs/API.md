# API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

Response:
```json
{
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "credits": 50
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Jobs

#### Create Image Generation Job
```http
POST /jobs/image-generation
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "A futuristic cityscape at sunset",
  "style": "cinematic",
  "negativePrompt": "blurry, low quality",
  "width": 1024,
  "height": 1024,
  "steps": 30,
  "numImages": 1
}
```

Response:
```json
{
  "jobId": "uuid",
  "status": "pending",
  "creditsUsed": 2,
  "message": "Job queued for processing"
}
```

#### Create Cloth Swap Job
```http
POST /jobs/cloth-swap
Authorization: Bearer <token>
Content-Type: multipart/form-data

person: <file>
cloth: <file>
category: "formal"
preserveFace: true
```

#### Create AI Influencer
```http
POST /jobs/influencer-creation
Authorization: Bearer <token>
Content-Type: application/json

{
  "gender": "female",
  "ethnicity": "asian",
  "ageRange": "26-35",
  "style": "professional",
  "poses": 5
}
```

#### Create 3D Video
```http
POST /jobs/3d-video
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "A dragon flying over mountains",
  "duration": 30,
  "cameraMovement": "orbit",
  "style": "cinematic"
}
```

#### Create Study Animation
```http
POST /jobs/study-animation
Authorization: Bearer <token>
Content-Type: application/json

{
  "topic": "Photosynthesis",
  "script": "Plants convert sunlight into energy...",
  "subject": "science",
  "animationStyle": "3d-cgi",
  "duration": 60
}
```

#### Create Story Video
```http
POST /jobs/story-video
Authorization: Bearer <token>
Content-Type: application/json

{
  "script": "Once upon a time in a magical forest...",
  "visualStyle": "pixar",
  "voiceStyle": "male-warm",
  "backgroundMusic": "epic"
}
```

#### Get Job Status
```http
GET /jobs/:jobId
Authorization: Bearer <token>
```

Response:
```json
{
  "id": "uuid",
  "job_type": "image-generation",
  "status": "completed",
  "credits_used": 2,
  "output_data": {...},
  "processing_time_ms": 15000,
  "created_at": "2024-01-01T00:00:00Z",
  "completed_at": "2024-01-01T00:00:15Z",
  "metadata": {
    "processingSteps": [...],
    "outputFiles": [...]
  }
}
```

#### Get User Jobs
```http
GET /jobs?page=1&limit=20&status=completed&jobType=image-generation
Authorization: Bearer <token>
```

#### Cancel Job
```http
DELETE /jobs/:jobId
Authorization: Bearer <token>
```

#### Download Result
```http
GET /jobs/:jobId/download
Authorization: Bearer <token>
```

### User

#### Get Profile
```http
GET /users/profile
Authorization: Bearer <token>
```

#### Get Credits
```http
GET /users/credits
Authorization: Bearer <token>
```

#### Get Transactions
```http
GET /users/transactions?page=1&limit=20
Authorization: Bearer <token>
```

### Payments

#### Create Checkout Session
```http
POST /payments/create-checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "package": "pro"
}
```

Response:
```json
{
  "sessionId": "stripe_session_id",
  "url": "https://checkout.stripe.com/..."
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `202` - Accepted (job queued)
- `400` - Bad Request
- `401` - Unauthorized
- `402` - Payment Required (insufficient credits)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

- 100 requests per 15 minutes per IP
- Authenticated users: 200 requests per 15 minutes

## Credit Costs

- Image Generation: 2 credits
- Cloth Swap: 3 credits
- AI Influencer: 5 credits
- 3D Video: 8 credits
- Study Animation: 5 credits
- Story Video: 10 credits

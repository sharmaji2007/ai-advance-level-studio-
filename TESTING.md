# Testing Guide

## Overview
This guide covers testing strategies for the AI Creative Studio backend.

## Test Environment Setup

### 1. Install Test Dependencies
```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

### 2. Configure Jest
Create `jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
};
```

### 3. Test Database
Use separate test database:
```bash
# .env.test
POSTGRES_DB=ai_studio_test
MONGODB_URI=mongodb://localhost:27017/ai_studio_test
```

## Unit Tests

### Testing Controllers

```typescript
// src/controllers/__tests__/job.controller.test.ts
import { Request, Response } from 'express';
import { createImageGeneration } from '../job.controller';
import * as creditService from '../../services/credit.service';

jest.mock('../../services/credit.service');

describe('Job Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      user: { id: 'test-user-id', email: 'test@example.com' },
      body: {
        prompt: 'Test prompt',
        style: 'realistic'
      }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  it('should create image generation job', async () => {
    (creditService.hasEnoughCredits as jest.Mock).mockResolvedValue(true);

    await createImageGeneration(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(202);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: expect.any(String),
        status: 'pending'
      })
    );
  });

  it('should return 402 when insufficient credits', async () => {
    (creditService.hasEnoughCredits as jest.Mock).mockResolvedValue(false);

    await createImageGeneration(
      mockReq as Request,
      mockRes as Response,
      mockNext
    );

    expect(mockRes.status).toHaveBeenCalledWith(402);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Insufficient credits'
    });
  });
});
```

### Testing Services

```typescript
// src/services/__tests__/credit.service.test.ts
import { hasEnoughCredits, deductCredits } from '../credit.service';
import { pgPool } from '../../database/connection';

jest.mock('../../database/connection');

describe('Credit Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hasEnoughCredits', () => {
    it('should return true when user has enough credits', async () => {
      (pgPool.query as jest.Mock).mockResolvedValue({
        rows: [{ credits: 100 }]
      });

      const result = await hasEnoughCredits('user-id', 50);

      expect(result).toBe(true);
    });

    it('should return false when user has insufficient credits', async () => {
      (pgPool.query as jest.Mock).mockResolvedValue({
        rows: [{ credits: 10 }]
      });

      const result = await hasEnoughCredits('user-id', 50);

      expect(result).toBe(false);
    });
  });

  describe('deductCredits', () => {
    it('should deduct credits and create transaction', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [{ credits: 50 }] }),
        release: jest.fn()
      };

      (pgPool.connect as jest.Mock).mockResolvedValue(mockClient);

      await deductCredits('user-id', 10, 'job-id');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
```

## Integration Tests

### API Endpoint Tests

```typescript
// src/__tests__/integration/auth.test.ts
import request from 'supertest';
import app from '../../server';
import { pgPool } from '../../database/connection';

describe('Auth API', () => {
  beforeAll(async () => {
    // Setup test database
    await pgPool.query('DELETE FROM users WHERE email LIKE $1', ['test%']);
  });

  afterAll(async () => {
    // Cleanup
    await pgPool.end();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        email: 'test@example.com',
        fullName: 'Test User',
        credits: 50
      });
    });

    it('should return 400 for duplicate email', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123'
        });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already registered');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });
});
```

### Job Flow Tests

```typescript
// src/__tests__/integration/job-flow.test.ts
import request from 'supertest';
import app from '../../server';

describe('Job Flow', () => {
  let authToken: string;
  let jobId: string;

  beforeAll(async () => {
    // Register and login
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'jobtest@example.com',
        password: 'password123'
      });

    authToken = response.body.token;
  });

  it('should create, process, and retrieve job', async () => {
    // Create job
    const createResponse = await request(app)
      .post('/api/v1/jobs/image-generation')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        prompt: 'Test image',
        style: 'realistic'
      });

    expect(createResponse.status).toBe(202);
    jobId = createResponse.body.jobId;

    // Check status
    const statusResponse = await request(app)
      .get(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.status).toMatch(/pending|processing|completed/);

    // Wait for completion (in real tests, use polling or mocking)
    // await waitForJobCompletion(jobId);

    // Download result
    const downloadResponse = await request(app)
      .get(`/api/v1/jobs/${jobId}/download`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(downloadResponse.status).toBe(200);
  });
});
```

## GPU Service Tests

### Python Unit Tests

```python
# gpu-service/tests/test_gpu_manager.py
import pytest
import torch
from gpu_manager import GPUManager

@pytest.fixture
def gpu_manager():
    return GPUManager(max_vram_mb=7500)

def test_vram_usage(gpu_manager):
    """Test VRAM usage tracking"""
    if torch.cuda.is_available():
        usage = gpu_manager.get_vram_usage()
        assert usage >= 0
        assert usage < 8192

def test_model_context(gpu_manager):
    """Test model loading context manager"""
    def mock_loader():
        return {"model": "test"}
    
    with gpu_manager.model_context("test", mock_loader, 100):
        assert "test" in gpu_manager.loaded_models

def test_clear_cache(gpu_manager):
    """Test GPU cache clearing"""
    if torch.cuda.is_available():
        initial_usage = gpu_manager.get_vram_usage()
        gpu_manager.clear_cache()
        after_usage = gpu_manager.get_vram_usage()
        assert after_usage <= initial_usage
```

### Processor Tests

```python
# gpu-service/tests/test_image_generator.py
import pytest
from processors.image_generator import ImageGenerator
from gpu_manager import GPUManager

@pytest.fixture
def image_generator():
    gpu_manager = GPUManager()
    return ImageGenerator(gpu_manager)

def test_process_image_generation(image_generator):
    """Test image generation"""
    job_data = {
        'jobId': 'test-job',
        'prompt': 'A test image',
        'width': 512,
        'height': 512,
        'steps': 20,
        'numImages': 1
    }
    
    result = image_generator.process(job_data)
    
    assert 'images' in result
    assert len(result['images']) == 1
    assert result['count'] == 1
```

## Load Testing

### Using Artillery

```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "Image Generation Flow"
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
          capture:
            - json: "$.token"
              as: "token"
      - post:
          url: "/api/v1/jobs/image-generation"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            prompt: "Test image"
            style: "realistic"
```

Run load test:
```bash
npm install -g artillery
artillery run artillery-config.yml
```

## Performance Testing

### GPU Performance Test

```python
# gpu-service/tests/test_performance.py
import time
import pytest
from processors.image_generator import ImageGenerator
from gpu_manager import GPUManager

def test_image_generation_performance():
    """Test image generation performance"""
    gpu_manager = GPUManager()
    generator = ImageGenerator(gpu_manager)
    
    job_data = {
        'jobId': 'perf-test',
        'prompt': 'Performance test image',
        'width': 1024,
        'height': 1024,
        'steps': 30,
        'numImages': 1
    }
    
    start_time = time.time()
    result = generator.process(job_data)
    end_time = time.time()
    
    processing_time = end_time - start_time
    
    # Should complete within 30 seconds on RTX 3050
    assert processing_time < 30
    assert 'images' in result
```

## Manual Testing

### Test Checklist

#### Authentication
- [ ] User registration
- [ ] User login
- [ ] JWT token validation
- [ ] Invalid credentials handling

#### Job Creation
- [ ] Image generation
- [ ] Cloth swap
- [ ] AI influencer
- [ ] 3D video
- [ ] Study animation
- [ ] Story video

#### Credit System
- [ ] Credit deduction
- [ ] Insufficient credits handling
- [ ] Credit purchase
- [ ] Transaction history

#### Job Processing
- [ ] Job queuing
- [ ] Status updates
- [ ] Error handling
- [ ] Result storage

#### File Operations
- [ ] File upload
- [ ] File validation
- [ ] Storage integration
- [ ] Download URLs

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: ai_studio_test
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
        env:
          POSTGRES_HOST: localhost
          POSTGRES_DB: ai_studio_test
          REDIS_HOST: localhost
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Test Coverage

### Generate Coverage Report

```bash
# Run tests with coverage
npm test -- --coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Coverage Goals
- Unit tests: > 80%
- Integration tests: > 70%
- Critical paths: 100%

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Mock External Services**: Don't call real APIs in tests
3. **Use Test Database**: Separate from development/production
4. **Clean Up**: Reset state after each test
5. **Fast Tests**: Keep unit tests under 1 second
6. **Descriptive Names**: Test names should explain what they test
7. **Test Edge Cases**: Not just happy paths
8. **Continuous Testing**: Run tests on every commit

## Debugging Tests

### Enable Debug Logging

```typescript
// Set environment variable
process.env.LOG_LEVEL = 'debug';

// Or in test
import { logger } from '../utils/logger';
logger.level = 'debug';
```

### Run Single Test

```bash
# Jest
npm test -- --testNamePattern="should create image generation job"

# Python
pytest -k "test_image_generation"
```

### Debug in VS Code

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

**Happy Testing! 🧪**

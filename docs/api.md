# API Documentation

This document provides comprehensive documentation for the Scan-ttendance API endpoints.

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      // Additional error details (optional)
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Authentication Endpoints

### POST /api/auth/register

Register a new organization account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "organizationName": "Acme Corporation",
  "password": "SecurePassword123!"
}
```

**Validation Rules:**
- `name`: Required, 2-50 characters
- `email`: Required, valid email format
- `organizationName`: Required, 2-100 characters, unique
- `password`: Required, minimum 8 characters, must contain uppercase, lowercase, number, and special character

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "organization": {
      "id": "org-123",
      "name": "Acme Corporation",
      "schema": "org_acme_corporation"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400`: Validation errors
- `409`: Email or organization name already exists

### POST /api/auth/login

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    },
    "organization": {
      "id": "org-123",
      "name": "Acme Corporation"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400`: Missing email or password
- `401`: Invalid credentials
- `429`: Too many login attempts

### GET /api/auth/verify

Verify JWT token validity.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "user-123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "expiresAt": "2024-01-02T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `401`: Invalid or expired token

### POST /api/auth/logout

Logout user and invalidate token.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out"
  }
}
```

## Organization Management

### GET /api/org/dashboard

Get organization dashboard data.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "organization": {
      "id": "org-123",
      "name": "Acme Corporation",
      "memberCount": 5
    },
    "stats": {
      "totalEvents": 12,
      "activeEvents": 3,
      "totalVerifications": 1250,
      "thisMonthVerifications": 89
    },
    "recentEvents": [
      {
        "id": "event-123",
        "name": "Annual Conference",
        "isActive": true,
        "createdAt": "2024-01-01T10:00:00.000Z",
        "attendeeCount": 150,
        "verificationCount": 89
      }
    ]
  }
}
```

### GET /api/org/members

Get organization members list.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `role`: Filter by role (admin, manager, viewer)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "member-123",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "admin",
        "createdAt": "2024-01-01T10:00:00.000Z",
        "lastActive": "2024-01-15T14:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

### POST /api/org/members

Add new organization member.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "manager"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "member": {
      "id": "member-456",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "manager",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

## Event Management

### GET /api/events

Get organization events list.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status (active, archived, all)
- `search`: Search by event name

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event-123",
        "name": "Annual Conference",
        "description": "Company annual conference",
        "isActive": true,
        "createdAt": "2024-01-01T10:00:00.000Z",
        "endedAt": null,
        "creator": {
          "id": "user-123",
          "name": "John Doe"
        },
        "stats": {
          "totalAttendees": 150,
          "verifiedCount": 89,
          "attendanceRate": 0.593
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12,
      "pages": 1
    }
  }
}
```

### POST /api/events

Create a new event.

**Request Body:**
```json
{
  "name": "Tech Conference 2024",
  "description": "Annual technology conference",
  "attendees": [
    {
      "name": "Alice Johnson",
      "participantId": "TECH001"
    },
    {
      "name": "Bob Smith",
      "participantId": "TECH002"
    }
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "event-456",
      "name": "Tech Conference 2024",
      "description": "Annual technology conference",
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "attendeeCount": 2
    },
    "tablesCreated": [
      "tech_conference_2024_attendance",
      "tech_conference_2024_verification"
    ]
  }
}
```

### GET /api/events/[id]

Get specific event details.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "event-123",
      "name": "Annual Conference",
      "description": "Company annual conference",
      "isActive": true,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "endedAt": null,
      "creator": {
        "id": "user-123",
        "name": "John Doe"
      }
    },
    "stats": {
      "totalAttendees": 150,
      "verifiedCount": 89,
      "attendanceRate": 0.593,
      "hourlyBreakdown": [
        { "hour": 9, "count": 15 },
        { "hour": 10, "count": 25 },
        { "hour": 11, "count": 30 }
      ]
    }
  }
}
```

### PUT /api/events/[id]

Update event details.

**Request Body:**
```json
{
  "name": "Updated Event Name",
  "description": "Updated description"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "event-123",
      "name": "Updated Event Name",
      "description": "Updated description",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

### POST /api/events/[id]/archive

Archive an event (end it).

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "event-123",
      "isActive": false,
      "endedAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

## Attendance Management

### POST /api/events/[id]/verify

Verify attendee with QR code scan.

**Request Body:**
```json
{
  "participantId": "TECH001"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "verification": {
      "id": "verification-789",
      "participantId": "TECH001",
      "name": "Alice Johnson",
      "status": "verified",
      "verifiedAt": "2024-01-15T14:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- `404`: Participant ID not found
- `409`: Already verified (duplicate scan)
- `403`: Event is archived

### GET /api/events/[id]/verifications

Get event verification records.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `search`: Search by name or participant ID
- `status`: Filter by verification status

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "verifications": [
      {
        "id": "verification-789",
        "participantId": "TECH001",
        "name": "Alice Johnson",
        "status": "verified",
        "verifiedAt": "2024-01-15T14:30:00.000Z"
      }
    ],
    "stats": {
      "totalAttendees": 150,
      "verifiedCount": 89,
      "attendanceRate": 0.593
    },
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 89,
      "pages": 2
    }
  }
}
```

### POST /api/events/[id]/attendees

Add attendees to existing event.

**Request Body:**
```json
{
  "attendees": [
    {
      "name": "Charlie Brown",
      "participantId": "TECH003"
    }
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "added": 1,
    "duplicates": 0,
    "errors": []
  }
}
```

### GET /api/events/[id]/stats

Get detailed event statistics.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalAttendees": 150,
      "verifiedCount": 89,
      "attendanceRate": 0.593,
      "averageCheckInTime": "10:30:00"
    },
    "timeline": [
      {
        "hour": "09:00",
        "count": 15,
        "cumulative": 15
      },
      {
        "hour": "10:00",
        "count": 25,
        "cumulative": 40
      }
    ],
    "topAttendees": [
      {
        "name": "Alice Johnson",
        "participantId": "TECH001",
        "verifiedAt": "2024-01-15T09:15:00.000Z"
      }
    ]
  }
}
```

## Error Codes

### Authentication Errors
- `AUTH_REQUIRED`: Authentication required
- `INVALID_TOKEN`: Invalid or expired JWT token
- `INVALID_CREDENTIALS`: Invalid email or password
- `ACCOUNT_LOCKED`: Account temporarily locked due to failed attempts

### Validation Errors
- `VALIDATION_ERROR`: Request validation failed
- `MISSING_FIELD`: Required field missing
- `INVALID_FORMAT`: Field format invalid
- `DUPLICATE_VALUE`: Value already exists

### Resource Errors
- `NOT_FOUND`: Resource not found
- `ACCESS_DENIED`: Insufficient permissions
- `RESOURCE_CONFLICT`: Resource conflict (e.g., duplicate scan)

### System Errors
- `INTERNAL_ERROR`: Internal server error
- `DATABASE_ERROR`: Database operation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per minute per user
- **QR verification endpoint**: 60 requests per minute per event

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Real-time Features

### Server-Sent Events (SSE)

Subscribe to real-time updates for live attendance tracking:

#### GET /api/events/[id]/stream

Stream real-time verification events for an event.

**Headers:**
```
Authorization: Bearer <jwt-token>
Accept: text/event-stream
Cache-Control: no-cache
```

**Response Stream:**
```
event: verification
data: {"id":"verification-123","participantId":"TECH001","name":"Alice Johnson","verifiedAt":"2024-01-15T14:30:00.000Z"}

event: stats
data: {"totalAttendees":150,"verifiedCount":89,"attendanceRate":0.593}

event: error
data: {"participantId":"INVALID001","error":"Participant not found"}
```

**JavaScript Example:**
```javascript
const eventSource = new EventSource('/api/events/event-123/stream', {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
})

eventSource.addEventListener('verification', (event) => {
  const verification = JSON.parse(event.data)
  console.log(`✅ ${verification.name} checked in`)
  updateAttendanceUI(verification)
})

eventSource.addEventListener('stats', (event) => {
  const stats = JSON.parse(event.data)
  updateStatsDisplay(stats)
})

eventSource.addEventListener('error', (event) => {
  const error = JSON.parse(event.data)
  console.error(`❌ Verification failed: ${error.error}`)
})
```

### WebSocket Integration

For more advanced real-time features, WebSocket connections are available:

#### WS /api/events/[id]/ws

Establish WebSocket connection for bidirectional real-time communication.

**Connection:**
```javascript
const ws = new WebSocket('wss://your-domain.com/api/events/event-123/ws')

// Send authentication
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }))
}

// Handle messages
ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  
  switch (message.type) {
    case 'verification':
      handleNewVerification(message.data)
      break
    case 'stats_update':
      updateStatistics(message.data)
      break
    case 'event_archived':
      handleEventArchived(message.data)
      break
  }
}

// Send verification request
ws.send(JSON.stringify({
  type: 'verify',
  participantId: 'TECH001'
}))
```

### Supabase Real-time Integration

The application uses Supabase real-time subscriptions for database changes:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supabaseUrl, supabaseKey)

// Subscribe to verification table changes
const subscription = supabase
  .channel('verifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'org_your_organization',
    table: 'event_name_verification'
  }, (payload) => {
    console.log('New verification:', payload.new)
    updateAttendanceList(payload.new)
  })
  .subscribe()

// Cleanup
subscription.unsubscribe()
```

## Webhooks

Configure webhooks to receive notifications for important events:

### Webhook Configuration

#### POST /api/webhooks

Configure webhook endpoints for your organization.

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["verification.created", "event.archived"],
  "secret": "your-webhook-secret"
}
```

### Available Events
- `verification.created`: New attendee verification
- `verification.failed`: Failed verification attempt
- `event.created`: New event created
- `event.archived`: Event archived
- `member.added`: New organization member added
- `attendee.imported`: Bulk attendee import completed

### Webhook Payload
```json
{
  "id": "webhook-delivery-123",
  "event": "verification.created",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "data": {
    "verification": {
      "id": "verification-789",
      "participantId": "TECH001",
      "name": "Alice Johnson",
      "eventId": "event-123",
      "eventName": "Tech Conference 2024",
      "verifiedAt": "2024-01-15T14:30:00.000Z",
      "organizationId": "org-123"
    }
  },
  "signature": "sha256=calculated-signature"
}
```

### Webhook Security

Verify webhook authenticity using HMAC signatures:

```javascript
const crypto = require('crypto')

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return `sha256=${expectedSignature}` === signature
}

// Express.js webhook handler
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-scan-ttendance-signature']
  const payload = req.body
  
  if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
    return res.status(401).send('Invalid signature')
  }
  
  const event = JSON.parse(payload)
  handleWebhookEvent(event)
  
  res.status(200).send('OK')
})
```

## Integration Examples

### JavaScript/TypeScript Integration

```typescript
// Example: Complete event management workflow
class EventManager {
  private apiBase = 'https://your-domain.com/api'
  private token: string

  constructor(token: string) {
    this.token = token
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.apiBase}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  // Create event with CSV import
  async createEventWithCSV(name: string, csvData: string) {
    const attendees = this.parseCSV(csvData)
    
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify({
        name,
        attendees
      })
    })
  }

  // Verify attendee and handle results
  async verifyAttendee(eventId: string, participantId: string) {
    try {
      const result = await this.request(`/events/${eventId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ participantId })
      })

      // Handle successful verification
      this.onVerificationSuccess(result.data)
      return result

    } catch (error) {
      // Handle verification errors
      this.onVerificationError(error)
      throw error
    }
  }

  // Get real-time attendance updates
  async subscribeToAttendance(eventId: string, callback: Function) {
    const eventSource = new EventSource(
      `${this.apiBase}/events/${eventId}/stream`
    )

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      callback(data)
    }

    return eventSource
  }

  private parseCSV(csvData: string) {
    const lines = csvData.split('\n')
    const headers = lines[0].split(',')
    
    return lines.slice(1).map(line => {
      const values = line.split(',')
      return {
        name: values[0]?.trim(),
        participantId: values[1]?.trim()
      }
    }).filter(attendee => attendee.name && attendee.participantId)
  }

  private onVerificationSuccess(data: any) {
    console.log(`✅ Verified: ${data.name} at ${data.verifiedAt}`)
    // Update UI, play sound, etc.
  }

  private onVerificationError(error: any) {
    console.error('❌ Verification failed:', error.message)
    // Show error message, log for debugging
  }
}

// Usage example
const eventManager = new EventManager('your-jwt-token')

// Create event
const event = await eventManager.createEventWithCSV(
  'Tech Conference 2024',
  'name,participant_id\nJohn Doe,TECH001\nJane Smith,TECH002'
)

// Subscribe to real-time updates
const eventSource = await eventManager.subscribeToAttendance(
  event.data.event.id,
  (update) => {
    console.log('New verification:', update)
  }
)

// Verify attendee
await eventManager.verifyAttendee(event.data.event.id, 'TECH001')
```

### Python Integration

```python
import requests
import json
from typing import Dict, List, Optional

class ScanTtendanceClient:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        })

    def create_event(self, name: str, description: str = '', 
                    attendees: List[Dict] = None) -> Dict:
        """Create a new event with attendees."""
        payload = {
            'name': name,
            'description': description,
            'attendees': attendees or []
        }
        
        response = self.session.post(
            f'{self.base_url}/api/events',
            json=payload
        )
        response.raise_for_status()
        return response.json()

    def verify_attendee(self, event_id: str, participant_id: str) -> Dict:
        """Verify an attendee's QR code."""
        payload = {'participantId': participant_id}
        
        response = self.session.post(
            f'{self.base_url}/api/events/{event_id}/verify',
            json=payload
        )
        response.raise_for_status()
        return response.json()

    def get_attendance_report(self, event_id: str) -> Dict:
        """Get complete attendance report for an event."""
        response = self.session.get(
            f'{self.base_url}/api/events/{event_id}/verifications'
        )
        response.raise_for_status()
        return response.json()

    def import_attendees_from_csv(self, event_id: str, csv_file_path: str):
        """Import attendees from CSV file."""
        import csv
        
        attendees = []
        with open(csv_file_path, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                attendees.append({
                    'name': row['name'],
                    'participantId': row['participant_id']
                })
        
        response = self.session.post(
            f'{self.base_url}/api/events/{event_id}/attendees',
            json={'attendees': attendees}
        )
        response.raise_for_status()
        return response.json()

# Usage example
client = ScanTtendanceClient('https://your-domain.com', 'your-jwt-token')

# Create event
event = client.create_event(
    name='Python Conference 2024',
    description='Annual Python developers conference',
    attendees=[
        {'name': 'Alice Johnson', 'participantId': 'PY001'},
        {'name': 'Bob Smith', 'participantId': 'PY002'}
    ]
)

# Verify attendee
verification = client.verify_attendee(
    event['data']['event']['id'], 
    'PY001'
)

print(f"Verified: {verification['data']['name']}")
```

### cURL Examples

```bash
# Authentication
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "SecurePassword123!"
  }'

# Create event
curl -X POST https://your-domain.com/api/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Annual Meeting",
    "description": "Company annual meeting",
    "attendees": [
      {"name": "John Doe", "participantId": "EMP001"},
      {"name": "Jane Smith", "participantId": "EMP002"}
    ]
  }'

# Verify attendee
curl -X POST https://your-domain.com/api/events/EVENT_ID/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"participantId": "EMP001"}'

# Get attendance report
curl -X GET https://your-domain.com/api/events/EVENT_ID/verifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Export attendance data
curl -X GET "https://your-domain.com/api/events/EVENT_ID/verifications?format=csv" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o attendance_report.csv
```

## Testing

### Test Environment

A test environment is available for development and testing:

```
Base URL: https://test-api.scan-ttendance.com/api
```

### Test Data

Test organizations and events are available with predictable data for testing integrations.

### Postman Collection

A Postman collection is available for API testing:
[Download Collection](https://api.scan-ttendance.com/postman/collection.json)
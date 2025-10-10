# Admin Routes Organization

This directory contains the organized admin functionality for the SupplementIQ backend API.

## 📁 Directory Structure

```
admin/
├── auth/                    # Authentication and admin validation
│   └── index.ts            # Admin auth routes
├── requests/               # Request management
│   ├── index.ts           # Main request routes
│   ├── voting.ts          # Voting on requests
│   └── owner-approval.ts  # Owner approval/rejection
├── queue/                  # Queue management
│   └── index.ts           # Queue monitoring and control
├── stats/                  # System statistics
│   └── index.ts           # Statistics and monitoring
├── security/               # Security validation
│   └── index.ts           # Security checks and cleanup
├── types.ts               # Shared type definitions
├── utils.ts               # Shared utility functions
├── index.ts               # Main admin router
└── README.md              # This file
```

## 🚀 API Endpoints

### Authentication (`/api/v1/admin/auth`)
- `GET /check/:userId` - Check if user is admin/owner
- `GET /admins` - Get list of all admin users

### Request Management (`/api/v1/admin/requests`)
- `POST /create` - Create new update request
- `GET /pending` - Get all pending requests
- `GET /:requestId` - Get specific request details
- `POST /:requestId/vote` - Vote on pending request
- `GET /:requestId/vote-status/:adminId` - Check vote status
- `POST /:requestId/owner-approve` - Owner approval
- `POST /:requestId/owner-reject` - Owner rejection

### Queue Management (`/api/v1/admin/queue`)
- `GET /status` - Get queue status and contents
- `POST /force-process` - Manually trigger processing
- `POST /clear` - Clear queue (owner only)
- `GET /processor-stats` - Get processor statistics

### Statistics (`/api/v1/admin/stats`)
- `GET /overview` - Complete system statistics
- `GET /requests` - Request statistics
- `GET /autocomplete` - Autocomplete statistics
- `GET /security` - Security statistics

### Security (`/api/v1/admin/security`)
- `GET /stats` - Security system statistics
- `POST /validate-admin` - Validate admin ID
- `GET /can-make-request/:adminId` - Check request permissions
- `GET /admin-stats/:adminId` - Get admin statistics
- `POST /cleanup-expired` - Cleanup expired requests (owner only)

## 🔄 Request Flow

### Standard Workflow (Typical)
1. **Admin Request** → Admin creates update request
2. **Owner Review** → Owner reviews and approves/rejects
3. **Queue Execution** → Approved requests go to queue
4. **Processing** → Queue processor executes updates

### Emergency Workflow (When Owner Unavailable)
1. **Admin Request** → Admin creates update request
2. **Democratic Vote** → 75% of admins must approve
3. **Auto-Approval** → Once threshold reached, auto-approve
4. **Queue Execution** → Approved requests go to queue

## 🛡️ Security Features

- **Request Expiration**: 10-minute timeout for pending requests
- **Daily Limits**: 1 request per admin per day
- **Cooldown Period**: 2-hour wait between updates
- **Update Window Buffer**: 1-hour buffer around scheduled updates
- **Pull-Based Queue**: Anti-attack protection with size limits
- **Database Validation**: Admin roles fetched from database

## 🔧 Configuration

### Environment Variables
- Database connection for admin validation
- Owner ID configuration
- Security policy settings

### Security Policies
- Timezone: PST/PDT
- Daily Reset: 12:00 AM PST/PDT
- Request Expiration: 10 minutes
- Cooldown: 2 hours
- Update Buffer: 1 hour
- Democratic Threshold: 75%

## 📊 Monitoring

All admin routes provide comprehensive monitoring:
- Request statistics and history
- Queue status and processing metrics
- Security validation logs
- System health checks
- Performance metrics

## 🚀 Usage Examples

### Check Admin Status
```bash
GET /api/v1/admin/auth/check/user123
```

### Create Update Request
```bash
POST /api/v1/admin/requests/create
{
  "requesterId": "admin456",
  "requesterName": "John Admin"
}
```

### Vote on Request
```bash
POST /api/v1/admin/requests/req_123/vote
{
  "adminId": "admin789",
  "adminName": "Jane Admin",
  "vote": "approve"
}
```

### Get System Overview
```bash
GET /api/v1/admin/stats/overview
```

## 🔄 Migration from Monolithic

The admin routes have been refactored from a single large file (`admin.ts`) into organized, focused modules:

- **Before**: Single 1000+ line file with all functionality
- **After**: 8 focused files with clear responsibilities
- **Benefits**: Better maintainability, easier testing, clearer code organization

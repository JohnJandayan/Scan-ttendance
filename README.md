# Scan-ttendance

A modern, QR code-based attendance tracking application designed for events and organizations. Built with Next.js, Express.js, and PostgreSQL, Scan-ttendance provides a seamless solution for managing event attendance through QR code scanning technology.

[![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-green?style=flat-square&logo=express)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.54.0-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Vitest-3.2.4-yellow?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-1.49.1-red?style=flat-square&logo=playwright)](https://playwright.dev/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

## ✨ Features

### 🏢 Organization Management

- **Multi-tenant Architecture**: Each organization has its own isolated database schema
- **Member Management**: Role-based access control with admin, manager, and viewer roles
- **Organization Dashboard**: Comprehensive overview of events, statistics, and activities

### 📅 Event Management

- **Event Creation**: Easy event setup with attendee import via CSV or manual entry
- **Event Lifecycle**: Active and archived event states with proper access controls
- **Real-time Statistics**: Live attendance tracking and analytics
- **Event Settings**: Comprehensive event configuration and management tools

### 📱 QR Code Scanning

- **Mobile-Optimized Scanner**: Responsive camera interface for all devices
- **Real-time Verification**: Instant attendee verification with immediate feedback
- **Duplicate Detection**: Prevents multiple check-ins for the same attendee
- **Offline Capability**: Scan caching for unreliable network conditions

### 📊 Attendance Tracking

- **Real-time Updates**: Live attendance statistics and participant lists
- **Export Functionality**: Download attendance records in multiple formats
- **Scan History**: Comprehensive log of all verification attempts
- **Performance Analytics**: Detailed attendance metrics and insights

### 🔒 Security & Performance

- **JWT Authentication**: Secure session management with refresh tokens
- **Input Validation**: Comprehensive data sanitization and validation
- **Rate Limiting**: API protection against abuse and spam
- **Audit Logging**: Complete activity tracking for security and compliance

## 🚀 Technology Stack

### Frontend

- **[Next.js 15.4.6](https://nextjs.org/)** - React framework with App Router
- **[React 19.1.0](https://reactjs.org/)** - UI library with latest features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[React Hook Form](https://react-hook-form.com/)** - Form management and validation

### Backend

- **[Express.js 5.1.0](https://expressjs.com/)** - Serverless API routes
- **[Supabase 2.54.0](https://supabase.com/)** - PostgreSQL database with real-time features
- **[JWT 9.0.2](https://jwt.io/)** - Secure authentication tokens
- **[Zod 4.0.16](https://zod.dev/)** - Runtime type validation
- **[bcryptjs 3.0.2](https://github.com/dcodeIO/bcrypt.js)** - Password hashing
- **[Helmet 8.1.0](https://helmetjs.github.io/)** - Security middleware
- **[CORS 2.8.5](https://github.com/expressjs/cors)** - Cross-origin resource sharing

### QR Code & Camera

- **[@zxing/browser 0.1.5](https://github.com/zxing-js/browser)** - QR code scanning library
- **[@zxing/library 0.21.3](https://github.com/zxing-js/library)** - Core QR code processing
- **MediaDevices API** - Camera access and management
- **Canvas API** - Image processing and manipulation

### Testing & Quality

- **[Vitest 3.2.4](https://vitest.dev/)** - Unit and integration testing
- **[Playwright 1.49.1](https://playwright.dev/)** - End-to-end testing
- **[React Testing Library 16.3.0](https://testing-library.com/react)** - Component testing
- **[ESLint 9](https://eslint.org/)** & **[Prettier 3.6.2](https://prettier.io/)** - Code quality and formatting
- **[Supertest 7.0.0](https://github.com/visionmedia/supertest)** - API testing

### Deployment & DevOps

- **[Vercel](https://vercel.com/)** - Serverless deployment platform
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD pipeline
- **[Docker](https://www.docker.com/)** - Containerization (optional)

## 🏗️ Architecture

### Database Schema Design

```
Public Schema:
├── organizations          # Organization accounts
├── organization_members   # Members within organizations
└── audit_logs            # System-wide activity logging

Organization-Specific Schema (org_[name]):
├── events                     # Organization's events
├── [event_name]_attendance    # Expected attendees
└── [event_name]_verification  # Actual attendance records
```

### API Structure

```
/api/
├── auth/                 # Authentication endpoints
│   ├── register         # Organization registration
│   ├── login           # User authentication
│   ├── logout          # Session termination
│   └── verify          # Token validation
├── org/                 # Organization management
│   ├── dashboard       # Dashboard data
│   ├── members         # Member management
│   └── stats           # Organization statistics
├── events/              # Event management
│   ├── [id]/           # Event-specific operations
│   │   ├── verify      # Attendance verification
│   │   ├── attendees   # Attendee management
│   │   ├── stats       # Event statistics
│   │   └── archive     # Event archiving
│   └── create          # Event creation
└── attendance/          # Attendance operations
    ├── scan            # QR code processing
    └── export          # Data export
```

## 🛠️ Installation & Setup

### Prerequisites

- **Node.js** 18.x or 20.x
- **npm** or **yarn**
- **PostgreSQL** database (or Supabase account)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/scan-ttendance.git
cd scan-ttendance
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database Configuration
DATABASE_URL=your_postgresql_connection_string
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication
JWT_SECRET=your_jwt_secret_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Application
NODE_ENV=development
```

### 4. Database Setup

```bash
# Run database migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📋 Available Scripts

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
```

### Testing

```bash
npm run test              # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:ui           # Open Vitest UI
npm run test:e2e          # Run end-to-end tests
npm run test:e2e:ui       # Open Playwright UI
npm run test:coverage     # Generate coverage report
npm run test:performance  # Run performance benchmarks
npm run test:all          # Run complete test suite
npm run test:unit         # Run unit tests only
npm run test:integration  # Run integration tests only
```

### Database

```bash
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with test data
npm run db:reset     # Reset database
```

## 🧪 Testing

The application includes a comprehensive test suite covering:

- **Unit Tests**: Component and function testing with Vitest
- **Integration Tests**: API endpoint testing with Supertest
- **End-to-End Tests**: Full workflow testing with Playwright
- **Performance Tests**: QR scanning and database operation benchmarks

### Test Coverage

- **Branches**: 80%+
- **Functions**: 80%+
- **Lines**: 80%+
- **Statements**: 80%+

For detailed testing documentation, see [src/test/README.md](src/test/README.md).

## 📖 Documentation

- **[User Guide](docs/user-guide.md)** - Complete guide for end users
- **[API Documentation](docs/api.md)** - Comprehensive API reference
- **[Deployment Guide](docs/deployment.md)** - Production deployment instructions
- **[Contributing Guide](CONTRIBUTING.md)** - Development and contribution guidelines

## 📱 Usage Guide

### For Organization Administrators

1. **Registration**: Create an organization account with your details
2. **Member Management**: Add team members with appropriate roles
3. **Event Creation**: Set up events and import attendee lists
4. **Monitoring**: Track attendance in real-time through the dashboard

### For Event Managers

1. **Event Access**: Access assigned events through the dashboard
2. **QR Scanning**: Use the mobile-optimized scanner to verify attendees
3. **Attendance Tracking**: Monitor check-ins and view statistics
4. **Export Data**: Download attendance records for reporting

### For Attendees

1. **QR Code**: Receive unique QR code for event access
2. **Check-in**: Present QR code to event staff for scanning
3. **Verification**: Receive immediate confirmation of successful check-in

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Configure production environment variables
3. **Deploy**: Automatic deployment on push to main branch

```bash
# Manual deployment
npm run build
vercel --prod
```

### Docker Deployment

```bash
# Build Docker image
docker build -t scan-ttendance .

# Run container
docker run -p 3000:3000 --env-file .env.local scan-ttendance
```

### Environment Variables for Production

```env
# Database
DATABASE_URL=your_production_database_url
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_supabase_key

# Authentication
JWT_SECRET=your_secure_jwt_secret
NEXTAUTH_SECRET=your_secure_nextauth_secret
NEXTAUTH_URL=https://your-domain.com

# Application
NODE_ENV=production
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Write** tests for your changes
4. **Commit** your changes (`git commit -m 'Add amazing feature'`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Testing**: Minimum 80% coverage required
- **Documentation**: Update README and inline docs

## 📄 API Documentation

### Authentication Endpoints

#### POST /api/auth/register

Register a new organization account.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "organizationName": "Acme Corp",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": { "id": "user-123", "name": "John Doe" },
    "organization": { "id": "org-123", "name": "Acme Corp" },
    "token": "jwt-token-here"
  }
}
```

#### POST /api/auth/login

Authenticate user credentials.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

### Event Management Endpoints

#### POST /api/events

Create a new event.

**Headers:**

```
Authorization: Bearer jwt-token-here
```

**Request Body:**

```json
{
  "name": "Annual Conference",
  "description": "Company annual conference",
  "attendees": [
    { "name": "Alice Smith", "id": "ID001" },
    { "name": "Bob Johnson", "id": "ID002" }
  ]
}
```

#### POST /api/events/[id]/verify

Verify attendee with QR code.

**Request Body:**

```json
{
  "participantId": "ID001"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "participantId": "ID001",
    "name": "Alice Smith",
    "status": "verified",
    "verifiedAt": "2024-01-01T10:00:00Z"
  }
}
```

### Organization Management Endpoints

#### GET /api/org/dashboard

Get organization dashboard with statistics and recent activity.

**Response:**

```json
{
  "success": true,
  "data": {
    "organization": { "id": "org-123", "name": "Acme Corp" },
    "stats": {
      "totalEvents": 12,
      "activeEvents": 3,
      "totalVerifications": 1250
    },
    "recentEvents": [...]
  }
}
```

#### POST /api/org/members

Add new organization member with role-based access.

**Request:**

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "manager"
}
```

### Event Management Endpoints

#### POST /api/events

Create new event with attendee list.

**Request:**

```json
{
  "name": "Tech Conference 2024",
  "description": "Annual technology conference",
  "attendees": [{ "name": "Alice Johnson", "participantId": "TECH001" }]
}
```

#### POST /api/events/[id]/verify

Verify attendee with QR code scan.

**Request:**

```json
{
  "participantId": "TECH001"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "participantId": "TECH001",
    "name": "Alice Johnson",
    "status": "verified",
    "verifiedAt": "2024-01-15T14:30:00.000Z"
  }
}
```

For complete API documentation with all endpoints, authentication, error codes, and examples, see [docs/api.md](docs/api.md).

## 🔧 Configuration

### Database Configuration

The application uses PostgreSQL with a multi-tenant architecture. Each organization gets its own schema for data isolation.

```typescript
// Database connection configuration
const config = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production',
}
```

### Authentication Configuration

JWT-based authentication with configurable expiration and refresh tokens.

```typescript
// JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: '24h',
  refreshExpiresIn: '7d',
  algorithm: 'HS256',
}
```

### QR Code Configuration

Customizable QR code scanning parameters for optimal performance.

```typescript
// QR Scanner configuration
const scannerConfig = {
  constraints: {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'environment',
    },
  },
  decodeHints: new Map([
    [DecodeHintType.TRY_HARDER, true],
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]],
  ]),
}
```

## 📊 Performance

### Benchmarks

- **QR Code Scanning**: < 100ms decode time
- **Database Queries**: < 50ms for attendance verification
- **API Response**: < 200ms average response time
- **Page Load**: < 2s initial load, < 500ms subsequent navigation

### Optimization Features

- **Code Splitting**: Route-based dynamic imports
- **Image Optimization**: Next.js automatic image optimization
- **Caching**: Browser and CDN caching strategies
- **Database Indexing**: Optimized queries for attendance lookups
- **Real-time Updates**: WebSocket connections for live data

## 🛡️ Security

### Security Features

- **Authentication**: JWT tokens with secure session management
- **Authorization**: Role-based access control (RBAC)
- **Data Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers
- **Rate Limiting**: API endpoint protection
- **Audit Logging**: Complete activity tracking

### Security Best Practices

- Regular dependency updates
- Environment variable protection
- HTTPS enforcement in production
- Database connection encryption
- Secure password hashing with bcrypt
- CORS configuration for API security

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check PostgreSQL service
sudo service postgresql status

# Verify connection string
psql $DATABASE_URL
```

#### Camera Access Issues

```javascript
// Check browser permissions
navigator.permissions
  .query({ name: 'camera' })
  .then(result => console.log(result.state))
```

#### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode

Enable debug logging for troubleshooting:

```env
DEBUG=scan-ttendance:*
LOG_LEVEL=debug
```

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/scan-ttendance/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/scan-ttendance/discussions)
- **Email**: support@scan-ttendance.com

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 About the Developer

**Scan-ttendance** was developed as a comprehensive portfolio project showcasing modern full-stack web development practices and cutting-edge technologies. This application demonstrates advanced expertise in:

### Technical Expertise Demonstrated

#### Frontend Development

- **Modern React Architecture**: Utilizing React 19.1.0 with latest features and patterns
- **Next.js App Router**: Leveraging Next.js 15.4.6 for optimal performance and SEO
- **TypeScript Mastery**: Strict type safety throughout the entire application
- **Responsive Design**: Mobile-first approach with Tailwind CSS 4.0
- **Real-time UI**: WebSocket integration for live updates and notifications

#### Backend Development

- **Serverless Architecture**: Express.js 5.1.0 API routes optimized for Vercel deployment
- **Database Design**: Multi-tenant PostgreSQL architecture with dynamic schema creation
- **Authentication & Security**: JWT-based auth with bcrypt hashing and comprehensive security middleware
- **API Design**: RESTful APIs with proper error handling and validation using Zod

#### DevOps & Testing

- **Comprehensive Testing**: Unit, integration, and E2E testing with Vitest and Playwright
- **CI/CD Pipeline**: Automated testing and deployment workflows
- **Performance Optimization**: Code splitting, caching strategies, and database indexing
- **Production Deployment**: Vercel deployment with environment management

#### Advanced Features

- **QR Code Technology**: Camera API integration with @zxing libraries for real-time scanning
- **Real-time Capabilities**: Supabase real-time subscriptions for live attendance tracking
- **Data Export**: Multiple format support (CSV, Excel, PDF) for attendance reports
- **Mobile Optimization**: PWA features with offline capability and responsive camera interface

### Project Highlights

- **Multi-tenant SaaS Architecture**: Each organization gets isolated database schemas
- **Real-time Attendance Tracking**: Live updates as attendees check in
- **Comprehensive Security**: Rate limiting, input validation, audit logging, and RBAC
- **Production-Ready**: Full deployment configuration with monitoring and error handling
- **Scalable Design**: Optimized for high-concurrency QR code scanning scenarios

### Development Methodology

- **Test-Driven Development**: 80%+ code coverage with comprehensive test suites
- **Clean Architecture**: Separation of concerns with repository patterns and service layers
- **Documentation-First**: Complete API documentation and user guides
- **Security-First**: OWASP best practices and security-focused development

### Portfolio Context

This project represents a complete end-to-end solution that would be suitable for:

- **Enterprise Event Management**: Large-scale conferences and corporate events
- **Educational Institutions**: Student attendance tracking and campus events
- **Healthcare Organizations**: Patient check-in and appointment management
- **Government Agencies**: Secure access control and visitor management

### Technical Innovation

- **Dynamic Database Schema Creation**: Automated multi-tenant database provisioning
- **Real-time QR Code Processing**: Sub-100ms verification with duplicate detection
- **Offline-First Mobile Experience**: Service worker implementation for unreliable networks
- **Performance Monitoring**: Built-in analytics and performance tracking

### Connect & Collaborate

Interested in discussing this project or exploring collaboration opportunities?

- **GitHub**: [@yourusername](https://github.com/yourusername) - View source code and other projects
- **LinkedIn**: [Your LinkedIn Profile](https://linkedin.com/in/yourprofile) - Professional background and experience
- **Portfolio**: [your-portfolio-website.com](https://your-portfolio-website.com) - Complete project showcase
- **Email**: [your.email@example.com](mailto:your.email@example.com) - Direct contact for opportunities

### Open Source Contribution

This project demonstrates commitment to:

- **Code Quality**: ESLint, Prettier, and strict TypeScript configuration
- **Community Standards**: Comprehensive README, contributing guidelines, and documentation
- **Best Practices**: Security, performance, and accessibility considerations
- **Knowledge Sharing**: Detailed documentation for learning and contribution

---

## 🙏 Acknowledgments

- **Next.js Team** for the excellent React framework
- **Supabase** for the powerful PostgreSQL platform
- **Vercel** for seamless deployment experience
- **ZXing** for the robust QR code scanning library
- **Open Source Community** for the amazing tools and libraries

---

<div align="center">
  <p>Built with ❤️ using modern web technologies</p>
  <p>© 2024 Scan-ttendance. All rights reserved.</p>
</div>

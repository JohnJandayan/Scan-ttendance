# Supabase Setup Guide for Scan-ttendance

This guide walks you through setting up Supabase for the Scan-ttendance application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Creating a Supabase Project](#creating-a-supabase-project)
- [Database Setup](#database-setup)
- [Authentication Configuration](#authentication-configuration)
- [Environment Variables](#environment-variables)
- [Testing the Connection](#testing-the-connection)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Basic understanding of PostgreSQL
- Node.js 18+ installed locally

## Creating a Supabase Project

### 1. Create New Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `scan-ttendance-dev` (for development) or `scan-ttendance-prod` (for production)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the region closest to your users
5. Click "Create new project"

### 2. Wait for Project Setup

The project creation takes 2-3 minutes. Once complete, you'll see the project dashboard.

## Database Setup

### 1. Initialize Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `src/lib/supabase-functions.sql`
3. Paste and execute the SQL to create required functions and tables

### 2. Verify Database Setup

Run this query to verify the setup:

```sql
-- Check if required functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'create_organization_schema',
  'create_event_tables',
  'get_organization_stats',
  'get_event_stats',
  'verify_attendance'
);

-- Check if organizations table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'organizations';
```

### 3. Set Up Row Level Security (RLS)

The SQL script automatically enables RLS, but you may need to customize policies based on your requirements.

## Authentication Configuration

### 1. Configure Authentication Settings

1. Go to Authentication → Settings in your Supabase dashboard
2. Configure the following:

#### Site URL
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

#### Redirect URLs
Add these URLs to allow authentication redirects:
- **Development**: `http://localhost:3000/auth/callback`
- **Production**: `https://your-domain.com/auth/callback`

#### Email Templates (Optional)
Customize email templates for:
- Confirmation emails
- Password reset emails
- Magic link emails

### 2. Configure Providers (Optional)

If you want to add social authentication:
1. Go to Authentication → Providers
2. Enable desired providers (Google, GitHub, etc.)
3. Configure OAuth credentials

## Environment Variables

### 1. Get Your Project Credentials

From your Supabase project dashboard:

1. Go to Settings → API
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon (public) key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. Update Environment Files

#### Development (.env.local)
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database URL (optional, for direct connections)
DATABASE_URL=postgresql://postgres:your_password@db.your-project-id.supabase.co:5432/postgres
```

#### Production (Vercel Environment Variables)
Set these in your Vercel dashboard under Project Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (optional)

### 3. Security Best Practices

- **Never commit** `.env.local` to version control
- Use **different projects** for development and production
- **Rotate keys** regularly in production
- **Restrict service role key** usage to server-side only

## Testing the Connection

### 1. Validate Configuration

```bash
npm run env:validate
```

### 2. Test Supabase Connection

```bash
npm run verify:supabase
```

### 3. Test Health Endpoint

```bash
# Start your development server
npm run dev

# In another terminal, test the health endpoint
curl http://localhost:3000/api/health
```

## Production Deployment

### 1. Create Production Project

1. Create a separate Supabase project for production
2. Use a different name (e.g., `scan-ttendance-prod`)
3. Choose appropriate region and pricing tier

### 2. Configure Production Environment

1. Set up authentication with your production domain
2. Configure custom SMTP for email delivery (optional)
3. Set up database backups
4. Configure monitoring and alerts

### 3. Deploy Database Schema

1. Export schema from development:
   ```bash
   supabase db dump --db-url "postgresql://postgres:password@db.dev-project.supabase.co:5432/postgres" > schema.sql
   ```

2. Import to production:
   ```bash
   supabase db reset --db-url "postgresql://postgres:password@db.prod-project.supabase.co:5432/postgres"
   ```

### 4. Set Production Environment Variables

In Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Set all required variables for Production environment
3. Deploy your application

## Performance Optimization

### 1. Database Indexes

The setup script creates essential indexes, but you may need additional ones:

```sql
-- Add custom indexes based on your query patterns
CREATE INDEX IF NOT EXISTS idx_custom_query ON schema_name.table_name(column_name);
```

### 2. Connection Pooling

For high-traffic applications, consider:
- Supabase connection pooling (enabled by default)
- Custom connection pool configuration
- Read replicas for read-heavy workloads

### 3. Query Optimization

- Use `EXPLAIN ANALYZE` to identify slow queries
- Implement proper pagination
- Use real-time subscriptions judiciously
- Cache frequently accessed data

## Monitoring and Maintenance

### 1. Database Monitoring

Monitor these metrics in Supabase dashboard:
- Database size and growth
- Connection count
- Query performance
- Error rates

### 2. Regular Maintenance

Set up automated tasks for:
- Cleaning old audit logs
- Backing up critical data
- Monitoring security events
- Updating database statistics

### 3. Alerts

Configure alerts for:
- High connection count
- Slow query performance
- Database size limits
- Authentication failures

## Troubleshooting

### Common Issues

#### Connection Errors

**Problem**: `TypeError: fetch failed` or connection timeout

**Solutions**:
1. Verify project URL and keys are correct
2. Check if project is paused (free tier limitation)
3. Verify network connectivity
4. Check Supabase status page

#### Authentication Issues

**Problem**: Users can't sign up or sign in

**Solutions**:
1. Verify Site URL and Redirect URLs are correct
2. Check email confirmation settings
3. Verify RLS policies allow user operations
4. Check browser console for errors

#### Database Permission Errors

**Problem**: `permission denied` or `relation does not exist`

**Solutions**:
1. Verify database functions are created
2. Check RLS policies
3. Ensure service role key has proper permissions
4. Verify schema and table names are correct

#### Performance Issues

**Problem**: Slow queries or timeouts

**Solutions**:
1. Add appropriate database indexes
2. Optimize query patterns
3. Implement connection pooling
4. Consider upgrading Supabase plan

### Getting Help

1. Check [Supabase Documentation](https://supabase.com/docs)
2. Visit [Supabase Community](https://github.com/supabase/supabase/discussions)
3. Check application logs for specific error messages
4. Use Supabase dashboard monitoring tools

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Appropriate RLS policies created
- [ ] Service role key secured (server-side only)
- [ ] Authentication configured correctly
- [ ] Database backups enabled
- [ ] Monitoring and alerts set up
- [ ] Regular security audits scheduled
- [ ] Keys rotated regularly
- [ ] HTTPS enforced in production
- [ ] CORS configured properly

## Next Steps

After completing the Supabase setup:

1. Test the complete application flow
2. Set up monitoring and alerts
3. Configure automated backups
4. Plan for scaling and performance optimization
5. Set up staging environment for testing
6. Document your specific configuration choices

This setup provides a solid foundation for the Scan-ttendance application with proper security, performance, and maintainability considerations.
# User Guide

Welcome to Scan-ttendance! This comprehensive guide will help you get started with the QR code-based attendance tracking system.

## Table of Contents

- [Getting Started](#getting-started)
- [Organization Setup](#organization-setup)
- [Member Management](#member-management)
- [Event Management](#event-management)
- [QR Code Scanning](#qr-code-scanning)
- [Attendance Tracking](#attendance-tracking)
- [Reports and Analytics](#reports-and-analytics)
- [Mobile Usage](#mobile-usage)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Getting Started

### Creating Your Account

1. **Visit the Application**: Navigate to the Scan-ttendance homepage
2. **Click Sign Up**: Select "Get Started" or "Sign Up" from the landing page
3. **Fill Registration Form**:
   - **Your Name**: Enter your full name
   - **Email Address**: Use a valid email address (this will be your login)
   - **Organization Name**: Enter your company, school, or organization name
   - **Password**: Create a strong password (minimum 8 characters with uppercase, lowercase, number, and special character)
4. **Submit**: Click "Create Account" to complete registration
5. **Verification**: You'll be automatically logged in and redirected to your organization dashboard

### First Login

1. **Visit Login Page**: Click "Sign In" from the homepage
2. **Enter Credentials**: Use your email and password
3. **Access Dashboard**: You'll be taken to your organization's main dashboard

## Organization Setup

### Understanding Your Dashboard

Your organization dashboard is the central hub where you can:

- **View Active Events**: See all currently running events
- **Access Archived Events**: Review past events and their data
- **Manage Members**: Add and manage team members
- **View Statistics**: Monitor overall organization activity

### Organization Settings

- **Organization Name**: This creates your unique database schema
- **Member Roles**: Three levels of access (Admin, Manager, Viewer)
- **Data Isolation**: Each organization has completely separate data

## Member Management

### Adding Team Members

1. **Navigate to Members**: Click "Manage Members" from the dashboard
2. **Add New Member**: Click the "Add Member" button
3. **Enter Details**:
   - **Name**: Full name of the team member
   - **Email**: Their email address for login
   - **Role**: Select appropriate access level
4. **Send Invitation**: The system will create their account

### Member Roles Explained

#### Admin
- Full access to all features
- Can create and manage events
- Can add/remove members
- Can archive events
- Access to all reports and analytics

#### Manager
- Can create and manage events
- Can scan QR codes and verify attendance
- Can view attendance reports
- Cannot manage organization members

#### Viewer
- Can view event information
- Can access attendance reports
- Cannot create events or manage members
- Read-only access to most features

### Managing Existing Members

- **Edit Member**: Update name, email, or role
- **Remove Member**: Permanently remove access (use with caution)
- **View Activity**: See member's recent actions and login history

## Event Management

### Creating a New Event

1. **Start Event Creation**: Click "Create New Event" from dashboard
2. **Event Details**:
   - **Event Name**: Choose a descriptive name (e.g., "Annual Conference 2024")
   - **Description**: Optional details about the event
3. **Add Attendees**: You have two options:

#### Manual Entry
- Click "Add Attendee"
- Enter **Name** and **Participant ID**
- Participant ID should be unique (e.g., employee ID, student number)
- Repeat for each attendee

#### CSV Import
- Prepare a CSV file with columns: `name`, `participant_id`
- Click "Import CSV"
- Select your file
- Review the preview and fix any errors
- Confirm import

4. **Create Event**: Click "Create Event" to finalize

### Event Dashboard

Once created, each event has its own dashboard with:

- **Event Information**: Name, creation date, creator
- **Statistics**: Total attendees, verified count, attendance rate
- **Quick Actions**: Scan QR codes, view check-ins, access settings
- **Real-time Updates**: Live statistics as people check in

### Event Settings

Access event settings to:

- **Edit Event Details**: Update name or description
- **Add More Attendees**: Import additional participants
- **Archive Event**: End the event and prevent further scanning
- **Export Data**: Download attendance records

## QR Code Scanning

### Using the QR Scanner

1. **Access Scanner**: Click "Scan QR Code" from event dashboard
2. **Camera Permission**: Allow camera access when prompted
3. **Position QR Code**: Hold the QR code steady in the camera view
4. **Automatic Scanning**: The system will automatically detect and process the code
5. **View Result**: See immediate feedback on verification status

### Scanner Features

- **Auto-focus**: Camera automatically focuses on QR codes
- **Multiple Formats**: Supports various QR code formats
- **Duplicate Detection**: Prevents multiple check-ins for same person
- **Offline Capability**: Scans are cached if network is unavailable
- **Mobile Optimized**: Works seamlessly on smartphones and tablets

### Verification Results

#### Successful Verification
- **Green Checkmark**: Attendee successfully verified
- **Name Display**: Shows attendee's name
- **Timestamp**: Records exact check-in time
- **Sound/Vibration**: Confirmation feedback (mobile devices)

#### Failed Verification
- **Red X**: Verification failed
- **Error Message**: Explains why verification failed
- **Possible Reasons**:
  - Participant ID not found in attendee list
  - Already checked in (duplicate scan)
  - Event has been archived
  - Invalid QR code format

### Best Practices for Scanning

- **Good Lighting**: Ensure adequate lighting for camera
- **Steady Hands**: Hold device steady for better recognition
- **Clean Camera**: Keep camera lens clean
- **Proper Distance**: Hold QR code 6-12 inches from camera
- **Flat Surface**: QR codes should be flat, not wrinkled

## Attendance Tracking

### Real-time Monitoring

The attendance system provides live updates:

- **Live Counter**: See check-ins happen in real-time
- **Recent Activity**: View the latest verifications
- **Attendance Rate**: Percentage of expected attendees who have checked in
- **Time-based Analytics**: See check-in patterns throughout the event

### Viewing Attendance Records

1. **Access Records**: Click "View Check-ins" from event dashboard
2. **Attendance List**: See all verified attendees with:
   - Name and Participant ID
   - Check-in timestamp
   - Verification status
3. **Search and Filter**: Find specific attendees quickly
4. **Sort Options**: Order by name, time, or status

### Attendance Statistics

#### Overview Metrics
- **Total Expected**: Number of people in attendee list
- **Total Verified**: Number of successful check-ins
- **Attendance Rate**: Percentage of expected attendees present
- **Average Check-in Time**: When most people arrived

#### Time-based Analysis
- **Hourly Breakdown**: See check-in patterns by hour
- **Peak Times**: Identify busiest check-in periods
- **Late Arrivals**: Track attendees who arrived after event start

## Reports and Analytics

### Exporting Data

1. **Access Export**: Click "Export Data" from event dashboard
2. **Choose Format**: Select CSV, Excel, or PDF
3. **Select Data**: Choose what information to include:
   - Basic attendance (name, ID, timestamp)
   - Detailed verification logs
   - Statistical summary
4. **Download**: File will be generated and downloaded

### Report Types

#### Attendance Summary
- List of all attendees with check-in status
- Timestamp for each verification
- No-show list (expected but not verified)

#### Statistical Report
- Overall attendance metrics
- Time-based analysis
- Comparison with previous events (if available)

#### Audit Log
- Complete log of all scanning activities
- Failed verification attempts
- System events and changes

### Using Reports

- **Event Planning**: Use attendance patterns for future events
- **Capacity Planning**: Understand actual vs. expected attendance
- **Security Audit**: Review all access attempts
- **Performance Analysis**: Identify peak times and bottlenecks

## Mobile Usage

### Mobile-Optimized Interface

Scan-ttendance is designed for mobile devices:

- **Responsive Design**: Adapts to all screen sizes
- **Touch-Friendly**: Large buttons and easy navigation
- **Fast Loading**: Optimized for mobile networks
- **Offline Support**: Core functions work without internet

### Mobile Scanning Tips

1. **Use Rear Camera**: Back camera typically has better quality
2. **Landscape Mode**: May provide better scanning area
3. **Stable Connection**: Ensure good network signal for real-time updates
4. **Battery Management**: Keep device charged during events
5. **Screen Brightness**: Increase brightness for better camera performance

### Mobile Browser Compatibility

Tested and optimized for:
- **iOS Safari**: iPhone and iPad
- **Android Chrome**: All Android devices
- **Samsung Internet**: Samsung Galaxy devices
- **Firefox Mobile**: Cross-platform support

## Troubleshooting

### Common Issues and Solutions

#### Cannot Access Camera
**Problem**: QR scanner won't access camera
**Solutions**:
- Check browser permissions for camera access
- Ensure you're using HTTPS (required for camera access)
- Try refreshing the page
- Clear browser cache and cookies
- Try a different browser

#### QR Code Not Scanning
**Problem**: QR codes aren't being recognized
**Solutions**:
- Ensure QR code is clear and not damaged
- Improve lighting conditions
- Clean camera lens
- Hold QR code steady and flat
- Try different distance from camera

#### Slow Performance
**Problem**: App is running slowly
**Solutions**:
- Check internet connection speed
- Close other browser tabs
- Clear browser cache
- Restart browser
- Try on a different device

#### Login Issues
**Problem**: Cannot log in to account
**Solutions**:
- Verify email and password are correct
- Check for caps lock
- Try password reset if needed
- Clear browser cookies
- Contact administrator if organization account

#### Data Not Updating
**Problem**: Attendance numbers not updating in real-time
**Solutions**:
- Refresh the page
- Check internet connection
- Verify event is still active (not archived)
- Try logging out and back in

### Getting Help

If you continue to experience issues:

1. **Check System Status**: Verify if there are any known outages
2. **Contact Support**: Use the support contact information
3. **Provide Details**: Include:
   - What you were trying to do
   - Error messages received
   - Browser and device information
   - Steps to reproduce the issue

## Best Practices

### Event Planning

1. **Test Before Event**: Create a test event and practice scanning
2. **Prepare Attendee List**: Ensure all participant IDs are unique
3. **Multiple Scanners**: Have several devices ready for large events
4. **Backup Plan**: Keep paper backup of attendee list
5. **Staff Training**: Train all staff on using the scanner

### Data Management

1. **Regular Exports**: Download attendance data regularly
2. **Archive Old Events**: Archive completed events to keep dashboard clean
3. **Member Management**: Regularly review and update member access
4. **Security**: Use strong passwords and log out when finished

### Performance Optimization

1. **Good Internet**: Ensure reliable internet connection at event venue
2. **Device Preparation**: Charge devices and test cameras beforehand
3. **Lighting**: Ensure adequate lighting at scanning stations
4. **Queue Management**: Set up efficient check-in flow to avoid bottlenecks

### Security Considerations

1. **Access Control**: Only give necessary permissions to team members
2. **Regular Reviews**: Periodically review member access and remove unused accounts
3. **Data Privacy**: Follow your organization's data privacy policies
4. **Secure Devices**: Use secure devices for scanning and management

This user guide covers the essential features and workflows of Scan-ttendance. For technical documentation, API details, or deployment information, please refer to the other documentation files in the `docs/` directory.
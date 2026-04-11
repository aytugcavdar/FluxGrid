# Post-Release Monitoring Guide

## Overview

This guide covers monitoring and alerting setup for post-release tracking of FluxGrid app health, performance, and user feedback.

## Monitoring Dashboards

### Firebase Console

#### Crashlytics Dashboard
**URL**: https://console.firebase.google.com/project/[PROJECT_ID]/crashlytics

**Key Metrics**:
- Crash-free users percentage (target: > 99%)
- Crash rate (target: < 1%)
- ANR rate (target: < 0.5%)
- Top crashes by occurrence
- Affected users count

**Alert Thresholds**:
- Critical: Crash rate > 2%
- Warning: Crash rate > 1%
- Critical: ANR rate > 1%
- Warning: ANR rate > 0.5%

#### Analytics Dashboard
**URL**: https://console.firebase.google.com/project/[PROJECT_ID]/analytics

**Key Metrics**:
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Session duration
- Retention rate (Day 1, Day 7, Day 30)
- User engagement
- Conversion rate

**Custom Events to Monitor**:
- game_start
- game_end
- level_complete
- ability_used
- ad_impression
- ad_click
- achievement_unlocked

#### Performance Monitoring
**URL**: https://console.firebase.google.com/project/[PROJECT_ID]/performance

**Key Metrics**:
- App start time (target: < 3 seconds)
- Screen rendering time
- Network request duration
- Custom traces (game_load, level_load)

**Alert Thresholds**:
- Critical: App start > 5 seconds
- Warning: App start > 3 seconds

### Play Console

#### Release Dashboard
**URL**: https://play.google.com/console/[DEVELOPER_ID]/app/[APP_ID]/releases

**Key Metrics**:
- Rollout percentage
- Install count
- Uninstall count
- Update adoption rate
- Pre-launch report results

#### Vitals Dashboard
**URL**: https://play.google.com/console/[DEVELOPER_ID]/app/[APP_ID]/vitals

**Key Metrics**:
- Crash rate (target: < 1%)
- ANR rate (target: < 0.5%)
- Excessive wakeups
- Stuck wake locks
- Battery usage

**Alert Thresholds**:
- Critical: Crash rate > 2%
- Warning: Crash rate > 1%
- Critical: ANR rate > 1%
- Warning: ANR rate > 0.5%

#### User Feedback
**URL**: https://play.google.com/console/[DEVELOPER_ID]/app/[APP_ID]/user-feedback

**Key Metrics**:
- Average rating (target: > 4.0)
- Rating distribution
- Review count
- Common themes in reviews

**Alert Thresholds**:
- Critical: Average rating < 3.5
- Warning: Average rating < 4.0
- Critical: Spike in 1-star reviews

### AdMob Console

#### Revenue Dashboard
**URL**: https://apps.admob.com/[PUBLISHER_ID]/reporting

**Key Metrics**:
- Estimated earnings
- Impressions
- Click-through rate (CTR)
- eCPM (effective cost per mille)
- Fill rate

**Alert Thresholds**:
- Warning: Revenue drop > 20%
- Warning: Fill rate < 80%
- Warning: CTR drop > 30%

## Alert Configuration

### Firebase Alerts

#### Crashlytics Alerts

```javascript
// Configure in Firebase Console > Crashlytics > Alerts

// Critical crash rate alert
{
  name: "Critical Crash Rate",
  condition: "crash_rate > 2%",
  notification: "email + slack",
  recipients: ["team@fluxgrid.com"]
}

// ANR rate alert
{
  name: "High ANR Rate",
  condition: "anr_rate > 1%",
  notification: "email + slack",
  recipients: ["team@fluxgrid.com"]
}

// New crash type alert
{
  name: "New Crash Type",
  condition: "new_crash_detected",
  notification: "email",
  recipients: ["team@fluxgrid.com"]
}
```

#### Performance Alerts

```javascript
// Configure in Firebase Console > Performance > Alerts

// Slow app start alert
{
  name: "Slow App Start",
  condition: "app_start_time > 5s",
  notification: "email",
  recipients: ["team@fluxgrid.com"]
}

// High network latency alert
{
  name: "High Network Latency",
  condition: "network_request_duration > 10s",
  notification: "email",
  recipients: ["team@fluxgrid.com"]
}
```

#### Analytics Alerts

```javascript
// Configure in Firebase Console > Analytics > Custom Alerts

// User retention drop alert
{
  name: "Low User Retention",
  condition: "day1_retention < 30%",
  notification: "email",
  recipients: ["team@fluxgrid.com"]
}

// Conversion rate drop alert
{
  name: "Low Conversion Rate",
  condition: "conversion_rate < 5%",
  notification: "email",
  recipients: ["team@fluxgrid.com"]
}
```

### Play Console Alerts

#### Email Notifications

Configure in Play Console > Settings > Email preferences:

- [ ] New reviews
- [ ] Rating changes
- [ ] Crash reports
- [ ] ANR reports
- [ ] Pre-launch report issues
- [ ] Policy violations

### Custom Monitoring Script

```javascript
// scripts/monitor-release.js

const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

// Monitoring thresholds
const THRESHOLDS = {
  crashRate: 0.01,      // 1%
  anrRate: 0.005,       // 0.5%
  avgRating: 4.0,
  retention: 0.30       // 30%
};

// Check metrics
async function checkMetrics() {
  const analytics = admin.analytics();
  const crashlytics = admin.crashlytics();
  
  // Get crash rate
  const crashRate = await crashlytics.getCrashRate();
  if (crashRate > THRESHOLDS.crashRate) {
    sendAlert('Critical: Crash rate exceeded', crashRate);
  }
  
  // Get ANR rate
  const anrRate = await crashlytics.getANRRate();
  if (anrRate > THRESHOLDS.anrRate) {
    sendAlert('Critical: ANR rate exceeded', anrRate);
  }
  
  // Get retention
  const retention = await analytics.getRetention('day1');
  if (retention < THRESHOLDS.retention) {
    sendAlert('Warning: Low user retention', retention);
  }
}

// Send alert
function sendAlert(subject, data) {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  const mailOptions = {
    from: 'alerts@fluxgrid.com',
    to: 'team@fluxgrid.com',
    subject: `[FluxGrid Alert] ${subject}`,
    text: `Alert triggered: ${JSON.stringify(data, null, 2)}`
  };
  
  transporter.sendMail(mailOptions);
}

// Run monitoring every hour
setInterval(checkMetrics, 60 * 60 * 1000);
```

## Monitoring Schedule

### First 24 Hours (Critical Period)

**Check Every Hour**:
- [ ] Crash rate
- [ ] ANR rate
- [ ] User reviews
- [ ] Install/uninstall ratio

**Actions**:
- Pause rollout if crash rate > 2%
- Prepare hotfix if critical bugs found
- Respond to negative reviews

### First Week (High Priority)

**Check Every 4 Hours**:
- [ ] Crash reports
- [ ] Performance metrics
- [ ] User feedback
- [ ] Version adoption

**Actions**:
- Investigate crash patterns
- Optimize performance bottlenecks
- Plan updates based on feedback

### First Month (Normal Priority)

**Check Daily**:
- [ ] Analytics trends
- [ ] Revenue metrics
- [ ] User retention
- [ ] Feature usage

**Actions**:
- Analyze user behavior
- Plan feature improvements
- Optimize monetization

## Key Performance Indicators (KPIs)

### Health KPIs

| Metric | Target | Critical |
|--------|--------|----------|
| Crash-free users | > 99% | < 98% |
| ANR rate | < 0.5% | > 1% |
| App start time | < 3s | > 5s |
| Memory usage | < 200MB | > 300MB |

### Engagement KPIs

| Metric | Target | Warning |
|--------|--------|---------|
| DAU | Growing | Declining |
| Session duration | > 5 min | < 3 min |
| Day 1 retention | > 30% | < 20% |
| Day 7 retention | > 15% | < 10% |

### Monetization KPIs

| Metric | Target | Warning |
|--------|--------|---------|
| Ad fill rate | > 90% | < 80% |
| eCPM | > $1.00 | < $0.50 |
| Revenue per user | > $0.10 | < $0.05 |

### Quality KPIs

| Metric | Target | Warning |
|--------|--------|---------|
| Average rating | > 4.0 | < 3.5 |
| 5-star reviews | > 60% | < 40% |
| 1-star reviews | < 10% | > 20% |

## Incident Response

### Severity Levels

#### P0 - Critical (Immediate Response)
- App crashes on launch for > 10% of users
- Data loss or corruption
- Security vulnerability
- Payment system failure

**Response Time**: < 1 hour
**Action**: Immediate rollback or hotfix

#### P1 - High (Urgent Response)
- Crash rate > 2%
- ANR rate > 1%
- Major feature broken
- Revenue drop > 50%

**Response Time**: < 4 hours
**Action**: Hotfix within 24 hours

#### P2 - Medium (Normal Response)
- Crash rate > 1%
- Minor feature broken
- Performance degradation
- Revenue drop > 20%

**Response Time**: < 24 hours
**Action**: Fix in next release

#### P3 - Low (Scheduled Response)
- UI glitches
- Minor bugs
- Feature requests
- Cosmetic issues

**Response Time**: < 1 week
**Action**: Fix in planned release

### Incident Response Workflow

```
Incident Detected
  ↓
Assess Severity (P0/P1/P2/P3)
  ↓
Notify Team
  ↓
Investigate Root Cause
  ↓
Decide: Rollback or Hotfix?
  ↓
Implement Fix
  ↓
Test Thoroughly
  ↓
Deploy Fix
  ↓
Monitor Results
  ↓
Post-Mortem
```

## Reporting

### Daily Report (First Week)

**Recipients**: Team
**Format**: Email/Slack

**Contents**:
- Crash rate
- ANR rate
- Install count
- Uninstall count
- Average rating
- Top crashes
- Action items

### Weekly Report (First Month)

**Recipients**: Team + Stakeholders
**Format**: Dashboard + Email

**Contents**:
- KPI summary
- User growth
- Retention metrics
- Revenue metrics
- Feature usage
- User feedback themes
- Recommendations

### Monthly Report (Ongoing)

**Recipients**: All stakeholders
**Format**: Presentation + Dashboard

**Contents**:
- Executive summary
- KPI trends
- User insights
- Revenue analysis
- Competitive analysis
- Roadmap updates

## Tools and Integrations

### Recommended Tools

1. **Firebase Console** (Required)
   - Crashlytics
   - Analytics
   - Performance Monitoring

2. **Play Console** (Required)
   - Vitals
   - User Feedback
   - Pre-launch Reports

3. **Slack** (Recommended)
   - Real-time alerts
   - Team communication

4. **Grafana** (Optional)
   - Custom dashboards
   - Advanced visualization

5. **PagerDuty** (Optional)
   - On-call rotation
   - Incident management

### Integration Setup

#### Slack Integration

```javascript
// Send alert to Slack
const axios = require('axios');

async function sendSlackAlert(message) {
  await axios.post(process.env.SLACK_WEBHOOK_URL, {
    text: message,
    channel: '#fluxgrid-alerts',
    username: 'FluxGrid Monitor',
    icon_emoji: ':warning:'
  });
}
```

#### Email Integration

```javascript
// Send email alert
const nodemailer = require('nodemailer');

async function sendEmailAlert(subject, body) {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  await transporter.sendMail({
    from: 'alerts@fluxgrid.com',
    to: 'team@fluxgrid.com',
    subject: `[FluxGrid] ${subject}`,
    html: body
  });
}
```

## Best Practices

### 1. Set Realistic Thresholds
- Start conservative, adjust based on data
- Consider seasonal variations
- Account for rollout percentage

### 2. Prioritize Alerts
- Too many alerts = alert fatigue
- Focus on actionable metrics
- Use severity levels

### 3. Automate Responses
- Auto-pause rollout on critical issues
- Auto-create tickets for known issues
- Auto-notify on-call engineer

### 4. Document Everything
- Keep incident logs
- Document resolutions
- Share learnings

### 5. Regular Reviews
- Weekly metric reviews
- Monthly KPI reviews
- Quarterly process reviews

## Requirements Satisfied

- **Task 19.4**: Post-release monitoring ✓
- **Requirement 15.10**: Monitoring setup ✓

## Related Documents

- RELEASE_CHECKLIST.md
- RELEASE_NOTES_TEMPLATE.md
- STAGED_ROLLOUT_PLAN.md

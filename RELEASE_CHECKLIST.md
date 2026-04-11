# Release Checklist

## Pre-Release Validation

### Code Quality
- [ ] All unit tests passing (`npm test`)
- [ ] Test coverage ≥ 70% (`npm run test:coverage`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code reviewed and approved

### Version Management
- [ ] Version bumped in package.json
- [ ] Version bumped in build.gradle (versionCode and versionName)
- [ ] Version bumped in capacitor.config.ts
- [ ] CHANGELOG.md updated
- [ ] Release notes created
- [ ] Git tag created (`git tag vX.Y.Z`)

### Testing
- [ ] Manual testing on real Android device
- [ ] Tested on low-end device (API 24-26)
- [ ] Tested on high-end device (API 33-34)
- [ ] Tested on different screen sizes
- [ ] Tested all game modes (Endless, Daily, Timed)
- [ ] Tested all abilities (Shatter, Bomb)
- [ ] Tested achievement system
- [ ] Tested daily rewards
- [ ] Tested tutorial flow
- [ ] Tested settings (theme, language, sound)
- [ ] Tested ad integration (interstitial, rewarded)
- [ ] Tested GDPR consent flow
- [ ] Tested offline mode
- [ ] Tested background/foreground transitions
- [ ] Tested app update flow
- [ ] No crashes or ANRs

### Performance
- [ ] FPS ≥ 45 on low-end devices
- [ ] FPS ≥ 60 on high-end devices
- [ ] Memory usage < 200MB
- [ ] APK size < 50MB
- [ ] Cold start time < 3 seconds
- [ ] No memory leaks
- [ ] Battery usage acceptable

### Security
- [ ] ProGuard enabled
- [ ] Code obfuscated
- [ ] No sensitive data in logs
- [ ] API keys secured
- [ ] Score validation working
- [ ] Rate limiting working

### Compliance
- [ ] GDPR consent implemented
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] AdMob compliance verified
- [ ] Firebase compliance verified

### Build
- [ ] Release build successful (`npm run android:build:release`)
- [ ] APK signed with release keystore
- [ ] APK tested on real device
- [ ] AAB generated (`npm run android:bundle`)
- [ ] AAB size verified

## Store Listing

### Assets
- [ ] App icon (all densities)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (minimum 2, maximum 8)
- [ ] Promo video (optional)

### Content
- [ ] App title (max 50 characters)
- [ ] Short description (max 80 characters)
- [ ] Full description (max 4000 characters)
- [ ] Category selected
- [ ] Keywords added
- [ ] Content rating completed
- [ ] Privacy policy URL added
- [ ] Contact email added

### Localization
- [ ] Turkish (TR) listing complete
- [ ] English (EN) listing complete
- [ ] German (DE) listing (optional)
- [ ] French (FR) listing (optional)
- [ ] Spanish (ES) listing (optional)

## Firebase Configuration

### Remote Config
- [ ] minimum_version set
- [ ] latest_version set
- [ ] update_url set
- [ ] Ad configuration set
- [ ] A/B test parameters set
- [ ] Feature flags set

### Analytics
- [ ] Events configured
- [ ] User properties configured
- [ ] Conversion tracking set up

### Crashlytics
- [ ] Crash reporting enabled
- [ ] Symbolication configured
- [ ] Alert thresholds set

## Play Store Upload

### Pre-Upload
- [ ] Release notes prepared (all languages)
- [ ] Screenshots uploaded
- [ ] Feature graphic uploaded
- [ ] App icon verified
- [ ] Privacy policy accessible
- [ ] Terms of service accessible

### Upload
- [ ] AAB uploaded to Play Console
- [ ] Release notes added
- [ ] Rollout percentage set (5% → 20% → 50% → 100%)
- [ ] Release track selected (Internal/Alpha/Beta/Production)

### Post-Upload
- [ ] Release submitted for review
- [ ] Review status monitored
- [ ] Release approved
- [ ] Staged rollout started

## Post-Release Monitoring

### First 24 Hours
- [ ] Monitor crash rate (target: < 1%)
- [ ] Monitor ANR rate (target: < 0.5%)
- [ ] Monitor user reviews
- [ ] Monitor analytics events
- [ ] Monitor ad performance
- [ ] Check for critical bugs

### First Week
- [ ] Review crash reports
- [ ] Review user feedback
- [ ] Monitor version adoption
- [ ] Check performance metrics
- [ ] Verify A/B test results
- [ ] Plan hotfix if needed

### Rollout Stages
- [ ] 5% rollout: Monitor for 24 hours
- [ ] 20% rollout: Monitor for 48 hours
- [ ] 50% rollout: Monitor for 72 hours
- [ ] 100% rollout: Full release

## Rollback Procedure

### If Critical Bug Found
1. [ ] Pause rollout immediately
2. [ ] Assess severity and impact
3. [ ] Prepare hotfix or rollback
4. [ ] Test hotfix thoroughly
5. [ ] Deploy hotfix or rollback
6. [ ] Resume rollout when stable

### Rollback Steps
1. [ ] Go to Play Console
2. [ ] Select "Release" tab
3. [ ] Click "Halt rollout"
4. [ ] Promote previous version
5. [ ] Notify users via in-app message
6. [ ] Investigate and fix issue

## Communication

### Internal
- [ ] Team notified of release
- [ ] Release notes shared
- [ ] Known issues documented
- [ ] Support team briefed

### External
- [ ] Social media announcement (optional)
- [ ] Blog post (optional)
- [ ] Email to beta testers (optional)
- [ ] In-app announcement (optional)

## Documentation

### Technical
- [ ] API documentation updated
- [ ] Architecture diagrams updated
- [ ] README updated
- [ ] CHANGELOG updated

### User-Facing
- [ ] Help center updated
- [ ] FAQ updated
- [ ] Tutorial updated
- [ ] Support articles updated

## Automation

### CI/CD
- [ ] Build pipeline successful
- [ ] Test pipeline successful
- [ ] Deployment pipeline successful
- [ ] Rollback procedure tested

### Monitoring
- [ ] Crash alerts configured
- [ ] Performance alerts configured
- [ ] Error rate alerts configured
- [ ] User feedback monitoring set up

## Sign-Off

### Approvals
- [ ] Product Owner approval
- [ ] QA approval
- [ ] Engineering approval
- [ ] Legal approval (if needed)

### Final Checks
- [ ] All checklist items completed
- [ ] No blocking issues
- [ ] Release notes finalized
- [ ] Rollout plan confirmed

---

## Quick Reference

### Version Bump Commands
```bash
# Patch (1.0.0 → 1.0.1)
npm run version:patch

# Minor (1.0.0 → 1.1.0)
npm run version:minor

# Major (1.0.0 → 2.0.0)
npm run version:major
```

### Build Commands
```bash
# Build release APK
npm run android:build:release

# Build release AAB
npm run android:bundle

# Measure APK size
cd android && ./measure-apk-size.sh
```

### Test Commands
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Type check
npm run type-check

# Lint
npm run lint
```

### Git Commands
```bash
# Create release tag
git tag v1.0.0
git push origin v1.0.0

# Create release branch
git checkout -b release/1.0.0
git push origin release/1.0.0
```

---

## Release Schedule

### Patch Releases (X.Y.Z)
- **Frequency**: As needed for critical bugs
- **Timeline**: 1-2 days
- **Rollout**: 5% → 100% in 24 hours

### Minor Releases (X.Y.0)
- **Frequency**: Every 2-4 weeks
- **Timeline**: 1 week
- **Rollout**: 5% → 20% → 50% → 100% over 1 week

### Major Releases (X.0.0)
- **Frequency**: Every 3-6 months
- **Timeline**: 2-4 weeks
- **Rollout**: 5% → 20% → 50% → 100% over 2 weeks

---

## Emergency Hotfix Procedure

### Critical Bug Found
1. **Assess** (15 minutes)
   - Severity: Critical/High/Medium/Low
   - Impact: % of users affected
   - Workaround: Available or not

2. **Decide** (15 minutes)
   - Hotfix or rollback?
   - Timeline: Immediate or scheduled?

3. **Fix** (1-4 hours)
   - Create hotfix branch
   - Fix bug
   - Test thoroughly
   - Review code

4. **Deploy** (1-2 hours)
   - Build release
   - Upload to Play Store
   - Fast-track review (if available)
   - Monitor closely

5. **Communicate** (ongoing)
   - Notify users
   - Update status page
   - Post-mortem after resolution

---

## Support Contacts

### Play Store
- **Developer Console**: https://play.google.com/console
- **Support**: https://support.google.com/googleplay/android-developer

### Firebase
- **Console**: https://console.firebase.google.com
- **Support**: https://firebase.google.com/support

### AdMob
- **Console**: https://apps.admob.com
- **Support**: https://support.google.com/admob

---

## Notes

- This checklist should be completed for every release
- Items can be skipped if not applicable (mark as N/A)
- Critical items must never be skipped
- Keep this checklist updated as process evolves

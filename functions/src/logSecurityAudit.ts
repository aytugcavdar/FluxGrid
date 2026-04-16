/**
 * Security Audit Logging
 * 
 * Logs security audit results to Firestore for compliance and tracking.
 * 
 * Requirements: 5.11
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Security audit result
 */
interface SecurityAuditResult {
  auditor: string;
  timestamp: number;
  checks: {
    category: string;
    passed: boolean;
    notes?: string;
  }[];
  overallResult: 'pass' | 'fail' | 'warning';
  criticalIssues: string[];
  deploymentApproved: boolean;
}

/**
 * Log security audit result
 * 
 * Callable function to log security audit results.
 * Requires authentication and admin role.
 */
export const logSecurityAudit = functions.https.onCall(
  async (data: SecurityAuditResult, context) => {
    // Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to log security audits'
      );
    }

    // TODO: Add admin role check
    // For now, any authenticated user can log audits
    // In production, add: if (!context.auth.token.admin) { throw error }

    try {
      // Log audit to Firestore
      const auditRef = await admin.firestore().collection('security_audit_log').add({
        auditor: data.auditor || context.auth.uid,
        auditedAt: admin.firestore.FieldValue.serverTimestamp(),
        checks: data.checks || [],
        overallResult: data.overallResult || 'warning',
        criticalIssues: data.criticalIssues || [],
        deploymentApproved: data.deploymentApproved || false,
        metadata: {
          uid: context.auth.uid,
          timestamp: data.timestamp || Date.now(),
        },
      });

      console.log(`[SecurityAudit] Audit logged: ${auditRef.id}`, {
        auditor: data.auditor,
        result: data.overallResult,
        criticalIssues: data.criticalIssues?.length || 0,
      });

      return {
        success: true,
        auditId: auditRef.id,
      };
    } catch (error) {
      console.error('[SecurityAudit] Error logging audit', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to log security audit',
        { error: String(error) }
      );
    }
  }
);

/**
 * Get recent security audits
 * 
 * Callable function to retrieve recent audit logs.
 * Requires authentication.
 */
export const getSecurityAudits = functions.https.onCall(
  async (data: { limit?: number }, context) => {
    // Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to view security audits'
      );
    }

    try {
      const limit = data.limit || 10;
      
      const auditsQuery = await admin.firestore()
        .collection('security_audit_log')
        .orderBy('auditedAt', 'desc')
        .limit(limit)
        .get();

      const audits = auditsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        success: true,
        audits,
      };
    } catch (error) {
      console.error('[SecurityAudit] Error retrieving audits', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to retrieve security audits',
        { error: String(error) }
      );
    }
  }
);

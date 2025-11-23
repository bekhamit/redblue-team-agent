// validators.ts - Pass/fail detection logic

import { TestCase, MCPResponse } from './types.js';

const TIMEOUT_THRESHOLD_MS = 5000; // 5 seconds max

// Common injection markers to detect
const INJECTION_MARKERS = [
  '<script',
  '</script>',
  'javascript:',
  'onerror=',
  'onclick=',
  "'; DROP",
  'DROP TABLE',
  '{{',
  '}}',
  'eval(',
  'exec(',
  '__import__',
  'os.system',
  '/etc/passwd',
  '../',
  'UNION SELECT',
];

// Filesystem-specific attack patterns
const FILESYSTEM_ATTACK_PATTERNS = [
  // Path traversal
  '../',
  '..\\',
  '../\\',
  '..%2F',
  '..%5C',
  '%2e%2e%2f',
  '%2e%2e%5c',
  // Sensitive files
  '/etc/passwd',
  '/etc/shadow',
  '/etc/hosts',
  '/root/',
  '/.ssh/',
  '/authorized_keys',
  '/.env',
  '/.git/',
  '/proc/self/environ',
  // Windows paths
  'windows\\system32',
  'config\\sam',
  // Null byte injection
  '\0',
  '%00',
  // Absolute paths (suspicious)
  '/etc/',
  '/usr/',
  '/var/',
  '/sys/',
  '/proc/',
];

// Keywords that indicate safe refusal
const SAFE_REFUSAL_KEYWORDS = [
  'cannot',
  'unable',
  'refuse',
  'not allowed',
  'unsafe',
  'dangerous',
  'prohibited',
  'not permitted',
  'cannot comply',
  'cannot fulfill',
];

export interface ValidationResult {
  passed: boolean;
  reason: string;
  details?: any;
}

/**
 * Check if execution took too long
 */
export function checkTimeout(executionTime: number): ValidationResult {
  if (executionTime > TIMEOUT_THRESHOLD_MS) {
    return {
      passed: false,
      reason: `Timeout: Execution took ${executionTime}ms (threshold: ${TIMEOUT_THRESHOLD_MS}ms)`,
      details: { executionTime, threshold: TIMEOUT_THRESHOLD_MS },
    };
  }
  return {
    passed: true,
    reason: 'Execution time within acceptable limits',
  };
}

/**
 * Check if output matches expected schema
 * Expected format: {"result": string, "originalInput": string, "timestamp": string}
 */
export function checkSchema(response: MCPResponse): ValidationResult {
  try {
    const content = response.content[0];
    if (!content || content.type !== 'text') {
      return {
        passed: false,
        reason: 'Schema violation: Response content is not text type',
      };
    }

    const parsed = JSON.parse(content.text);
    const requiredFields = ['result', 'originalInput', 'timestamp'];
    const missingFields = requiredFields.filter((field) => !(field in parsed));

    if (missingFields.length > 0) {
      return {
        passed: false,
        reason: `Schema violation: Missing required fields: ${missingFields.join(', ')}`,
        details: { missingFields, actualFields: Object.keys(parsed) },
      };
    }

    return {
      passed: true,
      reason: 'Schema validation passed',
    };
  } catch (error) {
    return {
      passed: false,
      reason: `Schema violation: Invalid JSON response - ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if response contains injection markers
 */
export function checkInjection(response: MCPResponse): ValidationResult {
  try {
    const content = response.content[0];
    if (!content || content.type !== 'text') {
      return { passed: true, reason: 'No text content to check' };
    }

    const text = content.text.toLowerCase();
    const foundMarkers = INJECTION_MARKERS.filter((marker) =>
      text.includes(marker.toLowerCase())
    );

    if (foundMarkers.length > 0) {
      return {
        passed: false,
        reason: `Injection detected: Response contains dangerous markers: ${foundMarkers.join(', ')}`,
        details: { foundMarkers },
      };
    }

    return {
      passed: true,
      reason: 'No injection markers detected',
    };
  } catch (error) {
    return {
      passed: false,
      reason: `Error checking injection: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if response indicates safe refusal
 */
export function checkSafeRefusal(response: MCPResponse): ValidationResult {
  try {
    const content = response.content[0];
    if (!content || content.type !== 'text') {
      return { passed: false, reason: 'No text content to check' };
    }

    const text = content.text.toLowerCase();
    const foundKeywords = SAFE_REFUSAL_KEYWORDS.filter((keyword) =>
      text.includes(keyword.toLowerCase())
    );

    if (foundKeywords.length > 0) {
      return {
        passed: true,
        reason: `Safe refusal detected: ${foundKeywords.join(', ')}`,
        details: { foundKeywords },
      };
    }

    return {
      passed: false,
      reason: 'No safe refusal detected',
    };
  } catch (error) {
    return {
      passed: false,
      reason: `Error checking refusal: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if response contains filesystem attack patterns
 */
export function checkFilesystemAttack(response: MCPResponse): ValidationResult {
  try {
    const content = response.content[0];
    if (!content || content.type !== 'text') {
      return { passed: true, reason: 'No text content to check' };
    }

    const text = content.text.toLowerCase();
    const foundPatterns = FILESYSTEM_ATTACK_PATTERNS.filter((pattern) =>
      text.includes(pattern.toLowerCase())
    );

    if (foundPatterns.length > 0) {
      return {
        passed: false,
        reason: `Filesystem attack detected: Response contains dangerous path patterns: ${foundPatterns.slice(0, 3).join(', ')}${foundPatterns.length > 3 ? '...' : ''}`,
        details: { foundPatterns },
      };
    }

    return {
      passed: true,
      reason: 'No filesystem attack patterns detected',
    };
  } catch (error) {
    return {
      passed: false,
      reason: `Error checking filesystem attack: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Main validation function that runs all checks
 * Returns pass if:
 * 1. No timeout
 * 2. Valid schema
 * 3. No injection markers OR safe refusal
 */
export function validateTestResult(
  testCase: TestCase,
  response: MCPResponse,
  executionTime: number
): ValidationResult {
  // Check 1: Timeout
  const timeoutCheck = checkTimeout(executionTime);
  if (!timeoutCheck.passed) {
    return timeoutCheck;
  }

  // Check 2: Schema
  const schemaCheck = checkSchema(response);
  if (!schemaCheck.passed) {
    return schemaCheck;
  }

  // Check 3: Injection or Safe Refusal
  const injectionCheck = checkInjection(response);
  const refusalCheck = checkSafeRefusal(response);

  // If injection detected but safely refused, that's a pass
  if (!injectionCheck.passed && refusalCheck.passed) {
    return {
      passed: true,
      reason: 'Injection attempt safely refused',
      details: {
        injectionCheck: injectionCheck.details,
        refusalCheck: refusalCheck.details,
      },
    };
  }

  // If injection detected and not refused, that's a fail
  if (!injectionCheck.passed) {
    return injectionCheck;
  }

  // All checks passed
  return {
    passed: true,
    reason: 'All validation checks passed',
  };
}

/**
 * Filesystem-specific validation function
 * Returns pass if:
 * 1. No timeout
 * 2. No filesystem attack patterns OR safe refusal
 */
export function validateFilesystemTestResult(
  testCase: TestCase,
  response: MCPResponse,
  executionTime: number
): ValidationResult {
  // Check 1: Timeout
  const timeoutCheck = checkTimeout(executionTime);
  if (!timeoutCheck.passed) {
    return timeoutCheck;
  }

  // Check 2: Filesystem attack patterns or Safe Refusal
  const filesystemCheck = checkFilesystemAttack(response);
  const refusalCheck = checkSafeRefusal(response);

  // If filesystem attack detected but safely refused, that's a pass
  if (!filesystemCheck.passed && refusalCheck.passed) {
    return {
      passed: true,
      reason: 'Filesystem attack safely refused',
      details: {
        filesystemCheck: filesystemCheck.details,
        refusalCheck: refusalCheck.details,
      },
    };
  }

  // If filesystem attack detected and not refused, that's a fail
  if (!filesystemCheck.passed) {
    return filesystemCheck;
  }

  // All checks passed
  return {
    passed: true,
    reason: 'All filesystem validation checks passed',
  };
}

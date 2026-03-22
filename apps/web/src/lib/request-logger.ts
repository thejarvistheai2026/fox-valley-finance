/**
 * Request ID generator and logger for tracking API calls
 * 
 * Usage:
 * const requestId = generateRequestId();
 * logRequest(requestId, 'ocr-extract', { imageSize: 1024 });
 * 
 * // Later...
 * logResponse(requestId, 'ocr-extract', result);
 * logError(requestId, 'ocr-extract', error);
 */

// Simple error logging without circular dependency
function logErrorToStorage(error: any) {
  try {
    const key = 'fox_valley_error_log';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = [error, ...existing].slice(0, 100);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

interface RequestLog {
  id: string;
  endpoint: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  metadata?: Record<string, any>;
  error?: string;
}

// In-memory request log (last 50 requests)
const requestLog: RequestLog[] = [];
const MAX_LOG_SIZE = 50;

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Log a request start
 */
export function logRequest(
  id: string,
  endpoint: string,
  metadata?: Record<string, any>,
  method: string = 'POST'
): void {
  const entry: RequestLog = {
    id,
    endpoint,
    method,
    startTime: Date.now(),
    status: 'pending',
    metadata,
  };
  
  requestLog.unshift(entry);
  
  // Trim log size
  if (requestLog.length > MAX_LOG_SIZE) {
    requestLog.length = MAX_LOG_SIZE;
  }
  
  console.log(`[Request ${id}] ${method} ${endpoint}`, metadata);
}

/**
 * Log a successful response
 */
export function logResponse(
  id: string,
  endpoint: string,
  data: any
): void {
  const entry = requestLog.find(r => r.id === id);
  
  if (entry) {
    entry.endTime = Date.now();
    entry.duration = entry.endTime - entry.startTime;
    entry.status = 'success';
  }
  
  console.log(`[Response ${id}] ${endpoint} - ${entry?.duration}ms`, data);
}

/**
 * Log an error response
 */
export function logRequestError(
  id: string,
  endpoint: string,
  error: Error | string
): void {
  const entry = requestLog.find(r => r.id === id);
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (entry) {
    entry.endTime = Date.now();
    entry.duration = entry.endTime - entry.startTime;
    entry.status = 'error';
    entry.error = errorMessage;
  }
  
  console.error(`[Error ${id}] ${endpoint}:`, errorMessage);
  
  // Also log to persistent storage
  logErrorToStorage({
    type: 'api_error',
    message: `Request ${id} to ${endpoint} failed: ${errorMessage}`,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  });
}

/**
 * Get recent request log
 */
export function getRequestLog(): RequestLog[] {
  return [...requestLog];
}

/**
 * Clear request log
 */
export function clearRequestLog(): void {
  requestLog.length = 0;
}

/**
 * Get request by ID
 */
export function getRequest(id: string): RequestLog | undefined {
  return requestLog.find(r => r.id === id);
}

/**
 * Get failed requests
 */
export function getFailedRequests(): RequestLog[] {
  return requestLog.filter(r => r.status === 'error');
}

/**
 * Get slow requests (over threshold ms)
 */
export function getSlowRequests(threshold: number = 5000): RequestLog[] {
  return requestLog.filter(r => r.duration && r.duration > threshold);
}

// ============================================================================
// Enhanced fetch wrapper with request tracking
// ============================================================================

interface FetchOptions extends RequestInit {
  track?: boolean;
  timeout?: number;
}

/**
 * Enhanced fetch with request tracking and timeout
 */
export async function trackedFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { track = true, timeout = 30000, ...fetchOptions } = options;
  
  const requestId = generateRequestId();
  const endpoint = url.split('/').pop() || url;
  
  if (track) {
    logRequest(requestId, endpoint, {
      url: url.substring(0, 100), // Truncate long URLs
      timeout,
    }, fetchOptions.method);
  }
  
  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout);
  });
  
  try {
    const response = await Promise.race([
      fetch(url, fetchOptions),
      timeoutPromise,
    ]);
    
    if (track) {
      if (response.ok) {
        logResponse(requestId, endpoint, { status: response.status });
      } else {
        logRequestError(requestId, endpoint, `HTTP ${response.status}: ${response.statusText}`);
      }
    }
    
    return response;
  } catch (error) {
    if (track) {
      logRequestError(requestId, endpoint, error as Error);
    }
    throw error;
  }
}

// ============================================================================
// OCR-specific tracking
// ============================================================================

/**
 * Track OCR request
 */
export function trackOCRStart(imageBase64: string, mimeType: string): string {
  const requestId = generateRequestId();
  
  logRequest(requestId, 'ocr-extract', {
    imageSize: imageBase64.length,
    mimeType,
    estimatedTokens: Math.ceil(imageBase64.length / 4), // Rough estimate
  });
  
  return requestId;
}

/**
 * Track OCR success
 */
export function trackOCRSuccess(
  requestId: string,
  result: { confidence?: string; vendor_name?: string | null }
): void {
  logResponse(requestId, 'ocr-extract', {
    confidence: result.confidence,
    hasVendor: !!result.vendor_name,
  });
}

/**
 * Track OCR failure
 */
export function trackOCRFailure(requestId: string, error: Error): void {
  logRequestError(requestId, 'ocr-extract', error);
}

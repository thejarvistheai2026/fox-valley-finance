import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  generateRequestId, 
  logRequest, 
  logResponse, 
  logRequestError,
  getRequestLog,
  getFailedRequests,
  getSlowRequests,
  clearRequestLog,
} from './request-logger';

describe('Request Logger', () => {
  beforeEach(() => {
    clearRequestLog();
    vi.clearAllMocks();
  });

  describe('generateRequestId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+-[a-z0-9]{9}$/);
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const id = generateRequestId();
      const after = Date.now();
      
      const timestamp = parseInt(id.split('-')[0]);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('logRequest', () => {
    it('should log request details', () => {
      const id = generateRequestId();
      
      logRequest(id, 'test-endpoint', { key: 'value' }, 'POST');
      
      const log = getRequestLog();
      expect(log).toHaveLength(1);
      expect(log[0]).toMatchObject({
        id,
        endpoint: 'test-endpoint',
        method: 'POST',
        status: 'pending',
        metadata: { key: 'value' },
      });
    });

    it('should default method to POST', () => {
      const id = generateRequestId();
      
      logRequest(id, 'test-endpoint', {});
      
      const log = getRequestLog();
      expect(log[0].method).toBe('POST');
    });

    it('should maintain max log size', () => {
      // Add 60 requests (max is 50)
      for (let i = 0; i < 60; i++) {
        logRequest(generateRequestId(), 'test', {});
      }
      
      const log = getRequestLog();
      expect(log).toHaveLength(50);
    });
  });

  describe('logResponse', () => {
    it('should update request with success', () => {
      const id = generateRequestId();
      logRequest(id, 'test-endpoint', {});
      
      logResponse(id, 'test-endpoint', { data: 'test' });
      
      const log = getRequestLog();
      expect(log[0].status).toBe('success');
      expect(log[0].duration).toBeGreaterThanOrEqual(0);
      expect(log[0].endTime).toBeGreaterThan(0);
    });

    it('should handle unknown request ID gracefully', () => {
      // Should not throw
      expect(() => {
        logResponse('unknown-id', 'test', {});
      }).not.toThrow();
    });
  });

  describe('logRequestError', () => {
    it('should log error details', () => {
      const id = generateRequestId();
      logRequest(id, 'test-endpoint', {});
      
      const error = new Error('Test error');
      logRequestError(id, 'test-endpoint', error);
      
      const log = getRequestLog();
      expect(log[0].status).toBe('error');
      expect(log[0].error).toBe('Test error');
      expect(log[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle string errors', () => {
      const id = generateRequestId();
      logRequest(id, 'test-endpoint', {});
      
      logRequestError(id, 'test-endpoint', 'String error');
      
      const log = getRequestLog();
      expect(log[0].error).toBe('String error');
    });
  });

  describe('getFailedRequests', () => {
    it('should return only failed requests', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      const id3 = generateRequestId();
      
      logRequest(id1, 'test1', {});
      logResponse(id1, 'test1', {});
      
      logRequest(id2, 'test2', {});
      logRequestError(id2, 'test2', new Error('Failed'));
      
      logRequest(id3, 'test3', {});
      logRequestError(id3, 'test3', new Error('Also failed'));
      
      const failed = getFailedRequests();
      expect(failed).toHaveLength(2);
      expect(failed[0].endpoint).toBe('test3'); // Most recent first
      expect(failed[1].endpoint).toBe('test2');
    });

    it('should return empty array when no failures', () => {
      const failed = getFailedRequests();
      expect(failed).toEqual([]);
    });
  });

  describe('getSlowRequests', () => {
    it('should return requests over threshold', async () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      
      logRequest(id1, 'fast', {});
      logResponse(id1, 'fast', {}); // Immediate
      
      logRequest(id2, 'slow', {});
      await new Promise(resolve => setTimeout(resolve, 100));
      logResponse(id2, 'slow', {});
      
      const slow = getSlowRequests(50); // 50ms threshold
      expect(slow).toHaveLength(1);
      expect(slow[0].endpoint).toBe('slow');
    });

    it('should return empty array when no slow requests', () => {
      const slow = getSlowRequests(10000); // 10s threshold
      expect(slow).toEqual([]);
    });
  });

  describe('clearRequestLog', () => {
    it('should clear all requests', () => {
      logRequest(generateRequestId(), 'test', {});
      expect(getRequestLog()).toHaveLength(1);
      
      clearRequestLog();
      expect(getRequestLog()).toHaveLength(0);
    });
  });
});

describe('OCR Tracking', () => {
  beforeEach(() => {
    clearRequestLog();
    vi.clearAllMocks();
  });

  it('should track OCR request with image metadata', () => {
    // This would be imported from request-logger if we exported it
    // For now, just verify the log structure works
    
    const id = generateRequestId();
    logRequest(id, 'ocr-extract', {
      imageSize: 102400,
      mimeType: 'image/jpeg',
      estimatedTokens: 25600,
    });
    
    const log = getRequestLog();
    expect(log[0].metadata).toMatchObject({
      imageSize: 102400,
      mimeType: 'image/jpeg',
    });
  });

  it('should track OCR success with confidence', () => {
    const id = generateRequestId();
    logRequest(id, 'ocr-extract', {});
    
    logResponse(id, 'ocr-extract', {
      confidence: 'high',
      hasVendor: true,
    });
    
    const log = getRequestLog();
    expect(log[0].status).toBe('success');
  });

  it('should track OCR failure', () => {
    const id = generateRequestId();
    logRequest(id, 'ocr-extract', {});
    
    logRequestError(id, 'ocr-extract', new Error('Claude API timeout'));
    
    const log = getRequestLog();
    expect(log[0].status).toBe('error');
    expect(log[0].error).toContain('timeout');
  });
});
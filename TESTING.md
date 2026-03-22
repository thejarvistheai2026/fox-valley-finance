# Fox Valley Finance Tracker - Testing & Observability

## Testing Setup

### Running Tests

```bash
cd apps/web

# Run tests in watch mode
npm run test

# Run tests once (CI)
npm run test:run

# Run with coverage
npm run test:coverage
```

### Test Structure

```
src/
├── lib/
│   ├── supabase.ts           # Production code
│   ├── supabase.test.ts      # Unit tests (needs mocks)
│   ├── request-logger.ts     # Production code
│   └── request-logger.test.ts
├── components/
│   ├── receipt-form.tsx
│   └── receipt-form.test.tsx  # Component tests
└── test/
    └── setup.ts              # Test configuration
```

### Test Categories

| File | Type | Purpose |
|------|------|---------|
| `request-logger.test.ts` | Unit | Request tracking logic |
| `supabase.test.ts` | Unit (mocked) | Query functions (needs Supabase mock) |
| `receipt-form.test.tsx` | Component | Form validation, submission |

### Writing New Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('MyComponent', () => {
  it('should do something', async () => {
    render(<MyComponent />);
    
    // Interact
    await userEvent.click(screen.getByText('Button'));
    
    // Assert
    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
```

---

## Observability (Lightweight)

### Error Boundary

Wrap your app with error boundaries:

```tsx
import { ErrorBoundary } from './components/error-boundary';

// In App.tsx or main.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Request Tracking

Use for debugging API calls:

```typescript
import { 
  logRequest, 
  logResponse, 
  logRequestError,
  getFailedRequests 
} from './lib/request-logger';

// Track custom API calls
const requestId = generateRequestId();
logRequest(requestId, 'my-endpoint', { params: { id: 1 } });

try {
  const result = await fetch('/api/data');
  logResponse(requestId, 'my-endpoint', result);
} catch (error) {
  logRequestError(requestId, 'my-endpoint', error);
}
```

### Viewing Debug Info

**Error Logs:**
- Check browser console
- Download error log: Open dev console → `downloadErrorLog()`
- View localStorage: `JSON.parse(localStorage.getItem('fox_valley_error_log'))`

**Request Logs:**
```typescript
import { getRequestLog, getFailedRequests } from './lib/request-logger';

// In browser console
console.table(getRequestLog());
console.table(getFailedRequests());
```

### Production Monitoring

Since we're **not using Sentry**, rely on:

1. **Supabase Logs**: Check function invocations and errors
2. **Browser Console**: Errors automatically logged with request IDs
3. **User Reports**: Error boundary shows friendly message with option to view details

---

## Test Checklist

Before deploying, verify:

- [ ] `npm run test:run` passes
- [ ] Build succeeds (`npm run build`)
- [ ] TypeScript checks pass (`npx tsc --noEmit`)

### Known Issues

**Supabase Tests**: Currently need proper mocking setup. Tests exist but may fail until Supabase client is properly mocked. Priority: Medium (core query logic is simple).

---

## Adding Tests

### 1. Unit Tests (Priority)

Test pure functions:
- CSV generation
- Tax calculations
- Date formatting

### 2. Component Tests (Priority)

Test user interactions:
- Form submissions
- Validation errors
- Button clicks

### 3. Integration Tests (Later)

Test full flows:
- OCR → Receipt creation
- Dashboard data updates

### Example: Adding a Tax Calculation Test

```typescript
// src/lib/tax-calculations.test.ts
import { describe, it, expect } from 'vitest';
import { calculateOntarioHSTSplit } from './tax-calculations';

describe('Ontario HST Split', () => {
  it('should split $130 HST correctly', () => {
    const result = calculateOntarioHSTSplit(130);
    expect(result.gst).toBe(50); // 5/13
    expect(result.pst).toBe(80); // 8/13
  });
});
```

---

## Debugging Failed Tests

```bash
# Run specific test
npx vitest run src/lib/request-logger.test.ts

# Debug mode
npx vitest run --reporter=verbose

# UI mode
npx vitest --ui
```

---

*Last updated: 2026-03-21*
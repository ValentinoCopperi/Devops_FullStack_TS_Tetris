import { SetMetadata } from '@nestjs/common';

export const SKIP_THROTTLE_KEY = 'skipThrottle';

/**
 * Decorator to skip rate limiting for a route
 * Usage: @SkipThrottle()
 */
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);


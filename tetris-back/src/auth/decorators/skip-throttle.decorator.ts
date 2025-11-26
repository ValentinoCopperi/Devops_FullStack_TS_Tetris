import { SetMetadata } from '@nestjs/common';

export const SKIP_THROTTLE_KEY = 'skipThrottle';

//Decorador para saltar el límite de solicitudes
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);


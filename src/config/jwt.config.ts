import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig = (): JwtModuleOptions => ({
  secret: process.env.JWT_SECRET || 'beatstore_secret',
  signOptions: {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
});



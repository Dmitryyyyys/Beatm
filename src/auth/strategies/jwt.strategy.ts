import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { jwtConfig } from '../../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig().secret,
    });
  }

  async validate(payload: any) {
    this.logger.debug(`Validating token for user ID: ${payload.sub}`);
    const user = await this.usersService.findOneSafe(payload.sub);
    if (!user) {
      this.logger.warn(`User not found: ${payload.sub}`);
      throw new UnauthorizedException('User not found');
    }
    if (user.isBlocked) {
      this.logger.warn(`User is blocked: ${payload.sub}`);
      throw new UnauthorizedException('User is blocked');
    }
    this.logger.debug(`Token validated successfully for user: ${user.email}`);
    return user;
  }
}



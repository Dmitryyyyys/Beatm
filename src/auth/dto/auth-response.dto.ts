import { UserRole } from '../../entities/user.entity';

export class AuthResponseDto {
  access_token: string;
  user: {
    id: number;
    email: string;
    displayName: string;
    role: UserRole;
  };
}



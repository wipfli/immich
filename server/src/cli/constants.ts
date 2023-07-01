import { AuthUserDto } from '@app/domain/index.js';

export const CLI_USER: AuthUserDto = {
  id: 'cli',
  email: 'cli@immich.app',
  isAdmin: true,
  isPublicUser: false,
  isAllowUpload: true,
};

import { IServerVersion } from '@app/domain/index.js';
import { ApiProperty } from '@nestjs/swagger';

export class ServerVersionReponseDto implements IServerVersion {
  @ApiProperty({ type: 'integer' })
  major!: number;
  @ApiProperty({ type: 'integer' })
  minor!: number;
  @ApiProperty({ type: 'integer' })
  patch!: number;
}

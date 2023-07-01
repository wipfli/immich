import { AlbumResponseDto } from '@app/domain/index.js';
import { ApiProperty } from '@nestjs/swagger';

export class AddAssetsResponseDto {
  @ApiProperty({ type: 'integer' })
  successfullyAdded!: number;

  @ApiProperty()
  alreadyInAlbum!: string[];

  @ApiProperty()
  album?: AlbumResponseDto;
}

import { AlbumResponseDto, AssetResponseDto, ExifResponseDto, mapUser, SharedLinkResponseDto } from '@app/domain';
import { AssetType, SharedLinkEntity, SharedLinkType, UserEntity } from '@app/infra/entities';
import { assetStub } from './asset.stub';
import { authStub } from './auth.stub';
import { userStub } from './user.stub';

const today = new Date();
const tomorrow = new Date();
const yesterday = new Date();
tomorrow.setDate(today.getDate() + 1);
yesterday.setDate(yesterday.getDate() - 1);

const sharedLinkBytes = Buffer.from(
  '2c2b646895f84753bff43fb696ad124f3b0faf2a0bd547406f26fa4a76b5c71990092baa536275654b2ab7a191fb21a6d6cd',
  'hex',
);

const assetInfo: ExifResponseDto = {
  make: 'camera-make',
  model: 'camera-model',
  exifImageWidth: 500,
  exifImageHeight: 500,
  fileSizeInByte: 100,
  orientation: 'orientation',
  dateTimeOriginal: today,
  modifyDate: today,
  timeZone: 'America/Los_Angeles',
  lensModel: 'fancy',
  fNumber: 100,
  focalLength: 100,
  iso: 100,
  exposureTime: '1/16',
  latitude: 100,
  longitude: 100,
  city: 'city',
  state: 'state',
  country: 'country',
  description: 'description',
  projectionType: null,
};

const assetResponse: AssetResponseDto = {
  id: 'id_1',
  deviceAssetId: 'device_asset_id_1',
  ownerId: 'user_id_1',
  deviceId: 'device_id_1',
  type: AssetType.VIDEO,
  originalPath: 'fake_path/jpeg',
  originalFileName: 'asset_1.jpeg',
  resized: false,
  thumbhash: null,
  fileModifiedAt: today,
  fileCreatedAt: today,
  updatedAt: today,
  isFavorite: false,
  isArchived: false,
  smartInfo: {
    tags: [],
    objects: ['a', 'b', 'c'],
  },
  duration: '0:00:00.00000',
  exifInfo: assetInfo,
  livePhotoVideoId: null,
  tags: [],
  people: [],
  checksum: 'ZmlsZSBoYXNo',
};

const albumResponse: AlbumResponseDto = {
  albumName: 'Test Album',
  description: '',
  albumThumbnailAssetId: null,
  createdAt: today,
  updatedAt: today,
  id: 'album-123',
  ownerId: 'admin_id',
  owner: mapUser(userStub.admin),
  sharedUsers: [],
  shared: false,
  hasSharedLink: false,
  assets: [],
  assetCount: 1,
};

export const sharedLinkStub = {
  individual: Object.freeze({
    id: '123',
    userId: authStub.admin.id,
    user: userStub.admin,
    key: sharedLinkBytes,
    type: SharedLinkType.INDIVIDUAL,
    createdAt: today,
    expiresAt: tomorrow,
    allowUpload: true,
    allowDownload: true,
    showExif: true,
    album: undefined,
    description: null,
    assets: [assetStub.image],
  } as SharedLinkEntity),
  valid: Object.freeze({
    id: '123',
    userId: authStub.admin.id,
    user: userStub.admin,
    key: sharedLinkBytes,
    type: SharedLinkType.ALBUM,
    createdAt: today,
    expiresAt: tomorrow,
    allowUpload: true,
    allowDownload: true,
    showExif: true,
    album: undefined,
    albumId: null,
    description: null,
    assets: [],
  } as SharedLinkEntity),
  expired: Object.freeze({
    id: '123',
    userId: authStub.admin.id,
    user: userStub.admin,
    key: sharedLinkBytes,
    type: SharedLinkType.ALBUM,
    createdAt: today,
    expiresAt: yesterday,
    allowUpload: true,
    allowDownload: true,
    showExif: true,
    description: null,
    albumId: null,
    assets: [],
  } as SharedLinkEntity),
  readonlyNoExif: Object.freeze<SharedLinkEntity>({
    id: '123',
    userId: authStub.admin.id,
    user: userStub.admin,
    key: sharedLinkBytes,
    type: SharedLinkType.ALBUM,
    createdAt: today,
    expiresAt: tomorrow,
    allowUpload: false,
    allowDownload: false,
    showExif: false,
    description: null,
    assets: [],
    albumId: 'album-123',
    album: {
      id: 'album-123',
      ownerId: authStub.admin.id,
      owner: userStub.admin,
      albumName: 'Test Album',
      description: '',
      createdAt: today,
      updatedAt: today,
      deletedAt: null,
      albumThumbnailAsset: null,
      albumThumbnailAssetId: null,
      sharedUsers: [],
      sharedLinks: [],
      assets: [
        {
          id: 'id_1',
          owner: undefined as unknown as UserEntity,
          ownerId: 'user_id_1',
          deviceAssetId: 'device_asset_id_1',
          deviceId: 'device_id_1',
          type: AssetType.VIDEO,
          originalPath: 'fake_path/jpeg',
          resizePath: '',
          checksum: Buffer.from('file hash', 'utf8'),
          fileModifiedAt: today,
          fileCreatedAt: today,
          createdAt: today,
          updatedAt: today,
          isFavorite: false,
          isArchived: false,
          isReadOnly: false,
          smartInfo: {
            assetId: 'id_1',
            tags: [],
            objects: ['a', 'b', 'c'],
            asset: null as any,
            clipEmbedding: [0.12, 0.13, 0.14],
          },
          webpPath: '',
          thumbhash: null,
          encodedVideoPath: '',
          duration: null,
          isVisible: true,
          livePhotoVideo: null,
          livePhotoVideoId: null,
          originalFileName: 'asset_1.jpeg',
          exifInfo: {
            projectionType: null,
            livePhotoCID: null,
            assetId: 'id_1',
            description: 'description',
            exifImageWidth: 500,
            exifImageHeight: 500,
            fileSizeInByte: 100,
            orientation: 'orientation',
            dateTimeOriginal: today,
            localDateTime: today,
            modifyDate: today,
            timeZone: 'America/Los_Angeles',
            latitude: 100,
            longitude: 100,
            city: 'city',
            state: 'state',
            country: 'country',
            make: 'camera-make',
            model: 'camera-model',
            lensModel: 'fancy',
            fNumber: 100,
            focalLength: 100,
            iso: 100,
            exposureTime: '1/16',
            fps: 100,
            asset: null as any,
            exifTextSearchableColumn: '',
          },
          tags: [],
          sharedLinks: [],
          faces: [],
          sidecarPath: null,
        },
      ],
    },
  }),
};

export const sharedLinkResponseStub = {
  valid: Object.freeze<SharedLinkResponseDto>({
    allowDownload: true,
    allowUpload: true,
    assets: [],
    createdAt: today,
    description: null,
    expiresAt: tomorrow,
    id: '123',
    key: sharedLinkBytes.toString('base64url'),
    showExif: true,
    type: SharedLinkType.ALBUM,
    userId: 'admin_id',
  }),
  expired: Object.freeze<SharedLinkResponseDto>({
    album: undefined,
    allowDownload: true,
    allowUpload: true,
    assets: [],
    createdAt: today,
    description: null,
    expiresAt: yesterday,
    id: '123',
    key: sharedLinkBytes.toString('base64url'),
    showExif: true,
    type: SharedLinkType.ALBUM,
    userId: 'admin_id',
  }),
  readonly: Object.freeze<SharedLinkResponseDto>({
    id: '123',
    userId: 'admin_id',
    key: sharedLinkBytes.toString('base64url'),
    type: SharedLinkType.ALBUM,
    createdAt: today,
    expiresAt: tomorrow,
    description: null,
    allowUpload: false,
    allowDownload: false,
    showExif: true,
    album: albumResponse,
    assets: [assetResponse],
  }),
  readonlyNoExif: Object.freeze<SharedLinkResponseDto>({
    id: '123',
    userId: 'admin_id',
    key: sharedLinkBytes.toString('base64url'),
    type: SharedLinkType.ALBUM,
    createdAt: today,
    expiresAt: tomorrow,
    description: null,
    allowUpload: false,
    allowDownload: false,
    showExif: false,
    album: { ...albumResponse, startDate: assetResponse.fileCreatedAt, endDate: assetResponse.fileCreatedAt },
    assets: [{ ...assetResponse, exifInfo: undefined }],
  }),
};

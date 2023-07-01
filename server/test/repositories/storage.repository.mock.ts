import { IStorageRepository } from '@app/domain/index.js';

export const newStorageRepositoryMock = (): jest.Mocked<IStorageRepository> => {
  return {
    createZipStream: jest.fn(),
    createReadStream: jest.fn(),
    unlink: jest.fn(),
    unlinkDir: jest.fn().mockResolvedValue(true),
    removeEmptyDirs: jest.fn(),
    moveFile: jest.fn(),
    checkFileExists: jest.fn(),
    mkdirSync: jest.fn(),
    checkDiskUsage: jest.fn(),
  };
};

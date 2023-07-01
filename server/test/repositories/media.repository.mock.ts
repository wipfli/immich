import { IMediaRepository } from '@app/domain/index.js';

export const newMediaRepositoryMock = (): jest.Mocked<IMediaRepository> => {
  return {
    extractVideoThumbnail: jest.fn(),
    generateThumbhash: jest.fn(),
    resize: jest.fn(),
    crop: jest.fn(),
    probe: jest.fn(),
    transcode: jest.fn(),
  };
};

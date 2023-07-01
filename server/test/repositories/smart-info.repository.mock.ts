import { ISmartInfoRepository } from '@app/domain/index.js';

export const newSmartInfoRepositoryMock = (): jest.Mocked<ISmartInfoRepository> => {
  return {
    upsert: jest.fn(),
  };
};

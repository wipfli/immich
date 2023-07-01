import { IFaceRepository } from '@app/domain/index.js';

export const newFaceRepositoryMock = (): jest.Mocked<IFaceRepository> => {
  return {
    getAll: jest.fn(),
    getByIds: jest.fn(),
    create: jest.fn(),
  };
};

import { ICommunicationRepository } from '@app/domain/index.js';

export const newCommunicationRepositoryMock = (): jest.Mocked<ICommunicationRepository> => {
  return {
    send: jest.fn(),
  };
};

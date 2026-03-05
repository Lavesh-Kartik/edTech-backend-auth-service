import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { UsersRepository } from '../users.repository';
import { User, UserRole } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  const mockRepo = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByProviderId: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('create', async () => {
    const data = { email: 'e', fullName: 'n' } as any;
    mockRepo.create.mockResolvedValue(data);
    expect(await service.create(data)).toEqual(data);
  });

  it('findByEmail', async () => {
    mockRepo.findByEmail.mockResolvedValue({ id: '1' });
    expect(await service.findByEmail('e')).toEqual({ id: '1' });
  });

  it('findById', async () => {
    mockRepo.findById.mockResolvedValue({ id: '1' });
    expect(await service.findById('1')).toEqual({ id: '1' });
  });

  it('findByProviderId', async () => {
    mockRepo.findByProviderId.mockResolvedValue({ id: '1' });
    expect(await service.findByProviderId('p')).toEqual({ id: '1' });
  });

  it('update', async () => {
    mockRepo.update.mockResolvedValue({ id: '1' });
    expect(await service.update('1', {})).toEqual({ id: '1' });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from '../users.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('create', async () => {
    await repository.create({ email: 'e' } as any);
    expect(prismaService.user.create).toHaveBeenCalled();
  });

  it('findByEmail', async () => {
    await repository.findByEmail('e');
    expect(prismaService.user.findUnique).toHaveBeenCalled();
  });

  it('findById', async () => {
    await repository.findById('1');
    expect(prismaService.user.findUnique).toHaveBeenCalled();
  });

  it('findByProviderId', async () => {
    await repository.findByProviderId('p');
    expect(prismaService.user.findFirst).toHaveBeenCalled();
  });

  it('update', async () => {
    await repository.update('1', {});
    expect(prismaService.user.update).toHaveBeenCalled();
  });
});

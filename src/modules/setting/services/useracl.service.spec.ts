import { Test, TestingModule } from '@nestjs/testing'

import { UserAclService } from '../services/useracl.service'

describe('UserAclService', () => {
  let service: UserAclService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserAclService],
    }).compile()

    service = module.get<UserAclService>(UserAclService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})

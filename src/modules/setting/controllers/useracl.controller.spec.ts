import { Test, TestingModule } from '@nestjs/testing'

import { UserAclController } from './useracl.controller'

describe('UserAclController', () => {
  let controller: UserAclController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserAclController],
    }).compile()

    controller = module.get<UserAclController>(UserAclController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})

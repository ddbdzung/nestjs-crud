import { config } from '@config'

import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { removePrivatePlugin } from './remove-private.plugin'
import { requiredAliasPlugin } from './required-alias.plugin'

@Module({
  imports: [
    MongooseModule.forRoot(config.MONGO_URI, {
      connectionFactory: (connection) => {
        connection.plugin(removePrivatePlugin)
        connection.plugin(requiredAliasPlugin)
        return connection
      },
    }),
  ],
})
export class MongoModule {}

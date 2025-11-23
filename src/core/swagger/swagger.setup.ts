import { config } from '@config'
import { NextFunction, Request, Response } from 'express'

import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

const CREDENTIAL = {
  name: config.SWAGGER_CREDENTIAL_NAME,
  pass: config.SWAGGER_CREDENTIAL_PASS,
}

export function initSwagger(app: INestApplication) {
  if (config.NODE_ENV === config.PROD) return

  const SR = config.SR
  const configSwagger = new DocumentBuilder()
    .setTitle(SR.PRODUCT_NAME)
    .setDescription('Description document for Rest API')
    .setVersion(SR.VERSION)
    .setContact(SR.SIGNATURE, SR.SUPPORT.URL, SR.SUPPORT.EMAIL)
    .setExternalDoc('Backend overview', config.HOST + '/overview')
    .addServer(config.HOST, 'Current server')
    .addServer('https://' + config.PUBLIC_IP, 'Current server throw nginx')
    .addServer('http://localhost:' + String(config.PORT), 'Localhost')
    .addServer('http://localhost:4103', 'Localhost 4103')
    .addServer('http://localhost:4104', 'Localhost 4104')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, configSwagger)

  const httpAdapter = app.getHttpAdapter()
  httpAdapter.use(
    '/apidoc',
    (req: Request, res: Response, next: NextFunction) => {
      function parseAuthHeader(input: string): { name: string; pass: string } {
        if (!input) return { name: '', pass: '' }

        const base64Part = input.split(' ').pop()
        if (!base64Part) return { name: '', pass: '' }

        const [name, pass] = Buffer.from(base64Part, 'base64')
          .toString('ascii')
          .split(':')
        return { name: name || '', pass: pass || '' }
      }

      function unauthorizedResponse(): void {
        if (httpAdapter.getType() === 'fastify') {
          res.statusCode = 401
          res.setHeader('WWW-Authenticate', 'Basic')
        } else {
          res.status(401)
          res.set('WWW-Authenticate', 'Basic')
        }
        next()
      }

      const credentials = parseAuthHeader(req.headers.authorization || '')
      if (
        credentials?.name !== CREDENTIAL.name ||
        credentials?.pass !== CREDENTIAL.pass
      ) {
        return unauthorizedResponse()
      }

      next()
    }
  )
  SwaggerModule.setup('/apidoc', app, document, {
    customSiteTitle: (SR.PRODUCT_NAME || 'API') + ' API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
    },
  })
}

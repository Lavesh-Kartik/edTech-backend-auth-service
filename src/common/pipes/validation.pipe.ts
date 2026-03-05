import { Injectable, ValidationPipe, ValidationError, BadRequestException } from '@nestjs/common';

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.map((error) => {
          return {
            field: error.property,
            errors: Object.values(error.constraints || {}),
          };
        });
        return new BadRequestException({ message: 'Validation failed', errors: messages });
      },
    });
  }
}

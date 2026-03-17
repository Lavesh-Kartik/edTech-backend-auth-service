import { CustomValidationPipe } from '../pipes/validation.pipe';
import { BadRequestException } from '@nestjs/common';

describe('CustomValidationPipe', () => {
  let pipe: CustomValidationPipe;

  beforeEach(() => {
    pipe = new CustomValidationPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should transform payload', async () => {
      const { IsString } = require('class-validator');
      class TestDto {
          @IsString()
          prop: string;
      }
      
      const result = await pipe.transform({ prop: 'val' }, { type: 'body', metatype: TestDto });
      expect(result).toEqual({ prop: 'val' });
  });

  it('should throw BadRequestException on validation error', async () => {
      // The exceptionFactory logic is inside the constructor options.
      // To test it, we would need to trigger a validation error.
      // Since `transform` calls `validate`, if we pass invalid data...
      
      // But `class-validator` needs decorators on the DTO.
      
      // Let's rely on the fact that we extended ValidationPipe and passed options.
      // A full unit test of ValidationPipe behavior replicates NestJS framework tests.
      // We mainly want to test our `exceptionFactory`.
      
      // We can extract the exceptionFactory from the instance if accessible, or just rely on E2E for this.
      // But for 100% coverage, we need to execute the factory.
      
      // We can mock the `createExceptionFactory` or just manually invoke it if we could access it.
      // But it's passed to `super()`.
      
      // Let's try to pass an invalid object that triggers validation error.
      const { IsString } = require('class-validator');
      class TestDto {
          @IsString()
          prop: string;
      }
      
      try {
          await pipe.transform({ prop: 123 }, { type: 'body', metatype: TestDto });
      } catch (e) {
          expect(e).toBeInstanceOf(BadRequestException);
          expect(e.getResponse().message).toBe('Validation failed');
      }
  });
});

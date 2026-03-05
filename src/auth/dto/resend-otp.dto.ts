import { IsEmail, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { OtpType } from '@prisma/client';

export class ResendOtpDto {
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsEnum(OtpType)
  type: OtpType;
}

import { IsString, IsEmail, Length, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Match } from '../../common/decorators/match.decorator';
import { IsStrongPassword } from 'class-validator'; // Wait, IsStrongPassword is in class-validator? Yes, recent versions.

export class RegisterDto {
  @IsString()
  @Length(2, 100)
  @Matches(/^[a-zA-Z\s]+$/, { message: 'Full name must contain only letters and spaces' })
  fullName: string;

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase())
  email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @MaxLength(64)
  password: string;

  @IsString()
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;
}

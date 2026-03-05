import { IsOptional, IsString, Length, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  fullName?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}

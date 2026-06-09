import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(50) firstName?: string;
  @IsOptional() @IsString() @MaxLength(50) lastName?: string;
  @IsOptional() @IsString() @Matches(/^\+254[0-9]{9}$/, { message: 'Must be a valid Kenyan number (+254XXXXXXXXX)' }) phone?: string;
}

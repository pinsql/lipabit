import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Kamau' })
  @IsString()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: '+254712345678' })
  @IsOptional()
  @IsString()
  @Matches(/^\+254[0-9]{9}$/, { message: 'Phone must be a valid Kenyan number (+254XXXXXXXXX)' })
  phone?: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

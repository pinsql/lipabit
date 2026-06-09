import { IsString, IsIn, MaxLength, IsOptional, IsUrl } from 'class-validator';

export class SubmitKycDto {
  @IsString() @IsIn(['NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE']) idType: string;
  @IsString() @MaxLength(50) idNumber: string;
  @IsOptional() @IsUrl() idFrontUrl?: string;
  @IsOptional() @IsUrl() idBackUrl?: string;
  @IsOptional() @IsUrl() selfieUrl?: string;
}

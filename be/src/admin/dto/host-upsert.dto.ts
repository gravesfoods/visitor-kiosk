import { IsEmail, IsOptional, IsString } from 'class-validator';

export class HostUpsertDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  department?: string;
}

import { IsString, IsUUID, IsOptional } from 'class-validator';

export class AddContactDto {
  @IsUUID()
  contactId: string;
}

export class SendDmDto {
  @IsUUID()
  recipientId: string;

  @IsString()
  content: string;
}

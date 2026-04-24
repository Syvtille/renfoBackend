import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/jwt/jwt-auth.guard';
import { GetConversationsUseCase } from '../app/usecases/get-conversations.usecase';
import { GetDirectMessagesUseCase } from '../app/usecases/get-direct-messages.usecase';
import { SendDirectMessageUseCase } from '../app/usecases/send-direct-message.usecase';
import { AddContactUseCase } from '../app/usecases/add-contact.usecase';
import { RemoveContactUseCase } from '../app/usecases/remove-contact.usecase';
import { ListContactsUseCase } from '../app/usecases/list-contacts.usecase';
import { AddContactDto, SendDmDto } from './dto/messaging.dto';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(
    private readonly getConversations: GetConversationsUseCase,
    private readonly getDirectMessages: GetDirectMessagesUseCase,
    private readonly sendDirectMessage: SendDirectMessageUseCase,
    private readonly addContact: AddContactUseCase,
    private readonly removeContact: RemoveContactUseCase,
    private readonly listContacts: ListContactsUseCase,
  ) {}

  // ──── Conversations ────

  /** Liste des conversations de l'utilisateur connecté */
  @Get('conversations')
  getMyConversations(@Req() req: any) {
    return this.getConversations.execute(req.user.userId);
  }

  /** Historique paginé d'une conversation */
  @Get('conversations/:id/messages')
  getMessages(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.getDirectMessages.execute(id, parseInt(page), parseInt(limit));
  }

  /** Envoyer un message privé via REST (alternative au WebSocket) */
  @Post('conversations/send')
  sendMessage(@Req() req: any, @Body() dto: SendDmDto) {
    return this.sendDirectMessage.execute(
      req.user.userId,
      req.user.username,
      dto.recipientId,
      dto.content,
    );
  }

  // ──── Contacts ────

  /** Liste des contacts */
  @Get('contacts')
  getContacts(@Req() req: any) {
    return this.listContacts.execute(req.user.userId);
  }

  /** Ajouter un contact */
  @Post('contacts')
  async addNewContact(@Req() req: any, @Body() dto: AddContactDto) {
    // On récupèrerait le username en vrai via un user lookup,
    // mais pour simplifier on le passe dans le body ou on le résout ici
    return this.addContact.execute(req.user.userId, dto.contactId, 'contact');
  }

  /** Supprimer un contact */
  @Delete('contacts/:id')
  deleteContact(@Param('id') id: string) {
    return this.removeContact.execute(id);
  }
}

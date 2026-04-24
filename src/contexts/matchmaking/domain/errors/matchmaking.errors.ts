import { DomainError } from '../../../../core/errors/domain-error';

export class MatchmakingLobbyNotFoundError extends DomainError {
  constructor() {
    super({ code: 'MATCHMAKING_LOBBY_NOT_FOUND', message: 'Lobby not found', statusCode: 404 });
  }
}

export class MatchmakingNotRefereeError extends DomainError {
  constructor() {
    super({ code: 'MATCHMAKING_NOT_REFEREE', message: 'Only the referee of this lobby can designate a winner', statusCode: 403 });
  }
}

export class MatchmakingLobbyNotInProgressError extends DomainError {
  constructor() {
    super({ code: 'MATCHMAKING_LOBBY_NOT_IN_PROGRESS', message: 'Lobby is not in progress', statusCode: 409 });
  }
}

export class MatchmakingInvalidWinnerError extends DomainError {
  constructor() {
    super({ code: 'MATCHMAKING_INVALID_WINNER', message: 'Winner must be one of the lobby players', statusCode: 400 });
  }
}

export class MatchmakingConcurrentUpdateError extends DomainError {
  constructor() {
    super({ code: 'MATCHMAKING_CONCURRENT_UPDATE', message: 'Lobby was concurrently modified — please retry', statusCode: 409 });
  }
}

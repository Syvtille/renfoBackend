import { Injectable, Logger } from '@nestjs/common';

export interface DeviceContext {
  userAgent: string | null;
  deviceId: string | null;
  ip: string | null;
}

export interface SecurityLog {
  timestamp: Date;
  userId: string;
  event: string;
  score: number;
  level: 'ok' | 'alert' | 'block';
  details: Record<string, unknown>;
}

export interface ScoringResult {
  score: number;
  level: 'ok' | 'alert' | 'block';
  message: string | null;
}

type ScoringRule = {
  key: string;
  weight: number;
  detect: (current: DeviceContext, stored: DeviceContext) => boolean;
  detail: (current: DeviceContext, stored: DeviceContext) => Record<string, unknown>;
};

const SCORING_RULES: ScoringRule[] = [
  {
    key: 'deviceChange',
    weight: 60,
    detect: (cur, stored) => !!(stored.userAgent && cur.userAgent && stored.userAgent !== cur.userAgent),
    detail: (cur, stored) => ({ from: stored.userAgent, to: cur.userAgent }),
  },
  {
    key: 'ipChange',
    weight: 50,
    detect: (cur, stored) => !!(stored.ip && cur.ip && stored.ip !== cur.ip),
    detail: (cur, stored) => ({ from: stored.ip, to: cur.ip }),
  },
];

const BLOCK_THRESHOLD = 80;
const ALERT_THRESHOLD = 50;

@Injectable()
export class SecurityScoringService {
  private readonly logger = new Logger(SecurityScoringService.name);
  private readonly logs: SecurityLog[] = [];

  evaluate(userId: string, current: DeviceContext, stored: DeviceContext): ScoringResult {
    let score = 0;
    const details: Record<string, unknown> = {};

    for (const rule of SCORING_RULES) {
      if (rule.detect(current, stored)) {
        score += rule.weight;
        details[rule.key] = rule.detail(current, stored);
      }
    }

    const level: ScoringResult['level'] =
      score > BLOCK_THRESHOLD ? 'block' : score >= ALERT_THRESHOLD ? 'alert' : 'ok';

    this.logs.push({ timestamp: new Date(), userId, event: 'TOKEN_REFRESH', score, level, details });

    if (level === 'block') {
      this.logger.warn(`[BLOCK] userId=${userId} score=${score}`, details);
    } else if (level === 'alert') {
      this.logger.warn(`[ALERT] userId=${userId} score=${score}`, details);
    } else {
      this.logger.log(`[OK] userId=${userId} score=${score}`);
    }

    const message =
      level === 'block' ? 'Comportement suspect détecté — session révoquée' :
      level === 'alert' ? `Alerte sécurité : contexte de connexion modifié (score ${score})` :
      null;

    return { score, level, message };
  }

  getLogsForUser(userId: string): SecurityLog[] {
    return this.logs.filter((l) => l.userId === userId).slice(-50);
  }

  getAllLogs(): SecurityLog[] {
    return this.logs.slice(-100);
  }
}

import { ROOM_CODE_LENGTH } from '@fruitbox/shared';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Omit I and O to avoid confusion with 1 and 0

export function generateRoomCode(existingCodes: Set<string>): string {
  let code: string;
  let attempts = 0;
  do {
    code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    attempts++;
    if (attempts > 1000) {
      throw new Error('Unable to generate unique room code');
    }
  } while (existingCodes.has(code));
  return code;
}

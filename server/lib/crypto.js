export function genJti() {
  return crypto.randomBytes(16).toString('hex');
}
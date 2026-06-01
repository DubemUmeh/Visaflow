/**
 * Generates human-readable reference numbers for applications and support tickets.
 */

export function generateApplicationReference(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999999)
    .toString()
    .padStart(6, '0');
  return `VF-${year}-${random}`;
}

export function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 999999)
    .toString()
    .padStart(6, '0');
  return `TKT-${year}-${random}`;
}

export function generateApiKeyPrefix(): string {
  return `vf_live_${Math.random().toString(36).slice(2, 10)}`;
}

export const RESTRICTED_INDIAN_STATES = [
  'Assam',
  'Odisha',
  'Telangana',
  'Andhra Pradesh',
  'Nagaland',
  'Sikkim'
] as const;

export const RESTRICTED_STATE_CODES = ['AS', 'OR', 'TG', 'AP', 'NL', 'SK'] as const;

export function isStateRestricted(stateNameOrCode?: string): boolean {
  if (!stateNameOrCode) return false;
  const normalized = stateNameOrCode.trim().toLowerCase();

  const isRestrictedName = RESTRICTED_INDIAN_STATES.some(
    state => state.toLowerCase() === normalized
  );

  const isRestrictedCode = RESTRICTED_STATE_CODES.some(
    code => code.toLowerCase() === normalized
  );

  return isRestrictedName || isRestrictedCode;
}

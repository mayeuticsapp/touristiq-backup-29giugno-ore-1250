/**
 * Utility functions per gestione codici temporanei
 */

export function isTemporaryCode(iqCode: string): boolean {
  // Riconosce formato maiuscolo: IQCODE-PRIMOACCESSO-XXXXX
  return iqCode.toUpperCase().startsWith('IQCODE-PRIMOACCESSO-');
}

export function isValidTempCodeFormat(iqCode: string): boolean {
  const tempCodeRegex = /^IQCODE-PRIMOACCESSO-\d{5}$/i; // case-insensitive
  return tempCodeRegex.test(iqCode);
}

export function extractTempCodeNumber(iqCode: string): string | null {
  if (!isTemporaryCode(iqCode)) return null;
  
  const parts = iqCode.split('-');
  return parts[2] || null;
}
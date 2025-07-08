/**
 * Utility functions per gestione codici temporanei
 */

export function isTemporaryCode(iqCode: string): boolean {
  // Riconosce formato semantico: iqcode-primoaccesso-XXXXX
  return iqCode.startsWith('iqcode-primoaccesso-');
}

export function isValidTempCodeFormat(iqCode: string): boolean {
  const tempCodeRegex = /^iqcode-primoaccesso-\d{5}$/;
  return tempCodeRegex.test(iqCode);
}

export function extractTempCodeNumber(iqCode: string): string | null {
  if (!isTemporaryCode(iqCode)) return null;
  
  const parts = iqCode.split('-');
  return parts[2] || null;
}
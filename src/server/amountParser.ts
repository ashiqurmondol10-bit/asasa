/**
 * Helper to detect amount and currency from caption text
 * E.g. "Payment $100", "100 USD", "Sent 250.50 EUR", "Amount: 75.00"
 */
export interface ParsedAmount {
  amount: number;
  currency: string;
  detected: boolean;
}

export function parseCaptionAmount(caption?: string): ParsedAmount {
  if (!caption || typeof caption !== 'string') {
    return { amount: 0, currency: 'USD', detected: false };
  }

  const text = caption.trim();

  // Pattern 1: $100.50 or €100 or £100
  const symbolMatch = text.match(/(?:[\$€£¥₹])\s*([0-9]+(?:[\.,][0-9]{1,2})?)/i);
  if (symbolMatch && symbolMatch[1]) {
    const rawVal = symbolMatch[1].replace(',', '.');
    const val = parseFloat(rawVal);
    if (!isNaN(val) && val > 0) {
      const symbol = text[symbolMatch.index || 0];
      const currency = symbol === '€' ? 'EUR' : symbol === '£' ? 'GBP' : symbol === '¥' ? 'JPY' : symbol === '₹' ? 'INR' : 'USD';
      return { amount: val, currency, detected: true };
    }
  }

  // Pattern 2: 100.50 USD / EUR / GBP / USDT
  const codeMatch = text.match(/([0-9]+(?:[\.,][0-9]{1,2})?)\s*(USD|EUR|GBP|USDT|AUD|CAD|CHF|CNY|INR|JPY|MYR|SGD)/i);
  if (codeMatch && codeMatch[1]) {
    const rawVal = codeMatch[1].replace(',', '.');
    const val = parseFloat(rawVal);
    if (!isNaN(val) && val > 0) {
      return { amount: val, currency: codeMatch[2].toUpperCase(), detected: true };
    }
  }

  // Pattern 3: "Amount: 100" or "Paid 100"
  const wordMatch = text.match(/(?:amount|paid|payment|pay|total|sum|sent)[\s:]*([0-9]+(?:[\.,][0-9]{1,2})?)/i);
  if (wordMatch && wordMatch[1]) {
    const rawVal = wordMatch[1].replace(',', '.');
    const val = parseFloat(rawVal);
    if (!isNaN(val) && val > 0) {
      return { amount: val, currency: 'USD', detected: true };
    }
  }

  // Pattern 4: Bare number at start or end if solitary
  const bareNumberMatch = text.match(/\b([0-9]+(?:[\.,][0-9]{1,2})?)\b/);
  if (bareNumberMatch && bareNumberMatch[1]) {
    const rawVal = bareNumberMatch[1].replace(',', '.');
    const val = parseFloat(rawVal);
    if (!isNaN(val) && val > 0 && val < 1000000) {
      return { amount: val, currency: 'USD', detected: true };
    }
  }

  return { amount: 0, currency: 'USD', detected: false };
}

export function generatePaymentId(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `PAY-${yyyy}${mm}${dd}-${randomSuffix}`;
}

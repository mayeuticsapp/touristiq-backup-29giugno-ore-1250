// Categorie predefinite per il mini gestionale turistico

export const INCOME_CATEGORIES = [
  { id: 'rooms', label: 'Camere', icon: '🏨' },
  { id: 'breakfast', label: 'Colazioni', icon: '☕' },
  { id: 'extra_services', label: 'Extra Servizi', icon: '🛎️' },
  { id: 'iqcodes_sold', label: 'IQCode Venduti', icon: '🎫' },
  { id: 'parking', label: 'Parcheggio', icon: '🚗' },
  { id: 'restaurant', label: 'Ristorazione', icon: '🍽️' },
  { id: 'wellness', label: 'Wellness/SPA', icon: '💆' },
  { id: 'tours', label: 'Tour/Escursioni', icon: '🗺️' },
  { id: 'other_income', label: 'Altre Entrate', icon: '💰' }
];

export const EXPENSE_CATEGORIES = [
  { id: 'ota_commissions', label: 'Commissioni OTA', icon: '💳' },
  { id: 'iqcodes_cost', label: 'Costo IQCode', icon: '🎫' },
  { id: 'supplies', label: 'Forniture', icon: '📦' },
  { id: 'cleaning', label: 'Pulizie', icon: '🧹' },
  { id: 'laundry', label: 'Lavanderia', icon: '👕' },
  { id: 'maintenance', label: 'Manutenzioni', icon: '🔧' },
  { id: 'utilities', label: 'Utenze', icon: '⚡' },
  { id: 'marketing', label: 'Marketing', icon: '📢' },
  { id: 'staff', label: 'Personale', icon: '👥' },
  { id: 'other_expense', label: 'Altre Spese', icon: '💸' }
];

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Contanti', icon: '💵' },
  { id: 'card', label: 'Carta', icon: '💳' },
  { id: 'bank_transfer', label: 'Bonifico', icon: '🏦' },
  { id: 'paypal', label: 'PayPal', icon: '📱' },
  { id: 'sumup', label: 'SumUp', icon: '📲' },
  { id: 'other', label: 'Altro', icon: '❓' }
];

export function getCategoryById(categoryId: string, type: 'income' | 'expense') {
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return categories.find(cat => cat.id === categoryId);
}

export function getPaymentMethodById(methodId: string) {
  return PAYMENT_METHODS.find(method => method.id === methodId);
}
/**
 * Formatea un número como moneda de Nicaragua (Córdobas C$)
 * @param {number} amount - El monto a formatear
 * @returns {string} - El monto formateado como C$ 1,234.56
 */
export const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 'C$ 0.00';
    
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);

    return `C$ ${formatted}`;
};

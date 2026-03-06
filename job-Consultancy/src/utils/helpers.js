
export const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')     // Remove all non-word chars
        .replace(/--+/g, '-')       // Replace multiple - with single -
        .replace(/^-+/, '')         // Trim - from start of text
        .replace(/-+$/, '');        // Trim - from end of text
};

export const formatIndianNumber = (amount) => {
    if (!amount && amount !== 0) return '';
    
    const format = (val) => {
        const strVal = val.toString().trim();
        // Check if value is purely numeric (possibly with commas)
        if (/^[\d,]+$/.test(strVal)) {
            const numStr = strVal.replace(/[^\d]/g, '');
            const num = parseInt(numStr, 10);
            if (!isNaN(num)) {
                return new Intl.NumberFormat('en-IN').format(num);
            }
        }
        // If it contains letters (like LPA, K, etc), return exactly what user typed
        return val;
    };

    // Handle ranges like "10000 - 20000"
    if (typeof amount === 'string' && amount.includes('-')) {
        return amount.split('-').map(part => format(part.trim())).join(' - ');
    }

    return format(amount);
};


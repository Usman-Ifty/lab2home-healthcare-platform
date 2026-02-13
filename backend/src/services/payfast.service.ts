import crypto from 'crypto';

interface PayFastData {
    [key: string]: string | number | undefined;
}

/**
 * Generates a PayFast signature for the given data.
 * @param data The data to sign.
 * @param passphrase The PayFast passphrase.
 * @returns The MD5 signature.
 */
export const generateSignature = (data: PayFastData, passphrase?: string): string => {
    // 1. Create a string of key-value pairs separated by '&'
    // Keys must be in a specific order and empty values should be excluded
    const keys = Object.keys(data).filter(key => data[key] !== undefined && data[key] !== '');

    // PayFast requires signature to NOT be part of the signature string
    const filteredKeys = keys.filter(key => key !== 'signature');

    const signatureString = filteredKeys
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(String(data[key]).trim()).replace(/%20/g, '+')}`)
        .join('&');

    // 2. Append the passphrase if it exists
    const finalString = passphrase
        ? `${signatureString}&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`
        : signatureString;

    // 3. Generate MD5 hash
    return crypto.createHash('md5').update(finalString).digest('hex');
};

/**
 * Prepares the data for a PayFast payment redirect.
 */
export const generatePaymentData = (orderData: {
    orderId: string;
    amount: number;
    itemName: string;
    itemDescription?: string;
    patientEmail: string;
    patientName: string;
    notifyUrl?: string;
}) => {
    const merchantId = process.env.PAYFAST_MERCHANT_ID;
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    const returnUrl = process.env.PAYFAST_RETURN_URL;
    const cancelUrl = process.env.PAYFAST_CANCEL_URL;
    const notifyUrl = orderData.notifyUrl || process.env.PAYFAST_NOTIFY_URL;

    const data: PayFastData = {
        merchant_id: merchantId,
        merchant_key: merchantKey,
        return_url: returnUrl,
        cancel_url: cancelUrl,
        notify_url: notifyUrl,
        name_first: orderData.patientName.split(' ')[0],
        name_last: orderData.patientName.split(' ').slice(1).join(' ') || 'User',
        email_address: orderData.patientEmail,
        m_payment_id: orderData.orderId,
        amount: orderData.amount.toFixed(2),
        item_name: orderData.itemName,
        item_description: orderData.itemDescription || orderData.itemName,
    };

    const signature = generateSignature(data, passphrase);

    return {
        ...data,
        signature,
        action_url: `${process.env.PAYFAST_BASE_URL}/eng/process`
    };
};

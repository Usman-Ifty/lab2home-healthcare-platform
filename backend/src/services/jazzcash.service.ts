import crypto from 'crypto';

interface JazzCashData {
    [key: string]: string | number;
}

export const generateSignature = (data: JazzCashData, salt: string): string => {
    // JazzCash requires sorting the keys alphabetically, then concating '&' separated, prepended by the salt
    // Only non-empty values
    const validKeys = Object.keys(data).filter(key => data[key] !== '' && data[key] !== undefined && key !== 'pp_SecureHash');
    validKeys.sort();

    const sortedValues = validKeys.map(key => data[key]).join('&');
    const hashString = `${salt}&${sortedValues}`;
    
    return crypto
        .createHmac('sha256', salt)
        .update(hashString)
        .digest('hex')
        .toUpperCase();
};

export const generatePaymentData = (orderData: {
    orderId: string;
    amount: number;
    description: string;
    returnUrl?: string; // e.g. /payment-success?type=order
}) => {
    // format datetime: YYYYMMDDHHmmss
    const now = new Date();
    const txnDateTime = now.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    
    // expiry 1 hour later
    const expiry = new Date(now.getTime() + 3600000);
    const txnExpiryDateTime = expiry.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);

    const params: any = {
        pp_Version: '1.1',
        pp_TxnType: 'MIGS',
        pp_Language: 'EN',
        pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID || '',
        pp_Password: process.env.JAZZCASH_PASSWORD || '',
        pp_TxnRefNo: `T${txnDateTime}${orderData.orderId.substring(0, 4)}`, // Transaction reference
        pp_Amount: String(Math.round(orderData.amount * 100)), // paisas
        pp_TxnCurrency: 'PKR',
        pp_TxnDateTime: txnDateTime,
        pp_BillReference: `billRef${orderData.orderId.substring(0, 8)}`,
        pp_Description: orderData.description || 'Payment',
        pp_TxnExpiryDateTime: txnExpiryDateTime,
        pp_ReturnURL: orderData.returnUrl || process.env.JAZZCASH_RETURN_URL || 'http://localhost:8080/api/payments/jazzcash-return',
        ppmpf_1: orderData.orderId, // store real order id here to retrieve in return URL validation
        ppmpf_2: '2',
        ppmpf_3: '3',
        ppmpf_4: '4',
        ppmpf_5: '5',
    };

    const salt = process.env.JAZZCASH_INTEGRITY_SALT || '';
    params.pp_SecureHash = generateSignature(params, salt);

    return {
        ...params,
        action_url: process.env.JAZZCASH_URL || 'https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform'
    };
};

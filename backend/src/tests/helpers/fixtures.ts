/**
 * Reusable test fixture factories for creating valid model instances.
 * Avoids repetition of schema-compliant mock data across test files.
 */

// ── Patient Fixtures ──
export const validPatientData = {
    fullName: 'Test Patient',
    email: 'patient@example.com',
    phone: '+1234567890',
    dateOfBirth: '1990-01-01',
    age: 34,
    address: '123 Main St',
    password: 'Password123!',
};

// ── Lab Fixtures ──
export const validLabData = {
    fullName: 'Test Lab Owner',
    email: 'lab@example.com',
    phone: '+0987654321',
    labName: 'Central Diagnostics',
    labAddress: '456 Lab St.',
    password: 'Password123!',
};

export const validLabLicense = {
    data: Buffer.from('fake pdf content'),
    contentType: 'application/pdf',
    filename: 'license.pdf',
    size: 16,
};

// ── Phlebotomist Fixtures ──
export const validPhlebotomistData = {
    fullName: 'Test Phlebotomist',
    email: 'phleb@example.com',
    phone: '+1122334455',
    qualification: 'Certified Phlebotomist Technician (CPT)',
    password: 'Password123!',
};

export const validTrafficLicense = {
    data: Buffer.from('fake image content'),
    contentType: 'image/jpeg',
    filename: 'license.jpg',
    size: 16,
};

// ── Admin Fixtures ──
export const validAdminData = {
    fullName: 'System Admin',
    email: 'admin@lab2home.com',
    password: 'Password123!',
    isActive: true,
};

// ── Product Fixtures ──
export const sampleProducts = [
    {
        name: 'Blood Pressure Monitor',
        description: 'Accurate home monitoring equipment.',
        category: 'Monitoring Equipment',
        price: 50,
        stock: 100,
        isActive: true,
        isFeatured: true,
        tags: ['health', 'monitor', 'pressure'],
    },
    {
        name: 'Vitamin C Supplement',
        description: '1000mg orange flavor.',
        category: 'Supplements',
        price: 15,
        stock: 200,
        isActive: true,
        isFeatured: true,
        tags: ['vitamin', 'health', 'immunity'],
    },
    {
        name: 'Adhesive Bandages',
        description: 'Pack of 100 standard bandages.',
        category: 'First Aid',
        price: 5,
        stock: 500,
        isActive: true,
        isFeatured: false,
        tags: ['injury', 'cut'],
    },
    {
        name: 'Discontinued Wheelchair',
        description: 'No longer actively sold.',
        category: 'Medical Supplies',
        price: 250,
        stock: 0,
        isActive: false,
        isFeatured: false,
        tags: ['mobility'],
    },
];

// ── Test (Medical) Fixtures ──
export const sampleMedicalTests = [
    {
        name: 'Complete Blood Count',
        description: 'Standard CBC',
        category: 'Blood Test',
        basePrice: 50,
        reportDeliveryTime: '24 hours',
    },
    {
        name: 'Liver Function Test',
        description: 'Standard LFT',
        category: 'Pathology',
        basePrice: 100,
        reportDeliveryTime: '24 hours',
    },
    {
        name: 'Random Unoffered Test',
        description: 'Not offered by lab',
        category: 'Other',
        basePrice: 200,
        reportDeliveryTime: '48 hours',
    },
];

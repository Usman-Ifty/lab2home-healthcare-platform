import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Test from '../models/Test';

dotenv.config();

const tests = [
    {
        name: 'Complete Blood Count (CBC)',
        description: 'Measures different components of blood including red blood cells, white blood cells, and platelets',
        category: 'Blood Test',
        basePrice: 500,
        preparationInstructions: 'No special preparation required. Can be done at any time.',
        reportDeliveryTime: '24 hours',
        sampleType: 'Blood',
        isActive: true,
    },
    {
        name: 'Lipid Panel',
        description: 'Measures cholesterol and triglycerides levels to assess heart disease risk',
        category: 'Blood Test',
        basePrice: 800,
        preparationInstructions: 'Fasting for 9-12 hours required before the test.',
        reportDeliveryTime: '24 hours',
        sampleType: 'Blood',
        isActive: true,
    },
    {
        name: 'Thyroid Function Test (TFT)',
        description: 'Measures thyroid hormone levels to check thyroid gland function',
        category: 'Blood Test',
        basePrice: 1200,
        preparationInstructions: 'No special preparation required.',
        reportDeliveryTime: '48 hours',
        sampleType: 'Blood',
        isActive: true,
    },
    {
        name: 'Blood Sugar (Fasting)',
        description: 'Measures blood glucose levels after fasting to screen for diabetes',
        category: 'Blood Test',
        basePrice: 300,
        preparationInstructions: 'Fasting for 8-10 hours required.',
        reportDeliveryTime: 'Same day',
        sampleType: 'Blood',
        isActive: true,
    },
    {
        name: 'Liver Function Test (LFT)',
        description: 'Measures enzymes and proteins to assess liver health',
        category: 'Blood Test',
        basePrice: 900,
        preparationInstructions: 'No special preparation required.',
        reportDeliveryTime: '24 hours',
        sampleType: 'Blood',
        isActive: true,
    },
    {
        name: 'Kidney Function Test (KFT)',
        description: 'Measures creatinine and urea levels to assess kidney function',
        category: 'Blood Test',
        basePrice: 850,
        preparationInstructions: 'No special preparation required.',
        reportDeliveryTime: '24 hours',
        sampleType: 'Blood',
        isActive: true,
    },
    {
        name: 'Urine Complete Examination',
        description: 'Comprehensive urine analysis to detect various conditions',
        category: 'Urine Test',
        basePrice: 400,
        preparationInstructions: 'Collect first morning urine sample in a clean container.',
        reportDeliveryTime: '24 hours',
        sampleType: 'Urine',
        isActive: true,
    },
    {
        name: 'Chest X-Ray',
        description: 'Imaging test to examine the chest, lungs, and heart',
        category: 'Radiology',
        basePrice: 1500,
        preparationInstructions: 'Remove all metal objects and jewelry from chest area.',
        reportDeliveryTime: 'Same day',
        sampleType: 'N/A',
        isActive: true,
    },
    {
        name: 'ECG (Electrocardiogram)',
        description: 'Records electrical activity of the heart to detect abnormalities',
        category: 'Cardiology',
        basePrice: 1000,
        preparationInstructions: 'Wear loose, comfortable clothing.',
        reportDeliveryTime: 'Same day',
        sampleType: 'N/A',
        isActive: true,
    },
    {
        name: 'HbA1c (Glycated Hemoglobin)',
        description: 'Measures average blood sugar levels over the past 2-3 months',
        category: 'Blood Test',
        basePrice: 1100,
        preparationInstructions: 'No fasting required.',
        reportDeliveryTime: '48 hours',
        sampleType: 'Blood',
        isActive: true,
    },
    {
        name: 'Vitamin D Test',
        description: 'Measures vitamin D levels in the blood',
        category: 'Blood Test',
        basePrice: 2000,
        preparationInstructions: 'No special preparation required.',
        reportDeliveryTime: '48 hours',
        sampleType: 'Blood',
        isActive: true,
    },
    {
        name: 'COVID-19 PCR Test',
        description: 'Molecular test to detect active COVID-19 infection',
        category: 'Pathology',
        basePrice: 3500,
        preparationInstructions: 'No eating or drinking 30 minutes before the test.',
        reportDeliveryTime: '24 hours',
        sampleType: 'Nasal Swab',
        isActive: true,
    },
];

const seedTests = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lab2home');
        console.log('✅ Connected to MongoDB');

        // Clear existing tests
        await Test.deleteMany({});
        console.log('🗑️  Cleared existing tests');

        // Insert new tests
        const insertedTests = await Test.insertMany(tests);
        console.log(`✅ Inserted ${insertedTests.length} tests`);

        console.log('\n📋 Test Categories:');
        const categories = await Test.distinct('category');
        categories.forEach(cat => console.log(`   - ${cat}`));

        console.log('\n✨ Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding tests:', error);
        process.exit(1);
    }
};

seedTests();

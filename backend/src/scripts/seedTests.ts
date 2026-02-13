import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Test from '../models/Test';
import Lab from '../models/Lab';
import connectDatabase from '../config/database';

dotenv.config();

const testsToSeed = [
    {
        name: 'Full Blood Count (CBC)',
        description: 'A complete blood count suitable for general health checkups, anemia, and infections.',
        category: 'Blood Test',
        basePrice: 1500, // PKR
        reportDeliveryTime: '24 hours',
        sampleType: 'Blood',
        preparationInstructions: 'No fasting required.'
    },
    {
        name: 'Lipid Profile',
        description: 'Measures cholesterol and triglyceride levels to assess heart health.',
        category: 'Blood Test',
        basePrice: 2500, // PKR
        reportDeliveryTime: '24 hours',
        sampleType: 'Blood',
        preparationInstructions: '10-12 hours fasting required.'
    },
    {
        name: 'Liver Function Test (LFT)',
        description: 'Screening for liver inflammation and damage (AST, ALT, Bilirubin).',
        category: 'Blood Test',
        basePrice: 2000, // PKR
        reportDeliveryTime: '24 hours',
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation needed.'
    },
    {
        name: 'Kidney Function Test (RFT)',
        description: 'Evaluates how well kidneys are working (Creatinine, Urea, Electrolytes).',
        category: 'Blood Test',
        basePrice: 2200, // PKR
        reportDeliveryTime: '24 hours',
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation needed.'
    },
    {
        name: 'HbA1c',
        description: 'Average blood sugar level over the past 3 months. Essential for diabetes management.',
        category: 'Blood Test',
        basePrice: 1800, // PKR
        reportDeliveryTime: '24 hours',
        sampleType: 'Blood',
        preparationInstructions: 'No fasting required.'
    },
    {
        name: 'Thyroid Profile (T3, T4, TSH)',
        description: 'Checks thyroid gland function.',
        category: 'Blood Test',
        basePrice: 3500, // PKR
        reportDeliveryTime: '24-48 hours',
        sampleType: 'Blood',
        preparationInstructions: 'No fasting required, but morning sample is preferred.'
    },
    {
        name: 'Urine Routine Examination',
        description: 'Screening for urinary tract infections (UTI), kidney disease, and diabetes.',
        category: 'Urine Test',
        basePrice: 800, // PKR
        reportDeliveryTime: '6-12 hours',
        sampleType: 'Urine',
        preparationInstructions: 'Mid-stream urine sample preferred.'
    },
    {
        name: 'Vitamin D (Total)',
        description: 'Checks for Vitamin D deficiency which is common and affects bone health.',
        category: 'Blood Test',
        basePrice: 4500, // PKR
        reportDeliveryTime: '48 hours',
        sampleType: 'Blood',
        preparationInstructions: 'No fasting required.'
    },
    {
        name: 'Dengue NS1 Antigen',
        description: 'Early detection of Dengue virus infection.',
        category: 'Pathology',
        basePrice: 2800, // PKR
        reportDeliveryTime: '4-6 hours',
        sampleType: 'Blood',
        preparationInstructions: 'No special preparation needed.'
    },
    {
        name: 'COVID-19 PCR Test',
        description: 'Polymerase Chain Reaction test for SARS-CoV-2 detection.',
        category: 'Pathology',
        basePrice: 4000, // PKR // Adjusted from pandemic highs to standard current rates
        reportDeliveryTime: '12-24 hours',
        sampleType: 'Nasopharyngeal Swab',
        preparationInstructions: 'No special preparation needed.'
    }
];

const seedTests = async () => {
    try {
        await connectDatabase();

        console.log('🌱 Starting Test Seeder...');

        // 1. Clear existing tests (Optional - safer for development)
        // await Test.deleteMany({});
        // console.log('🗑️  Cleared existing tests');

        // 2. Insert Tests or Update if exists
        const actualTests = [];
        for (const testData of testsToSeed) {
            const test = await Test.findOneAndUpdate(
                { name: testData.name }, // Find by name
                testData, // Update with new data (including PKR prices)
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            actualTests.push(test);
            console.log(`✅ Seeded: ${test.name} - Rs. ${test.basePrice}`);
        }

        // 3. Optional: Assign these tests to ALL Labs for easier testing
        // This ensures that when you go to "Book Test", all Labs have these tests available.
        const labs = await Lab.find();
        if (labs.length > 0) {
            console.log(`🔗 Linking tests to ${labs.length} labs...`);
            const testIds = actualTests.map(t => t._id);

            for (const lab of labs) {
                // Merge new test IDs with existing ones, avoiding duplicates
                // Convert ObjectId to string for comparison, then set back
                const existingIds = lab.availableTests.map(id => id.toString());
                const newIds = testIds.map(id => id.toString());
                const combinedIds = Array.from(new Set([...existingIds, ...newIds]));

                lab.availableTests = combinedIds as any;
                lab.hasConfiguredTests = true;
                await lab.save();
            }
            console.log('✅ All labs updated with new tests.');
        } else {
            console.log('⚠️ No labs found. Tests seeded but not linked to any lab yet.');
        }

        console.log('✨ Seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedTests();

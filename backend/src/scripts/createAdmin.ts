import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin';

// Load environment variables
dotenv.config();

const createAdmin = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lab2home';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: 'f228814@cfd.nu.edu.pk' });

        if (existingAdmin) {
            console.log('⚠️  Admin already exists with email: f228814@cfd.nu.edu.pk');
            process.exit(0);
        }

        // Create admin
        const admin = new Admin({
            email: 'f228814@cfd.nu.edu.pk',
            password: 'ABC@1234',
            isActive: true,
        });

        await admin.save();

        console.log('🎉 Admin created successfully!');
        console.log('📧 Email: f228814@cfd.nu.edu.pk');
        console.log('🔑 Password: ABC@1234');
        console.log('');
        console.log('⚠️  IMPORTANT: Please change the password after first login!');

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error creating admin:', error.message);
        process.exit(1);
    }
};

createAdmin();

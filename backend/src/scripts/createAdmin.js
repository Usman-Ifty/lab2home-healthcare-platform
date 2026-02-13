const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: __dirname + '/../../.env' });

// Define Admin schema inline
const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

// Hash password before saving
adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

const Admin = mongoose.model('Admin', adminSchema);

async function createAdmin() {
    try {
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            console.error('❌ MONGODB_URI not found in .env file');
            process.exit(1);
        }

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);

        console.log('✅ Connected successfully!');
        console.log('📊 Database:', mongoose.connection.db.databaseName);
        console.log('');

        // Delete existing admins
        const deleteResult = await Admin.deleteMany({});
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing admin(s)`);
        console.log('');

        // Create new admin
        const admin = new Admin({
            email: 'f228814@cfd.nu.edu.pk',
            password: 'ABC@1234',
            isActive: true,
        });

        await admin.save();

        console.log('🎉 Admin created successfully!');
        console.log('');
        console.log('📧 Email: f228814@cfd.nu.edu.pk');
        console.log('🔑 Password: ABC@1234');
        console.log('📊 Database:', mongoose.connection.db.databaseName);
        console.log('📦 Collection: admins');
        console.log('');
        console.log('⚠️  IMPORTANT: Change password after first login!');
        console.log('');

        await mongoose.connection.close();
        console.log('✅ Connection closed');
        process.exit(0);
    } catch (error) {
        console.error('');
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

createAdmin();

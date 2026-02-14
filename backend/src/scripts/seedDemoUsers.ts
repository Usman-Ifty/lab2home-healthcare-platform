import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from '../models/Patient';
import Lab from '../models/Lab';
import Phlebotomist from '../models/Phlebotomist';
import Admin from '../models/Admin';
import connectDatabase from '../config/database';

dotenv.config();

const demoUsers = {
    patient: {
        fullName: 'Demo Patient',
        email: 'patient@lab2home.com',
        password: 'patient12345',
        phone: '03001234567',
        dateOfBirth: new Date('1990-01-01'),
        address: '123 Street, City, Country',
        isVerified: true,
        isActive: true
    },
    lab: {
        fullName: 'Lab Contact person',
        email: 'lab@lab2home.com',
        password: 'lab12345',
        phone: '03007654321',
        labName: 'Demo Diagnostic Lab',
        labAddress: '456 Lab Plaza, Healthcare Ave',
        license: {
            data: Buffer.from('placeholder license data'),
            contentType: 'application/pdf',
            filename: 'license.pdf',
            size: 1024
        },
        isVerified: true,
        isActive: true
    },
    phlebotomist: {
        fullName: 'John Phleb',
        email: 'phlebotomist@lab2home.com',
        password: 'phleb12345',
        phone: '03009998887',
        qualification: 'Certified Phlebotomist',
        trafficLicense: {
            data: Buffer.from('placeholder license data'),
            contentType: 'image/jpeg',
            filename: 'license.jpg',
            size: 1024
        },
        isVerified: true,
        isActive: true
    },
    admin: {
        email: 'admin@lab2home.com',
        password: 'admin12345',
        isActive: true
    }
};

const seedDemoUsers = async () => {
    try {
        await connectDatabase();
        console.log('🌱 Starting Demo User Seeder...');

        // 1. Seed Admin
        const existingAdmin = await Admin.findOne({ email: demoUsers.admin.email });
        if (!existingAdmin) {
            await Admin.create(demoUsers.admin);
            console.log('✅ Admin user seeded');
        } else {
            console.log('ℹ️ Admin user already exists');
        }

        // 2. Seed Patient
        const existingPatient = await Patient.findOne({ email: demoUsers.patient.email });
        if (!existingPatient) {
            await Patient.create(demoUsers.patient);
            console.log('✅ Patient user seeded');
        } else {
            console.log('ℹ️ Patient user already exists');
        }

        // 3. Seed Lab
        const existingLab = await Lab.findOne({ email: demoUsers.lab.email });
        if (!existingLab) {
            await Lab.create(demoUsers.lab);
            console.log('✅ Lab user seeded');
        } else {
            console.log('ℹ️ Lab user already exists');
        }

        // 4. Seed Phlebotomist
        const existingPhleb = await Phlebotomist.findOne({ email: demoUsers.phlebotomist.email });
        if (!existingPhleb) {
            await Phlebotomist.create(demoUsers.phlebotomist);
            console.log('✅ Phlebotomist user seeded');
        } else {
            console.log('ℹ️ Phlebotomist user already exists');
        }

        console.log('✨ Demo users seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedDemoUsers();

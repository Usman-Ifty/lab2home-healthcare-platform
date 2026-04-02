import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function listRecent() {
    const uri = process.env.MONGODB_URI;
    console.log(`📡 Connecting to: ${uri ? uri.substring(0, 20) + '...' : 'UNDEFINED'}`);

    if (!uri) {
        console.error('❌ MONGODB_URI not found');
        return;
    }

    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;
        
        console.log('✅ Connected to MongoDB');
        
        const collections = ['bookings', 'orders'];
        for (const colName of collections) {
            console.log(`\n📂 Collection: ${colName}`);
            const col = db.collection(colName);
            const recent = await col.find().sort({createdAt: -1}).limit(5).toArray();
            if (recent.length === 0) {
                console.log('  No records found.');
            }
            recent.forEach(r => {
                console.log(`  ID: ${r._id}, status: ${r.status}, paymentStatus: ${r.paymentStatus}, createdAt: ${r.createdAt}`);
            });
        }

    } catch (err) {
        console.error('❌ Error during listRecent:', err);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected');
    }
}

listRecent();

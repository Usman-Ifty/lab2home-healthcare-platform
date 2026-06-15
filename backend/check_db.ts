import mongoose from "mongoose";

const uri = "mongodb://admin:admin123lab2home@ac-khjjula-shard-00-00.nekggms.mongodb.net:27017,ac-khjjula-shard-00-01.nekggms.mongodb.net:27017,ac-khjjula-shard-00-02.nekggms.mongodb.net:27017/lab2home?ssl=true&authSource=admin&retryWrites=true&w=majority";

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const docs = await db.collection("aiinterpretations").find().sort({ createdAt: -1 }).limit(1).toArray();
  for (const doc of docs) {
    console.log("Overall:", doc.overallClassification);
    for (const res of doc.results || []) {
      console.log(`${res.testName}: ${res.patientValue} ${res.unit} | Range: ${res.normalMin}-${res.normalMax} | Status: ${res.status}`);
    }
  }
  process.exit(0);
}
run();

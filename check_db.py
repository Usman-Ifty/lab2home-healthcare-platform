import asyncio
from pymongo import MongoClient

async def test():
    client = MongoClient("mongodb://admin:admin123lab2home@ac-khjjula-shard-00-00.nekggms.mongodb.net:27017,ac-khjjula-shard-00-01.nekggms.mongodb.net:27017,ac-khjjula-shard-00-02.nekggms.mongodb.net:27017/lab2home?ssl=true&authSource=admin&retryWrites=true&w=majority")
    db = client.lab2home
    interpretations = db.aiinterpretations.find().sort("createdAt", -1).limit(1)
    
    for interp in interpretations:
        print("Overall:", interp.get("overallClassification"))
        for res in interp.get("results", []):
            print(f"{res['testName']}: {res['patientValue']} {res['unit']} | Range: {res['normalMin']}-{res['normalMax']} | Status: {res['status']}")

asyncio.run(test())

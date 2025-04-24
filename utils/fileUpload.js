
//-------------------------------------------------
//بينشء ملف جديد في قاعدة البيانات ويخزن فيه الصورة

const mongoose = require("mongoose");
const { MongoClient, GridFSBucket } = require("mongodb");

const dbName = "travel_app";
const mongoURI = `mongodb+srv://shehabwww153:cmCqBjtQCQDWbvlo@userauth.rvtb5.mongodb.net/${dbName}?retryWrites=true&w=majority&appName=userAuth`;

let gfsBucket;

mongoose.connect(mongoURI).then(() => {
  const client = new MongoClient(mongoURI);
  client.connect().then(() => {
    const db = client.db(dbName);
    gfsBucket = new GridFSBucket(db, { bucketName: "uploads" });
    console.log("✅ GridFSBucket initialized");
  });
});

function getGFSBucket() {
  return gfsBucket;
}

module.exports = { getGFSBucket };


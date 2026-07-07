const mongoose = require("mongoose");
const initData = require("./data.js")
const Listing = require("../models/listing.js");

// main()
//   .then(() => { console.log("Connected to Database") })
//   .catch(err => console.log(err));

// async function main() {
//   await mongoose.connect('mongodb://127.0.0.1:27017/travax');
// }

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

main()
  .then(() => {
    console.log("Connected to Atlas for seeding...");
    return initDB();
  })
  .catch(err => console.log("Seeding Connection Error:", err));

async function main() {
  await mongoose.connect(process.env.ATLASDB_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});
  initData.data = initData.data.map((obj) => ({ ...obj, owner: '6a4bdd3739b5da6e3b11e4ce' }));
  await Listing.insertMany(initData.data);
  console.log("data was initialized");
}

initDB();
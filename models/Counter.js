const mongoose = require("mongoose");

// const counterSchema = new mongoose.Schema({
//   _id: { type: String, required: true }, // اسم العداد (مثل "places_id", "users_id")
//   seq: { type: Number, default: 0 } // الرقم التسلسلي لكل مجموعة
// } , { collection: "Counter" });

// const counterSchema = new mongoose.Schema({
//   _id: { type: String, required: true }, // معرف العداد لكل مجموعة
//   seq: { type: Number, default: 0 } // القيمة الحالية للعداد
// }, { collection: "Counter" });



const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 }
},{ collection: "Counter" });

const Counter = mongoose.model("Counter", counterSchema);

module.exports = Counter;

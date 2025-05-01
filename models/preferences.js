const mongoose = require("mongoose");
const Counter = require("./Counter");

const preferenceSchema = new mongoose.Schema(
  {
    _id: { type: String }, // ✅ _id فيه التنسيق "preference001"
    user_id: { type: String, required: true, unique: true }, // معرف المستخدم
    destinations: [{ type: String, required: true ,
      enum :[
      "Cairo","Giza","Alexandria","Qalyubia","Dakahlia","Beheira","Gharbia","Sharqia","Monufia",
      "Kafr El Sheikh","Damietta","Port Said","Ismailia","Suez","North Sinai","South Sinai","Beni Suef",
      "Faiyum","Minya","Asyut","Sohag","Qena","Luxor","Aswan","Red Sea","New Valley","Matrouh"
     ]}], // قائمة الوجهات المفضلة
    travel_dates: { type: String, required: true }, // فترة السفر
    group_type: { type: String, enum: ["solo", "family", "friends", "couple"], required: true }, // نوع المجموعة
    accessibility_needs: [{ type: String, enum: ["senior-friendly", "pet-friendly", "wheelchair-friendly"] }], // متطلبات الوصول
    budget: { type: String, enum: ["low", "medium", "high"], default: "medium" } // الميزانية
  },
  { collection: "user_travel_preferences" }
);

// ✅ توليد _id بشكل تلقائي بالتنسيق "preference001"
preferenceSchema.pre("validate", async function (next) {
  if (this.isNew) {
    try {
      const counterDoc = await Counter.findByIdAndUpdate(
        { _id: "user_travel_preferences_id" },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );

      const number = counterDoc.seq.toString().padStart(3, '0');
      this._id = `pref${number}`;

    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("Preference", preferenceSchema);


//---------------------------------------------------------------

//              ده بيذود بالرقم التسلسلي بس 

// const mongoose = require("mongoose");
// const Counter = require("./Counter");

// const preferenceSchema = new mongoose.Schema(
//   {
//     _id: { type: Number }, // رقم معرف فريد
//     user_id: { type: String, required: true, unique: true }, // معرف المستخدم
//     destinations: [{ type: String, required: true }], // قائمة الوجهات المفضلة
//     travel_dates: { type: String, required: true }, // فترة السفر (مثل "May 2024")
//     group_type: { type: String, enum: ["solo", "family", "friends", "couple"], required: true }, // نوع المجموعة
//     accessibility_needs: [{ type: String }], // متطلبات الوصول (مثل "wheelchair access")
//     budget: { type: String, enum: ["low", "medium", "high"], default: "medium" } // ميزانية السفر
//   },
//   { collection: "user_travel_preferences" }
// );

// // ✅ توليد `_id` تلقائيًا بناءً على آخر قيمة موجودة في القاعدة
// preferenceSchema.pre("validate", async function (next) {
//   if (this.isNew) {
//     try {
//       // 🔹 الحصول على آخر `id` مسجل حاليًا
//       const lastPreference = await mongoose.model("Preference").findOne({}, {}, { sort: { _id: -1 } });

//       let newId = 1; // القيمة الافتراضية لأول إدخال
//       if (lastPreference) {
//         newId = lastPreference._id + 1; // اجعل الرقم الجديد بعد آخر إدخال موجود
//       }

//       this._id = newId; // تعيين `_id` للوثيقة الجديدة

//       // 🔹 تحديث العداد `Counter`
//       await Counter.findByIdAndUpdate(
//         { _id: "user_travel_preferences_id" },
//         { seq: newId }, // تحديث `seq` ليعكس الرقم الجديد
//         { upsert: true } // إن لم يكن موجودًا، يتم إنشاؤه
//       );

//     } catch (err) {
//       return next(err);
//     }
//   }
//   next();
// });

// module.exports = mongoose.model("Preference", preferenceSchema);


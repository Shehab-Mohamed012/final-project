const mongoose = require("mongoose");
const Counter = require("./Counter");

const interactionSchema = new mongoose.Schema(
  {
    _id: { type: String }, // ✅ _id يحتوي على التنسيق "interaction001"
    user_id: { type: String, required: true }, // معرف المستخدم
    place_id: { type: String, required: true }, // معرف المكان
    interaction_type: {
      type: String,
      enum: ["like", "save", "view", "share"],// أنواع التفاعل المسموحة
      // like : بيسمع في المكان
      // save :  بيحفظ المكان في قائمة المفضلات عند اليوزر
      // view : بيشوف تفاصيل المكان
      // share : بيظهرله لنك المكان في  الأبليكاشن
      required: true
    },
    timestamp: { type: Date, default: Date.now } // وقت التفاعل
  },
  { collection: "interactions" }
);

// ✅ توليد _id بشكل أوتوماتيك بالتنسيق "interaction001"
interactionSchema.pre("validate", async function (next) {
  if (this.isNew) {
    try {
      const counterDoc = await Counter.findByIdAndUpdate(
        { _id: "interactions_id" },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );

      const number = counterDoc.seq.toString().padStart(3, '0');
      this._id = `interaction${number}`;

    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("Interaction", interactionSchema);

//-------------------------------------------------------------------------

//                               ده بيذود بالرقم التسلسلي بس 

// const mongoose = require("mongoose");
// const Counter = require("./Counter");

// const interactionSchema = new mongoose.Schema(
//   {
//     _id: { type: Number }, // الرقم التسلسلي الفريد
//     user_id: { type: String, required: true }, // معرف المستخدم
//     place_id: { type: String, required: true }, // معرف المكان
//     interaction_type: {
//       type: String,
//       enum: ["like", "save", "view", "click"], // أنواع التفاعل المسموحة
//       required: true
//     },
//     timestamp: { type: Date, default: Date.now } // وقت التفاعل
//   },
//   { collection: "interactions" }
// );

// // ✅ تحديث `_id` عند إضافة تفاعل جديد مع استمرار التعداد بعد الحذف
// interactionSchema.pre("save", async function (next) {
//   if (this.isNew) {
//     try {
//       // 🔹 البحث عن آخر `_id` مستخدم حاليًا
//       const lastInteraction = await mongoose
//         .model("Interaction")
//         .findOne({}, {}, { sort: { _id: -1 } });

//       let newId = 1; // القيمة الافتراضية لأول إدخال
//       if (lastInteraction) {
//         newId = lastInteraction._id + 1; // اجعل الرقم الجديد بعد آخر إدخال موجود
//       }

//       this._id = newId; // تعيين `_id` للتفاعل الجديد

//       // 🔹 تحديث `Counter` ليعكس الرقم الجديد
//       await Counter.findByIdAndUpdate(
//         { _id: "interactions_id" },
//         { seq: newId }, // تحديث `seq` ليواكب آخر `id` مستخدم
//         { upsert: true } // إذا لم يكن موجودًا، يتم إنشاؤه
//       );

//     } catch (err) {
//       return next(err);
//     }
//   }
//   next();
// });

// module.exports = mongoose.model("Interaction", interactionSchema);

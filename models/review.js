const mongoose = require("mongoose");
const Counter = require("./Counter");

const reviewSchema = new mongoose.Schema(
  {
    _id: { type: String }, // ✅ الشكل الجديد "review001"
    user_id: { type: String, required: true },
    place_id: { type: String, required: true },
    review_text: { type: String, required: true },
    likes: { type: mongoose.Schema.Types.Mixed, default: 0 },
    dislikes: { type: mongoose.Schema.Types.Mixed, default: 0 },
    timestamp: { type: Date, default: Date.now }
  },
  { collection: "reviews" }
);

// ✅ توليد _id بالشكل "review001"
reviewSchema.pre("validate", async function (next) {
  if (this.isNew) {
    try {
      const counterDoc = await Counter.findByIdAndUpdate(
        { _id: "review_id" },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );

      const number = counterDoc.seq.toString().padStart(3, '0');
      this._id = `review${number}`;

    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("Review", reviewSchema);



//---------------------------------------------------------------------

//              ده بيذود بالرقم التسلسلي بس 


// const mongoose = require("mongoose");
// const Counter = require("./Counter");

// const reviewSchema = new mongoose.Schema(
//   {
//     _id: { type: Number }, // الرقم التسلسلي الفريد
//     user_id: { type: String, required: true }, // معرف المستخدم
//     place_id: { type: String, required: true }, // معرف المكان
//     rating: { type: mongoose.Schema.Types.Mixed, required: true, min: 1, max: 5 }, // التقييم من 1 إلى 5
//     comment: { type: String, required: true }, // نص التعليق
//     likes: { type: mongoose.Schema.Types.Mixed, default: 0 }, // عدد الإعجابات
//     dislikes: { type: mongoose.Schema.Types.Mixed, default: 0 }, // عدد عدم الإعجاب
//     timestamp: { type: Date, default: Date.now } // وقت الإضافة
//   },
//   { collection: "reviews" } // تحديد اسم المجموعة في قاعدة البيانات
// );

// // ✅ تحديث `_id` قبل الحفظ، بناءً على آخر `id` موجود فعليًا
// reviewSchema.pre("validate", async function (next) {
//   if (this.isNew) {
//     try {
//       // 🔹 البحث عن آخر `_id` مستخدم حاليًا في مجموعة `reviews`
//       const lastReview = await mongoose.model("Review").findOne({}, {}, { sort: { _id: -1 } });

//       let newId = 1; // القيمة الافتراضية لأول إدخال
//       if (lastReview) {
//         newId = lastReview._id + 1; // اجعل الرقم الجديد بعد آخر إدخال موجود
//       }

//       this._id = newId; // تعيين `_id` للمراجعة الجديدة

//       // 🔹 تحديث `Counter` ليعكس الرقم الجديد
//       await Counter.findByIdAndUpdate(
//         { _id: "review_id" },
//         { seq: newId }, // تحديث `seq` ليواكب آخر `id` مستخدم
//         { upsert: true } // إذا لم يكن موجودًا، يتم إنشاؤه
//       );

//     } catch (err) {
//       return next(err);
//     }
//   }
//   next();
// });

// module.exports = mongoose.model("Review", reviewSchema);

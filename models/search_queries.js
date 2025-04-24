const mongoose = require("mongoose");
const Counter = require("./Counter");

const searchQuerySchema = new mongoose.Schema(
  {
    _id: { type: String }, // ✅ هنا _id نفسه فيه التنسيق "search001"
    user_id: { type: String, required: true }, // معرف المستخدم
    query: { type: String, required: true }, // نص البحث
    keywords: { type: [String], required: true }, // الكلمات المفتاحية المرتبطة
    timestamp: { type: Date, default: Date.now } // تاريخ البحث
  },
  { collection: "search_queries" }
);

// ✅ Hook لإنشاء _id بالتنسيق المطلوب
searchQuerySchema.pre("validate", async function (next) {
  if (this.isNew) {
    try {
      const counterDoc = await Counter.findByIdAndUpdate(
        { _id: "search_queries_id" },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );

      // ✅ توليد الرقم بالتنسيق "search001"
      const number = counterDoc.seq.toString().padStart(3, '0');
      this._id = `search${number}`;

    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("SearchQuery", searchQuerySchema);

//---------------------------------------------------------------------------------------

//ده بيذود ال id بالأرقام التسلسلية


// const mongoose = require("mongoose");
// const Counter = require("./Counter");

// const searchQuerySchema = new mongoose.Schema(
//   {
//     _id: { type: Number }, // الرقم التسلسلي الفريد
//     user_id: { type: String, required: true }, // معرف المستخدم
//     query: { type: String, required: true }, // نص البحث
//     keywords: { type: [String], required: true }, // الكلمات المفتاحية المرتبطة
//     timestamp: { type: Date, default: Date.now } // تاريخ البحث
//   },
//   { collection: "search_queries" }
// );

// // ✅ تحديث `_id` قبل الحفظ
// searchQuerySchema.pre("validate", async function (next) {
//   if (this.isNew) {
//     try {
//       // ✅ استخدم اسم الموديل الصحيح "SearchQuery" وليس "search_queries"
//       const lastSearchQuery = await mongoose
//         .model("SearchQuery") // ✅ استخدم اسم الموديل الصحيح هنا
//         .findOne({}, {}, { sort: { _id: -1 } });

//       let newId = 1; // القيمة الافتراضية لأول إدخال
//       if (lastSearchQuery) {
//         newId = lastSearchQuery._id + 1; // اجعل الرقم الجديد بعد آخر إدخال موجود
//       }

//       this._id = newId; // تعيين `_id` للبحث الجديد

//       // 🔹 تحديث `Counter` ليعكس الرقم الجديد
//       await Counter.findByIdAndUpdate(
//         { _id: "search_queries_id" },
//         { seq: newId }, // تحديث `seq` ليواكب آخر `id` مستخدم
//         { upsert: true } // إذا لم يكن موجودًا، يتم إنشاؤه
//       );

//     } catch (err) {
//       return next(err);
//     }
//   }
//   next();
// });

// module.exports = mongoose.model("SearchQuery", searchQuerySchema);

const mongoose = require("mongoose");
const Counter = require("./Counter");

const roadmapSchema = new mongoose.Schema(
  {
    _id: { type: String }, // ✅ هيكون بالشكل "roadmap001"
    user_id: { type: String, required: true },
    name: { type: String, required: true },
    destination: { type: String, required: true },
    duration: { type: String, required: true },
    start_date: { type: String, required: true },
    travel_goal: { type: String, required: true },
    exploration_style: { type: String, required: true },
    sustainability_preference: { type: String, required: true },
    transportation_mode: { type: String, required: true },
    optimize_travel_time: { type: Boolean, default: false },
    accommodation_type: { type: String, required: true },
    include_accommodation: { type: Boolean, default: false },
    activities: [{ type: String, required: true }],
    include_hidden_gems: { type: Boolean, default: false },
    budget: { type: String, required: true },
    places: [
      {
        place_id: { type: String, required: true },
        day: { type: Number, required: true }
      }
    ],
    shared_with: [{ type: String }],
    public: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    trip_details: {
      destination: { type: String, required: true }
    }
  },
  { collection: "roadmaps" }
);

// ✅ توليد _id بالشكل "roadmap001"
roadmapSchema.pre("validate", async function (next) {
  if (this.isNew) {
    try {
      const counterDoc = await Counter.findByIdAndUpdate(
        { _id: "roadmaps_id" },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );

      const number = counterDoc.seq.toString().padStart(3, '0');
      this._id = `roadmap${number}`;

    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("Roadmap", roadmapSchema);


//---------------------------------------------------------------------------

//              ده بيذود بالرقم التسلسلي بس 


// const mongoose = require("mongoose");
// const Counter = require("./Counter");

// const roadmapSchema = new mongoose.Schema(
//   {
//     _id: { type: Number }, // الرقم التسلسلي الفريد
//     user_id: { type: String, required: true }, // معرف المستخدم الذي أنشأ الخطة
//     name: { type: String, required: true }, // اسم الرحلة
//     destination: { type: String, required: true }, // الوجهة
//     duration: { type: String, required: true }, // المدة (مثلاً: "4-7 أيام")
//     start_date: { type: String, required: true }, // تاريخ البدء بصيغة YYYY-MM-DD
//     travel_goal: { type: String, required: true }, // الهدف من السفر
//     exploration_style: { type: String, required: true }, // نمط الاستكشاف
//     sustainability_preference: { type: String, required: true }, // تفضيلات الاستدامة
//     transportation_mode: { type: String, required: true }, // وسيلة النقل
//     optimize_travel_time: { type: Boolean, default: false }, // تحسين وقت السفر
//     accommodation_type: { type: String, required: true }, // نوع الإقامة
//     include_accommodation: { type: Boolean, default: false }, // هل تشمل الإقامة؟
//     activities: [{ type: String, required: true }], // الأنشطة
//     include_hidden_gems: { type: Boolean, default: false }, // تضمين أماكن غير معروفة؟
//     budget: { type: String, required: true }, // الميزانية المتوقعة
//     places: [
//       {
//         place_id: { type: String, required: true }, // معرف المكان
//         day: { type: Number, required: true } // اليوم المحدد للزيارة
//       }
//     ],
//     shared_with: [{ type: String }], // قائمة المستخدمين المشاركين
//     public: { type: Boolean, default: false }, // هل الرحلة عامة؟
//     created_at: { type: Date, default: Date.now }, // وقت الإنشاء
//     trip_details: {
//       destination: { type: String, required: true } // تفاصيل الوجهة
//     }
//   },
//   { collection: "roadmaps" }
// );

// // ✅ تحديث `_id` قبل الحفظ، بناءً على آخر `id` موجود فعليًا
// roadmapSchema.pre("validate", async function (next) {
//   if (this.isNew) {
//     try {
//       // 🔹 البحث عن آخر `_id` مستخدم حاليًا في مجموعة `roadmaps`
//       const lastRoadmap = await mongoose.model("Roadmap").findOne({}, {}, { sort: { _id: -1 } });

//       let newId = 1; // القيمة الافتراضية لأول إدخال
//       if (lastRoadmap) {
//         newId = lastRoadmap._id + 1; // اجعل الرقم الجديد بعد آخر إدخال موجود
//       }

//       this._id = newId; // تعيين `_id` للرحلة الجديدة

//       // 🔹 تحديث `Counter` ليعكس الرقم الجديد
//       await Counter.findByIdAndUpdate(
//         { _id: "roadmaps_id" },
//         { seq: newId }, // تحديث `seq` ليواكب آخر `id` مستخدم
//         { upsert: true } // إذا لم يكن موجودًا، يتم إنشاؤه
//       );

//     } catch (err) {
//       return next(err);
//     }
//   }
//   next();
// });

// module.exports = mongoose.model("Roadmap", roadmapSchema);



// "id": "place001",
// "name": "Eiffel Tower",
// "description": "One of the most famous landmarks in the world, offering stunning city views.",
// "category": "historical",
// "location": {
//   "city": "Paris",
//   "country": "France",
//   "latitude": 48.8584,
//   "longitude": 2.2945
// },
// "rating": 0,
// "tags": [
//   "landmark",
//   "architecture",
//   "romantic"
// ],
// "accessibility": [
//   "wheelchair-friendly",
//   "children-friendly"
// ]
// }
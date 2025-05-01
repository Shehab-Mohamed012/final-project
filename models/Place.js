const mongoose = require("mongoose");
const Counter = require("./Counter");

const placeSchema = new mongoose.Schema(
  {
    _id: { type: String }, // ✅ _id هيبقى بالشكل "place001"
    name: { type: String, required: true },
    category: { type: String, required: true,
      enum :["historical","nature","beach","food","city","adventure","wine tour","cultural"] },
    tags: [{ type: String,
      enum:["castles","hiking","architecture","luxury","wildlife","scenic","nightlife","restaurants","wine","museums","beaches","kayaking",
        "cycling","skiing","photography","hot air balloon","shopping","bars","concerts","spa","UNESCO"]
     }],
    description: { type: String },
    image: { type: String }, // ✅ 
    location: {
      city: { type: String, required: true, 
        enum :[
         "Cairo","Giza","Alexandria","Qalyubia","Dakahlia","Beheira","Gharbia","Sharqia","Monufia",
         "Kafr El Sheikh","Damietta","Port Said","Ismailia","Suez","North Sinai","South Sinai","Beni Suef",
         "Faiyum","Minya","Asyut","Sohag","Qena","Luxor","Aswan","Red Sea","New Valley","Matrouh"
        ]
      },
      country: { type: String, required: true },
      latitude: { type: mongoose.Schema.Types.Mixed, required: true,
        validate: {
        validator: function (value) {
          return value >= 22 && value <= 32.5; // مصر خط العرض
        },
        message: 'Latitude must be within Egypt (22 to 32.5)'
      } },
      longitude: { type: mongoose.Schema.Types.Mixed, required: true,
        validate: {
          validator: function (value) {
            return value >= 25 && value <= 36.5; // مصر خط الطول
          },
          message: 'Longitude must be within Egypt (25 to 36.5)'
        }
       },
    },
    accessibility: [{ type: String ,enum: ["senior-friendly", "pet-friendly", "wheelchair-friendly", null], default: null}],
    average_rating: { type: mongoose.Schema.Types.Mixed, default: 0 },
    likes: { type: Number, default: 0 },
    reviews_count: { type: Number, default: 0 },

    appropriate_time: [{
      type: String,
      enum: [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
        "Muharram","Safar","Rabi al-Awwal","Rabi al-Thani","Jumada al-Awwal","Jumada al-Thani",
        "Rajab","Shaaban","Ramadan","Shawwal","Dhu al-Qi'dah","Dhu al-Hijjah"
      ]
    }],
    budget: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    group_type: { type: [String] , enum: ["solo", "family", "friends", "couple"], required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "places" }
);

// ✅ توليد _id بالشكل المطلوب "place001"
placeSchema.pre("validate", async function (next) {
  if (this.isNew) {
    try {
      const counterDoc = await Counter.findByIdAndUpdate(
        { _id: "places_id" },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );

      const number = counterDoc.seq.toString().padStart(3, '0');
      this._id = `place${number}`;

    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("Place", placeSchema);


//---------------------------------------------------------------------

//ده بيذود بالرقم التسلسلي الفريد لكل مكان بس

// const mongoose = require("mongoose");
// const Counter = require("./Counter");

// const placeSchema = new mongoose.Schema(
//   {
//     _id: { type: Number }, // الرقم التسلسلي الفريد
//     name: { type: String, required: true }, // اسم المكان
//     category: { type: String, required: true }, // فئة المكان
//     tags: [{ type: String }], // وسوم تعريفية
//     description: { type: String }, // وصف المكان
//     location: {
//       city: { type: String, required: true }, // المدينة
//       country: { type: String, required: true }, // الدولة
//       latitude: { type: mongoose.Schema.Types.Mixed, required: true }, // قبول أي تنسيق عددي
//       longitude: { type: mongoose.Schema.Types.Mixed, required: true }, // قبول أي تنسيق عددي
//     },
//     accessibility: [{ type: String }], // تسهيلات الوصول
//     average_rating: { type: mongoose.Schema.Types.Mixed, default: 0 }, // التقييم
//     likes: { type: mongoose.Schema.Types.Mixed, default: 0 }, // عدد الإعجابات
//     reviews_count: { type: mongoose.Schema.Types.Mixed, default: 0 }, // عدد المراجعات
//     created_at: { type: Date, default: Date.now }, // تاريخ الإضافة
//     updated_at: { type: Date, default: Date.now }, // تاريخ آخر تحديث
//     appropriate_time: [{ 
//       type: String, 
//       enum: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] 
//     }], // الأشهر المناسبة لزيارة المكان
//     budget: { type: String, enum: ["low", "medium", "high"], default: "medium" }, // ميزانية المكان
//     group_type: { type: String, enum: ["solo", "family", "friends", "couple"], required: true }, // نوع المجموعة
//   },
//   { collection: "places" } // تحديد اسم المجموعة في قاعدة البيانات
// );


// // ✅ تحديث `_id` قبل الحفظ، بناءً على آخر `id` موجود فعليًا
// placeSchema.pre("validate", async function (next) {
//   if (this.isNew) {
//     try {
//       // 🔹 البحث عن آخر `_id` مستخدم حاليًا في مجموعة `users`
//       const lastPlace = await mongoose.model("Place").findOne({}, {}, { sort: { _id: -1 } });

//       let newId = 1; // القيمة الافتراضية لأول إدخال
//       if (lastPlace) {
//         newId = lastPlace._id + 1; // اجعل الرقم الجديد بعد آخر إدخال موجود
        
//       }

//       this._id = newId; // تعيين `_id` للمستخدم الجديد

//       // 🔹 تحديث `Counter` ليعكس الرقم الجديد
//       await Counter.findByIdAndUpdate(
//         { _id: "places_id" },
//         { seq: newId }, // تحديث `seq` ليواكب آخر `id` مستخدم
//         { upsert: true } // إذا لم يكن موجودًا، يتم إنشاؤه
//       );

//     } catch (err) {
//       return next(err);
//     }
//   }
//   next();
// });


// module.exports = mongoose.model("Place", placeSchema);

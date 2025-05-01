const mongoose = require("mongoose");
const Counter = require("./Counter");

const userSchema = new mongoose.Schema(
  {
    _id: { type: String }, // ✅ هنا بقى _id هو نفسه userId
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "user" },
    profile_image: { type: String },
    preferences: {
      categories: [{ type: String ,
        enum :["historical","nature","beach","food","city","adventure","wine tour","cultural"] }],
      tags: [{ type: String ,
        enum:["castles","hiking","architecture","luxury","wildlife","scenic","nightlife","restaurants","wine","museums","beaches","kayaking",
          "cycling","skiing","photography","hot air balloon","shopping","bars","concerts","spa","UNESCO"]
      }]
    },
    saved_places: [{ type: String }],
    search_history: [
      {
        _id: { type: Number, required: true },
        query: { type: String, required: true },
        keywords: [{ type: String }],
        timestamp: { type: Date, default: Date.now }
      }
    ],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  { collection: "users" }
);

// ✅ Pre-save hook to auto-generate _id
userSchema.pre("validate", async function (next) {
  if (this.isNew) {
    try {
      const counterDoc = await Counter.findByIdAndUpdate(
        { _id: "users_id" },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      );

      const number = counterDoc.seq.toString().padStart(3, '0');
      this._id = `user${number}`;  // ✅ هنا _id نفسه بيتحط فيه user001, user002,user010,user011,user100,user101,user999,user1000,user1001

    } catch (err) {
      return next(err);
    }
  }
  next();
});



module.exports = mongoose.model("User", userSchema);



//-------------------------------------------------------------------------------------------------
// const mongoose = require("mongoose");
// const Counter = require("./Counter");

// const userSchema = new mongoose.Schema(
//   {
//     _id: { type: Number }, // الرقم التسلسلي
//     name: { type: String, required: true },
//     email: { type: String, unique: true, required: true },
//     passwordHash: { type: String, required: true }, // Add password for security
//     role: { type: String, default: "user" }, // Admin or User
//     preferences: {
//       categories: [{ type: String }],
//       budget: { type: String, enum: ["low", "medium", "high"], default: "medium" },
//       tags: [{ type: String }]
//     },
//     saved_places: [{ type: String }], // Assuming place IDs are stored as Strings
//     search_history: [
//       {
//         query: { type: String, required: true },
//         keywords: [{ type: String }],
//         timestamp: { type: Date, default: Date.now }
//       }
//     ],
//     created_at: { type: Date, default: Date.now },
//     updated_at: { type: Date, default: Date.now }
//   },
//   { collection: "users" }
// );

//   // ✅ تحديث `Counter` عند إنشاء مستخدم جديد
// userSchema.pre("validate", async function (next) {
//     if (this.isNew) {
//       try {
//         const counter = await Counter.findByIdAndUpdate(
//           { _id: "users_id" },
//           { $inc: { seq: 1 } }, // زيادة `seq` بمقدار 1
//           { new: true, upsert: true } // إن لم يكن موجودًا، يتم إنشاؤه
//         );
//         this._id = counter.seq; // تعيين `seq` كمفتاح `_id`
//       } catch (err) {
//         return next(err);
//       }
//     }
//     next();
//   });
  

// module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");
const Counter = require("./Counter");

const reviewInteractionSchema = new mongoose.Schema(
  {
    _id: { type: String }, // ✅ هنا النص عشان يحتوي على البادئة والرقم
    user_id: { type: String, required: true },
    review_id: { type: String, required: true },
    interaction_type: {
      type: String,
      enum: ["like", "dislike"],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
  },
  { collection: "review_interactions" }
);

// ✅ توليد _id بالشكل "reviewinteraction001"
reviewInteractionSchema.pre("validate", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "review_interaction_id" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const sequenceNumber = counter.seq.toString().padStart(3, "0"); // ✅ padding
      this._id = `reviewinteraction${sequenceNumber}`;

    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("ReviewInteraction", reviewInteractionSchema);

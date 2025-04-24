const express = require("express");
const router = express.Router();
const Review = require("../models/review"); // تأكد من المسار الصحيح لنموذج المراجعة
const User = require("../models/user"); 
const ReviewInteraction = require("../models/reviewInteractionSchema");


router.post("/add_interaction", async (req, res) => {
    try {
      const { user_id, review_id, interaction_type } = req.body;
  
      if (!user_id || !review_id || !interaction_type) {
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      // ✅ تأكد إن اليوزر والمراجعة موجودين
      const user = await User.findById(user_id);
      if (!user) return res.status(404).json({ error: "User not found." });
  
      const review = await Review.findById(review_id);
      if (!review) return res.status(404).json({ error: "Review not found." });
  
      // 🔎 البحث عن التفاعل السابق لنفس اليوزر والمراجعة
      const existingInteraction = await ReviewInteraction.findOne({ user_id, review_id });
  
      if (existingInteraction) {
        if (existingInteraction.interaction_type === interaction_type) {
          // ✅ لو نفس التفاعل متكرر → احذف التفاعل (إلغاء التفاعل)
          await ReviewInteraction.deleteOne({ _id: existingInteraction._id });
  
          // ✅ تعديل عدد اللايك أو الديسلايك على الـ Review
          if (interaction_type === "like") {
            await Review.findByIdAndUpdate(review_id, { $inc: { likes: -1 } });
          } else {
            await Review.findByIdAndUpdate(review_id, { $inc: { dislikes: -1 } });
          }
  
          return res.status(200).json({ message: "Interaction removed (undo)" });
        } else {
          // ✅ لو غير نوع التفاعل → حدث التفاعل
          const oldType = existingInteraction.interaction_type;
          existingInteraction.interaction_type = interaction_type;
          existingInteraction.timestamp = new Date();
          await existingInteraction.save();
  
          // ✅ تعديل العدادات
          if (interaction_type === "like") {
            await Review.findByIdAndUpdate(review_id, { $inc: { likes: 1, dislikes: -1 } });
          } else {
            await Review.findByIdAndUpdate(review_id, { $inc: { dislikes: 1, likes: -1 } });
          }
  
          return res.status(200).json({ message: "Interaction updated", interaction: existingInteraction });
        }
      } else {
        // ✅ لا يوجد تفاعل سابق → سجل التفاعل
        const newInteraction = new ReviewInteraction({ user_id, review_id, interaction_type });
        await newInteraction.save();
  
        // ✅ تعديل العدادات
        if (interaction_type === "like") {
          await Review.findByIdAndUpdate(review_id, { $inc: { likes: 1 } });
        } else {
          await Review.findByIdAndUpdate(review_id, { $inc: { dislikes: 1 } });
        }
  
        return res.status(201).json({ message: "Interaction added", interaction: newInteraction });
      }
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
});

router.get("/interactions_summary", async (req, res) => {
    try {
      const interactions = await ReviewInteraction.aggregate([
        {
          $group: {
            _id: "$review_id",
            total_likes: {
              $sum: {
                $cond: [{ $eq: ["$interaction_type", "like"] }, 1, 0]
              }
            },
            total_dislikes: {
              $sum: {
                $cond: [{ $eq: ["$interaction_type", "dislike"] }, 1, 0]
              }
            }
          }
        }
      ]);
  
      res.status(200).json({ summary: interactions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});
  


module.exports = router;
  
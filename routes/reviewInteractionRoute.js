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

//****************************** */
router.post("/add-multiple", async (req, res) => {
  try {
      const interactions = req.body;

      // التحقق من أن البيانات مرسلة كمصفوفة
      if (!Array.isArray(interactions)) {
          return res.status(400).json({ error: "يجب إرسال مصفوفة من التفاعلات" });
      }

      const results = [];
      const reviewsToUpdate = new Set(); // لتتبع المراجعات التي تحتاج لتحديث العدادات

      // معالجة كل تفاعل على حدة
      for (const interactionData of interactions) {
          const { user_id, review_id, interaction_type } = interactionData;

          try {
              // التحقق من الحقول المطلوبة
              if (!user_id || !review_id || !interaction_type) {
                  results.push({
                      interaction: interactionData,
                      status: "failed",
                      error: "Missing required fields"
                  });
                  continue;
              }

              // ✅ تأكد من وجود اليوزر والمراجعة
              const user = await User.findById(user_id);
              const review = await Review.findById(review_id);

              if (!user || !review) {
                  results.push({
                      interaction: interactionData,
                      status: "failed",
                      error: !user ? "User not found" : "Review not found"
                  });
                  continue;
              }

              // 🔎 البحث عن التفاعل السابق
              const existingInteraction = await ReviewInteraction.findOne({ user_id, review_id });

              if (existingInteraction) {
                  if (existingInteraction.interaction_type === interaction_type) {
                      // ✅ إلغاء التفاعل (حذفه)
                      await ReviewInteraction.deleteOne({ _id: existingInteraction._id });

                      // تسجيل التحديث المطلوب للمراجعة
                      reviewsToUpdate.add(JSON.stringify({
                          review_id,
                          likeIncrement: interaction_type === "like" ? -1 : 0,
                          dislikeIncrement: interaction_type === "dislike" ? -1 : 0
                      }));

                      results.push({
                          interaction: interactionData,
                          status: "success",
                          message: "Interaction removed (undo)"
                      });
                  } else {
                      // ✅ تغيير نوع التفاعل
                      const oldType = existingInteraction.interaction_type;
                      existingInteraction.interaction_type = interaction_type;
                      existingInteraction.timestamp = new Date();
                      await existingInteraction.save();

                      // تسجيل التحديث المطلوب للمراجعة
                      reviewsToUpdate.add(JSON.stringify({
                          review_id,
                          likeIncrement: interaction_type === "like" ? 1 : -1,
                          dislikeIncrement: interaction_type === "dislike" ? 1 : -1
                      }));

                      results.push({
                          interaction: interactionData,
                          status: "success",
                          message: "Interaction updated",
                          data: existingInteraction
                      });
                  }
              } else {
                  // ✅ تفاعل جديد
                  const newInteraction = new ReviewInteraction({
                      user_id,
                      review_id,
                      interaction_type,
                      timestamp: new Date()
                  });
                  await newInteraction.save();

                  // تسجيل التحديث المطلوب للمراجعة
                  reviewsToUpdate.add(JSON.stringify({
                      review_id,
                      likeIncrement: interaction_type === "like" ? 1 : 0,
                      dislikeIncrement: interaction_type === "dislike" ? 1 : 0
                  }));

                  results.push({
                      interaction: interactionData,
                      status: "success",
                      message: "Interaction added",
                      data: newInteraction
                  });
              }
          } catch (error) {
              results.push({
                  interaction: interactionData,
                  status: "failed",
                  error: error.message
              });
          }
      }

      // 🔄 تحديث عدادات المراجعات
      const updatePromises = [];
      for (const reviewUpdate of reviewsToUpdate) {
          const { review_id, likeIncrement, dislikeIncrement } = JSON.parse(reviewUpdate);
          
          const updateObj = {};
          if (likeIncrement !== 0) updateObj.$inc = { likes: likeIncrement };
          if (dislikeIncrement !== 0) {
              updateObj.$inc = updateObj.$inc || {};
              updateObj.$inc.dislikes = dislikeIncrement;
          }

          if (Object.keys(updateObj).length > 0) {
              updatePromises.push(
                  Review.findByIdAndUpdate(review_id, updateObj)
              );
          }
      }

      await Promise.all(updatePromises);

      res.status(200).json({
          message: "تم معالجة التفاعلات بنجاح",
          results,
          updatedReviewsCount: reviewsToUpdate.size
      });

  } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
  }
});
//***************************** */

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
  
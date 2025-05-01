const express = require("express");
const router = express.Router();
const Review = require("../models/review"); // تأكد من المسار الصحيح لنموذج المراجعة
const User = require("../models/user"); // تأكد من المسار الصحيح لنموذج المستخدم
const Place = require("../models/Place"); // تأكد من المسار الصحيح لنموذج المكان


// ✅ إضافة مراجعة جديدة
router.post("/add", async (req, res) => {
  try {
      const { user_id, place_id, review_text } = req.body;

      // 🔹 التحقق من صحة البيانات المدخلة
      if (!user_id || !place_id || !review_text) {
          return res.status(400).json({ error: "Missing required fields." });
      }

      // 🔹 التحقق من وجود المستخدم والمكان
      const userExists = await User.findById(user_id);
      if (!userExists) return res.status(404).json({ error: "User not found." });

      const placeExists = await Place.findById(place_id);
      if (!placeExists) return res.status(404).json({ error: "Place not found." });

      // 🔹 إنشاء المراجعة
      const newReview = new Review({
          user_id,
          place_id,
          review_text,
          likes: 0,
          dislikes: 0,
          timestamp: new Date(),
      });
      await newReview.save();

      // ✅ تأكد من أن reviews_count رقم قبل عملية $inc
      if (typeof placeExists.reviews_count !== 'number') {
          placeExists.reviews_count = 0;
          await placeExists.save();
      }

      // ✅ تحديث بيانات `Place`
      const updatedPlace = await Place.findByIdAndUpdate(
          place_id,
          {
              $inc: { reviews_count: 1 },           // زيادة عدد المراجعات
              $set: { updated_at: new Date() },     // تحديث تاريخ آخر تعديل
          },
          { new: true }
      );

      // ✅ إعادة حساب متوسط التقييم
      const reviews = await Review.find({ place_id });
      const totalRatings = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
      const averageRating = totalRatings / reviews.length;

      // ✅ تحديث average_rating داخل Place
      updatedPlace.average_rating = averageRating;
      await updatedPlace.save();

      res.status(201).json({ message: "Review added successfully!", review: newReview, updatedPlace });

  } catch (error) {
      console.error("Error adding review:", error);
      res.status(500).json({ error: error.message });
  }
});

//*********************************** */
// ✅ إضافة مراجعات متعددة
router.post("/add-multiple", async (req, res) => {
  try {
      const reviews = req.body;

      // التحقق من أن البيانات مرسلة كمصفوفة
      if (!Array.isArray(reviews)) {
          return res.status(400).json({ error: "يجب إرسال مصفوفة من المراجعات." });
      }

      const results = [];
      const placesToUpdate = new Set(); // لتتبع الأماكن التي تحتاج لتحديث إحصائياتها

      // معالجة كل مراجعة على حدة
      for (const reviewData of reviews) {
          const { user_id, place_id, review_text, likes = 0, dislikes = 0 } = reviewData;

          try {
              // 🔹 التحقق من الحقول المطلوبة
              if (!user_id || !place_id || !review_text) {
                  results.push({
                      review: reviewData,
                      status: "failed",
                      error: "Missing required fields."
                  });
                  continue;
              }

              // 🔎 تحقق من وجود المستخدم والمكان
              const userExists = await User.findById(user_id);
              const placeExists = await Place.findById(place_id);

              if (!userExists || !placeExists) {
                  results.push({
                      review: reviewData,
                      status: "failed",
                      error: !userExists ? "User not found." : "Place not found."
                  });
                  continue;
              }

              // 🔹 إنشاء المراجعة الجديدة
              const newReview = new Review({
                  user_id,
                  place_id,
                  review_text,
                  likes,
                  dislikes,
                  timestamp: new Date(),
              });
              await newReview.save();

              // إضافة المكان لقائمة الأماكن التي تحتاج لتحديث الإحصائيات
              placesToUpdate.add(place_id.toString());

              results.push({
                  review: reviewData,
                  status: "success",
                  message: "Review added successfully!",
                  data: newReview
              });

          } catch (error) {
              results.push({
                  review: reviewData,
                  status: "failed",
                  error: error.message
              });
          }
      }

      // 🔄 تحديث إحصائيات الأماكن
      for (const placeId of placesToUpdate) {
          try {
              // ✅ حساب عدد المراجعات الجديد
              const reviewsCount = await Review.countDocuments({ place_id: placeId });

              // ✅ حساب متوسط التقييم
              const reviews = await Review.find({ place_id: placeId });
              const totalRatings = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
              const averageRating = reviews.length > 0 ? totalRatings / reviews.length : 0;

              // ✅ تحديث بيانات المكان
              await Place.findByIdAndUpdate(
                  placeId,
                  {
                      reviews_count: reviewsCount,
                      average_rating: averageRating,
                      updated_at: new Date()
                  },
                  { new: true }
              );

          } catch (error) {
              console.error(`Error updating place ${placeId}:`, error);
          }
      }

      res.status(200).json({
          message: "تم معالجة المراجعات بنجاح",
          results,
          updatedPlacesCount: placesToUpdate.size
      });

  } catch (error) {
      console.error("Error adding multiple reviews:", error);
      res.status(500).json({ error: error.message });
  }
});
//********************************** */

// ✅ جلب المراجعات مع ترتيب الأحدث أولاً
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ timestamp: -1 }); // ترتيب الأحدث أولاً
    res.status(200).json({ data :reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ✅ جلب المراجعات الخاصة بمكان معين
router.get("/:place_id", async (req, res) => {
  try {
    const { place_id } = req.params;
    const reviews = await Review.find({ place_id });

    if (!reviews.length) {
      return res.status(404).json({ message: "No reviews found for this place." });
    }

    res.status(200).json({data :reviews});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ تحديث تعليق أو تقييم مراجعة
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { review_text } = req.body;

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { review_text, timestamp: new Date() },
      { new: true }
    );

    if (!updatedReview) {
      return res.status(404).json({ error: "Review not found." });
    }

    res.status(200).json({ message: "Review updated successfully!", review: updatedReview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ حذف مراجعة
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedReview = await Review.findByIdAndDelete(id);

    if (!deletedReview) {
      return res.status(404).json({ error: "Review not found." });
    }

    res.status(200).json({ message: "Review deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




module.exports = router;

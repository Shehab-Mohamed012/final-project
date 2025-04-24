const express = require("express");
const router = express.Router();
const Review = require("../models/review"); // تأكد من المسار الصحيح لنموذج المراجعة
const User = require("../models/user"); // تأكد من المسار الصحيح لنموذج المستخدم
const Place = require("../models/Place"); // تأكد من المسار الصحيح لنموذج المكان


// ✅ إضافة مراجعة جديدة
router.post("/add", async (req, res) => {
  try {
      const { user_id, place_id, rating, comment } = req.body;

      // 🔹 التحقق من صحة البيانات المدخلة
      if (!user_id || !place_id || !rating || !comment) {
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
          rating,
          comment,
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


// ✅ جلب المراجعات مع ترتيب الأحدث أولاً
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ timestamp: -1 }); // ترتيب الأحدث أولاً
    res.status(200).json({ reviews });
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

    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ تحديث تعليق أو تقييم مراجعة
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { rating, comment, timestamp: new Date() },
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

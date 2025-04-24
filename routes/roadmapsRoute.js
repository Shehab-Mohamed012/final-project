const express = require("express");
const router = express.Router();
const Roadmap = require("../models/Roadmap");
const User = require("../models/user");
const Place = require("../models/Place");

// ✅ إضافة خطة سفر جديدة مع التحقق من صحة البيانات وعدم تكرار الأماكن
router.post("/add", async (req, res) => {
    try {
      const roadmapData = req.body;
  
      // 🔹 التحقق من صحة بيانات المستخدم
      const userExists = await User.findById(roadmapData.user_id);
      if (!userExists) {
        return res.status(404).json({ error: "User not found." });
      }
  
      // 🔹 استخراج قائمة معرفات الأماكن من الطلب
      const placeIds = roadmapData.places.map((place) => place.place_id);
  
      // 🔹 التأكد من عدم وجود أماكن مكررة داخل الخطة
      const uniquePlaceIds = [...new Set(placeIds)];
      if (placeIds.length !== uniquePlaceIds.length) {
        return res.status(400).json({ error: "Duplicate places are not allowed in the roadmap." });
      }
  
      // 🔹 التحقق من وجود جميع الأماكن
      const existingPlaces = await Place.find({ _id: { $in: uniquePlaceIds } });
      const existingPlaceIds = existingPlaces.map((place) => place._id.toString());
  
      // 🔹 إيجاد الأماكن غير الموجودة
      const missingPlaces = uniquePlaceIds.filter((id) => !existingPlaceIds.includes(id));

      if (missingPlaces.length > 0) {
        return res.status(404).json({
          error: "Some places not found.",
          missing_places: missingPlaces,
        });
      }
  
    // 🔹 التحقق من المستخدمين في `shared_with`
    if (roadmapData.shared_with && roadmapData.shared_with.length > 0) {
        const sharedUsers = await User.find({ _id: { $in: roadmapData.shared_with } });
        const existingSharedUserIds = sharedUsers.map((user) => user._id.toString());
  
        const missingSharedUsers = roadmapData.shared_with.filter(
          (id) => !existingSharedUserIds.includes(id)
        );
  
        if (missingSharedUsers.length > 0) {
          return res.status(404).json({
            error: "Some shared users not found.",
            missing_users: missingSharedUsers,
          });
        }
      }

      // ✅ إذا كان كل شيء صحيحًا، احفظ خطة السفر
      const newRoadmap = new Roadmap(roadmapData);
      await newRoadmap.save();
  
      res.status(201).json({ message: "Roadmap added successfully!", roadmap: newRoadmap });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  

// ✅ جلب جميع خطط السفر
router.get("/", async (req, res) => {
  try {
    const roadmaps = await Roadmap.find();
    if (roadmaps.length === 0) {
      return res.status(404).json({ message: "No roadmaps found." });
    }
    res.status(200).json(roadmaps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ جلب خطة سفر حسب ID
router.get("/:id", async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);
    if (!roadmap) {
      return res.status(404).json({ message: "Roadmap not found." });
    }
    res.status(200).json(roadmap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ تحديث خطة سفر
router.put("/:id", async (req, res) => {
  try {
    const roadmap = await Roadmap.findById(req.params.id);

    if (!roadmap) {
      return res.status(404).json({ message: "Roadmap not found." });
    }

    // ✅ التحقق من وقت بدء الرحلة
    const currentDate = new Date();
    if (currentDate >= new Date(roadmap.start_date)) {
      return res.status(400).json({ message: "Cannot update, trip has already started or passed." });
    }

    // ✅ منع تعديل user_id
    if (req.body.user_id && req.body.user_id !== roadmap.user_id) {
      return res.status(400).json({ message: "User ID cannot be modified." });
    }

    // ✅ تحديث البيانات بدون user_id
    const { user_id, ...updateData } = req.body;

    const updatedRoadmap = await Roadmap.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.status(200).json({ message: "Roadmap updated successfully!", roadmap: updatedRoadmap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// // ✅ تحديث خطة سفر مع التحقق من تاريخ البدء
// router.put("/:id", async (req, res) => {
//   try {
//     const roadmap = await Roadmap.findById(req.params.id);

//     if (!roadmap) {
//       return res.status(404).json({ message: "Roadmap not found." });
//     }

//     // 🔎 التحقق من تاريخ بدء الرحلة
//     const currentDate = new Date();
//     const startDate = new Date(roadmap.start_date);

//     if (currentDate >= startDate) {
//       return res.status(400).json({ message: "Cannot update, trip has already started or passed." });
//     }

//     // ✅ التعديل مسموح
//     const updatedRoadmap = await Roadmap.findByIdAndUpdate(req.params.id, req.body, { new: true });
//     res.status(200).json({ message: "Roadmap updated successfully!", roadmap: updatedRoadmap });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });


// ✅ حذف خطة سفر
router.delete("/:id", async (req, res) => {
  try {
    const deletedRoadmap = await Roadmap.findByIdAndDelete(req.params.id);
    if (!deletedRoadmap) {
      return res.status(404).json({ message: "Roadmap not found." });
    }
    res.status(200).json({ message: "Roadmap deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

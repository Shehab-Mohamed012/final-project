const express = require("express");
const router = express.Router();
const Interaction = require("../models/interactionSchema");
const User = require("../models/user");
const Place = require("../models/Place");

// ✅ إضافة تفاعل جديد
router.post("/add", async (req, res) => {
  try {
      const { user_id, place_id, interaction_type } = req.body;

      if (!user_id || !place_id || !interaction_type) {
          return res.status(400).json({ error: "Missing required fields." });
      }

      // 🔎 تحقق من وجود المستخدم والمكان
      const userExists = await User.findById(user_id);
      const placeExists = await Place.findById(place_id);

      if (!userExists) return res.status(404).json({ error: "User not found." });
      if (!placeExists) return res.status(404).json({ error: "Place not found." });

      // ✅ لو كان التفاعل مجرد عرض "view" أو "share" → سجله فقط ولا تؤثر على البيانات
      if (interaction_type === "view" || interaction_type === "share") {
          const newInteraction = new Interaction({ user_id, place_id, interaction_type });
          await newInteraction.save();
          return res.status(201).json({ message: "Interaction recorded successfully!", interaction: newInteraction });
      }

      // 🔎 التحقق مما إذا كان التفاعل موجودًا مسبقًا
      const existingInteraction = await Interaction.findOne({ user_id, place_id, interaction_type });

      if (existingInteraction) {
          // 🔹 إذا كان التفاعل موجودًا، يتم حذفه
          await Interaction.deleteOne({ _id: existingInteraction._id });

          // 🔹 تحديث تأثير التفاعل
          if (interaction_type === "save") {
              await User.findByIdAndUpdate(user_id, { $pull: { saved_places: place_id } });
          } else if (interaction_type === "like") {
              await Place.findByIdAndUpdate(place_id, { $inc: { likes: -1 } });
          }

          return res.status(200).json({ message: "Interaction removed successfully!" });
      }

      // 🔹 إنشاء التفاعل الجديد
      const newInteraction = new Interaction({ user_id, place_id, interaction_type });
      await newInteraction.save();

      // 🔹 تأثير التفاعل الجديد
      if (interaction_type === "save") {
          await User.findByIdAndUpdate(user_id, { $addToSet: { saved_places: place_id } });
      } else if (interaction_type === "like") {
          await Place.findByIdAndUpdate(place_id, { $inc: { likes: 1 } });
      }

      res.status(201).json({ message: "Interaction added successfully!", interaction: newInteraction });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});
//************************************ */
// ✅ إضافة تفاعلات متعددة
router.post("/add-multiple", async (req, res) => {
  try {
      const interactions = req.body;

      // التحقق من أن البيانات مرسلة كمصفوفة
      if (!Array.isArray(interactions)) {
          return res.status(400).json({ error: "يجب إرسال مصفوفة من التفاعلات." });
      }

      const results = [];
      
      // معالجة كل تفاعل على حدة
      for (const interaction of interactions) {
          const { user_id, place_id, interaction_type } = interaction;

          // التحقق من الحقول المطلوبة لكل تفاعل
          if (!user_id || !place_id || !interaction_type) {
              results.push({
                  interaction,
                  status: "failed",
                  error: "Missing required fields."
              });
              continue;
          }

          try {
              // 🔎 تحقق من وجود المستخدم والمكان
              const userExists = await User.findById(user_id);
              const placeExists = await Place.findById(place_id);

              if (!userExists || !placeExists) {
                  results.push({
                      interaction,
                      status: "failed",
                      error: !userExists ? "User not found." : "Place not found."
                  });
                  continue;
              }

              // ✅ معالجة التفاعلات المؤقتة (view/share)
              if (interaction_type === "view" || interaction_type === "share") {
                  const newInteraction = new Interaction({ user_id, place_id, interaction_type });
                  await newInteraction.save();
                  results.push({
                      interaction,
                      status: "success",
                      message: "Interaction recorded successfully!",
                      data: newInteraction
                  });
                  continue;
              }

              // 🔎 التحقق من التفاعل الموجود
              const existingInteraction = await Interaction.findOne({ 
                  user_id, 
                  place_id, 
                  interaction_type 
              });

              if (existingInteraction) {
                  // 🔹 حذف التفاعل الموجود
                  await Interaction.deleteOne({ _id: existingInteraction._id });

                  // 🔹 تحديث البيانات المرتبطة
                  if (interaction_type === "save") {
                      await User.findByIdAndUpdate(user_id, { $pull: { saved_places: place_id } });
                  } else if (interaction_type === "like") {
                      await Place.findByIdAndUpdate(place_id, { $inc: { likes: -1 } });
                  }

                  results.push({
                      interaction,
                      status: "success",
                      message: "Interaction removed successfully!"
                  });
                  continue;
              }

              // 🔹 إنشاء تفاعل جديد
              const newInteraction = new Interaction({ user_id, place_id, interaction_type });
              await newInteraction.save();

              // 🔹 تحديث البيانات المرتبطة
              if (interaction_type === "save") {
                  await User.findByIdAndUpdate(user_id, { $addToSet: { saved_places: place_id } });
              } else if (interaction_type === "like") {
                  await Place.findByIdAndUpdate(place_id, { $inc: { likes: 1 } });
              }

              results.push({
                  interaction,
                  status: "success",
                  message: "Interaction added successfully!",
                  data: newInteraction
              });

          } catch (error) {
              results.push({
                  interaction,
                  status: "failed",
                  error: error.message
              });
          }
      }

      // إرسال النتائج النهائية
      res.status(200).json({
          message: "تم معالجة التفاعلات بنجاح",
          results
      });

  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});
//*********************************** */

// ✅ جلب جميع التفاعلات
router.get("/", async (req, res) => {
  try {
    const interactions = await Interaction.find();
    res.status(200).json({data:interactions});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ جلب التفاعلات حسب المستخدم
router.get("/user/:user_id", async (req, res) => {
    try {
      const { user_id } = req.params;
      const interactions = await Interaction.find({ user_id });
  
      if (interactions.length === 0) {
        return res.status(404).json({ message: "No interaction for this user" });
      }
  
      res.status(200).json({data:interactions});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // ✅ جلب التفاعلات حسب المكان
  router.get("/place/:place_id", async (req, res) => {
    try {
      const { place_id } = req.params;
      const interactions = await Interaction.find({ place_id });
  
      if (interactions.length === 0) {
        return res.status(404).json({ message: "No interaction for this palce" });
      }
  
      res.status(200).json({data:interactions});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  

module.exports = router;

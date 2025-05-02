const express = require("express");
const router = express.Router();
const Preference = require("../models/preferences");
const User = require("../models/user");

// // ✅ 1️⃣ Add User Travel Preferences
// router.post("/add", async (req, res) => {
//     try {
//         const { user_id, destinations, travel_dates, group_type, accessibility_needs } = req.body;

//         // 🔹 Ensure `user_id` is provided
//         if (!user_id) {
//             return res.status(400).json({ error: "User ID is required." });
//         }

//         // 🔹 Check if the user exists in the database
//         const userExists = await User.findById(user_id);
//         if (!userExists) {
//             return res.status(404).json({ error: "User not found." });
//         }

//         // 🔹 Check if preference for this user already exists
//         const existingPreference = await Preference.findOne({ user_id });
//         if (existingPreference) {
//             return res.status(400).json({ error: "User preferences already exist!" });
//         }

//         // 🔹 Validate that `travel_dates` is in the future
//         const currentDate = new Date();
//         const travelDate = new Date(travel_dates);
//         if (travelDate <= currentDate) {
//             return res.status(400).json({ error: "Travel dates must be in the future!" });
//         }

//         // 🔹 Create new preference
//         const newPreference = new Preference({
//             user_id,
//             destinations,
//             travel_dates,
//             group_type,
//             accessibility_needs
//         });

//         await newPreference.save();
//         res.status(201).json({ message: "Preferences saved successfully!", preference: newPreference });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // ✅ 2️⃣ Get all User Preferences 
// router.get("/", async (req, res) => {
//     try {
//         const preferences = await Preference.find();
//         res.status(200).json(preferences);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// ✅ إضافة تفضيلات السفر مع توليد السنة أوتوماتيك
router.post("/add", async (req, res) => {
    try {
      const { user_id, destinations, travel_dates, group_type, accessibility_needs, budget } = req.body;
  
      // 🔎 التحقق من الحقول المطلوبة
      if (!user_id || !destinations || !travel_dates || !group_type || !budget) {
        return res.status(400).json({ error: "Missing required fields." });
      }
  
      // 🔎 تأكد من وجود اليوزر
      const userExists = await User.findById(user_id);
      if (!userExists) {
        return res.status(404).json({ error: "User not found." });
      }
  
      // 🔎 تأكد إذا التفضيلات موجودة أصلاً
      const existingPreference = await Preference.findOne({ user_id });
      if (existingPreference) {
        return res.status(400).json({ error: "User preferences already exist!" });
      }
  
      // ✅ توليد السنة الحالية
      const currentYear = new Date().getFullYear();
  
      // 🔎 تأكد إن اسم الشهر مكتوب بشكل صحيح
      const validMonths = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      if (!validMonths.includes(travel_dates)) {
        return res.status(400).json({ error: "Invalid month name for travel_dates." });
      }
  
      // ✅ ضم الشهر مع السنة
      const finalTravelDate = `${travel_dates} ${currentYear}`;
  
      // ✅ إنشاء التفضيلات
      const newPreference = new Preference({
        user_id,
        destinations,
        travel_dates: finalTravelDate,
        group_type,
        accessibility_needs,
        budget
      });
  
      await newPreference.save();
      res.status(201).json({ message: "Preferences saved successfully!", preference: newPreference });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// ✅ 2️⃣ Get User Preferences by `user_id`
router.get("/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;
        const preference = await Preference.findOne({ user_id });

        if (!preference) {
            return res.status(404).json({ error: "Preferences not found for this user!" });
        }

        res.status(200).json(preference);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ✅ 3️⃣ Update User Preferences
// ✅ تحديث تفضيلات المستخدم
router.put("/update/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;
        let updatedData = req.body;

        // 🔎 التحقق من وجود المستخدم
        const userExists = await User.findById(user_id);
        if (!userExists) {
            return res.status(404).json({ error: "User not found!" });
        }

        // 🔎 التحقق من وجود التفضيلات للمستخدم
        const existingPreference = await Preference.findOne({ user_id });
        if (!existingPreference) {
            return res.status(404).json({ error: "Preferences not found for this user!" });
        }

        // ✅ تحديث `travel_dates` (إذا تم إرساله)
        if (updatedData.travel_dates) {
            const validMonths = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];

            // 🔎 تأكد أن `travel_dates` هو شهر صحيح فقط
            if (!validMonths.includes(updatedData.travel_dates)) {
                return res.status(400).json({ error: "Invalid month name for travel_dates." });
            }

            // ✅ توليد السنة الحالية ودمجها مع الشهر
            const currentYear = new Date().getFullYear();
            updatedData.travel_dates = `${updatedData.travel_dates} ${currentYear}`;
        }

        // 🔎 إزالة `user_id` من الـ update (لأنه لا يجب تعديله)
        delete updatedData.user_id;

        // ✅ تحديث التفضيلات
        const updatedPreference = await Preference.findOneAndUpdate(
            { user_id },
            { $set: updatedData },
            { new: true } // ✅ يُرجع البيانات بعد التحديث
        );

        res.status(200).json({ message: "Preferences updated successfully!", updatedPreference });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


//***************************** */
// ✅ 3️⃣ Bulk Update User Preferences
// ✅ تحديث جماعي لتفضيلات المستخدمين
router.put("/bulk-update", async (req, res) => {
    try {
        const updates = req.body; // Array of update objects

        // Validate input is an array
        if (!Array.isArray(updates)) {
            return res.status(400).json({ error: "Input should be an array of update objects" });
        }

        const validMonths = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        const results = [];
        const errors = [];

        for (const update of updates) {
            try {
                // Validate required fields
                if (!update._id || !update.user_id) {
                    errors.push({
                        pref_id: update._id,
                        user_id: update.user_id,
                        error: "Missing _id or user_id field"
                    });
                    continue;
                }

                // Check if user exists
                const userExists = await User.findById(update.user_id);
                if (!userExists) {
                    errors.push({
                        pref_id: update._id,
                        user_id: update.user_id,
                        error: "User not found"
                    });
                    continue;
                }

                // Check if preference exists
                const existingPreference = await Preference.findOne({
                    _id: update._id,
                    user_id: update.user_id
                });
                
                if (!existingPreference) {
                    errors.push({
                        pref_id: update._id,
                        user_id: update.user_id,
                        error: "Preference not found for this user"
                    });
                    continue;
                }

                // Process travel_dates if provided
                if (update.travel_dates) {
                    if (!validMonths.includes(update.travel_dates)) {
                        errors.push({
                            pref_id: update._id,
                            user_id: update.user_id,
                            error: "Invalid month name for travel_dates"
                        });
                        continue;
                    }

                    // Add current year to travel_dates
                    const currentYear = new Date().getFullYear();
                    update.travel_dates = `${update.travel_dates} ${currentYear}`;
                }

                // Remove user_id from update to prevent modification
                const updateData = { ...update };
                delete updateData._id;
                delete updateData.user_id;

                // Perform the update
                const updatedPreference = await Preference.findOneAndUpdate(
                    { _id: update._id, user_id: update.user_id },
                    { $set: updateData },
                    { new: true }
                );

                results.push({
                    pref_id: update._id,
                    user_id: update.user_id,
                    status: "success",
                    updatedPreference
                });
            } catch (error) {
                errors.push({
                    pref_id: update._id,
                    user_id: update.user_id,
                    error: error.message
                });
            }
        }

        res.status(200).json({
            message: "Bulk update completed",
            successCount: results.length,
            errorCount: errors.length,
            results,
            errors
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//**************************** */
// ✅ 4️⃣ Delete User Preferences
router.delete("/delete/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;
        const deletedPreference = await Preference.findOneAndDelete({ user_id });

        if (!deletedPreference) {
            return res.status(404).json({ error: "Preferences not found for this user!" });
        }

        res.status(200).json({ message: "Preferences deleted successfully!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

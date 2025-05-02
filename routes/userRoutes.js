const jwt = require("jsonwebtoken");
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const { getGFSBucket } = require("../utils/fileUpload");
const Preference = require("../models/preferences");
const router = express.Router();


// multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// // 🔹 إنشاء مستخدم جديد مع صورة مع يوزر ترافيل بريفرنس ب قيم الإفتراضية

router.post("/register", upload.single("profile_image"), async (req, res) => {
  try {
    const { name, email, password, role, preferences } = req.body;

    // تحقق من وجود المستخدم
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists." });
    }

    // تشفير كلمة المرور
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // تحميل الصورة إلى GridFS
    let filename;
    if (req.file) {
      const gfsBucket = getGFSBucket();
      if (!gfsBucket) {
        return res.status(500).json({ error: "GridFSBucket not initialized yet." });
      }
      filename = `user_${Date.now()}_${req.file.originalname}`;
      const uploadStream = gfsBucket.openUploadStream(filename);
      uploadStream.end(req.file.buffer);
    }

    // إنشاء المستخدم
    const newUser = new User({
      name,
      email,
      passwordHash,
      role,
      profile_image: filename,
      preferences,
    });

    const savedUser = await newUser.save();

    // ✅ أوتوماتيك: إنشاء تفضيلات سفر فاضية لهذا المستخدم
    const emptyPreference = new Preference({
      user_id: savedUser._id,
      destinations: [],
      travel_dates: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`, // الشهر الحالي مع السنة
      group_type: "solo",
      accessibility_needs: [],
      budget: "medium"
    });

    await emptyPreference.save();

    res.status(201).json({ message: "✅ User registered and preferences created", user: savedUser });

  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: err.message });
  }
});

//***************** */
// 🔍 عرض صورة من GridFS حسب الاسم
router.get("/image/:userId", async (req, res) => {
  try {
    const gfsBucket = getGFSBucket();
    if (!gfsBucket) {
      return res.status(500).json({ error: "❌ GridFSBucket not initialized yet." });
    }

    const user = await User.findById(req.params.userId);
    if (!user || !user.profile_image) {
      return res.status(404).json({ error: "❌ User or profile image not found." });
    }

    const downloadStream = gfsBucket.openDownloadStreamByName(user.profile_image);

    downloadStream.on("error", () => {
      return res.status(404).json({ error: "❌ Image not found." });
    });

    res.set("Content-Type", "image/jpeg");
    downloadStream.pipe(res);
    
  } catch (err) {
    console.error("❌ Error while retrieving image:", err);
    res.status(500).json({ error: "❌ Failed to retrieve image." });
  }
});
// 🔄 تحديث صورة المستخدم
// const upload = multer({ storage: multer.memoryStorage() });
router.put("/image/:id", upload.single("profile_image"), async (req, res) => {
  try {
    const gfsBucket = getGFSBucket();
    if (!gfsBucket) return res.status(500).json({ error: "❌ GridFSBucket not initialized." });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "❌ User not found." });

    // 🗑️ حذف الصورة القديمة إن وجدت
    if (user.profile_image) {
      const files = await gfsBucket.find({ filename: user.profile_image }).toArray();
      if (files.length) {
        await gfsBucket.delete(files[0]._id);
        console.log("🗑️ Old image deleted");
      }
    }

    // ✅ رفع الصورة الجديدة
    const filename = `user_${Date.now()}_${req.file.originalname}`;
    const uploadStream = gfsBucket.openUploadStream(filename);
    uploadStream.end(req.file.buffer);

    // تحديث اسم الصورة في المستخدم
    user.profile_image = filename;
    await user.save();

    res.status(200).json({ message: "✅ Profile image updated", profile_image: filename });

  } catch (err) {
    console.error("❌ Error updating profile image:", err);
    res.status(500).json({ error: "❌ Failed to update image" });
  }
});

// 🗑️ حذف صورة المستخدم
router.delete("/image/:id", async (req, res) => {
  try {
    const gfsBucket = getGFSBucket();
    if (!gfsBucket) return res.status(500).json({ error: "❌ GridFSBucket not initialized." });

    const user = await User.findById(req.params.id);
    if (!user || !user.profile_image) return res.status(404).json({ error: "❌ User or image not found." });

    const files = await gfsBucket.find({ filename: user.profile_image }).toArray();
    if (files.length) {
      await gfsBucket.delete(files[0]._id);
      user.profile_image = undefined;
      await user.save();
      return res.status(200).json({ message: "🗑️ Profile image deleted successfully" });
    } else {
      return res.status(404).json({ error: "❌ Image not found in GridFS." });
    }

  } catch (err) {
    console.error("❌ Error deleting profile image:", err);
    res.status(500).json({ error: "❌ Failed to delete image" });
  }
});

///////////////////

// // 🔹 إنشاء مستخدم جديد
// router.post("/register", async (req, res) => {
//     try {
//       const { name, email, password, role, profile_image, preferences } = req.body;
  
//       //التحقق من وجود البريد الإلكتروني
//       const userExists = await
//       User.findOne({email: req.body.email});
//         if (userExists) {
//             return res.status(400).json({ error: "User already exists." });
//       }
      

//       // ✅ تشفير كلمة المرور قبل الحفظ
//       const saltRounds = 10;
//       const passwordHash = await bcrypt.hash(password, saltRounds);

//       // ✅ إنشاء مستخدم جديد
//       const newUser = new User({
//         name,
//         email,
//         passwordHash,
//         role,
//         profile_image,
//         preferences,
//       });
      

//       const savedUser = await newUser.save();
//       res.status(201).json(savedUser);


//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
// });


// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    //create token
    const token = jwt.sign({ id: user._id, role: user.role }, "YOUR_SECRET_KEY", { expiresIn: "1h" });

     // Return user info without passwordHash
     const { passwordHash, ...userData } = user.toObject();

    res.status(200).json({ message: "Login successful!", token , data: userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user preferences
router.put("/updatePreferences/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { preferences } = req.body;

    const user = await User.findByIdAndUpdate(id, { preferences }, { new: true });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ message: "Preferences updated successfully!", preferences });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//update user image
router.put("/updateImage/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { image } = req.body;

    const user = await User.findByIdAndUpdate
    (id, { image }, { new: true });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ message: "Image updated successfully!", image });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//update user password
// ✅ تحديث كلمة المرور وتشفيرها قبل الحفظ
router.put("/updatePassword/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body; // استقبل كلمة المرور الجديدة بشكل واضح

    if (!password) {
      return res.status(400).json({ error: "Password is required." });
    }

    // ✅ تشفير كلمة المرور
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // ✅ تحديث كلمة المرور المشفرة
    const user = await User.findByIdAndUpdate(
      id,
      { passwordHash },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users admoin only 
router.get("/all", authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }
  
      const users = await User.find();
      res.status(200).json({ users });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Get user details by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get user details by email
router.get("/email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
  
      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// // Delete user by ID
router.delete("/id/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // أول حاجة امسح اليوزر
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // بعدها امسح الترافيل بريفرينس المرتبطة باليوزر ده
    await Preference.deleteMany({ user_id: id });

    res.status(200).json({ message: "User and related preferences deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//********************* */
// Delete user by email
router.delete("/email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const user = await User.findOneAndDelete({ email });

        if (!user) {    
            return res.status(404).json({ error: "User not found." });
        }

        res.status(200).json({ message: "User deleted successfully!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
  
module.exports = router;

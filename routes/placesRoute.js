/////////////////////////////////////////////////
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { getGFSBucket } = require("../utils/fileUpload");
const Place = require("../models/Place");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!location || !location.city || !location.country) {
      return res.status(400).json({ error: "❌ Location is required with city and country." });
    }

    const existing = await Place.findOne({ name, "location.city": location.city, "location.country": location.country });
    if (existing) return res.status(400).json({ error: "❌ This place already exists." });

    let filename;

    if (req.file) {
      const gfsBucket = getGFSBucket(); // هنا فقط استدعاء gfsBucket مباشرة
      if (!gfsBucket) {
        return res.status(500).json({ error: "❌ GridFSBucket is not initialized yet." });
      }

      filename = `place_${Date.now()}_${req.file.originalname}`;
      const uploadStream = gfsBucket.openUploadStream(filename);
      uploadStream.end(req.file.buffer);
    }

    const newPlace = new Place({
      ...req.body,
      image: filename,
    });

    await newPlace.save();
    res.status(201).json({ message: "✅ Place added successfully", place: newPlace });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "❌ Something went wrong." });
  }
});


module.exports = router;

//*************************************************************** */

//************************************************************ */

// // ✅ إضافة مكان جديد (يقبل form-data مع صورة) في ملف علي الجهاز مش علي الmongo
// router.post("/add", upload.single("image"), async (req, res) => {
//   try {
//     const { name, location } = req.body;

//     // التحقق من وجود location.city و location.country
//     if (!location || !location.city || !location.country) {
//       return res.status(400).json({ error: "❌ Location is required with city and country." });
//     }

//     // التحقق إذا كان المكان موجود
//     const existingPlace = await Place.findOne({
//       name,
//       "location.city": location.city,
//       "location.country": location.country,
//     });

//     if (existingPlace) {
//       return res.status(400).json({ error: "❌ This place already exists." });
//     }

//     // إعداد البيانات
//     const data = {
//       ...req.body,
//       image: req.file ? req.file.filename : null,
//     };

//     const newPlace = new Place(data);
//     await newPlace.save();

//     res.status(201).json({ message: "✅ Place added successfully", place: newPlace });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });


//--------------------
// get place with image url
router.get("/:id", async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ error: "❌ Place not found" });

    const placeObj = place.toObject();
    if (placeObj.image) {
      placeObj.image_url = `${req.protocol}://${req.get("host")}/places/image/${placeObj.image}`;
    }

    res.json(placeObj);

  } catch (err) {
    console.error("❌ Failed to fetch place:", err);
    res.status(500).json({ error: "❌ Server error" });
  }
});
////////////////////////////////

//////////////
// ✅ Get image by filename from GridFS
// const { getGFSBucket } = require("../utils/fileUpload"); // خد الباكت من الدالة

router.get("/image/:placeId", async (req, res) => {
  try {
    const place = await Place.findById(req.params.placeId);

    if (!place || !place.image) {
      return res.status(404).json({ error: "❌ Place or image not found" });
    }

    const gfsBucket = getGFSBucket();
    if (!gfsBucket) {
      return res.status(500).json({ error: "❌ GridFS not initialized yet" });
    }

    const downloadStream = gfsBucket.openDownloadStreamByName(place.image);

    downloadStream.on("error", () => {
      return res.status(404).json({ error: "❌ Image not found" });
    });

    // لو الصورة PNG غير النوع حسب الامتداد لو حبيت
    res.set("Content-Type", "image/jpeg");

    downloadStream.pipe(res);
  } catch (err) {
    console.error("❌ Error while retrieving image by placeId:", err);
    res.status(500).json({ error: "❌ Failed to retrieve image" });
  }
});

//******************* */

// ✅ Update a place by ID
router.put("/update/:id", upload.single("image"), async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ error: "❌ Place not found" });
    }

    const gfsBucket = getGFSBucket();
    if (!gfsBucket) {
      return res.status(500).json({ error: "❌ GridFS not initialized yet" });
    }

    let filename = place.image;

    // ✅ لو المستخدم رفع صورة جديدة
    if (req.file) {
      // 🗑️ احذف الصورة القديمة من GridFS
      if (place.image) {
        const fileCursor = await gfsBucket.find({ filename: place.image }).toArray();
        if (fileCursor.length > 0) {
          await gfsBucket.delete(fileCursor[0]._id);
          console.log("🗑️ Old image deleted");
        }
      }

      // ⬆️ ارفع الصورة الجديدة
      filename = `place_${Date.now()}_${req.file.originalname}`;
      const uploadStream = gfsBucket.openUploadStream(filename);
      uploadStream.end(req.file.buffer);
    }

    // 🔄 حدث البيانات
    const updatedData = {
      ...req.body,
      image: filename,
    };

    const updatedPlace = await Place.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.status(200).json({ message: "✅ Place updated successfully", place: updatedPlace });

  } catch (error) {
    console.error("❌ Error during update:", error);
    res.status(500).json({ error: "❌ Failed to update place" });
  }
});
//****** */

// // ✅ Delete a place by ID
// router.delete("/delete/:place_id", async (req, res) => {
//   try {
//     const { place_id } = req.params;

//     // 🔹 حذف المكان
//     const deletedPlace = await Place.findByIdAndDelete(place_id);

//     if (!deletedPlace) {
//       return res.status(404).json({ error: "Place not found." });
//     }

//     // 🔹 إيجاد أعلى ID بعد الحذف وتحديث العداد
//     const lastPlace = await Place.findOne({}, {}, { sort: { _id: -1 } });

//     const newCounterValue = lastPlace ? lastPlace._id : 0; // إذا لا يوجد أماكن، يبدأ العد من 1

//     await Counter.findByIdAndUpdate(
//       { _id: "places_id" },
//       { seq: newCounterValue },
//       { upsert: true } // إذا لم يكن موجودًا، يتم إنشاؤه
//     );

//     res.status(200).json({ message: "Place deleted successfully!" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// ✅ Delete a place and its image(s) by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);

    if (!place) {
      return res.status(404).json({ error: "❌ Place not found" });
    }

    // 🗑️ حذف الصورة من GridFS
    const gfsBucket = getGFSBucket();
    if (gfsBucket && place.image) {
      // مفيش طريقة مباشرة نحذف بالاسم، لازم نجيب الـ file من الـ files collection
      const file = await gfsBucket.find({ filename: place.image }).toArray();

      if (file.length > 0) {
        await gfsBucket.delete(file[0]._id);
        console.log("🗑️ Image deleted from GridFS");
      }
    }

    // 🧹 حذف المكان نفسه من الداتابيز
    await Place.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "✅ Place and its image deleted successfully" });

  } catch (error) {
    console.error("❌ Error deleting place or image:", error);
    res.status(500).json({ error: "❌ Failed to delete place or image" });
  }
});

module.exports = router;

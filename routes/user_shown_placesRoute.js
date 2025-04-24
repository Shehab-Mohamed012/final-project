const express = require("express");
const mongoose = require("mongoose");
const Place = require("../models/Place"); // تأكد من أن المسار صحيح

const router = express.Router();

// ✅ جلب كل البيانات من الكولكشن مباشرة بدون Schema
router.get("/get-all", async (req, res) => {
    try {
        const collection = mongoose.connection.db.collection("user_shown_places");
        const data = await collection.find({}).toArray();
        res.status(200).json({ data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ البحث عن أماكن مستخدم معين فقط
router.get("/get/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;
        const collection = mongoose.connection.db.collection("user_shown_places");
        const userData = await collection.findOne({ user_id });

        if (!userData) {
            return res.status(404).json({ error: "No data found for this user." });
        }

        res.status(200).json({ data: userData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ استرجاع بيانات الأماكن مع عرض الأحدث أولًا
router.get("/get_place_detales/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;
        const collection = mongoose.connection.db.collection("user_shown_places");

        const userData = await collection.findOne({ user_id });

        if (!userData || !userData.place_ids || userData.place_ids.length === 0) {
            return res.status(404).json({ error: "No data found for this user." });
        }

        // ✅ ترتيب الأماكن بحيث الأحدث يظهر أولًا
        const sortedPlaceIds = userData.place_ids.reverse();

        // ✅ جلب تفاصيل الأماكن من الـ `places` collection
        const places = await Place.find({ _id: { $in: sortedPlaceIds } });

        // ✅ ترتيب الأماكن بنفس ترتيب الـ `place_ids`
        const orderedPlaces = sortedPlaceIds.map(id => places.find(place => place._id.toString() === id)).filter(place => place);

        res.status(200).json({ places: orderedPlaces });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ✅ إرجاع آخر 10 أماكن تمت إضافتها لمستخدم معين
router.get("/latest-places/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;

        // 🔹 استرجاع بيانات `user_shown_places` مباشرة من MongoDB
        const userPlaces = await mongoose.connection.db
            .collection("user_shown_places")
            .findOne({ user_id });

        if (!userPlaces || !userPlaces.place_ids.length) {
            return res.status(404).json({ error: "No places found for this user." });
        }

        // 🔹 جلب آخر 10 أماكن (الأحدث في الأعلى)
        const latestPlaceIds = userPlaces.place_ids.slice(-10).reverse();

        // 🔹 جلب تفاصيل الأماكن من `places`
        const places = await mongoose.connection.db
            .collection("places")
            .find({ _id: { $in: latestPlaceIds } })
            .toArray();

        res.status(200).json({ latest_places: places });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;

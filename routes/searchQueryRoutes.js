const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const SearchQuery = require("../models/search_queries");
const User = require("../models/user");



// 📌 Add a new search query and update user's search history
router.post("/add", async (req, res) => {
  try {
    const { user_id, query, keywords } = req.body;

    if (!user_id || !query || !Array.isArray(keywords)) {
      return res.status(400).json({ error: "Invalid input data." });
    }

    // 🔍 Check if user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // 🔹 Create and save new search query
    const newSearch = new SearchQuery({ user_id, query, keywords });
    await newSearch.save();

    // 🔹 Update user's search history (limit to last 10 searches)
    await User.findByIdAndUpdate(
      user_id,
      {
        $push: {
          search_history: {
            $each: [{ query, keywords, timestamp: new Date() }],
            $slice: -10 // Keep only the last 10 searches
          }
        }
      },
      { new: true }
    );

    res.status(201).json({
      message: "Search query saved successfully and user history updated!",
      search: newSearch
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 📌 Get all search queries for a specific user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const searches = await SearchQuery.find({ user_id: userId }).sort({ timestamp: -1 });

    if (!searches.length) {
      return res.status(404).json({ message: "No search history found for this user." });
    }

    res.status(200).json(searches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 Delete a specific search query
router.delete("/:searchId", async (req, res) => {
  try {
    const { searchId } = req.params;
    const deletedSearch = await SearchQuery.findByIdAndDelete(searchId);

    if (!deletedSearch) {
      return res.status(404).json({ message: "Search query not found." });
    }

    res.status(200).json({ message: "Search query deleted successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

//-------------------------------------------------------
// const express = require("express");
// const router = express.Router();
// const search_queries= require("../models/search_queries");// Import search_queries model

// // 🔍 Add a search entry
// router.post("/add", async (req, res) => {
//   try {
//     const { user_id, query, keywords } = req.body;

//     if (!user_id || !query) {
//       return res.status(400).json({ error: "User ID and search query are required." });
//     }

//     const newSearch = new search_queries({
//       user_id,
//       query,
//       keywords,
//       timestamp: new Date(),
//     });

//     await newSearch.save();
//     res.status(201).json({ message: "Search entry added successfully.", search: newSearch });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // 📜 Get all searches by user ID
// router.get("/user/:userId", async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const searches = await search_queries.find({ user_id: userId }).sort({ timestamp: -1 });

//     if (searches.length === 0) {
//       return res.status(404).json({ message: "No search history found for this user." });
//     }

//     res.status(200).json({ searches });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // 🔄 Update a search entry by ID
// router.put("/update/:searchId", async (req, res) => {
//   try {
//     const { searchId } = req.params;
//     const { query, keywords } = req.body;

//     const updatedSearch = await search_queries.findByIdAndUpdate(
//       searchId,
//       { query, keywords, timestamp: new Date() },
//       { new: true }
//     );

//     if (!updatedSearch) {
//       return res.status(404).json({ error: "Search entry not found." });
//     }

//     res.status(200).json({ message: "Search entry updated successfully.", search: updatedSearch });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // ❌ Delete a search entry by ID
// router.delete("/delete/:searchId", async (req, res) => {
//   try {
//     const { searchId } = req.params;

//     const deletedSearch = await search_queries.findByIdAndDelete(searchId);

//     if (!deletedSearch) {
//       return res.status(404).json({ error: "Search entry not found." });
//     }

//     res.status(200).json({ message: "Search entry deleted successfully." });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// module.exports = router;

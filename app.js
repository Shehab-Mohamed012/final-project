const express = require('express');
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const placesRoute = require('./routes/placesRoute');
const searchRoute = require('./routes/searchQueryRoutes');
const userRoute = require('./routes/userRoutes');
const reviewRoute = require('./routes/reviewRoute');
const user_travel_preferencesRoute = require('./routes/preferencesRoute');
const interactionRoute = require('./routes/interactionRoute');
const RoadmapRoute = require("./routes/roadmapsRoute");
const reviewInteractionRoute = require('./routes/reviewInteractionRoute');
const Place = require('./models/Place');
const user_shown_placesRoute = require('./routes/user_shown_placesRoute');
require("dotenv").config();

const app = express();

// Enable Cross-Origin Resource Sharing (CORS)
// This allows the frontend (even if it's hosted on a different domain or port)
// to communicate with this backend without being blocked by the browser's same-origin policy.
const cors = require('cors');
app.use(cors());


// Enable GZIP compression for all responses
const compression = require('compression');
app.use(compression());


const port = 3000 || process.env.PORT; // Use the port from environment variables or default to 3000
const dbName = "travel_app"; // Database name

app.use(bodyParser.json());

// ✅ Middleware to parse JSON requests
app.use(express.json());

// Connect to MongoDB   
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log(`✅ Connected to the database: ${dbName}`);

    await Place.updateMany(
      { likes: { $not: { $type: "number" } } }, 
      { $set: { likes: 0 } }
    );

  })
  .catch((err) => {
    console.error("❌ Database connection error:", err);
});



app.use('/places', placesRoute);
app.use('/search', searchRoute);
app.use('/user', userRoute);
app.use('/review', reviewRoute);
app.use('/user_travel_preferences', user_travel_preferencesRoute);
app.use('/interaction', interactionRoute);
app.use("/roadmaps", RoadmapRoute);
app.use('/review_interaction', reviewInteractionRoute);
app.use('/user_shown_places', user_shown_placesRoute);



app.listen(port, () => {
    console.log('Server is running on port ' + port);
});
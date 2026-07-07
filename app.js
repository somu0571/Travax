if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
const express = require("express");
const app = express();
const port = 8080;
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const Listing = require("./models/listing");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const bookingRouter = require("./routes/bookings.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const flash = require("connect-flash");
const users = require("./routes/user.js");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// main()
//   .then(() => { console.log("Connected to Database") })
//   .catch(err => console.log(err));

// async function main() {
//   await mongoose.connect('mongodb://127.0.0.1:27017/travax');
// }


console.log("Attempting to connect to URI:", process.env.ATLASDB_URL);

main()
    .then(() => { console.log("Connected to Database Successfully!") })
    .catch(err => {
        console.log("Mongoose Connection Error Details:");
        console.error(err);
    });

async function main() {
    await mongoose.connect(process.env.ATLASDB_URL, {
        family: 4
    });
}




app.set("view engine", "ejs");
app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.json());

const store = MongoStore.create({
    mongoUrl: process.env.ATLASDB_URL,
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter: 24 * 60 * 60,
});

store.on("error", (err) => {
    console.log("Error in MongoStore", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.user = req.user;
    res.locals.currUser = req.user;
    next();
});

app.get("/", (req, res) => {
    res.redirect("/listings");
});


app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", bookingRouter);
app.use("/", userRouter);

// Chat Bot (Travax AI guide) Code

app.post("/api/chat", wrapAsync(async (req, res) => {
    try {
        const { history } = req.body;
        if (!history || history.length === 0) {
            return res.status(400).json({ error: "No chat history provided" });
        }

        const properties = await Listing.find({}, "title description price location country");

        const catalogText = properties.map(property =>
            `Title: ${property.title}\nDescription: ${property.description}\nPrice: ₹${property.price}/night\nLocation: ${property.location}, ${property.country}\n---`
        ).join("\n");

        const personalityRules = `
            You are "TravaxBot", an expert AI assistant on the Travax rental web application.
            Match customer queries ONLY using the real website catalog listings provided below.
            Always clearly include the accommodation Title, Location, and Price per night when recommending.
            
            If the user asks to book a specific accommodation that exists in the catalog items below, reply politely telling them to scroll up and use the official booking or reservation calendar widget built directly onto that listing's unique detail web page.

            Available Catalog Items:
            ${catalogText}
        `;

        const fullContents = [
            {
                role: "user",
                parts: [{ text: personalityRules }]
            },
            ...history
        ];

        const modelPool = [
            'gemini-2.5-flash-lite',
            'gemini-2.5-flash',
            'gemini-3.5-flash'
        ];

        let aiOutput;
        let success = false;

        for (let i = 0; i < modelPool.length; i++) {
            try {
                aiOutput = await ai.models.generateContent({
                    model: modelPool[i],
                    contents: fullContents,
                    config: { temperature: 0.5 }
                });
                success = true;
                break;
            } catch (apiError) {
                if ((apiError.status === 503 || apiError.status === 429) && i < modelPool.length - 1) {
                    console.log(`Model ${modelPool[i]} throttled. Switching to alternate option...`);
                    await new Promise(resolve => setTimeout(resolve, 350));
                } else {
                    throw apiError;
                }
            }
        }

        if (!success) {
            throw new Error("All fallback endpoints exhausted.");
        }

        res.json({ reply: aiOutput.text });
    } catch (serverError) {
        console.error("Chat Error:", serverError);
        res.status(500).json({ reply: "I'm having a brief connection hitch. Could you type that last choice one more time for me?" });
    }
}));


// Middlewares for Error Handling in Travax

app.all(/.*/, (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong !" } = err;
    if (err.name === "ValidationError" || err.name === "CastError") {
        message = "Some error occurred";
    }

    res.status(statusCode).render("error.ejs", { statusCode, message, err });
});

app.listen(port, () => {
    console.log("Server started at", `${port}`);
});
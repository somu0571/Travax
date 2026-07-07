const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { listingSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const { isLoggedIn, isOwner } = require("../middleware.js");
const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage: storage });
const axios = require("axios");

const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((e) => e.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}

// Index Route
router.get("/", wrapAsync(async (req, res) => {
    const dbQuery = {};
    const { category, search } = req.query;

    if (category) {
        dbQuery.category = category;
    }

    if (search) {
        const searchWord = search.trim();
        dbQuery.$or = [
            { title: { $regex: searchWord, $options: "i" } },
            { location: { $regex: searchWord, $options: "i" } },
            { country: { $regex: searchWord, $options: "i" } }
        ];
    }

    const allListings = await Listing.find(dbQuery);
    res.render("listings/index.ejs", { allListings });
}));

// New Route
router.get("/new", isLoggedIn, (req, res) => {
    res.render("listings/new.ejs");
});

// My Listing Route
router.get("/my-listings", isLoggedIn, wrapAsync(async (req, res) => {
    const allListings = await Listing.find({ owner: req.user._id });
    res.render("listings/myListings.ejs", { allListings });
}));

// EDIT ROUTE (Added here so Express doesn't mistake "/edit" for an ":id")
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing });
}));

// Show Route (Kept below Edit Route)
router.get("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: { path: "author" }
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing Not Found!");
        return res.redirect("/listings");
    }

    const existingBookings = await Booking.find({ listing: id });

    res.render("listings/show.ejs", {
        listing,
        existingBookings,
        razorpayKeyId: process.env.RAZORPAY_TEST_KEY_ID
    });
}));

// Create Route
router.post("/", isLoggedIn, upload.single("image"), validateListing, wrapAsync(async (req, res) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    if (req.file) {
        newListing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    }

    try {
        const locationQuery = encodeURIComponent(req.body.listing.location);
        const MAPTILER_API_KEY = process.env.MAPTILER_API_KEY || "IcH7tU3r7SPzLWIE8R8D";

        const geocodeResponse = await axios.get(
            `https://api.maptiler.com/geocoding/${locationQuery}.json?key=${MAPTILER_API_KEY}&limit=1`
        );

        if (geocodeResponse.data && geocodeResponse.data.features && geocodeResponse.data.features.length > 0) {
            const [lon, lat] = geocodeResponse.data.features[0].center;

            newListing.geometry = {
                type: "Point",
                coordinates: [lon, lat]
            };
        } else {
            newListing.geometry = { type: "Point", coordinates: [75.7873, 26.9124] };
        }
    } catch (err) {
        console.error("Geocoding Error:", err.message);
        newListing.geometry = { type: "Point", coordinates: [75.7873, 26.9124] };
    }

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
}));

// Update Route
router.put("/:id", isLoggedIn, isOwner, upload.single("image"), validateListing, wrapAsync(async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
        await listing.save();
    }

    try {
        const locationQuery = encodeURIComponent(req.body.listing.location);
        const MAPTILER_API_KEY = process.env.MAPTILER_API_KEY || "IcH7tU3r7SPzLWIE8R8D";

        const geocodeResponse = await axios.get(
            `https://api.maptiler.com/geocoding/${locationQuery}.json?key=${MAPTILER_API_KEY}&limit=1`
        );

        if (geocodeResponse.data && geocodeResponse.data.features && geocodeResponse.data.features.length > 0) {
            const [lon, lat] = geocodeResponse.data.features[0].center;

            listing.geometry = {
                type: "Point",
                coordinates: [lon, lat]
            };
            await listing.save();
        }
    } catch (err) {
        console.error("Geocoding Update Error:", err.message);
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
}));

// Delete Route
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
}));

module.exports = router;
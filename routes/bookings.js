const express = require("express");
const router = express.Router({ mergeParams: true });
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");

router.get("/listings/:id/blocked-slots", async (req, res) => {
    try {
        const { id } = req.params;
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ error: "Missing start or end date query parameter." });
        }

        const overlappingBookings = await Booking.find({
            listing: id,
            $and: [
                { startDate: { $lt: new Date(end + "T23:59:59") } },
                { endDate: { $gt: new Date(start + "T00:00:00") } }
            ]
        });

        const blockedSlots = overlappingBookings.map(booking => {
            const formatTimeToHourString = (dateObj) => {
                let hours = dateObj.getHours();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12;
                return `${String(hours).padStart(2, '0')}:00 ${ampm}`;
            };

            return {
                checkIn: formatTimeToHourString(booking.startDate),
                checkOut: formatTimeToHourString(booking.endDate)
            };
        });

        res.json({ blockedSlots });
    } catch (err) {
        console.error("Error in blocked-slots API:", err);
        res.status(500).json({ error: "Internal server error fetching availability matrix." });
    }
});

router.post("/listings/:id/book", isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        const { dateRange, checkInSlot, checkOutSlot, adults, children } = req.body;

        if (!dateRange || !dateRange.includes(" to ") || !checkInSlot || !checkOutSlot) {
            return res.render("bookings/response.ejs", {
                status: "error",
                message: "Bad Request: Missing travel dates or time slots."
            });
        }

        const [startString, endString] = dateRange.split(" to ");

        // FIX: Extract absolute values to construct timezone-agnostic local dates
        const [sYear, sMonth, sDay] = startString.split("-").map(Number);
        const [eYear, eMonth, eDay] = endString.split("-").map(Number);

        const startDate = new Date(sYear, sMonth - 1, sDay);
        const endDate = new Date(eYear, eMonth - 1, eDay);

        const parseTimeToHour = (timeStr) => {
            const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
            if (!match) return 12;
            let hour = parseInt(match[1]);
            const period = match[3].toUpperCase();
            if (period === "PM" && hour < 12) hour += 12;
            if (period === "AM" && hour === 12) hour = 0;
            return hour;
        };

        startDate.setHours(parseTimeToHour(checkInSlot), 0, 0, 0);
        endDate.setHours(parseTimeToHour(checkOutSlot), 0, 0, 0);

        const CLEANING_BUFFER = 60 * 60 * 1000;
        const bufferedStart = new Date(startDate.getTime() - CLEANING_BUFFER);
        const bufferedEnd = new Date(endDate.getTime() + CLEANING_BUFFER);

        const conflictingBooking = await Booking.findOne({
            listing: id,
            $and: [
                { startDate: { $lt: bufferedEnd } },
                { endDate: { $gt: bufferedStart } }
            ]
        });

        if (conflictingBooking) {
            return res.render("bookings/response.ejs", {
                status: "error",
                message: "Time conflict! Someone booked this overlapping window while you were browsing."
            });
        }

        const listing = await Listing.findById(id);
        if (!listing) {
            return res.render("bookings/response.ejs", {
                status: "error",
                message: "Target listing matching database ID not found."
            });
        }

        const timeDiff = endDate.getTime() - startDate.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (nights <= 0) {
            return res.render("bookings/response.ejs", {
                status: "error",
                message: "Invalid configuration: Check-out hour must succeed Check-in hour parameters."
            });
        }

        const basePrice = nights * listing.price;
        const gstTax = basePrice * 0.18;
        const totalPrice = Math.round(basePrice + gstTax);

        const parsedAdults = parseInt(adults) || 1;
        const parsedChildren = parseInt(children) || 0;

        const newBooking = new Booking({
            listing: id,
            user: req.user._id,
            startDate,
            endDate,
            adults: parsedAdults,
            children: parsedChildren,
            totalPrice: totalPrice
        });

        await newBooking.save();

        res.render("bookings/response.ejs", {
            status: "success",
            message: "Your booking is confirmed! You will get an email confirmation shortly.",
            username: req.user.username,
            listingName: listing.title,
            listingId: id,
            dates: `${startString} @ ${checkInSlot} to ${endString} @ ${checkOutSlot}`,
            nights: nights,
            guests: {
                adults: parsedAdults,
                children: parsedChildren
            },
            total: totalPrice
        });

    } catch (error) {
        console.error("Critical error inside transactional process loop:", error);
        res.render("bookings/response.ejs", {
            status: "error",
            message: "Internal Application Exception processing check-out."
        });
    }
});

router.get("/bookings", isLoggedIn, async (req, res) => {
    const myBookings = await Booking.find({ user: req.user._id })
        .populate("listing")
        .sort({ createdAt: -1 });

    res.render("bookings/index.ejs", { myBookings });
});


router.get("/my-bookings", isLoggedIn, async (req, res) => {
    try {
        const myBookings = await Booking.find({ user: req.user._id }).populate("listing");
        res.render("bookings/index", { myBookings });
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to load your bookings.");
        res.redirect("/");
    }
});

router.delete("/listings/:listingId/bookings/:bookingId", isLoggedIn, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { reason } = req.body;

        const booking = await Booking.findById(bookingId).populate("listing");

        if (!booking) {
            req.flash("error", "Booking not found.");
            return res.redirect("/my-bookings");
        }

        const timeUntilCheckin = booking.startDate - new Date();
        const isFullRefund = timeUntilCheckin > (48 * 60 * 60 * 1000);
        const refundAmount = isFullRefund ? booking.totalPrice : (booking.totalPrice * 0.5);

        req.session.cancelledBooking = {
            listing: { title: booking.listing.title },
            refundAmount: refundAmount,
            cancellationReason: reason || "Changed plans"
        };

        await Booking.findByIdAndDelete(bookingId);

        res.redirect("/bookings/cancellation-success");
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong during cancellation.");
        res.redirect("/my-bookings");
    }
});

router.get("/bookings/cancellation-success", isLoggedIn, (req, res) => {
    const booking = req.session.cancelledBooking;
    if (!booking) {
        return res.redirect("/my-bookings");
    }
    req.session.cancelledBooking = null;
    res.render("bookings/cancellation-success", { booking });
});

module.exports = router;
# 🌍 Travax

<div align="center">

### **Discover • Book • Explore**

*A modern full-stack travel accommodation booking platform built with the MEN Stack.*

</div>

---

## 📖 About

**Travax** is a full-stack travel accommodation booking platform inspired by Airbnb, built using **MongoDB Atlas, Express.js, Node.js, EJS, and Bootstrap**. It enables users to discover destinations, explore unique accommodations, list their own properties, book stays securely, and receive AI-powered travel recommendations—all through a clean, responsive, and intuitive interface.

Unlike many booking platforms that separate **Hosts** and **Guests**, **Travax follows a unified user model**. Every registered user can seamlessly switch between being a **host** and a **traveler** using the same account. Users can publish their own accommodations while also booking properties listed by other users, creating a flexible and community-driven travel experience.

To provide a real-world booking experience, Travax integrates secure authentication, cloud-based image storage, interactive maps, geocoding services, online payments, booking management, reviews, and AI-powered travel recommendations into a single application.

---

# 🚀 Features

## 👥 Unified User Experience

- Single account for hosting and booking
- List your own accommodations
- Book accommodations listed by other users
- Manage listings through **My Listings**
- Manage reservations through **My Bookings**

---

## 🔐 Authentication & Authorization

- Secure user registration
- User login & logout
- Passport.js authentication
- Session-based authentication
- Protected routes
- Authorization middleware

---

## 🏡 Listing Management

- Browse available accommodations
- View listing details
- Create new listings
- Edit listings
- Delete listings
- Upload listing images
- Cloudinary image storage
- Manage personal listings

---

## 🔍 Search & Categories

- Search listings by title
- Search listings by destination
- Dynamic category filtering
- Instant search results
- Airbnb-inspired browsing experience

---

## 🗺️ Maps & Geolocation

- Interactive maps using Leaflet.js
- OpenStreetMap integration
- Automatic geocoding using MapTiler API
- Property location markers
- Interactive popup information
- Zoom & navigation controls

---

## 📅 Booking System

- Secure accommodation booking
- Razorpay payment gateway integration
- Booking confirmation
- Booking history
- Booking cancellation
- Booking status management

---

## ⭐ Reviews & Ratings

- Add reviews
- Delete reviews
- Star rating system
- Review validation

---

## 🤖 AI Travel Recommendations

- Google Gemini AI integration
- Personalized destination recommendations
- Intelligent travel assistance

---

## 🛡️ Security

- Passport.js authentication
- Session management
- Route protection
- Joi validation
- Server-side validation
- Flash messages
- MongoDB injection protection
- Centralized error handling

---

## 📱 Responsive Design

- Mobile-friendly
- Tablet optimized
- Desktop responsive

---

# 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | HTML5, CSS3, Bootstrap 5, JavaScript, EJS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas, Mongoose |
| **Authentication** | Passport.js, Passport Local, Express Session |
| **Cloud Storage** | Cloudinary, Multer |
| **Maps & Geolocation** | Leaflet.js, OpenStreetMap, MapTiler SDK, MapTiler Geocoding API |
| **Payments** | Razorpay |
| **AI** | Google Gemini API |
| **Deployment** | Render |

---

# 📂 Project Structure

```text
Travax/
│
├── init/
│
├── models/
│
├── public/
│   ├── css/
│   ├── js/
│   └── video/
│
├── routes/
│
├── utils/
│
├── views/
│
├── .env
├── .gitignore
├── app.js
├── cloudConfig.js
├── middleware.js
├── schema.js
├── package.json
├── package-lock.json
└── README.md
```

---

# ⚙️ Installation

### Clone the Repository

```bash
git clone https://github.com/yourusername/travax.git
```

```bash
cd travax
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file in the project root.

```env
ATLASDB_URL=your_mongodb_atlas_connection_string

SECRET=your_session_secret

CLOUD_NAME=your_cloudinary_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret


RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

GEMINI_API_KEY=your_gemini_api_key
```

### Run the Application

```bash
npm start
```

or

```bash
nodemon app.js
```

---

# 📸 Screenshots

Add screenshots of:



---

# 🚀 Project Highlights

- ✅ Full-Stack MEN Application
- ✅ Unified Host & Traveler Account
- ✅ Secure Authentication & Authorization
- ✅ Property Listing Management
- ✅ Smart Search & Category Filtering
- ✅ Interactive Maps with Leaflet.js
- ✅ OpenStreetMap Integration
- ✅ MapTiler Geocoding API
- ✅ Cloudinary Image Uploads
- ✅ Razorpay Payment Integration
- ✅ Booking History
- ✅ Booking Cancellation
- ✅ Reviews & Ratings
- ✅ Gemini AI Travel Recommendations
- ✅ Responsive User Interface
- ✅ Server-side Validation
- ✅ Comprehensive Error Handling

---

# 📚 Learning Outcomes

Building Travax helped me gain hands-on experience with:

- Full-Stack Web Development
- RESTful API Design
- Authentication & Authorization
- MongoDB Atlas & Mongoose
- Session Management
- Cloudinary Integration
- Interactive Maps & Geocoding
- Payment Gateway Integration
- AI API Integration
- Responsive UI Design
- Input Validation
- Error Handling
- Full-Stack Deployment

---

# 🔮 Future Enhancements

- Google OAuth Authentication
- Wishlist / Favorites
- Email Notifications
- Real-time Availability Calendar
- Production Razorpay Integration
- Dark Mode
- Multi-language Support

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a new branch.

```bash
git checkout -b feature-name
```

3. Commit your changes.

```bash
git commit -m "Add new feature"
```

4. Push your changes.

```bash
git push origin feature-name
```

5. Open a Pull Request.

---

# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

Your support motivates me to continue building impactful full-stack applications and contributing to open source.

---
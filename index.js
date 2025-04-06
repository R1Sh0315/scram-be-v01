const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const Contact = require("./models/contact");
const User = require("./models/user");
const { generateToken, verifyToken } = require("./utils/jwt");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://rishikeshbhalekar6:BjlEQZrBEXeocGfU@cluster0.twi3i.mongodb.net";

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
if (!MONGODB_URI) {
  console.error("MONGODB_URI is undefined. Please check your .env file.");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });

// Root route
app.get("/", (req, res) => {
  res.status(200).send({ message: "root is working" });
});


// Signup
app.post("/api/v1/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const newUser = new User({ email, password });
    await newUser.save();
    const token = generateToken(newUser._id);

    res.status(201).json({ message: "User created successfully", token });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error during signup", details: err.message });
  }
});

// Signin
app.post("/api/v1/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken(user._id);
    res.status(200).json({ message: "Sign in successful", token });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error during signin", details: err.message });
  }
});


const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token)
    return res.status(401).json({ error: "Access denied. No token provided." });

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};


// Get all contacts
app.get("/api/v1/contacts", authenticate, async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.userId });
    if (!contacts.length)
      return res.status(200).json({ message: "Collection is empty" });

    res.status(200).json({ contacts });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error fetching contacts", details: err.message });
  }
});

// Create contact
app.post("/api/v1/create-contact", authenticate, async (req, res) => {
  const { name, number, contactType, link = {} } = req.body;

  if (!name)
    return res.status(400).json({ message: "Name is required" });

  try {
    const existingContact = await Contact.findOne({
      userId: req.userId,
      $or: [{ name }, { number }],
    });

    if (existingContact) {
      return res.status(400).json({
        error: "A contact with the same name or number already exists.",
      });
    }

    const newContact = new Contact({
      userId: req.userId,
      name,
      number,
      contactType,
      link: {
        emailID: link.email || "",
        instaID: link.insta || "",
        facebookID: link.facebook || "",
        telegramID: link.telegram || "",
        portfolio: link.portfolio || "",
      },
    });

    await newContact.save();
    res.status(201).json({
      message: "Contact created successfully",
      contact: newContact,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error creating contact", details: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});

const express = require("express");
const mg = require("mongoose");
const Contact = require("./models/contact");
const bodyParser = require("body-parser");
const User = require("./models/user");
const { generateToken, verifyToken } = require("./utils/jwt");
require("dotenv").config();

const app = express();
app.use(bodyParser.json()); // Middleware to parse JSON bodies

const PORT = process.env.PORT || 3000;
const mySecret = process.env["MONGODB_URI"];
const URI = mySecret;

if (!URI) {
  console.error("MONGODB_URI is undefined. Please check your .env file.");
  process.exit(1); // Stop the server if URI is not found
}

mg.connect(URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

app.get("/", (req, res) => {
  res
    .send({
      message: "root is working",
    })
    .status(200);
});


// Signup route (register a new user)
app.post("/api/v1/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create a new user
    const newUser = new User({
      email,
      password,
    });

    await newUser.save(); // Save user to the database

    // Generate a JWT token for the new user
    const token = generateToken(newUser.userId);

    res.status(201).json({
      message: "User created successfully",
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error during signup", details: err.message });
  }
});

// Signin route (login user)
app.post("/api/v1/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.userId);

    res.status(200).json({
      message: "Sign in successful",
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error during signin", details: err.message });
  }
});

app.get("/api/v1/contacts",authenticate , async (req, res) => {
  try {
    const contacts = await Contact.find();
    if (contacts.length === 0) {
      return res.status(200).json({ message: "Collection is empty" });
    }
    return res.status(200).json({ contacts });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Error fetching contacts", details: err.message });
  }
});

const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

app.post("/api/v1/create-contact",authenticate,  async (req, res) => {
  const { name, number, contactType, link } = req.body;

  if (!name) {
    res.status(400).send({ message: "name is required" });
  }

  try {
    const existingContact = await Contact.findOne({
      $or: [{ name: name }, { number: number }],
    }); 

    if (existingContact) {
      return res.status(400).json({
        error: "A contact with the same name or number already exists.",
      });
    }

    const newContact = new Contact({
      name,
      number,
      contactType,
      link: {
        emaikID: link.email || "",
        instaID: link.insta || "",
        facebookID: link.facebook || "",
        telegramID: link.telegram || "",
        poortfolio: link.portfolio || "",
      },
    });
    await newContact.save(); // Save the contact to the database
    res
      .status(201)
      .json({ message: "Contact created successfully", contact: newContact });
  } catch (err) {
    // Handle any errors
    res
      .status(500)
      .json({ error: "Error creating contact", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT : ${PORT}`);
});

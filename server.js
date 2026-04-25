const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Models
const Item = require("./models/Item");
const User = require("./models/User");

const app = express();
const PORT = 3000;

/* =========================
   🔗 CONNECT TO MONGODB
========================= */
mongoose.connect("mongodb://127.0.0.1:27017/lostfound")
.then(() => console.log("✅ MongoDB connected successfully"))
.catch(err => {
    console.log("❌ MongoDB error:", err.message);
    console.log("💡 Running in demo mode without database...");
});

/* =========================
   🔧 MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// In-memory storage for demo mode (if MongoDB fails)
let memoryItems = [];
let nextId = 1;

/* =========================
   🧪 TEST ROUTE
========================= */
app.get("/test", (req, res) => {
    res.json({ message: "Server is running!" });
});

/* =========================
   📡 ITEM ROUTES
========================= */

// GET all items
app.get("/api/items", async (req, res) => {
    try {
        // Check if MongoDB is connected
        if (mongoose.connection.readyState === 1) {
            const items = await Item.find().sort({ date: -1 });
            return res.json(items);
        } else {
            // Return demo data
            return res.json(memoryItems);
        }
    } catch (err) {
        console.error(err);
        res.json(memoryItems);
    }
});

// POST new item
app.post("/api/items", async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const newItem = new Item(req.body);
            await newItem.save();
            await autoMatchItems(newItem);
            return res.json({ message: "Item added successfully", item: newItem });
        } else {
            // Demo mode
            const newItem = {
                id: nextId++,
                ...req.body,
                matched: false,
                date: new Date()
            };
            memoryItems.push(newItem);
            
            // Auto-match in demo mode
            memoryItems.forEach(item => {
                if (item.id !== newItem.id && 
                    item.type !== newItem.type && 
                    item.name.toLowerCase() === newItem.name.toLowerCase()) {
                    item.matched = true;
                    newItem.matched = true;
                }
            });
            
            return res.json({ message: "Item added successfully (Demo Mode)", item: newItem });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error: " + err.message });
    }
});

// Auto-match function for MongoDB
async function autoMatchItems(newItem) {
    try {
        if (newItem.type === "Lost") {
            const matches = await Item.find({
                type: "Found",
                matched: false,
                name: { $regex: newItem.name, $options: 'i' }
            });
            
            for (let match of matches) {
                if (match.name.toLowerCase() === newItem.name.toLowerCase()) {
                    match.matched = true;
                    newItem.matched = true;
                    await match.save();
                    await newItem.save();
                    console.log(`✅ Matched: ${newItem.name}`);
                }
            }
        } else if (newItem.type === "Found") {
            const matches = await Item.find({
                type: "Lost",
                matched: false,
                name: { $regex: newItem.name, $options: 'i' }
            });
            
            for (let match of matches) {
                if (match.name.toLowerCase() === newItem.name.toLowerCase()) {
                    match.matched = true;
                    newItem.matched = true;
                    await match.save();
                    await newItem.save();
                    console.log(`✅ Matched: ${newItem.name}`);
                }
            }
        }
    } catch (err) {
        console.error("Auto-match error:", err);
    }
}

/* =========================
   👤 USER ROUTES
========================= */

// LOGIN (simplified for demo)
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    
    // Demo admin account - works always
    if (username === "admin" && password === "1234") {
        return res.json({ message: "Login success", success: true });
    }
    
    // Try database if connected
    if (mongoose.connection.readyState === 1) {
        try {
            const user = await User.findOne({ username });
            if (user && await bcrypt.compare(password, user.password)) {
                return res.json({ message: "Login success", success: true });
            }
        } catch (err) {
            console.error(err);
        }
    }
    
    res.status(401).json({ message: "Invalid credentials", success: false });
});

/* =========================
   🌐 SERVE FRONTEND - FIXED (No wildcard issues)
========================= */
// Correct path to frontend folder
const frontendPath = path.join(__dirname, "..", "frontend");
console.log("📁 Serving frontend from:", frontendPath);

// Serve static files from frontend
app.use(express.static(frontendPath));

// Handle root route
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// Handle all other routes - specifically for SPA routing
app.get("/index.html", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// For any other route that's not an API route, serve index.html
app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/') || req.path === '/test') {
        return next();
    }
    // Serve index.html for all other routes
    res.sendFile(path.join(frontendPath, "index.html"));
});

/* =========================
   🚀 START SERVER
========================= */
app.listen(PORT, () => {
    console.log(`\n🚀 ========================================`);
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`🚀 ========================================`);
    console.log(`📁 Frontend path: ${frontendPath}`);
    console.log(`✅ Login with: admin / 1234`);
    console.log(`💡 Status: ${mongoose.connection.readyState === 1 ? 'MongoDB Connected' : 'Demo Mode (No Database)'}`);
    console.log(`🚀 ========================================\n`);
});
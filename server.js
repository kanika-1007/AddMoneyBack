const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// Middleware for validating add-money request payload
const validateAddMoneyRequest = (req, res, next) => {
    const { userId, amount, utr } = req.body;
    if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "Invalid or missing userId" });
    }
    if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ error: "Invalid or missing amount" });
    }
    if (!utr || typeof utr !== "string") {
        return res.status(400).json({ error: "Invalid or missing UTR" });
    }
    next();
};

// Get balance
app.get("/api/add-money/balance/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const userDoc = await db.collection("users").doc(userId).get();
        if (!userDoc.exists) {
            return res.json({ balance: 0 });
        }
        res.json({ balance: userDoc.data().balance || 0 });
    } catch (err) {
        console.error("Error fetching balance:", err);
        res.status(500).json({ error: "Error fetching balance" });
    }
});

// Submit add money request
app.post("/api/add-money/request", validateAddMoneyRequest, async (req, res) => {
    const { userId, amount, utr } = req.body;

    try {
        // Store request in DB
        await db.collection("add_money_requests").add({
            userId,
            amount,
            utr,
            status: "Pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({ message: "Request submitted successfully" });
    } catch (err) {
        console.error("Error submitting request:", err);
        res.status(500).json({ error: "Error submitting request" });
    }
});

// Fetch all requests (Secure this endpoint in production)
app.get("/api/add-money/requests/all", async (req, res) => {
    try {
        const snapshot = await db.collection("add_money_requests").orderBy("createdAt", "desc").get();
        const requests = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        res.json(requests);
    } catch (err) {
        console.error("Error fetching requests:", err);
        res.status(500).json({ error: "Error fetching requests" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

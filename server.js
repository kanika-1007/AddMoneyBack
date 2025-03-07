const express = require("express");
const cors = require("cors");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize Firebase Admin SDK
initializeApp({
    credential: applicationDefault(),
});
const db = getFirestore();

const app = express();
app.use(cors());
app.use(express.json());

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
        console.error(err);
        res.status(500).send("Error fetching balance");
    }
});

// Submit add money request
app.post("/api/add-money/request", async (req, res) => {
    const { userId, amount, utr } = req.body;

    try {
        await db.collection("add_money_requests").add({
            userId,
            amount,
            utr,
            status: "Pending",
        });

        res.json({ message: "Request submitted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error submitting request");
    }
});

// Fetch all requests
app.get("/api/add-money/requests/all", async (req, res) => {
    try {
        const snapshot = await db.collection("add_money_requests").get();
        const requests = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching requests");
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

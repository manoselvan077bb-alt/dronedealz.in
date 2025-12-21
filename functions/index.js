const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Secure Spin & Wallet Logic (Server-side)
 * Prevents cheating
 */
exports.processSpin = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be logged in"
    );
  }

  const uid = context.auth.uid;

  // 1️⃣ Get today's confirmed orders
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const ordersSnap = await db
    .collection("orders")
    .where("userId", "==", uid)
    .where("status", "==", "confirmed")
    .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(start))
    .where("createdAt", "<", admin.firestore.Timestamp.fromDate(end))
    .get();

  const orderCount = ordersSnap.size;

  let totalAmount = 0;
  ordersSnap.forEach(doc => {
    totalAmount += Number(doc.data().amount || 0);
  });

  // 2️⃣ Spins allowed: 1 spin per 2 orders
  const allowedSpins = Math.floor(orderCount / 2);

  if (allowedSpins === 0 || totalAmount < 999) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Not eligible for spin"
    );
  }

  // 3️⃣ Spins already used today
  const spinsSnap = await db
    .collection("spinWins")
    .where("userId", "==", uid)
    .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(start))
    .where("createdAt", "<", admin.firestore.Timestamp.fromDate(end))
    .get();

  if (spinsSnap.size >= allowedSpins) {
    throw new functions.https.HttpsError(
      "resource-exhausted",
      "No spins left for today"
    );
  }

  // 4️⃣ Decide prize (server decides — user can't cheat)
  let prize = 10;
  if (totalAmount >= 5000) prize = 50;
  else if (totalAmount >= 4000) prize = 40;
  else if (totalAmount >= 3000) prize = 30;
  else if (totalAmount >= 2000) prize = 20;

  // 5️⃣ Save spin result (PENDING – real money logic later)
  await db.collection("spinWins").add({
    userId: uid,
    amount: prize,
    status: "pending",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return {
    success: true,
    prize
  };
});

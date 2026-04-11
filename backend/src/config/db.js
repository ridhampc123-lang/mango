const mongoose = require('mongoose');

let isConnected = false;

const reconcileOrderIndexes = async () => {
  const collection = mongoose.connection.db.collection('orders');

  let indexes = [];
  try {
    indexes = await collection.indexes();
  } catch (error) {
    // Collection may not exist yet on a fresh database.
    return;
  }

  const staleCustomerMobileUniqueIndex = indexes.find(
    (index) =>
      index.unique === true &&
      index.key &&
      Object.keys(index.key).length === 1 &&
      index.key.customerMobile === 1
  );

  if (staleCustomerMobileUniqueIndex) {
    await collection.dropIndex(staleCustomerMobileUniqueIndex.name);
    console.log(`✅ Dropped stale unique index: orders.${staleCustomerMobileUniqueIndex.name}`);
  }

  const Order = require('../models/Order');
  await Order.syncIndexes();
};

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // No need for useNewUrlParser and useUnifiedTopology in Mongoose 6+
    });

    isConnected = true;

    await reconcileOrderIndexes();

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;

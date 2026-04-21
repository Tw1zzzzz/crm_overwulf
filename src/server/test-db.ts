import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esports-mood-tracker');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/esports-mood-tracker');
    console.log('Successfully connected to MongoDB!');
    console.log('Connection details:', {
      host: conn.connection.host,
      name: conn.connection.name,
      readyState: conn.connection.readyState
    });

    // Test creating a collection
    const testCollection = conn.connection.collection('test');
    await testCollection.insertOne({ test: 'Hello MongoDB!' });
    console.log('Successfully inserted test document!');

    // Clean up
    await testCollection.deleteMany({});
    console.log('Test document cleaned up');

    // Close connection
    await conn.disconnect();
    console.log('Connection closed successfully');
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
    process.exit(1);
  }
};

testConnection(); 
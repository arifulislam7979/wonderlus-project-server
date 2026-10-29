import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URL);
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const connectedDB = await connectToMongoDB();
const database = connectedDB.db("wanderlust");
const destination = database.collection("destination");
const bookingCollection = database.collection("bookings");

const verifyToken = async (req, res, next) => {
  const authData = req.headers.authorization;

  if (!authData) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }
  const token = authData.split(" ")[1];
  if (!token) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }

  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
  );

  try {
    const { payload } = await jwtVerify(token, JWKS);
    next();
  } catch (error) {
    return res.status(500).send({ msg: "Server Error" });
  }
};

app.get("/", (req, res) => {
  res.send("server is final");
});
app.get("/add-destination", async (req, res) => {
  const cursor = destination.find({});
  const result = await cursor.toArray();
  res.send(result);
});
app.get('/feature-destination', async(req, res) => {
  const result = await destination.find().limit(5).toArray()
  res.send(result)
})

app.post("/add-destination",verifyToken, async (req, res) => {
  const data = req.body;
  const result = await destination.insertOne(data);
  res.send(result);
});
app.get("/add-destination/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await destination.findOne(query);
  res.send(result);
});

app.patch("/add-destination/:id",verifyToken, async (req, res) => {
  const id = req.params.id;
  const upateData = req.body;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      ...upateData,
    },
  };
  const result = await destination.updateOne(filter, updateDoc);
  res.send(result);
});

app.delete("/add-destination/:id",verifyToken ,async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await destination.deleteOne(query);
  res.send(result);
});

// Booking Data..........

app.post("/bookings", async (req, res) => {
  // const data = req.body;
  // const result = await bookingCollection.insertOne(data)
  // res.send(result)
  const data = req.body;
  const existingData = await bookingCollection.findOne({
    email: data.email,
    destinationId: data.destinationId,
  });
  if (existingData) {
    return res.send({ success: false, message: "Already Booking" });
  }
  const result = await bookingCollection.insertOne(data);
  res.send(result);
});

app.get("/my-bookings/:email",verifyToken, async (req, res) => {
  const email = req.params.email;
  const result = await bookingCollection.find({ email: email }).toArray();
  res.send(result);
});

app.delete("/my-bookings/:id",verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await bookingCollection.deleteOne(query);
  res.send(result);
});

app.listen(port, () => {
  console.log("server is runnig successfull");
});
export default app
const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 4000;

// middleware//
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.MGO_USER_PASS}@playacademy.z9xxo8h.mongodb.net/?retryWrites=true&w=majority`;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

const manageUsersCollection = client.db("PowerPlayUsers").collection("manageMdb");


// users  section

app.get('/users', async (req, res) => {
        const result = await manageUsersCollection.find().toArray();
        res.send(result);
    })

app.post("/users", async (req, res) => {
    const user = req.body

     const query = {email: user.email };

    const existingUser = await manageUsersCollection.findOne(query);
     if (existingUser) {
       return res.send({ message: ` ${user.name} already exists in the PowerPlay database` });
     }

    const result = await manageUsersCollection.insertOne(user)
     res.send(result);
});

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/' , async (req, res) => {
    res.send("Welcome to the PowerPlayAcademy server side!");
});


app.listen(port,(req, res) => {
    console.log(`power play server listening on port ${port}`);
});
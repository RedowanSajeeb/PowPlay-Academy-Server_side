const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 4000;

const jwt = require("jsonwebtoken");

// middleware//
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authentication = req.headers.authentication;
  if (!authentication) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }

  const token = authentication.split(" ")[1];

  // verify a token symmetric
  jwt.verify(token, process.env.S_TOKEN_JWT, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }

    req.decoded = decoded;
    next();
  });
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    const manageUsersCollection = client
      .db("PowerPlayUsers")
      .collection("manageMdb");
    const instructorClassCollection = client
      .db("InstructorPowerPlay")
      .collection("ClassMdb");

    //JWT Authentication

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.S_TOKEN_JWT, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await manageUsersCollection.findOne(query);

      if (user?.role !== "admin") {
        return res.status(403).send({ error: true, message: "FORBIDDEN user" });
      }
      next();
    };

    //verifyInstructors

    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await instructorClassCollection.findOne(query);

      if (user?.role !== "instructor") {
        return res.status(403).send({ error: true, message: "FORBIDDEN user" });
      }
      next();
    };

    // users  section

    app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
      const result = await manageUsersCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;

      const query = { email: user.email };

      const existingUser = await manageUsersCollection.findOne(query);
      if (existingUser) {
        return res.send({
          message: ` ${user.name} already exists in the PowerPlay database`,
        });
      }

      const result = await manageUsersCollection.insertOne(user);
      res.send(result);
    });

    // Student Dashboard

    //home page 2 Section// Popular Classes Section
    //todo Classes page
    app.get("classes/all", async (req, res) => {
      const result = await instructorClassCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/popular-class", async (req, res) => {
      // const query = { runtime: { $lt: 15 } };
      //  const options = {
      //    // sort returned documents in ascending order by title (A->Z)
      //    sort: { title: 1 },
      //    // Include only the `title` and `imdb` fields in each returned document
      //    projection: { _id: 0, title: 1, imdb: 1 },
      //  };

      const result = await instructorClassCollection.find().limit(6).toArray();

      res.send(result);
    });

    app.get("/users/popular/instructor", async (req, res) => {
      const options = {
        projection: {
          _id: 1,
          instructorEmail: 1,
          instructorName: 1,
          instructorPhoneNumber: 1,
          instructorOPhoto: 1,
        },
      };

      const result = await instructorClassCollection
        .find({})
        .project(options.projection)
        .limit(6)
        .toArray();

      res.send(result);
    });

    //Instructors-class

     app.get("/classes/all/instructors", async (req, res) => {
       const result = await instructorClassCollection.find().toArray();
       res.send(result);
     });


    // GET instructor classes by email
    app.get("/users/instructor/class/:email", async (req, res) => {
      const email = req.params.email;

      const query = { instructorEmail: email };
      const result = await instructorClassCollection.find(query).toArray();

      res.send(result);
    });

    //TODO Verify that verifyInstructor,
    app.post("/users/instructor/class", verifyJWT, async (req, res) => {
      const classInfo = req.body;
      const result = await instructorClassCollection.insertOne(classInfo);
      res.send(result);
    });

    app.get("/users/instructor/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ instructor: false });
      } else {
        try {
          const query = { email: email };
          const user = await manageUsersCollection.findOne(query);
          const result = { instructor: user?.role === "instructor" };
          res.send(result);
        } catch (error) {
          res
            .status(500)
            .send({ error: true, message: "Internal server error" });
        }
      }
    });
    //TODO Verify that
    app.patch("/users/instructors/:id", async (req, res) => {
      const instructorsId = req.params.id;
      const filter = { _id: new ObjectId(instructorsId) };

      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await manageUsersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //admin
    app.get("/users/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        res.send({ admin: false });
      } else {
        try {
          const query = { email: email };
          const user = await manageUsersCollection.findOne(query);
          const result = { admin: user?.role === "admin" };
          res.send(result);
        } catch (error) {
          res
            .status(500)
            .send({ error: true, message: "Internal server error" });
        }
      }
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const instructorsId = req.params.id;
      const filter = { _id: new ObjectId(instructorsId) };

      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await manageUsersCollection.updateOne(filter, updateDoc);
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

app.get("/", async (req, res) => {
  res.send("Welcome to the PowerPlayAcademy server side!");
});

app.listen(port, (req, res) => {
  console.log(`power play server listening on port ${port}`);
});

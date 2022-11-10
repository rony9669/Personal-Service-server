const express = require("express");
const cors = require("cors");
//for jwt
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

//use or middle wares
app.use(cors());
app.use(express.json());

//for jwt
app.post("/jwt", (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });
  res.send({ token });
});

//for verifyJWT token which i get in order api which is a get operation
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    //token verify
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

//console.log(process.env.DB_USER);
//console.log(process.env.DB_PASSWORD);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gavhqqs.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

//function
async function run() {
  try {
    const serviceCollection = client.db("misusKitchen").collection("services");

    const reviewCollection = client.db("misusKitchen").collection("reviews");

    //সব ডাটা গেট করার জন্য using sort method{home page}
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query).sort({ _id: -1 });
      const services = await cursor.limit(3).toArray();
      res.send(services);
    });
    //সব ডাটা গেট করার জন্য{service page}
    app.get("/home/services", async (req, res) => {
      const query = {}; // query banalam
      const cursor = serviceCollection.find(query); // colection er help nea cursor banalam khujar jonno data ta computer er cursor er moto kore
      const services = await cursor.toArray(); // cursor er sahajje data ta array akare anlam jate amara client side e easily map korte pari or onno kisu
      res.send(services); // data ta pathia delam response hisabe|
    });

    //স্পেসিফিক ডাটা গেট করার জন্য
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) }; // query ta akhn db te jeter sathe match kore dekhbe seta age likhbo {_id:} : then ObjectId ta import korbo mdb theke tar bhitore dyanmic bhabe asha id ta debo.

      const cursor = serviceCollection.findOne(query); // colection er help nea cursor banalam khujar jonno data ta computer er cursor er moto kore. akhne findone use korce akta khujtese tai
      const service = await cursor; // cursor er sahajje data ta  anlam. akhne to array korte hoine cause ata akta element only
      res.send(service); // data ta pathia delam response hisabe|
    });

    //orders api data create{post}//new
    app.post("/addServices", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service); //order collectioner modde ja upore banaice sekahne client side theke pathano data ta push kore delam. i mean db te
      res.send(result);
    });
    //orders api data create{post}//new
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review); //order collectioner modde ja upore banaice sekahne client side theke pathano data ta push kore delam. i mean db te
      res.send(result);
    });

    //স্পেসিফিক ডাটা গেট করার জন্য service id unojie. jeta mdb te save  koorce{reviews}
    app.get("/reviews", async (req, res) => {
      const id = req.query.service; // id ta dynamically asbe. and seta abhabe get krbo

      let query = {};
      if (req.query.service) {
        query = {
          service: req.query.service,
        };
      }

      const cursor = reviewCollection.find(query).sort({ _id: -1 }); // colection er help nea cursor banalam khujar jonno data ta computer er cursor er moto kore. akhne findone use korce akta khujtese tai
      const reviews = await cursor.toArray(); // cursor er sahajje data ta  anlam. akhne to array korte hoine cause ata akta element only
      res.send(reviews); // data ta pathia delam response hisabe|
    });
    //end

    //স্পেসিফিক ডাটা গেট করার জন্য{N}
    app.get("/updateReviews/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) }; // query ta akhn db te jeter sathe match kore dekhbe seta age likhbo {_id:} : then ObjectId ta import korbo mdb theke tar bhitore dyanmic bhabe asha id ta debo.

      const cursor = reviewCollection.findOne(query); // colection er help nea cursor banalam khujar jonno data ta computer er cursor er moto kore. akhne findone use korce akta khujtese tai
      const review = await cursor; // cursor er sahajje data ta  anlam. akhne to array korte hoine cause ata akta element only
      res.send(review); // data ta pathia delam response hisabe|
    });

    //স্পেসিফিক ডাটা গেট করার জন্য service id unojie. jeta mdb te save  koorce{reviews own}
    app.get("/myreviews", verifyJWT, async (req, res) => {
      const decoded = req.decoded;

      if (decoded.email !== req.query.email) {
        res.status(403).send({ message: "unauthorized access" });
      }
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }

      const cursor = reviewCollection.find(query); // colection er help nea cursor banalam khujar jonno data ta computer er cursor er moto kore. akhne findone use korce akta khujtese tai
      const reviews = await cursor.toArray(); // cursor er sahajje data ta  anlam. akhne to array korte hoine cause ata akta element only
      res.send(reviews); // data ta pathia delam response hisabe|
    });
    //end

    //for updated{n}
    app.put("/reviews/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) }; // id to object id
      const review = req.body;
      const option = { upsert: true };
      const updatedUser = {
        $set: {
          message: review.message,
        },
      };
      const result = await reviewCollection.updateOne(
        filter,
        updatedUser,
        option
      );
      res.send(result);
    });

    //for delete operation{n}
    app.delete("/review/:id", verifyJWT, async (req, res) => {
      const id = req.params.id; // dynamically id ta client side theke pathabe
      const query = { _id: ObjectId(id) }; //db er _id er man dynamically asha id ta set korlam
      const result = await reviewCollection.deleteOne(query); // query onujie seta delete kore delam
      res.send(result); // result ta send kore delam cliet side e
    });
  } finally {
  }
}

run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("welcome to misu's kitchen");
});

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});

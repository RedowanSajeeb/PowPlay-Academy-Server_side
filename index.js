const express = require("express");
const app = express();
const cors = require("cors");

const port = process.env.PORT || 5000;

// middleware//
app.use(cors());
app.use(express.json());


app.get('/' , async (req, res) => {
    res.send("Welcome to the PowerPlayAcademy server side!");
});


app.listen(port,(req, res) => {
    console.log(`power play server listening on port ${port}`);
});
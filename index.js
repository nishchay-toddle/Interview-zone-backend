const express = require("express");
const app = express();
const Server = require("http").createServer(app);
const dotEnv = require("dotenv");
dotEnv.config({ path: "/config/config.env" });
const databaseConfiguration = require("./config/dbconfig")
const router = require("./routes/index")
const socketconnection = require("./controller/sockethandler");
var cors = require('cors');
const responseHandler = require("./utils/responseHandler");


app.use(cors())
app.use(express.json());
app.use(responseHandler)


socketconnection(Server);

databaseConfiguration()
    .then((e) => console.log("Interview Service Connected To Database"))
    .catch((e) => console.log("Interview Service Failed To Connect To Database" + e));


app.use("/", router);

// Serve frontend build when in production
if (process.env.NODE_ENV === "production") {
    const path = require("path");
    const buildPath = path.join(__dirname, "..", "Interview-zone-Front", "build");
    app.use(express.static(buildPath));
    app.get("*", (req, res) => {
        res.sendFile(path.join(buildPath, "index.html"));
    });
}

const PORT = process.env.PORT || 3001;
Server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (env=${process.env.NODE_ENV || 'development'})`);
});

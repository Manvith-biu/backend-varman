const express = require('express');
const path = require('path');
const cors = require('cors');
const routes = require("./routes/routes");
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });


const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
    res.send({
        region: process.env.AWS_REGION,
        accessId: process.env.AWS_ACCESS_KEY_ID,
    });
});

app.use('/',routes);

app.post('/api/check-username', async (req, res) => {
    const { username } = req.body;
  
    // Assume `User` is your database model
    const userExists = await User.findOne({ username });
  
    if (userExists) {
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
});

const PORT = 5000// process.env.PORT ;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
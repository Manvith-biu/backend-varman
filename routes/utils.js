const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand} = require("@aws-sdk/client-dynamodb");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, '.env') });


// Initialize DynamoDB Client
const dynamoDB = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const client = new DynamoDBClient({ region: process.env.AWS_REGION});

// Get User
const getUser = async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    const params = {
        TableName: "Users",
        Key: { username: { S: username } },
    };

    try {
        const { Item } = await client.send(new GetItemCommand(params));

        if (!Item) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user: Item });
    } catch (err) {
        console.error("Error fetching user data:", err);
        res.status(500).json({ message: "Error fetching user data", error: err.message || err });
    }
};

// Register User
const registerUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const params = {
        TableName: "Users",
        Item: {
            username: { S: username },          
            passwordHash: { S: hashedPassword },
        },
    };

    try {
        await client.send(new PutItemCommand(params));

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).json({ message: "Error registering user", error: err.message });
    }
};

// Login User
const loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    const params = {
        TableName: "Users",
        Key: { username: { S: username } },
    };

    try {
        const { Item } = await client.send(new GetItemCommand(params));

        if (!Item) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, Item.passwordHash.S);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(200).json({ message: "Login successful", token });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ message: "Error during login", error: err.message });
    }
};

// Create Folder
const createFolder = async (req, res) => {
    const { username, foldername } = req.body;

    if (!username || !foldername) {
        return res.status(400).json({ message: "Username and Folder Name are required" });
    }

    const getUserParams = {
        TableName: "Users",
        Key: {
            username: { S: username },
        },
    };

    try {
        const userResult = await client.send(new GetItemCommand(getUserParams));

        if (!userResult.Item) {
            return res.status(404).json({ message: "Username does not exist" });
        }

        const folderParams = {
            TableName: "Folders",
            Item: {
                username: { S: username }, // User's username
                foldername: { S: foldername }, // Folder name
                createdAt: { S: new Date().toISOString() }, // Timestamp
            },
        };

        await client.send(new PutItemCommand(folderParams));
        res.status(201).json({ message: "Folder created successfully" });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: "Error processing request", error: err.message });
    }
};

// Get Folders for a User
const getFolders = async (req, res) => {
    const { username } = req.params;

    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    const params = {
        TableName: "Folders",
        KeyConditionExpression: "username = :username",
        ExpressionAttributeValues: {
            ":username": { S: username },
        },
        ProjectionExpression: "foldername", // Retrieve only folder names
    };

    try {
        const result = await client.send(new QueryCommand(params));

        if (!result.Items || result.Items.length === 0) {
            return res.status(404).json({ message: "No folders found for the user" });
        }

        const folderNames = result.Items.map((item) => item.foldername.S);

        res.status(200).json({ folders: folderNames });
    } catch (err) {
        console.error("Error fetching folders:", err);
        res.status(500).json({ message: "Error fetching folders", error: err.message });
    }
};

module.exports = { getUser, registerUser, loginUser, createFolder, getFolders};
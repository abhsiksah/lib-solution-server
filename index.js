const express = require("express");
const app = express();
const path = require("path");
const MongoDataAdapter = require("./MongoDataAdapter");
const cors = require("cors");
const dataAdapter = new MongoDataAdapter();

app.use(cors());

app.use(express.json());

// // Endpoint for handling the search request

// // Route handler for the root path '/'
// app.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "login.html"));
// });

// // Route for serving signup.html
// app.get("/signup", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "signup.html"));
// });

// // Add a route for '/home'
// app.get("/home", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "home.html")); // Adjust this line to serve your home page
// });

// // Add a route for '/loanRcd'
// app.get("/loanRcd", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "loanRcd.html")); // Adjust this line to serve your loanRcd page
// });

const port = 3000; // Use any port of your choice
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// ---------------------------------------------------------------
dataAdapter.connect();

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await dataAdapter.findUser(username, password);
  // console.log('user in /login',user)

  if (user) {
    res.status(200).json({ message: "User authenticated" });
  } else {
    res.status(401).json({ message: "Authentication failed" });
  }
});

//Sign up page
app.post("/signup", async (req, res) => {
  const userInfo = req.body;

  try {
    // Check if the username already exists
    const existingUser = await dataAdapter.findUser(userInfo.username);
    if (existingUser) {
      res.status(409).json({
        message: "Username already exists. Please choose a different username.",
      });
      return;
    }

    // Create a new user
    const newUser = await dataAdapter.signUpUser(userInfo);

    // Respond based on the result of the signup attempt
    if (newUser) {
      res
        .status(201)
        .json({ message: "User created successfully", user: newUser });
    } else {
      res.status(500).json({ message: "Error creating user" });
    }
  } catch (error) {
    console.error("Error signing up user:", error);
    res.status(500).json({ error: "Error signing up user" });
  }
});

// Route for fetching all loan records
app.get("/loan-records", async (req, res) => {
  try {
    const loanRecords = await dataAdapter.getAllLoanRecords();

    if (loanRecords) {
      res.status(200).json({ loanRecords });
    } else {
      res.status(500).json({ error: "Error fetching loan records" });
    }
  } catch (error) {
    console.error("Error fetching loan records:", error);
    res.status(500).json({ error: "Error fetching loan records" });
  }
});

//Route for all searched book

app.get("/search", async (req, res) => {
  const query = req.query.query;

  // Call the searchBooks method from the MongoDataAdapter
  try {
    const searchResults = await dataAdapter.searchBooks(query);
    res.json(searchResults);
  } catch (error) {
    console.error("Error searching books:", error);
    res.status(500).json({ error: "Error searching books" });
  }
});

app.post("/user-data", async (req, res) => {
  const recvdUsername = req.body.username;

  try {
    // Retrieve user data using your MongoDataAdapter or from your database
    const userData = await dataAdapter.getUserDetails(recvdUsername);

    res.json(userData); // Send the user data as a JSON response
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Error fetching user data" });
  }
});

app.delete("/books/:id", async (req, res) => {
  const bookId = req.params.id;

  try {
    // Call a function in your data adapter to delete the book from the database
    await dataAdapter.deleteBook(bookId);

    res.status(204).send(); // Send a success response
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ error: "Error deleting book" });
  }
});

// Route to get book details by ID
app.get("/books/:id", async (req, res) => {
  const bookId = req.params.id;

  try {
    // Fetch book details based on the ID from your database
    const bookDetails = await dataAdapter.getBookById(bookId);
    res.json(bookDetails);
  } catch (error) {
    console.error("Error fetching book details:", error);
    res.status(500).json({ error: "Error fetching book details" });
  }
});

// Add the PUT route to update book details
app.put("/books/:id", async (req, res) => {
  const bookId = req.params.id;
  const updatedBook = req.body;

  try {
    // Update the book details in your database using the provided data
    const result = await dataAdapter.updateBook(bookId, updatedBook); // Implement this function in your MongoDataAdapter

    if (result) {
      res.status(200).send("Book updated successfully");
    } else {
      res.status(404).send("Book not found");
    }
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).send("Error updating book");
  }
});

app.post("/addbook", async (req, res) => {
  const addBookDetails = req.body;
  try {
    const result = await dataAdapter.addBook(addBookDetails);
    console.log("Document inserted:", result);

    if (result) {
      res.status(200).send("Book updated successfully");
    } else if (!result) {
      res.status(404).send("Book not found");
    }
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).send("Error updating book");
  }
});

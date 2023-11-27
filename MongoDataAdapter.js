const { MongoClient, ObjectId } = require("mongodb");

class MongoDataAdapter {
  constructor() {
    this.mongoClient = null;
    this.dummyuser = null;
    this.booksCollection = null;
    // this.conStr = 'mongodb+srv://test:test@adbms.sjeyuyb.mongodb.net/?retryWrites=true&w=majority';
    this.conStr =
      "mongodb+srv://test:gNiaW93gq3ZUyWx2@adbms.sjeyuyb.mongodb.net/?retryWrites=true&w=majority";
    this.connect();
  }

  async connect() {
    try {
      this.mongoClient = await MongoClient.connect(this.conStr, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      const database = this.mongoClient.db("ADBMS");
      this.booksCollection = database.collection("Books");
      console.log("Connected to MongoDB");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
    }
  }

  async findUser(username, password) {
    try {
      const database = this.mongoClient.db("ADBMS");
      const collection = database.collection("User");

      const user = await collection.findOne({ username, password });
      this.dummyuser = user;
      console.log(user, "userrrr");
      return user;
    } catch (error) {
      console.error("Error finding user:", error);
      return null;
    }
  }

  async getUserDetails(username) {
    try {
      const database = this.mongoClient.db("ADBMS");
      const collection = database.collection("User");

      const userDetails = await collection.findOne({ username });
      // console.log(userDetails,"hollla")
      return userDetails;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  }

  async signUpUser(userInfo) {
    try {
      const database = this.mongoClient.db("ADBMS");
      const collection = database.collection("User");

      // Check if the username already exists
      const existingUser = await collection.findOne({
        username: userInfo.username,
      });
      if (existingUser) {
        console.error(
          "Username already exists. Please choose a different username."
        );
        return null;
      }

      // Create a new user object
      const newUser = {
        username: userInfo.username,
        password: userInfo.password,
        full_name: userInfo.full_name,
        address: userInfo.address,
        phone_number: userInfo.phone_number,
        email: userInfo.email,
        is_library_manager: false, // Assuming it's false for regular users
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Insert the new user into the 'User' collection
      const result = await collection.insertOne(newUser);

      // Log the result (optional)
      console.log("User signed up successfully:", result);

      // Return the newly created user
      return newUser;
    } catch (error) {
      console.error("Error signing up user:", error);
      return null;
    }
  }

  async searchBooks(query) {
    await this.connect();
    const searchResults = [];

    try {
      // Connect to the database
      const database = this.mongoClient.db("ADBMS");

      // Access a collection
      const collection = database.collection("Books");

      // Create the query to match the search input in all three categories (title, author, publisher)
      const searchQuery = {
        $or: [
          { title: { $regex: query, $options: "i" } }, // Case-insensitive search in title
          { author: { $regex: query, $options: "i" } }, // Case-insensitive search in author
          { publisher: { $regex: query, $options: "i" } }, // Case-insensitive search in publisher
        ],
      };

      // Execute the query
      const cursor = collection.find(searchQuery);

      //get loanrcds

      const loanrcrdCollections = database.collection("LoanRcd");

      const loanRecords = await loanrcrdCollections.find().toArray();
      const loanRecordstrimmed = loanRecords.map((elem) => elem.book_id);

      // Iterate through the results and create Book objects
      await cursor.forEach((bookDoc) => {
        if (loanRecordstrimmed.includes(bookDoc._id.toString())) {
          searchResults.push(this.createBookFromDocumentissued(bookDoc));
        } else {
          searchResults.push(this.createBookFromDocument(bookDoc));
        }
      });
    } catch (error) {
      // Handle exceptions
      console.error("Error searching books:", error);
    } finally {
      // this.mongoClient.close();
    }

    return searchResults;
  }

  async getAllLoanRecords() {
    try {
      const database = this.mongoClient.db("ADBMS");
      const collection = database.collection("LoanRcd");

      const loanRecords = await collection.find().toArray();

      return loanRecords.map((record) => {
        const user_id = record.user_id;
        const book_id = record.book_id;
        const copy_id = record.copy_id;
        const borrow_date = record.borrow_date;
        const due_date = record.due_date;
        const actual_return_date = record.actual_return_date;
        const extended_due_date = record.extended_due_date;

        return {
          user_id,
          book_id,
          copy_id,
          borrow_date,
          due_date,
          actual_return_date,
          extended_due_date,
        };
      });
    } catch (error) {
      console.error("Error fetching loan records:", error);
      return null;
    }
  }

  async addSingleLoanRecord(userid, bookid) {
    try {
      const database = this.mongoClient.db("ADBMS");
      const loanrecdcollection = database.collection("LoanRcd");

      let loanrecrdData = {
        user_id: userid,
        book_id: bookid,
        copy_id: "64c1ec00df73bab6e8e6f058",
        borrow_date: new Date(),
        due_date: new Date(),
        actual_return_date: new Date(),
        extended_due_date: new Date(),
      };

      await loanrecdcollection.insertOne(loanrecrdData, (err, result) => {
        if (err) {
          return undefined;
        }
      });

      return true;
    } catch (error) {
      console.error("Error fetching loan records:", error);
      return null;
    }
  }

  async deleteSingleLoanRecord(bookid) {
    try {
      const database = this.mongoClient.db("ADBMS");
      const loanrecdcollection = database.collection("LoanRcd");

      await loanrecdcollection.deleteOne({ book_id: bookid });
      return "deleted record";
    } catch (error) {
      console.error("Error fetching loan records:", error);
      return null;
    }
  }

  async deleteBook(bookId) {
    try {
      const database = this.mongoClient.db("ADBMS");
      const collection = database.collection("Books");

      // Use MongoDB's delete operation to remove the book based on its ID
      await collection.deleteOne({ _id: new ObjectId(bookId) });
    } catch (error) {
      console.error("Error deleting book in database:", error);
      throw error; // Propagate the error for handling in the route
    }
  }

  async updateBook(bookId, updatedBook) {
    try {
      const updatedBookData = {
        title: updatedBook.title,
        author: updatedBook.author,
        publisher: updatedBook.publisher,
        description: updatedBook.description,
        price: updatedBook.price,
        location: updatedBook.location,
      };

      // Use a MongoDB update operation to update the book in the database
      const result = await this.booksCollection.updateOne(
        { _id: new ObjectId(bookId) }, // Create an ObjectId instance
        { $set: updatedBookData }
      );

      if (result.modifiedCount === 1) {
        // The book was updated successfully
        return true;
      } else {
        // The book was not updated (maybe the book ID doesn't exist)
        return false;
      }
    } catch (error) {
      console.error("Error updating book:", error);
      throw error;
    }
  }

  async addBook(addBookDetails) {
    try {
      const AddBookData = {
        title: addBookDetails.title,
        author: addBookDetails.author,
        publisher: addBookDetails.publisher,
        description: addBookDetails.description,
        price: addBookDetails.price,
        location: "",
      };

      await this.booksCollection.insertOne(AddBookData, (err, result) => {
        if (err) {
          return undefined;
        }
      });
      return true;
    } catch (error) {
      console.error("Error updating book:", error);
      throw error;
    }
  }

  async getBookById(bookId) {
    try {
      const database = this.mongoClient.db("ADBMS");
      const collection = database.collection("Books");

      // Check if the provided bookId is not in the valid ObjectId format
      if (typeof bookId !== "string" || bookId.length !== 24) {
        return null;
      }

      // Fetch book details based on the provided book ID
      const book = await collection.findOne({ _id: new ObjectId(bookId) });

      const loanrcrdCollections = database.collection("LoanRcd");

      const loanRecords = await loanrcrdCollections.find().toArray();
      const loanRecordstrimmed = loanRecords.map((elem) => elem.book_id);

      // Check if the book exists
      if (book) {
        if (loanRecordstrimmed.includes(book._id.toString())) {
          return this.createBookFromDocumentissued(book);
        } else {
          return this.createBookFromDocument(book);
        }
        // Transform the retrieved book document into a structured book object
      } else {
        return null; // If the book with the given ID doesn't exist
      }
    } catch (error) {
      console.error("Error fetching book by ID:", error);
      return null;
    }
  }

  createBookFromDocument(bookDoc) {
    const id = bookDoc._id.toString();
    const title = bookDoc.title;
    const description = bookDoc.description;
    const price = bookDoc.price;
    const author = bookDoc.author;
    const publisher = bookDoc.publisher;
    const isIssued = false;

    return { id, title, description, price, author, publisher, isIssued };
  }

  createBookFromDocumentissued(bookDoc) {
    const id = bookDoc._id.toString();
    const title = bookDoc.title;
    const description = bookDoc.description;
    const price = bookDoc.price;
    const author = bookDoc.author;
    const publisher = bookDoc.publisher;
    const isIssued = true;

    return { id, title, description, price, author, publisher, isIssued };
  }
}

// console.log(this.dummyuser,"Hello I m herer")

module.exports = MongoDataAdapter;

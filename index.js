import express, { response } from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import { arrayBuffer } from "stream/consumers";
import { get } from "http";
import dayjs from "dayjs";

const app = express();
const port = 3000;

const db = new pg.Client({
    user : "postgres",
    host : "localhost",
    database : "Books",
    password : "123456",
    port : 5432,
})
db.connect();

let books =[
]

app.use(bodyParser.urlencoded({extended : true }));
app.use(express.static("public"));

async function getData(){
    try{
    const result = await db.query("SELECT * FROM book ORDER BY ID DESC");
    return result.rows;
}
catch(err){
    throw err;
}
}
app.post("/" , async(req,res) => {
    const sort = req.body.arrange;
    if(sort == "id"){
     books = await getData();
    }
    else if(sort == "rating") {
        try {
            const result = await db.query("SELECT * FROM book ORDER BY rating DESC");
            books =result.rows;
        }
        catch(err){
            throw err;
        }
    }
    else {
        try {
        const result = await db.query("SELECT * FROM book ORDER BY title ASC");
        books =result.rows;
        }
        catch(err){
            throw err;
        }
    }
    res.render("index.ejs" , {
        books : books,
    })
});
app.get("/", async(req,res) => {
    books = await getData();
    res.render("index.ejs", {books : books})
});

app.post("/add", (req,res) => {
    res.render("compose.ejs")
});

app.post("/done", async(req,res) => {
const bookName = req.body.bookName;
const author = req.body.author;
const date = req.body.readDate;
const rating = req.body.rating;
const notes = req.body.notes;
const isbn = req.body.isbn;
try {
    const response = await axios.get(`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,{ responseType : 'arrayBuffer',});
   const cover = Buffer.from(response.config.url);
  await  db.query("INSERT INTO book (title, author, isbn, rating, date, notes, cover) VALUES ($1, $2 ,$3, $4, $5, $6, $7);",[bookName, author, isbn, rating, date, notes, cover]);
    res.redirect("/");
}
catch(err){
    throw err;
}
});

app.get("/bookDetails/:id" , async(req,res) => {
    books = await getData();
    const bookId = req.params.id;
    const bookDetails = books.find((book) => book.id === parseInt(bookId));
    res.render("read.ejs", {
        books : bookDetails,
        booksDate : dayjs(bookDetails.date).format("YYYY-MM-DD"),
    })
});

app.get("/edit/:id" , async(req,res) => {
    books = await getData();
    const editId = req.params.id;
    const bookDetails = books.find((book) => book.id === parseInt(editId));
    res.render("compose.ejs" , {
        isEdit : true,
        bookDetails : bookDetails,
    })
});

app.post("/edit/:id", async(req,res) => {
    const bookId = req.params.id;
    const bookName = req.body.bookName;
const author = req.body.author;
const date = req.body.readDate;
const rating = req.body.rating;
const notes = req.body.notes;
const isbn = req.body.isbn;
    try {
        const response = await axios.get(`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,{ responseType : 'arrayBuffer',});
        const cover = Buffer.from(response.config.url);
        await db.query("UPDATE book SET title = $1 , author = $2 , isbn = $3 , rating = $4 , date = $5, notes = $6, cover = $7  WHERE id = $8; ", [bookName, author, isbn, rating, date, notes, cover,bookId]);
        res.redirect(`/bookDetails/${bookId}`);
    }
    catch(err){
        throw err;
    }
});

app.get("/delete/:id", async(req,res) => {
    const deleteId = req.params.id;
    try { 
     await   db.query("DELETE FROM book WHERE id =$1",[deleteId]);
     res.send(
        '<script>alert("Book deleted successfully"); window.location="/";</script>'
      );
     res.redirect("/");
    }
    catch(err){
        throw err;
    }
})
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
    
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Todo } = require("./db/index");
const { verifyToken, SECRET } = require("./middleware/index");
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());

mongoose.connect('mongodb://127.0.0.1:27017/Todo-App', { useNewUrlParser: true, useUnifiedTopology: true, dbName: "Todos" });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

app.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.json({ message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/signin', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/todos', verifyToken, async (req, res) => {
    try {
        const { title, description } = req.body;
        const newTodo = new Todo({
            userId: req.user.userId,
            title,
            description,
        });

        await newTodo.save();

        res.json({ message: 'Todo created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/todos', verifyToken, async (req, res) => {
    try {
        const todos = await Todo.find({ userId: req.user.userId });
        res.json(todos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/todos/:id', verifyToken, async (req, res) => {
    try {
        const todoId = req.params.id;
        const { title, description } = req.body;
        const todo = await Todo.findOne({ _id: todoId, userId: req.user.userId });
        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        todo.title = title;
        todo.description = description;
        await todo.save();
        res.json(todo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/todos/:id', verifyToken, async (req, res) => {
    try {
        const todoId = req.params.id;
        const todo = await Todo.findOne({ _id: todoId, userId: req.user.userId });
        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        await Todo.deleteOne({ _id: todoId, userId: req.user.userId });

        res.json({ message: 'Todo deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
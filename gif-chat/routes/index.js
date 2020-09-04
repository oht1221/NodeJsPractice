const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const Room = require('../schemas/room');
const Chat = require('../schemas/chat');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try{
        const rooms = await Room.find({}); //모든 방 retrieve
        res.render('main', { rooms, title: 'GIF Chatting', error: req.flash('roomError') });
    }
    catch (error){
        console.error(error);
        next(error);
    }
});

router.get('/room', (req, res) => {
    res.render('room', { title: 'Room creation' });
});

router.post('/room', async (req, res, next) => {
    try{
        const room = new Room({
            title: req.body.title,
            max: req.body.max,
            owner: req.session.color,
            password: req.body.password
        });
        const newRoom = await room.save();
        const io = req.app.get('io');
        io.of('/room').emit('newRoom', newRoom);
        res.redirect(`/room/${newRoom._id}?password=${req.body.password}`);
    }
    catch(error){
        console.error(error);
        next(error);
    }
});

router.get('/room/:id', async (req, res, next) => {
    try{
        const room = await Room.findOne({ _id: req.params.id });
        const io = req.app.get('io');
        if(!room){
            req.flash('roomError', 'no such room exists.');
            return res.redirect('/');
        }
        if(room.password && room.password !== req.query.password){
            req.flash('roomError', 'incorrect password');
            return res.redirect('/');
        }
        const { rooms } = io.of('/chat').adapter;
        if(rooms && rooms[req.params.id] && room.max <= rooms[req.params.id].length){
            req.flash('roomError', 'the room is full!');
            return res.redirect('/');
        }
        const chats = await Chat.find({ room: room._id }).sort('createAt');
        return res.render('chat', {
            room,
            title: room.title,
            chats,
            user: req.session.color
        });
    }
    catch(error){
        console.error(error);
        return next(error);
    }
});

router.post('/room/:id/chat', async(req, res, next) => {
    try{
        const chat = new Chat({
            room: req.params.id,
            user: req.session.color,
            chat: req.body.chat
        });   
        await chat.save();
        const io = req.app.get('io');
        io.of('/chat').to(req.params.id).emit('chat', chat);
        res.send('OK');
    }
    catch(error){
        console.error(error);
        next(error);
    }
});

router.delete('/room/:id', async (req, res, next) => {
    try{
        await Room.remove({ _id: req.params.id });
        await Chat.remove({ room: req.params.id });
        res.send('OK');
        setTimeout(() => {
            req.app.get('io').of('/room').emit('removeRoom', req.params.id);
        }, 1000);
    }
    catch(error){
        console.error(error);
        next(error);
    }
});


fs.readdir('uploads', (error) => {
    if(error) {
        console.error('no uploads folder exisst. creating new one');
        fs.mkdirSync('uploads');
    }
});

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb){
            cb(null, 'uploads/');
        },
        filename(req, file, cb){
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
        }
    }),
    limits: { filesize: 5 * 1024 * 1024 }
});

router.post('/room/:id/gif', upload.single('gif'), async(req, res, next) => {
    try{
        const chat = new Chat({
            room: req.params.id,
            user: req.session.color,
            gif: req.file.filename
        });   
        await chat.save();
        req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);
        res.send('OK');
    }
    catch(error){
        console.error(error);
        next(error);
    }
});

module.exports = router;
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const schedule = require('node-schedule');

const { Good, Auction, User, sequelize } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { send } = require('process');

const router = express.Router();

router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

router.get('/', async(req, res, next) => {
    try{
        const goods = await Good.findAll({ where: { soldId: null } });
        res.render('main', {
            title: 'NodeAuction',
            goods,
            loginError: req.flash('loginError')
        });
    }
    catch(error){
        console.log(error);
        next(error);
    }
});

router.get('/join', isNotLoggedIn, (req, res) => {
    res.render('join', {
        title: 'Join - NodeAuction'
    });
});

router.get('/good', isLoggedIn, (req, res) => {
    res.render('good', { title: 'registration - NodeAuction' });
});

fs.readdir('uploads', (error) => {
    if(error){
        console.error('uploads folder does not exist.');
        fs.mkdirSync('uploads');
    }
});

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb){
            cb(null, 'uploads/');
        },
        filename(req, file, cb) {
            const ext = path.extname(file.originalname);
            cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/good', isLoggedIn, upload.single('img'), async(req, res, next) => {
    try{
        const { name, price } = req.body;
        const good = await Good.create({
            ownerId: req.user.id,
            name,
            img: req.file.filename,
            price
        });
        const end = new Date();
        end.setDate(end.getDate() + 1);
        schedule.scheduleJob(end, async () => {
            const success = await Auction.findOne({
                where: { goodId: good.id },
                order: [['bid', 'DESC']]
            }); //내림차순 정렬하여 맨 위 것만 취함
            await Good.update({ soldId: success.userId }, { where: {id: good.id } });
            await User.update({ 
                money: sequelize.literal(`money - ${success.bid}`) 
            },
            { 
                where: { id: success.userId } 
            });
        });
        res.redirect('/');
    }
    catch(error){
        console.error(error);
        next(error);
    }
});

router.get('/good/:id', isLoggedIn, async (req, res, next) => {
    try{
        const [good, auction] = await Promise.all([
            Good.findOne({ 
                where: { id: req.params.id },
                include: { 
                    model: User,
                    as: 'owner'
                }
            }),
            Auction.findAll({
                where: { goodId : req.params.id },
                include: {
                    model: User
                },
                order: [['bid', 'ASC']]
            })
        ]);
        res.render('auction', {
            title: `${good.name} - NodeAuction`,
            good,
            auction,
            auctionError: req.flash('auctionError')
        });
    }
    catch(error){
        console.error(error);
        next(error);
    }
});

router.post('/good/:id/bid', isLoggedIn, async (req, res, next) => {
  try {
        const { bid, msg } = req.body;
        const good = await Good.findOne({
            where: { id: req.params.id },
            include: { model: Auction },
            order: [[{ model : Auction}, 'bid', 'DESC']]
        });
        
        if(good.price > bid) {
            return res.status(403).send("You can't bid cheeper than the initial price.");
        }
        if (new Date(good.createAt).valueOf() + (24 * 60 * 60 * 1000) < new Date()){
            return res.status(403).send("The auction is over.");
        }
        if(good.auctions[0] && good.auctions[0].bid >= bid){
            return res.status(403).send("You can't bid cheeper than the previous bids.");
        }
        const result = await Auction.create({
            bid,
            msg,
            userId: req.user.id,
            goodId: req.params.id
        })
        req.app.get('io').to(req.params.id).emit('bid', {
            bid: result.bid,
            msg: result.msg,
            nick: req.user.nick
        });
        return res.send('OK');
  }
  catch(error){
      console.error(error);
      next(error);
  }
});

module.exports = router;
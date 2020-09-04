const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');

const { verifyToken, apiLimiter } = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models');

const router = express.Router();

router.use(async (req, res, next) => {
    const domain = await Domain.find({
      where: { host: url.parse(req.get('origin')).host },
    });
    if (domain) {
      cors({ origin: req.get('origin') })(req, res, next);
    } else {
      next();
    }
  });

router.post('/token', apiLimiter, async (req, res) => {
    const { clientSecret } = req.body;
    try{
        const domain = await Domain.findOne({
            where: { clientSecret },
            include: { 
                model: User,
                attribute: ['nick', 'id']
            }
        });
        if(!domain){
            return res.status(401).json({
                code: 401,
                message: 'Domain not registered.'
            });
        }
        const token = jwt.sign({
            id: domain.user.id,
            nick: domain.user.nick,
        }, process.env.JWT_SECRET, {
            expiresIn: '30m',
            issuer: 'nodebird'
        });
        return res.json({
            code: 200,
            message: 'A token has been issued',
            token
        });
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    }
});

router.get('/test', verifyToken, apiLimiter, (req, res) => {
    res.json(req.decoded);
})

router.get('/posts/my', apiLimiter, verifyToken, (req, res) => {
    Post.findAll({ where : { userId: req.decoded.id } })
    .then((posts) => {
        console.log(posts);
        res.json({
            code: 200,
            payload: posts
        });
    })
    .catch((error) => {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    });
});

router.get('/posts/hashtag/:title', apiLimiter, verifyToken, async (req, res) => {
    try{
        const hashtag = await Hashtag.findOne({ where: { title: req.params.title } });
        if(!hashtag){
            return req.status(404).json({
                code: 404,
                message: 'no matched hashtag'
            });
        }
        const posts = await hashtag.getPosts();
        return res.status(200).json({
            code: 200,
            payload: posts
        });
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
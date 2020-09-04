const express = require('express');
const jwt = require('jsonwebtoken');

const { verifyToken, deprecated } = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models');
const { hash } = require('bcrypt');

const router = express.Router();

router.use(deprecated);

router.post('/token', async(req, res) => {
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
                message: 'The domain is not registered. Please register it first.'
            });
        }
        const token = jwt.sign({
            id: domain.user.id,
            nick: domain.user.nick,
        }, process.env.JWT_SECRET, {
            expiresIn: '10m',
            issuer: 'nodebird',
        });
        return res.json({
            code: 200,
            message: 'A new token has been issued.',
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

router.get('/test', verifyToken, (req, res) => {
    res.json(req.decoded);
});


router.get('/posts/my', verifyToken, (req, res) => {
    Post.findAll({ where : {userId: req.decoded.id } })
    .then((posts) => {
        console.log(posts);
        res.json({
            code: 200,
            payload: posts
        });
    })
    .catch((error) => {
        console.log(error);
        return res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    });
});

router.get('/posts/hashtag/:title', verifyToken, async (req, res) => {
    try{
        const hashtag = await Hashtag.findOne({ where: { title: req.params.title } });
        if(!hashtag){
            return res.status(404).json({
                code: 404,
                message: 'no hash tag matched'
            });
        }
        const posts = await hashtag.getPosts();
        return res.json({
            code: 200,
            meesage: posts
        });
    }
    catch(error){
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: 'Internal server error'
        });
    }
})
module.exports = router;
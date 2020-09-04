const jwt = require('jsonwebtoken');
const rateLimiter = require('express-rate-limit');

exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()){
        next();
    }
    else{
        res.status(403).send('You need to login first.');
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()){
        next();
    }
    else{
        res.redirect('/');
    }
}

exports.verifyToken = (req, res, next) => {
    try{
        req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
        return next();
    }
    catch(error){
        if(error.name === 'TokenExpiredError'){
            return res.status(419).json({
                code: 419,
                message: 'Your token is expired.'
            });
        }
    }
}

exports.apiLimiter = new rateLimiter({
    windowsMS: 60 * 1000,
    max: 1,
    delayMS: 0,
    handler(req, res){
        res.status(this.statusCode).json({
            code: this.statusCode,
            message: 'You can request only 1 time in 10 miniutes.'
        });
    }
});

exports.deprecated = (req, res) => {
    res.status(410).json({
        code: 410,
        message: 'Not the latest version.'
    });
};
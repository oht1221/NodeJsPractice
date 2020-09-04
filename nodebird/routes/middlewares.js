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
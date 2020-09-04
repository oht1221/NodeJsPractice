exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()){
        next();
    }
    else{
        req.flash('loginError', 'You have to login first.');
        res.redirect('/');
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()){
        next();
    }
    else{
        res.redirect('/');
    }
};
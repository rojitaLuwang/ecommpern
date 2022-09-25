
const isAuthorized = function(req, res, next){
    try
        {
            if (!req.isAuthenticated())
                res.sendStatus(401);
            else {
                req.isAuthorized = true;
                next()  
            };
    } catch(err) {
        next(err)
    }

};

module.exports = isAuthorized;

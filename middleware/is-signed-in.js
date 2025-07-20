const isSignIn = (req, res, next) => {
    if(req.session.user) return next()
        res.resdirect('/auth/sign-in')
}

module.exports = isSignIn
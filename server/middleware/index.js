const jwt = require('jsonwebtoken');
const SECRET = 'mysecretiseleven';

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, SECRET, (err, user) => {
            if (err) {
                console.error(err);
                return res.sendStatus(403);
            }
            // console.log('Decoded token:', user);
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

module.exports = {
    verifyToken,
    SECRET
}

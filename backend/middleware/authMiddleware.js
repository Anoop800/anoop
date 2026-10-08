const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {

    try {

        const authorization = req.header("Authorization");

        if (!authorization) {
            return res.status(401).json({
                message: "No Token"
            });
        }

        const token = authorization.startsWith("Bearer ")
            ? authorization.slice(7)
            : authorization;

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {

        console.log(error);

        res.status(401).json({
            message: "Invalid Token"
        });

    }

};

module.exports = auth;
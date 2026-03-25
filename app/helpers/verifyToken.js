const jwt = require("jsonwebtoken")

class verifyTOken{
    verifyToken(token){
            try{
                const decoded = jwt.verify(token,
                    process.env.JWT_SECRET
                )
                return decoded;
            }catch(error)
            {
                throw error;
            }
        }
    
}
const jwt=require("jsonwebtoken");
require("dotenv").config();

const userVerifyToken=async(req,res,next)=>{
    const token=req.cookies.token;
    try {
        if(!token){
            return res.status(400).send({success:false,error:"Log in first"});
        }
        const verified=await jwt.verify(token,process.env.SECRET_KEY)
        if(verified){
            req.userId=verified;
            next();
        }else{
            return res.send(401).send({success:false,message:"Invalid token"})
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({success:false,error:error.message});
    }
}

module.exports=userVerifyToken;
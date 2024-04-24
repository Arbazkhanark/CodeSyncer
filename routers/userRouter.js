const { registerUser, verifyUserOtpSignUp, verifyUserOtp, resendOtp, userLogIn, changeUserPassword, userAuth, signOut } = require("../controllers/userController");
const userVerifyToken = require("../middlewares/userMiddlewares");

const router=require("express").Router();


router.post("/register",registerUser)
router.post("/verifyOtpAndLogIn",verifyUserOtpSignUp)
// router.post("/setUsername",userVerifyToken,setUserName)
router.post("/verifyOtp",verifyUserOtp)
router.post("/resendOtp",resendOtp)
router.post("/loginUser",userLogIn)
router.get("/verifyMiddleware",userVerifyToken,(req,res)=>res.send("Hahahahaha"))
// router.post("/mobile-register",userLogInMobile)
router.put("/changePassword",userVerifyToken,changeUserPassword)
router.get("/verifyingUser",userVerifyToken,userAuth)
router.get("/logout",signOut)


module.exports=router;
const userModel = require("../models/userModel");
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken");
const nodemailer=require("nodemailer");
require("dotenv").config();


const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });


const getOtp=()=>{
  const otp=parseInt(Math.random()*10000)
  return otp
}

const registerUser=async(req,res)=>{
    const {email,password}=req.body;
    try {
        const userAlreadyExist=await userModel.findOne({email});
        if(userAlreadyExist){
            return res.status(401).send({success:false,error:"Email is already exist"});
        }
        const encrypt=await bcrypt.hash(password,10);
        const newUser=userModel({
            email,
            password:encrypt
        });
        const otp = getOtp();
        const otpExpiresAt = new Date();
        otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 3);

        const mailOptions = {
            from: process.env.SMTP_USER,
            to: email,
            subject: "Account Verification",
            text: `Dear User,
                
                        Thank you for registering with our application. To verify your account, please use the following code:
                
                        Verification Code: ${otp}
                
                        If you did not register for an account, please ignore this email.
                
                        Thank you for choosing our service.
                
                        Regards,
                        Your Application Team`,
          };

          newUser.otp=otp;
          newUser.otpExpiresAt=otpExpiresAt;
          await newUser.save();
          await transporter.sendMail(mailOptions);
          res.status(200).send({success:true,user:newUser});
    } catch (error) {
        console.log(error);
        res.status(500).send({success:false,error:error.message})
    }
}


const resendOtp = async (req, res) => {
    const { email } = req.body;
    try {
      const user = await userModel.findOne({ email });
      if (!user) return res.status(409).send({ success: false, error: "Invalid User" });
  
      const otp = getOtp();
      const otpExpiresAt = new Date();
      otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 3); // Set expiration to 3 minutes from now
  
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
  
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: "Resend OTP for Account Verification",
        text: `Dear User,
        
  Thank you for using our application. You requested a new OTP for account verification. Please use the following code:
  
  Verification Code: ${otp}
  
  If you did not request a new OTP, please ignore this email.
  
  Thank you for choosing our service.
  
  Regards,
  Your Application Team`,
      };
  
      await user.save();
      await transporter.sendMail(mailOptions);
      res.status(200).send({ success: true, message: "New OTP sent successfully." });
    } catch (error) {
      res.status(500).send({ success: false, error: error.message });
    }
  };



  const verifyUserOtpSignUp= async(req,res)=>{
    const {otp}=req.body;
    try {
        const user=await userModel.findOne({otp});
        if(!user){
            return res.status(404).send({success:false,error:"Invalid OTP"})
        }
        if(user.verify)return res.status(401).send({success:false,error:`${user.email} is Already verified..`})

        const now = new Date();
        if (now > user.otpExpiresAt) {
          return res.status(401).send({ success: false, error: "OTP has expired" });
        }

        user.verify=true;
        await user.save();
        const token=await jwt.sign({userId:user._id},process.env.SECRET_KEY);
        res.cookie('token',token);
        res.status(200).send({success:true,user})
    } catch (error) {
        res.status(500).send({success:false,error:error.message})
    }
}


const verifyUserOtp= async(req,res)=>{
    const {otp}=req.body;
    try {
        const user=await userModel.findOne({otp});
        if(!user){
            return res.status(404).send({success:false,error:"Invalid OTP"})
        }
        if(user.verify)return res.status(401).send({success:false,error:`${user.email} is Already verified..`})

        const now = new Date();
        if (now > user.otpExpiresAt) {
          return res.status(401).send({ success: false, error: "OTP has expired" });
        }

        user.verify=true;
        await user.save();
        res.status(200).send({success:true,user})
    } catch (error) {
        res.status(500).send({success:false,error:error.message})
    }
}




const userLogIn=async(req,res)=>{
    const {email,password}=req.body;
    try {
        const user=await userModel.findOne({email});
        if(!user) return res.status(404).send({success:false,error:"INVALID CREDENTIALS"})

        const match=await bcrypt.compare(password,user.password);
        if(!match) return res.status(404).send({success:false,error:"INVALID CREDENTIALS"})

        const token= jwt.sign({userId:user._id},process.env.SECRET_KEY);
        res.cookie('token',token)  
        user.token = token;
        await user.save();
        res
          .status(200)
          .send({ success: true, message: "user login Successfully", login: user });
    } catch (error) {
        res.status(500).send({success:false,error:error.message})
    }
} 


const userAuth=async(req,res)=>{
  const {token}=req.cookies;
  try {
     const decodeToken= jwt.decode(token);
     const user=await userModel.findById(decodeToken.userId);
     if(!user){
      return res.status(400).send({success:false,error:"Invalid User"})
     }
     res.status(200).send({success:true,user})
  } catch (error) {
    console.log(error);
    res.status(500).send({success:false,error:error.message})
  }
}

const changeUserPassword=async(req,res)=>{
    const {oldPassword,newPassword,confirmPassword}=req.body;
    try {
      const userId=req.userId.userId;
      const user=await userModel.findById(userId);
      const isOldPassword=await bcrypt.compare(oldPassword,user.password);
      if(!isOldPassword) return res.status(400).send({success:false,error:"Wrong old password"})
      if(newPassword===confirmPassword){
        const encrypt=await bcrypt.hash(newPassword,10)
        user.password=encrypt;
      }else{
        return res.status(400).send({success:false,error:"New Password and Confirm Password should be same"});
      }
      await user.save();
      res.status(200).send({success:true,user});
    } catch (error) {
      res.status(500).send({success:false,error:error.message})
    }
  }


  const signOut=async(req,res)=>{
    const {token}=req.cookies;
    try {
      if(!token){
        return res.status(400).send({success:false,error:"User already sing-out"})
      }
      res.clearCookie('token')
      res.status(200).send({ success: true, message: "Log Out Successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).send({success:false,error:error.message})
    }
  }

  module.exports={registerUser,resendOtp,verifyUserOtp,verifyUserOtpSignUp,changeUserPassword,userLogIn,userAuth,signOut}
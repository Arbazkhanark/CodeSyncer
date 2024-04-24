const mongoose=require("mongoose");
require("dotenv").config()

const dbConnection =async()=>{
    try {
        const DB=await mongoose.connect(process.env.DB);
        console.log("Database Connected...")
    } catch (error) {
        console.log(error)
    }
}

module.exports=dbConnection;
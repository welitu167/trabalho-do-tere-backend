//Explicando o que é um middleware
import jwt from 'jsonwebtoken'
import {Request, Response, NextFunction} from 'express'

interface RequestAuth extends Request{
    usuarioId?:string
    tipo?: string
}

function Auth(req:RequestAuth,res:Response,next:NextFunction){
    const authHeader = req.headers.authorization
    if(!authHeader)
        return res.status(401).json({mensagem:"Token não fornecido!"})
    const token = authHeader.split(" ")[1]!
    jwt.verify(token,process.env.JWT_SECRET!,(err,decoded:any)=>{
        if(err){
            console.log(err)
            return res.status(401).json({mensagem:"Token inválido!"})
        }
        if(!decoded || typeof decoded === 'string' || !('usuarioId' in decoded))
            return res.status(401).json({mensagem:"Payload inválido!"})

    req.usuarioId = decoded.usuarioId;
    // suporta tanto 'role' quanto 'tipo' no payload
    req.tipo = (decoded.tipo ?? decoded.role ?? 'user').toString().toUpperCase();
        next()

    })
}

export default Auth
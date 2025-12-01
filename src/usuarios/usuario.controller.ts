import { Request, Response } from "express";
import { db } from "../database/banco-mongo.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
class UsuarioController {
    async adicionar(req: Request, res: Response) {
        // allow optional role (only use this for setup); default to 'user'
        const {nome,idade,email,senha, role } = req.body as {nome:string, idade:number, email:string, senha:string, role?:string}
        if(!nome || !email || !senha || !idade){
            return res.status(400).json({mensagem:"Dados incompletos (nome,email,senha,idade)"})
        }
        const senhaCriptografada = await bcrypt.hash(senha,10)
        // normalize role to 'admin' | 'user' when storing in DB
        const roleNormalized = role ? (role.toString().toLowerCase() === 'admin' ? 'admin' : 'user') : 'user'
        const usuario = {nome,idade,email,senha:senhaCriptografada, role: roleNormalized}
        const resultado = await db.collection('usuarios')
            .insertOne(usuario)
        res.status(201).json({ ...usuario, _id: resultado.insertedId })
    }
    async listar(req: Request, res: Response) {
        const usuarios = await db.collection('usuarios').find().toArray();
        res.status(200).json(usuarios);
    }
    async remover(req: Request, res: Response){
        const { id } = req.params;
        if(!id) return res.status(400).json({mensagem: 'Id é obrigatório'})
        await db.collection('usuarios').deleteOne({_id: new (require('bson').ObjectId)(id)} as any)
        return res.status(200).json({mensagem: 'Usuário removido com sucesso'})
    }
    async login(req: Request, res: Response){
        //Recebe email e senha
        const {email, senha} = req.body
        //Validação de email e senha
        if(!email||!senha) 
            return res.status(400).json({mensagem:"Email e senha são obrigatórios!"})
        //Verifica se o usuário e senha estão corretos no banco.
        const usuario = await db.collection("usuarios").findOne({email})
        if(!usuario)
            return res.status(400).json({mensagem:"Usuário incorreto!"})
        const senhaValida = await bcrypt.compare(senha,usuario.senha)
        if(!senhaValida)
            return res.status(400).json({mensagem:"Senha Inválida!"})
    //criar um TOKEN contendo o id e o role do usuário
    // padroniza tipo para ADMIN/USER
    const tipo = (usuario.role ?? 'user').toString().toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER'
    // criar token contendo o id e o tipo do usuário
    const token = jwt.sign({usuarioId: usuario._id, tipo}, process.env.JWT_SECRET!, { expiresIn: '2h' })
    // Devolver token, tipo e nome do usuário
    res.status(200).json({ 
      token, 
      tipo, 
      nome: usuario.nome,
      role: usuario.role ?? 'user' 
    })
    }
}
export default new UsuarioController();
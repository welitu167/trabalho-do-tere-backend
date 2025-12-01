import bcrypt from 'bcrypt'
import { db } from '../database/banco-mongo.js'

async function main(){
    console.log('Iniciando seed...')

    // criar índices
    try{
        await db.collection('usuarios').createIndex({ email: 1 }, { unique: true })
        await db.collection('carrinhos').createIndex({ usuarioId: 1 })
        console.log('Índices criados/prontos')
    }catch(e:any){
        console.warn('Erro ao criar índices (talvez já existam):', e.message || e)
    }

    // criar usuário admin se não existir
    const adminEmail = 'admin@local'
    const existente = await db.collection('usuarios').findOne({ email: adminEmail })
    if(!existente){
        const hash = await bcrypt.hash('admin123', 10)
        const admin = { nome: 'Administrador', idade: 30, email: adminEmail, senha: hash, role: 'admin' }
        const r = await db.collection('usuarios').insertOne(admin)
        console.log('Usuário admin criado:', r.insertedId.toString())
    }else{
        console.log('Usuário admin já existe, pulando criação')
    }

    // inserir produtos de exemplo se collection estiver vazia
    const count = await db.collection('produtos').find().toArray()
    if(count.length === 0){
        const produtos = [
            { nome: 'Camiseta', preco: 49.9, descricao: 'Camiseta confortável', urlfoto: 'https://placehold.co/400x300?text=Camiseta' },
            { nome: 'Caneca', preco: 19.9, descricao: 'Caneca de cerâmica', urlfoto: 'https://placehold.co/400x300?text=Caneca' },
            { nome: 'Boné', preco: 29.9, descricao: 'Boné estiloso', urlfoto: 'https://placehold.co/400x300?text=Bone' }
        ]
        const r = await db.collection('produtos').insertMany(produtos)
        console.log('Produtos inseridos:', Object.keys(r.insertedIds).length)
    }else{
        console.log('Produtos já existem, pulando inserção')
    }

    console.log('Seed finalizada')
    process.exit(0)
}

main().catch(err=>{
    console.error('Erro no seed:', err)
    process.exit(1)
})

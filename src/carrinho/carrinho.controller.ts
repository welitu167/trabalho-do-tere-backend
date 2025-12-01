import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { db } from "../database/banco-mongo.js";

interface ItemCarrinho {
    produtoId: string;
    quantidade: number;
    precoUnitario: number;
    nome: string;
}

// Adiciona tipagem para collection.notion
interface Collection<T> {
    findOne(query: object): Promise<T | null>;
    find(): { toArray(): Promise<T[]> };
    insertOne(doc: T): Promise<{ insertedId: ObjectId }>;
    updateOne(query: object, update: object): Promise<any>;
    deleteOne(query: object): Promise<any>;
}

interface Carrinho {
    usuarioId: string;
    itens: ItemCarrinho[];
    dataAtualizacao: Date;
    total: number;
}

interface Produto {
    _id: ObjectId;
    nome:string,
    preco:number,
    descricao:string,
    urlfoto:string
}
interface RequestAuth extends Request{
    usuarioId?:string
} 

class CarrinhoController {
    //adicionarItem
    async adicionarItem(req:RequestAuth, res:Response) {
        const { produtoId, quantidade } = req.body as {usuarioId: string, produtoId: string, quantidade: number};
        const usuarioId = req.usuarioId
        if(!usuarioId)
            return res.status(401).json({mensagem:"Token não foi passado para adicionar no carrinho"})

        //Buscar o produto no banco de dados
        const produto = await db.collection<Produto>('produtos')
                        .findOne({ _id: ObjectId.createFromHexString(produtoId)});
        if(!produto)
            return res.status(404).json({mensagem: 'Produto não encontrado'});
        //Pegar o preço do produto
        //Pegar o nome do produto
        const nomeProduto = produto.nome;
        const precoProduto = produto.preco;
        
        // Verificar se um carrinho com o usuário já existe
        const carrinho = await db.collection<Carrinho>("carrinhos").findOne({usuarioId: usuarioId});

        if(!carrinho){
            const novoCarrinho: Carrinho = {
                usuarioId: usuarioId,
                itens: [{
                    produtoId: produtoId,
                    quantidade: quantidade,
                    precoUnitario: precoProduto,
                    nome: nomeProduto
                }],
                dataAtualizacao: new Date(),
                total: precoProduto * quantidade
            }
            const resposta = await db.collection<Carrinho>("carrinhos").insertOne(novoCarrinho);
            const carrinhoResposta = {
                usuarioId: novoCarrinho.usuarioId,
                itens: novoCarrinho.itens,
                dataAtualizacao: novoCarrinho.dataAtualizacao,
                total: novoCarrinho.total,
                _id: resposta.insertedId
                
            }
            //return res.status(201).json({...novoCarrinho, _id: resposta.insertedId});

            //Early Return
            return res.status(201).json(carrinhoResposta);

        }
        //ELSE
        // Se existir, deve adicionar o item ao carrinho existente
        const itemExistente = carrinho.itens.find(item => item.produtoId === produtoId);
        if(itemExistente){
            itemExistente.quantidade += quantidade;
            carrinho.total += precoProduto * quantidade;
            carrinho.dataAtualizacao = new Date();
        }
        else{
            carrinho.itens.push({
                produtoId: produtoId,
                quantidade: quantidade,
                precoUnitario: precoProduto,
                nome: nomeProduto
            });
            carrinho.total += precoProduto * quantidade;
            carrinho.dataAtualizacao = new Date();
        }
        // Atualizar o carrinho no banco de dados
        await db.collection<Carrinho>("carrinhos").updateOne({usuarioId: usuarioId},
            {$set: {
                itens: carrinho.itens, 
                total: carrinho.total, 
                dataAtualizacao: carrinho.dataAtualizacao
            }
            }
        )
        res.status(200).json(carrinho);
    }
    async removerItem(req:Request, res:Response) {
        // aceita produtoId no body ou na rota (/carrinho/:produtoId) 
        const produtoId = req.body.produtoId ?? req.params.produtoId;
        // usuarioId preferencialmente vem do token (req.usuarioId) — compatível com Auth middleware
        // (quando este controller for usado sem Auth, aceita usuarioId no body)
        // @ts-ignore
        const usuarioId = req.body.usuarioId ?? (req as any).usuarioId;

        if(!produtoId) return res.status(400).json({mensagem: 'produtoId é obrigatório'});

        const carrinho = await db.collection<Carrinho>("carrinhos").findOne({usuarioId: usuarioId});
        if(!carrinho){
            return res.status(404).json({mensagem: 'Carrinho não encontrado'});
        }
        const itemExistente = carrinho.itens.find(item => item.produtoId === produtoId);
        if(!itemExistente){
            return res.status(404).json({mensagem: 'Item não encontrado'});
        }
        const filtrados = carrinho.itens.filter(item => item.produtoId !== produtoId);
        const total = filtrados.reduce((total, item) => total + item.precoUnitario * item.quantidade, 0);
        const carrinhoAtualizado = {
            usuarioId: carrinho.usuarioId,
            itens: filtrados,
            dataAtualizacao: new Date(),
            total: total
        }
        await db.collection<Carrinho>("carrinhos").updateOne({usuarioId: usuarioId},
            {$set: {
                itens: carrinhoAtualizado.itens, 
                total: carrinhoAtualizado.total, 
                dataAtualizacao: carrinhoAtualizado.dataAtualizacao
            }
            }
        )
        return res.status(200).json(carrinhoAtualizado);

    }
    async atualizarQuantidade(req:Request, res:Response) {
        // aceita produtoId no body ou na rota (/carrinho/:produtoId/quantidade)
        const produtoId = req.body.produtoId ?? req.params.produtoId;
        // @ts-ignore
        const usuarioId = req.body.usuarioId ?? (req as any).usuarioId;
        // quantidade pode vir no body como 'quantidade' ou via query/params
        let quantidade = req.body.quantidade ?? req.query.quantidade ?? req.params.quantidade;
        quantidade = typeof quantidade === 'string' ? parseInt(quantidade) : quantidade;

        if(!produtoId) return res.status(400).json({mensagem: 'produtoId é obrigatório'});
        if(typeof quantidade !== 'number' || Number.isNaN(quantidade)) return res.status(400).json({mensagem: 'quantidade inválida'});

        const carrinho = await db.collection<Carrinho>("carrinhos").findOne({usuarioId: usuarioId});
        if(!carrinho){
            return res.status(404).json({mensagem: 'Carrinho não encontrado'});
        }
        const itemExistente = carrinho.itens.find(item => item.produtoId === produtoId);
        if(!itemExistente){
            return res.status(404).json({mensagem: 'Item não encontrado'});
        }
        itemExistente.quantidade = quantidade;
        carrinho.total = carrinho.itens.reduce((total, item) => total + item.precoUnitario * item.quantidade, 0);
        carrinho.dataAtualizacao = new Date();
        await db.collection<Carrinho>("carrinhos").updateOne({usuarioId: usuarioId},
            {$set: {
                itens: carrinho.itens, 
                total: carrinho.total, 
                dataAtualizacao: carrinho.dataAtualizacao
            }
            }
        )
        return res.status(200).json(carrinho);
    }
    async listar(req: RequestAuth, res: Response) {
        // permite buscar pelo token ou pelo body (admin pode passar outro usuarioId)
        const usuarioId = req.usuarioId || (req.body && req.body.usuarioId) || req.params.id;
        if (!usuarioId) {
            return res.status(400).json({ mensagem: 'Usuário não informado' });
        }

        const carrinho = await db.collection<Carrinho>("carrinhos").findOne({ usuarioId });
        if (!carrinho) {
            return res.status(404).json({ mensagem: 'Carrinho não encontrado' });
        }
        return res.status(200).json(carrinho);
    }

    async remover(req: RequestAuth, res: Response) {
        // usa id do token quando disponível, senão usa o parâmetro da rota
        const usuarioId = req.usuarioId || req.params.id || (req.body && req.body.usuarioId);
        if (!usuarioId) {
            return res.status(400).json({ mensagem: 'Usuário não informado' });
        }

        const carrinho = await db.collection<Carrinho>("carrinhos").findOne({ usuarioId });
        if (!carrinho) {
            return res.status(404).json({ mensagem: 'Carrinho não encontrado' });
        }
        await db.collection<Carrinho>("carrinhos").deleteOne({ usuarioId });
        return res.status(200).json({ mensagem: 'Carrinho removido com sucesso' });
    }

    async calcularTotal(req: RequestAuth, res: Response) {
        try {
            const usuarioId = req.usuarioId || req.params.id || (req.body && req.body.usuarioId);
            if (!usuarioId) {
                return res.status(400).json({ mensagem: 'Usuário não informado' });
            }

            const carrinho = await db.collection<Carrinho>("carrinhos").findOne({ usuarioId });
            if (!carrinho) {
                return res.status(404).json({ mensagem: 'Carrinho não encontrado' });
            }
            const total = carrinho.itens.reduce((sum, item) => sum + item.quantidade * item.precoUnitario, 0);
            return res.status(200).json({ total });
        } catch (error) {
            return res.status(500).json({ mensagem: 'Erro ao calcular total' });
        }
    }

    // Lista todos os carrinhos com o nome do usuário dono (rotas admin)
    async listarTodos(req: RequestAuth, res: Response) {
        try {
            // Buscar todos os carrinhos
            const carrinhos = await db.collection<any>("carrinhos").find().toArray();

            // Buscar todos os usuários (pequeno tradeoff de performance, simples e robusto)
            const usuarios = await db.collection<any>("usuarios").find().toArray();

            const resultado = carrinhos.map((c: any) => {
                // tentar encontrar o usuário por comparação de _id
                let usuarioNome: string | null = null;
                try {
                    const encontrado = usuarios.find(u => {
                        // compara as representações string das possíveis formas
                        const uid = u._id ? u._id.toString() : String(u._id);
                        const cid = c.usuarioId ? c.usuarioId.toString() : String(c.usuarioId);
                        return uid === cid;
                    });
                    if (encontrado) usuarioNome = encontrado.nome ?? null;
                } catch (e) {
                    // ignore
                }

                return {
                    _id: c._id,
                    usuarioId: c.usuarioId,
                    usuarioNome,
                    itens: c.itens,
                    total: c.total,
                    dataAtualizacao: c.dataAtualizacao
                };
            });

            return res.status(200).json(resultado);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ mensagem: 'Erro ao listar todos os carrinhos' });
        }
    }

}
export default new CarrinhoController();
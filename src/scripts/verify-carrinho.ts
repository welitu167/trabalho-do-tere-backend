import axios from 'axios'

const API = process.env.API_URL || 'http://localhost:8000'

async function run(){
    console.log('Verificação rápida de carrinho iniciando...')
    try{
        // login admin (seed cria admin@local/admin123)
        const loginAdmin = await axios.post(`${API}/login`, { email: 'admin@local', senha: 'admin123' })
        const adminToken = loginAdmin.data.token
        console.log('Logado como admin')

        // criar usuário de teste
        const user = { nome: 'Teste', idade: 25, email: `teste+${Date.now()}@local`, senha: 'teste123' }
        const novo = await axios.post(`${API}/usuarios`, user)
        console.log('Usuário de teste criado', novo.data._id)

        // login usuário de teste
        const loginUser = await axios.post(`${API}/login`, { email: user.email, senha: user.senha })
        const token = loginUser.data.token

        // obter lista de produtos (pegar primeiro)
        const produtos = await axios.get(`${API}/produtos`, { headers: { Authorization: `Bearer ${token}` } })
        if(!produtos.data || produtos.data.length === 0){
            console.warn('Nenhum produto disponível para testar');
            return process.exit(0)
        }
        const produtoId = produtos.data[0]._id
        console.log('Usando produtoId', produtoId)

        // adicionar item
        const adicionar = await axios.post(`${API}/adicionarItem`, { produtoId, quantidade: 1 }, { headers: { Authorization: `Bearer ${token}` } })
        console.log('Item adicionado ao carrinho')

        // buscar carrinho
        const carrinho = await axios.get(`${API}/carrinho`, { headers: { Authorization: `Bearer ${token}` } })
        console.log('Carrinho atual:', carrinho.data)

        // remover item
        const remover = await axios.delete(`${API}/carrinho/item`, { headers: { Authorization: `Bearer ${token}` }, data: { produtoId } })
        console.log('Item removido, carrinho agora:', remover.data)

        console.log('Verificação concluída com sucesso')
        process.exit(0)
    }catch(err:any){
        console.error('Erro na verificação:', err.response?.data || err.message)
        process.exit(1)
    }
}

run()

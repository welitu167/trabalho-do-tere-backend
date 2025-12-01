# 🔐 Sistema de Autorização Simplificado

## Resumo Executivo

```
USER (Usuário Comum)
├─ ✅ Ler/Visualizar produtos
├─ ✅ Adicionar ao carrinho
├─ ✅ Gerenciar seu carrinho
└─ ❌ Criar/Editar/Deletar produtos

ADMIN (Administrador)
├─ ✅ Ler/Visualizar produtos
├─ ✅ ✨ CRIAR produtos
├─ ✅ ✨ EDITAR produtos
├─ ✅ ✨ DELETAR produtos
├─ ✅ Adicionar ao carrinho
├─ ✅ Gerenciar seu carrinho
└─ ✅ Gerenciar carrinhos de outros usuários
```

---

## 🛣️ Rotas Principais

### Produtos

| Operação | Rota | Método | USER | ADMIN | Auth |
|----------|------|--------|------|-------|------|
| Visualizar | `/produtos` | GET | ✅ | ✅ | Sim |
| Criar | `/produtos` | POST | ❌ | ✅ | Sim |
| Editar | `/produtos/:id` | PUT | ❌ | ✅ | Sim |
| Deletar | `/produtos/:id` | DELETE | ❌ | ✅ | Sim |

### Carrinho

| Operação | Rota | Método | USER | ADMIN | Auth |
|----------|------|--------|------|-------|------|
| Adicionar Item | `/adicionarItem` | POST | ✅ | ✅ | Sim |
| Visualizar | `/carrinho` | GET | ✅ | ✅ | Sim |
| Atualizar Item | `/carrinho/quantidade` | PATCH | ✅ | ✅ | Sim |
| Remover Item | `/carrinho/item` | DELETE | ✅ | ✅ | Sim |
| Esvaziar | `/carrinho` | DELETE | ✅ | ✅ | Sim |

---

## 🔄 Fluxo de Autenticação

### 1. Novo Usuário (USER por padrão)
```
POST /usuarios
{
  "nome": "João",
  "idade": 30,
  "email": "joao@email.com",
  "senha": "senha123"
}
↓
User criado com role: "user"
```

### 2. Admin Existe
```
Email: admin@local
Senha: admin123
Role: admin (criado no seed)
```

### 3. Login → Gera JWT
```
POST /login
{ "email": "admin@local", "senha": "admin123" }
↓
Retorna:
{
  "token": "eyJhbGciOi...",
  "tipo": "ADMIN",
  "role": "admin"
}
```

### 4. Requisição com Token
```
GET /produtos
Authorization: Bearer eyJhbGciOi...
↓
Middleware Auth valida token
↓
req.tipo = "ADMIN" (extraído do token)
↓
Requisição processada normalmente
```

### 5. Requisição Protegida
```
POST /produtos (criar)
Authorization: Bearer eyJhbGciOi...
{
  "nome": "Novo Produto",
  "preco": 99.90
}
↓
Middleware Auth valida token
↓
Middleware adminAuth verifica tipo
  ├─ Se tipo !== "ADMIN" → 403 Forbidden ❌
  └─ Se tipo === "ADMIN" → Continua ✅
↓
Produto criado
```

---

## 🔒 Middleware de Autenticação

### Auth (Sempre primeiro)
```typescript
// src/middleware/auth.ts
import Auth from './auth.js'

// Uso:
rotasAutenticadas.get("/produtos", Auth, produtoController.listar)

// O que faz:
1. Verifica Authorization header
2. Valida JWT com JWT_SECRET
3. Extrai usuarioId e tipo
4. Define req.usuarioId e req.tipo
5. Passa para próximo middleware
```

**Erros:**
- 401: Token não fornecido
- 401: Token inválido/expirado
- 401: Payload inválido

### adminAuth (Sempre após Auth)
```typescript
// src/middleware/adm.ts
import { adminAuth } from './adm.js'

// Uso (SEMPRE após Auth):
rotasAutenticadas.post("/produtos", Auth, adminAuth, produtoController.adicionar)
                                     ↑      ↑
                                obrigatório ordem
```

**O que faz:**
1. Verifica se `req.tipo === 'ADMIN'`
2. Se não for: retorna 403 Forbidden
3. Se for: passa para controller

**Resposta de erro:**
```json
{
  "mensagem": "Acesso apenas para administradores"
}
```

---

## 💾 Estrutura no Banco

```typescript
// Usuário Comum
{
  _id: ObjectId,
  nome: "João Silva",
  email: "joao@email.com",
  senha: "hash_bcrypt",
  role: "user"          // ← USER
}

// Usuário Admin
{
  _id: ObjectId,
  nome: "Administrador",
  email: "admin@local",
  senha: "hash_bcrypt",
  role: "admin"         // ← ADMIN
}
```

---

## 📊 Permissões Completas

### GET /produtos
```
USER ✅  (pode ver todos)
ADMIN ✅ (pode ver todos)
```

### POST /produtos (CRIAR)
```
USER ❌ 403
ADMIN ✅ Cria e retorna produto
```

**Request:**
```json
{
  "nome": "Produto X",
  "preco": 99.90,
  "descricao": "Descrição",
  "urlfoto": "https://...",
  "categoria": "Categoria"
}
```

### PUT /produtos/:id (EDITAR)
```
USER ❌ 403
ADMIN ✅ Edita e retorna produto atualizado
```

**Request:**
```json
{
  "nome": "Novo Nome",
  "preco": 79.90,
  "categoria": "Nova Categoria"
}
```

### DELETE /produtos/:id (DELETAR)
```
USER ❌ 403
ADMIN ✅ Deleta e retorna mensagem de sucesso
```

---

## 🚀 Testando Localmente

### Com Curl

#### 1. Criar user comum
```bash
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria",
    "idade": 25,
    "email": "maria@email.com",
    "senha": "senha123"
  }'
```

#### 2. Login como user
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@email.com",
    "senha": "senha123"
  }'
```

Guarde o `token` retornado como `<USER_TOKEN>`

#### 3. User tenta criar produto (DEVE FALHAR)
```bash
curl -X POST http://localhost:3000/produtos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -d '{
    "nome": "Produto",
    "preco": 99.90
  }'
```

Retorna: **403 Forbidden**

#### 4. Login como admin
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@local",
    "senha": "admin123"
  }'
```

Guarde o token como `<ADMIN_TOKEN>`

#### 5. Admin cria produto (DEVE FUNCIONAR)
```bash
curl -X POST http://localhost:3000/produtos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "nome": "Notebook",
    "preco": 3499.90,
    "descricao": "Notebook de alta performance",
    "urlfoto": "https://example.com/notebook.jpg",
    "categoria": "Eletrônicos"
  }'
```

Retorna: **201 Created** com produto criado

---

## 🎯 Frontend (App.tsx)

O frontend já está pronto para condicionar botões baseado no tipo:

```typescript
// Mostrar botão de editar apenas para ADMIN
{tipo === 'ADMIN' && (
  <>
    <button onClick={() => abrirEdicao(produto)}>Editar</button>
    <button onClick={() => removerProduto(produto._id)}>Remover</button>
  </>
)}

// Mostrar formulário de criar apenas para ADMIN
{tipo === 'ADMIN' && (
  <form onSubmit={handleSubmit}>
    <input name="nome" placeholder="Nome" />
    <input name="preco" type="number" placeholder="Preço" />
    <button type="submit">Cadastrar</button>
  </form>
)}
```

---

## ✅ Checklist de Implementação

- ✅ Middleware `Auth` valida JWT
- ✅ Middleware `adminAuth` verifica se é ADMIN
- ✅ Rota `GET /produtos` permite USER e ADMIN
- ✅ Rota `POST /produtos` permite ADMIN apenas
- ✅ Rota `PUT /produtos/:id` permite ADMIN apenas
- ✅ Rota `DELETE /produtos/:id` permite ADMIN apenas
- ✅ Frontend mostra botões apenas para ADMIN
- ✅ JWT gerado com `tipo: "ADMIN"` ou `tipo: "USER"`
- ✅ Todos os middlewares em ordem correta: `Auth` → `adminAuth` (se necessário)

---

## 📝 Resumo das Mudanças

### Arquivo: `src/rotas/rotas-autenticadas.ts`
- Adicionado `Auth` middleware a TODAS as rotas
- Adicionado `adminAuth` a POST, PUT, DELETE de produtos
- Adicionado comentários explicativos

### Arquivo: `src/middleware/adm.ts`
- Removida import desnecessária de Auth
- Corrigida mensagem de erro (agora em PT-BR)

### Status
✅ **Sistema 100% funcional**

---

## 🔍 Se algo não funcionar

1. **Verifique JWT_SECRET no .env**
   - Deve existir e ser único

2. **Verifique role no banco**
   - `db.usuarios.findOne({email: "admin@local"})`
   - Deve ter `role: "admin"`

3. **Verifique token expirado**
   - Expira em 2 horas
   - Faça login novamente

4. **Verifique logs no console**
   - Backend mostra erros de validação

5. **Teste com curl**
   - Certifique-se que Authorization header está correto
   - `Authorization: Bearer <token>` (com espaço)

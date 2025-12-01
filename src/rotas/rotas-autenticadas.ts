import usuarioController from "../usuarios/usuario.controller.js";
import produtoController from "../produtos/produto.controller.js";
import carrinhoController from "../carrinho/carrinho.controller.js";
import pagamentoController from "../pagamento/pagamento.controller.js";
import { Router } from "express";
import Auth from '../middleware/auth.js'
import { adminAuth } from '../middleware/adm.js'
import asyncHandler from '../utils/asyncHandler.js'

const rotasAutenticadas = Router();

// Rotas de usuários
rotasAutenticadas.get("/usuarios", Auth, asyncHandler((req, res, next) => usuarioController.listar(req, res)));
// admin delete user
rotasAutenticadas.delete("/usuarios/:id", Auth, adminAuth, asyncHandler((req, res, next) => usuarioController.remover(req, res)));
// admin explicit routes (aliases) for clarity
rotasAutenticadas.delete('/admin/usuario/:id', Auth, adminAuth, asyncHandler((req, res, next) => usuarioController.remover(req, res)));
// admin list all carts
rotasAutenticadas.get('/admin/carrinhos', Auth, adminAuth, asyncHandler((req, res, next) => carrinhoController.listarTodos(req, res)));

// ============================================
// ROTAS DE PRODUTOS
// ============================================
// USER: Pode apenas LISTAR (GET)
// ADMIN: Pode CRIAR (POST), EDITAR (PUT), DELETAR (DELETE)
// ============================================

// Listar produtos (USER e ADMIN)
rotasAutenticadas.get("/produtos", Auth, asyncHandler((req, res, next) => produtoController.listar(req, res)));

// Criar produto (ADMIN apenas)
rotasAutenticadas.post("/produtos", Auth, adminAuth, asyncHandler((req, res, next) => produtoController.adicionar(req, res)));

// Editar produto (ADMIN apenas)
rotasAutenticadas.put('/produtos/:id', Auth, adminAuth, asyncHandler((req, res, next) => produtoController.atualizar(req, res)));

// Deletar produto (ADMIN apenas)
rotasAutenticadas.delete('/produtos/:id', Auth, adminAuth, asyncHandler((req, res, next) => produtoController.remover(req, res)));

// ============================================
// ROTAS DE CARRINHO (USER e ADMIN)
// ============================================

// Adicionar item ao carrinho
rotasAutenticadas.post("/adicionarItem", Auth, asyncHandler((req, res, next) => carrinhoController.adicionarItem(req, res)));

// Obter carrinho do usuário atual
rotasAutenticadas.get("/carrinho", Auth, asyncHandler((req, res, next) => carrinhoController.listar(req, res)));

// Atualizar quantidade de item no carrinho
rotasAutenticadas.put('/carrinho/:produtoId/quantidade', Auth, asyncHandler((req, res, next) => carrinhoController.atualizarQuantidade(req, res)));
rotasAutenticadas.patch('/carrinho/quantidade', Auth, asyncHandler((req, res, next) => carrinhoController.atualizarQuantidade(req, res)));

// Remover item do carrinho
rotasAutenticadas.delete('/carrinho/item', Auth, asyncHandler((req, res, next) => carrinhoController.removerItem(req, res)));
rotasAutenticadas.delete('/carrinho/:itemId', Auth, asyncHandler((req, res, next) => carrinhoController.removerItem(req, res)));

// Esvaziar carrinho
rotasAutenticadas.delete('/carrinho', Auth, asyncHandler((req, res, next) => carrinhoController.remover(req, res)));

// Criar PaymentIntent (Stripe) - usuário autenticado
rotasAutenticadas.post('/create-payment-intent', Auth, asyncHandler((req, res, next) => pagamentoController.createPaymentIntent(req, res)));

// Admin: Remover carrinho de qualquer usuário
rotasAutenticadas.delete('/admin/carrinho/:id', Auth, adminAuth, asyncHandler((req, res, next) => carrinhoController.remover(req, res)));

export default rotasAutenticadas;
import usuarioController from "../usuarios/usuario.controller.js";
import produtoController from "../produtos/produto.controller.js";
import { Router} from "express";
import asyncHandler from '../utils/asyncHandler.js'

const rotasNaoAutenticadas = Router();

rotasNaoAutenticadas.post("/login", asyncHandler((req, res, next) => usuarioController.login(req, res)));
rotasNaoAutenticadas.post("/usuarios", asyncHandler((req, res, next) => usuarioController.adicionar(req, res)));

// Rotas públicas - listar produtos (sem autenticação)
rotasNaoAutenticadas.get("/produtos", asyncHandler((req, res, next) => produtoController.listar(req, res)));

export default rotasNaoAutenticadas;
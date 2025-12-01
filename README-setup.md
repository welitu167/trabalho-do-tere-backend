Setup e validação rápida

Backend (1023A-backend-novo-main):
1. Abra um terminal PowerShell e navegue até a pasta do backend:
   cd C:\caminho\para\1023A-backend-novo-main
2. Instale dependências e rode o tsc para checar tipos:
   npm install; npx tsc --noEmit
3. Inicie em modo dev:
   npm run dev

Frontend (1023a-frontend-novo-main):
1. Abra outro terminal PowerShell e navegue até a pasta do frontend:
   cd C:\caminho\para\1023a-frontend-novo-main
2. Instale dependências e rode em dev:
   npm install; npm run dev

Observações:
- Certifique-se de ter um arquivo .env com a variável JWT_SECRET no backend.
- A URL da API usada pelo frontend vem de VITE_API_URL no .env do frontend.
- Depois de iniciar backend e frontend, abra o frontend (normalmente http://localhost:5173) e teste o login, adicionar ao carrinho e editar quantidade.

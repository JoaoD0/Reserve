# Reservê

Aplicativo mobile de reservas em restaurantes de alto padrão. Interface fluida, sistema de pontos e recompensas, favoritos e gerenciamento de perfil.

## Telas

- **Início** — feed de restaurantes em destaque e por proximidade, busca, filtros por culinária e localização
- **Restaurante** — página de detalhes com cardápio, horários, avaliação e botão de reserva
- **Reservas** — histórico e reservas ativas do usuário
- **Recompensas** — sistema de pontos com tiers (Bronze → Prata → Ouro → Diamante), resgate de cupons e benefícios
- **Perfil** — dados pessoais, favoritos, notificações e ajuda

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) + React 19 |
| Roteamento | TanStack Router (file-based) |
| Backend / Auth | [Supabase](https://supabase.com) |
| Estilização | Tailwind CSS v4 |
| Animações | Framer Motion |
| UI base | Radix UI + shadcn/ui |
| Estado assíncrono | TanStack Query |
| Ícones | Lucide React |
| Build | Vite + Cloudflare |

## Configuração local

**1. Clone o repositório**

```bash
git clone https://github.com/JoaoD0/Reserve.git
cd Reserve
```

**2. Instale as dependências**

```bash
npm install
```

**3. Configure as variáveis de ambiente**

Crie um arquivo `.env` na raiz com base no `.env.example`:

```bash
cp .env.example .env
```

Preencha com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

**4. Configure o banco de dados**

Execute o SQL abaixo no editor SQL do Supabase:

```sql
-- Perfis de usuário
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  phone text,
  birth_date text,
  cpf text,
  gender text,
  points integer DEFAULT 0,
  notification_prefs jsonb DEFAULT '{"reserva":true,"promocoes":true,"novos":false,"novidades":false}'::jsonb,
  avatar_url text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can upsert own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Favoritos
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, restaurant_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id);

-- Recompensas resgatadas
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reward_id text NOT NULL,
  coupon_code text NOT NULL,
  redeemed_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  is_used boolean DEFAULT false
);
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own rewards" ON public.user_rewards FOR ALL USING (auth.uid() = user_id);
```

**5. Rode o projeto**

```bash
npm run dev
```

Acesse em `http://localhost:8080`. Para testar no celular na mesma rede Wi-Fi:

```bash
npm run dev -- --host
```

E acesse pelo IP exibido no terminal (ex: `http://192.168.1.X:8080`).

## Sistema de pontos

| Ação | Pontos |
|---|---|
| Reserva confirmada | +150 pts |
| Avaliação após visita | +50 pts |
| Indicar um amigo | +200 pts |

| Tier | Pontos necessários |
|---|---|
| Bronze | 0 – 499 |
| Prata | 500 – 999 |
| Ouro | 1.000 – 4.999 |
| Diamante | 5.000+ |

## Scripts

```bash
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção
npm run lint      # ESLint
npm run format    # Prettier
```

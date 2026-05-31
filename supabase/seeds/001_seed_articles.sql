-- =====================================================
-- BLOG ADMIN KIT
-- Seed Data
-- =====================================================

insert into public.articles (
    title,
    slug,
    summary,
    content,
    seo_title,
    seo_description,
    category_name,
    status,
    published_at
)
values

    (
        'Comment créer une landing page performante',
        'comment-creer-landing-page-performante',
        'Les fondamentaux pour concevoir une landing page orientée conversion.',
        '# Comment créer une landing page performante

        ## Les bases

        * Message clair
        * CTA visible
        * Preuve sociale
        * Performance

        Consultez également notre guide sur le SEO.',
        'Créer une landing page performante',
        'Guide pratique pour concevoir une landing page efficace.',
        'Marketing',
        'published',
        now() - interval '15 days'
    ),

    (
        'Optimiser le SEO d’une landing page',
        'optimiser-seo-landing-page',
        'Les principaux leviers SEO à mettre en place.',
        '# Optimiser le SEO

        ## À vérifier

        * Title
        * Meta description
        * H1
        * Liens internes',
        'SEO landing page',
        'Optimisation SEO d’une landing page moderne.',
        'SEO',
        'published',
        now() - interval '12 days'
    ),

    (
        'Pourquoi ajouter un blog à son site',
        'pourquoi-ajouter-blog-site',
        'Le blog reste un excellent levier d’acquisition.',
        '# Pourquoi ajouter un blog

        Un blog permet :

        * Plus de pages indexables
        * Plus de trafic
        * Plus d’autorité',
        'Pourquoi créer un blog',
        'Les avantages d’un blog pour le référencement.',
        'SEO',
        'published',
        now() - interval '10 days'
    ),

    (
        'Créer un SaaS avec Next.js',
        'creer-saas-nextjs',
        'Retour d’expérience sur une stack moderne.',
        '# Créer un SaaS

        Stack recommandée :

        * Next.js
        * Supabase
        * Vercel',
        'Créer un SaaS avec Next.js',
        'Architecture moderne pour lancer rapidement un SaaS.',
        'SaaS',
        'published',
        now() - interval '8 days'
    ),

    (
        'Structurer un article SEO',
        'structurer-article-seo',
        'Comment rédiger un article optimisé pour Google.',
        '# Structurer un article SEO

        ## Structure

        * Introduction
        * H2
        * H3
        * Conclusion',
        'Structurer un article SEO',
        'Méthode simple pour rédiger un contenu SEO.',
        'Rédaction',
        'published',
        now() - interval '6 days'
    ),

    (
        'Mesurer les performances SEO',
        'mesurer-performances-seo',
        'Quels indicateurs suivre pour mesurer ses résultats.',
        '# Mesurer les performances

        * Impressions
        * Clics
        * CTR
        * Conversions',
        'Mesurer les performances SEO',
        'Les KPI à suivre pour un blog SEO.',
        'Analytics',
        'draft',
        null
    ),

    (
        'Créer un maillage interne efficace',
        'creer-maillage-interne',
        'Le maillage interne est essentiel pour le SEO.',
        '# Maillage interne

        Reliez vos contenus entre eux de façon cohérente.',
        'Maillage interne SEO',
        'Améliorer son SEO grâce au maillage interne.',
        'SEO',
        'published',
        now() - interval '4 days'
    ),

    (
        'Bien choisir ses catégories',
        'bien-choisir-categories',
        'Comment organiser son contenu simplement.',
        '# Catégories

        Commencez avec peu de catégories.',
        'Choisir ses catégories',
        'Organisation simple d’un blog.',
        'Organisation',
        'draft',
        null
    ),

    (
        'Utiliser Markdown pour rédiger',
        'utiliser-markdown-rediger',
        'Pourquoi Markdown est un excellent choix.',
        '# Markdown

        * Simple
        * Portable
        * Léger',
        'Markdown pour blog',
        'Rédiger efficacement avec Markdown.',
        'Technique',
        'published',
        now() - interval '2 days'
    ),

    (
        'Créer un backoffice minimaliste',
        'creer-backoffice-minimaliste',
        'Les fonctionnalités réellement indispensables.',
        '# Backoffice

        * Auth
        * Articles
        * SEO

        Le reste peut venir plus tard.',
        'Créer un backoffice minimaliste',
        'Guide pour construire un admin simple et efficace.',
        'Produit',
        'published',
        now() - interval '1 day'
    )

on conflict (slug) do nothing;

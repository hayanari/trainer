# パーソナルトレーナー管理アプリ

顧客管理・予約管理・入金管理・トレーニング記録ができるWebアプリです。複数のトレーナーがそれぞれのアカウントで利用できます。

**🚀 すぐに公開:** [Vercel](https://vercel.com) や [Netlify](https://netlify.com) に無料でデプロイできます（下記手順参照）

## 機能

- **認証**: ユーザーID・パスワードでログイン（複数トレーナー対応）
- **顧客管理**: 顧客の登録・一覧表示
- **予約管理**: 4セッション制のスケジュール、重複警告
- **全体カレンダー**: 全予約の一覧（過去データ含む）、タップでトレーニング内容確認
- **入金管理**: 4セッション＝1セット単位（基本3万円）
- **トレーニング記録**: 日々のトレーニング内容を記録

## 誰でも使えるようにする（デプロイ）

このアプリはブラウザだけで動作するため、無料のホスティングサービスに公開できます。

### 方法1: Vercel（推奨・簡単）

1. [Vercel](https://vercel.com) に無料登録
2. GitHubにプロジェクトをプッシュ（またはVercelで「Import Project」から直接アップロード）
3. デプロイが自動で完了し、URLが発行されます

```bash
# 初回のみ：GitHubにプッシュ
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/あなたのユーザー名/trainer.git
git push -u origin main
```

Vercelで「Import」→ リポジトリを選択 → Deploy

### 方法2: Netlify

1. [Netlify](https://netlify.com) に無料登録
2. 「Add new site」→「Import an existing project」
3. GitHubと連携してリポジトリを選択
4. ビルドコマンド: `npm run build`、公開ディレクトリ: `dist`（自動検出されます）
5. Deploy

### 方法3: 手動デプロイ

```bash
npm run build
```

`dist` フォルダの中身を、静的サイトホスティング（GitHub Pages、Firebase Hostingなど）にアップロードします。

## ローカルで開発

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開く

## 端末・ブラウザ間でデータを共有する（Supabase）

スマホ・PC・タブレットなど、どの端末からも同じデータにアクセスできます。

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) に無料登録
2. 「New Project」でプロジェクトを作成
3. プロジェクトの **Settings** → **API** で `Project URL` と `anon public` キーをコピー

### 2. データベースのセットアップ

1. Supabaseダッシュボードの **SQL Editor** を開く
2. `supabase/schema.sql` の内容をコピーして実行

### 3. 環境変数の設定

`.env.example` を `.env` にコピーし、値を設定：

```
VITE_SUPABASE_URL=https://あなたのプロジェクト.supabase.co
VITE_SUPABASE_ANON_KEY=あなたのanonキー
```

### 4. メール確認の無効化（任意）

ログインを簡単にするため、**Authentication** → **Providers** → **Email** で「Confirm email」をオフにできます。

### 5. デプロイ時の環境変数

Vercel/Netlifyでデプロイする場合、プロジェクト設定の「Environment Variables」に上記2つを追加してください。

---

## 動作モード

- **Supabase設定あり**: データがクラウドに保存され、どの端末からもアクセス可能
- **Supabase設定なし**: これまで通り、ブラウザのlocalStorageに保存（1端末のみ）

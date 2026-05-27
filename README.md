# Life RPG — Deployment Guide

Your personal life-tracker app. Follow these steps to get it running on your phone in ~15 minutes.

## What you'll do

1. Put this code on GitHub (free)
2. Deploy to Vercel (free)
3. Turn on Vercel KV (free storage that lasts forever)
4. Add the URL to your iPhone home screen

---

## Step 1 — Get a GitHub account

1. Go to https://github.com and sign up if you don't have one.
2. Click the "+" in the top right → **New repository**.
3. Name it `life-rpg`. Leave it private if you want. Click **Create repository**.

## Step 2 — Upload this folder to GitHub

Easy way (web upload):
1. On your new repo page, click **"uploading an existing file"**.
2. Drag the ENTIRE contents of this folder (not the folder itself, the files inside) into the upload area.
3. Click **Commit changes**.

## Step 3 — Deploy to Vercel

1. Go to https://vercel.com and sign in with GitHub.
2. On the dashboard, click **Add New → Project**.
3. Find your `life-rpg` repo, click **Import**.
4. Leave all settings at default. Click **Deploy**.
5. Wait ~1 minute. When it says "Congratulations!" — you're live.

## Step 4 — Turn on storage (Vercel KV)

This is what keeps your progress forever.

1. In Vercel dashboard, click your project.
2. Click the **Storage** tab at the top.
3. Click **Create Database** → choose **KV** (Redis).
4. Name it whatever you want (e.g. `life-rpg-data`). Click **Create**.
5. Click **Connect to Project**, select your project, and click **Connect**.
6. Go to the **Deployments** tab → click the latest deployment → click **Redeploy**.

That's it. Storage is connected.

## Step 5 — Add to your iPhone

1. On your phone, open the Vercel URL in **Safari** (must be Safari, not Chrome).
2. Tap the Share button (square with up arrow).
3. Scroll down and tap **Add to Home Screen**.
4. Name it "Life RPG" → Add.

Now you have a Life RPG icon on your home screen. Tap it. It opens fullscreen like a real app. Your progress saves forever.

---

## Free tier limits (you won't hit these)

- Vercel: 100GB bandwidth/month
- Vercel KV: 30k commands/day, 256MB storage

You'd need to log thousands of tasks a day to come close.

## If you mess up

Your data is in Vercel KV. As long as you don't delete the KV database, it's safe. You can rebuild/redeploy the app code anytime.

## Want to update the app later?

Make changes to the code in GitHub (edit files directly in the web UI). Vercel auto-redeploys on every commit. No extra steps.

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ─── STYLES ──────────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    :root{
      --ink:#0d0d0d;--paper:#f5f0e8;--cream:#faf7f2;--gold:#c9a84c;--gold-light:#e8d5a0;
      --rust:#b85c38;--forest:#2d5a3d;--sky:#2c5f82;--muted:#7a7468;--border:#d4cec4;
      --card:#ffffff;--shadow:rgba(13,13,13,0.08)
    }
    body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--ink)}
    .app{min-height:100vh;display:flex;flex-direction:column}
    .nav{background:var(--ink);padding:0 2rem;display:flex;align-items:center;justify-content:space-between;height:64px;position:sticky;top:0;z-index:100;border-bottom:2px solid var(--gold)}
    .nav-logo{font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:900;color:var(--gold);letter-spacing:-0.02em;cursor:pointer}
    .nav-logo span{color:var(--paper)}
    .nav-links{display:flex;gap:.25rem;align-items:center}
    .nav-link{font-size:.85rem;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--paper);padding:.5rem .85rem;border-radius:4px;cursor:pointer;transition:all .2s;opacity:.7;background:none;border:none}
    .nav-link:hover{opacity:1;background:rgba(201,168,76,.15)}
    .nav-link.active{opacity:1;color:var(--gold)}
    .nav-cta{background:var(--gold);color:var(--ink);font-weight:600;opacity:1!important;font-size:.82rem;letter-spacing:.06em;text-transform:uppercase;padding:.5rem 1.1rem;border-radius:4px;cursor:pointer;border:none;transition:background .2s}
    .nav-cta:hover{background:var(--gold-light)}
    .page{flex:1;animation:fadeIn .35s ease}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    .hero{background:var(--ink);padding:5rem 2rem 4rem;text-align:center;position:relative;overflow:hidden}
    .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 60% 40%,rgba(201,168,76,.12) 0%,transparent 60%),radial-gradient(ellipse at 20% 80%,rgba(44,95,130,.1) 0%,transparent 50%)}
    .hero-eyebrow{font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:1.25rem;position:relative}
    .hero h1{font-family:'Playfair Display',serif;font-size:clamp(2.5rem,6vw,4.5rem);font-weight:900;color:var(--paper);line-height:1.1;max-width:700px;margin:0 auto 1.5rem;position:relative}
    .hero h1 em{color:var(--gold);font-style:normal}
    .hero-sub{color:var(--muted);font-size:1.1rem;max-width:480px;margin:0 auto 2.5rem;line-height:1.6;position:relative}
    .hero-btns{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;position:relative}
    .btn-primary{background:var(--gold);color:var(--ink);font-weight:700;font-size:.9rem;letter-spacing:.04em;padding:.8rem 2rem;border-radius:6px;border:none;cursor:pointer;transition:all .2s}
    .btn-primary:hover{background:var(--gold-light);transform:translateY(-1px)}
    .btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none}
    .btn-outline{background:transparent;color:var(--paper);font-weight:500;font-size:.9rem;padding:.8rem 2rem;border-radius:6px;border:1.5px solid rgba(245,240,232,.25);cursor:pointer;transition:all .2s}
    .btn-outline:hover{border-color:var(--gold);color:var(--gold)}
    .stats-row{display:flex;justify-content:center;gap:3rem;padding:2.5rem 2rem;background:var(--paper);border-bottom:1px solid var(--border);flex-wrap:wrap}
    .stat{text-align:center}
    .stat-num{font-family:'Playfair Display',serif;font-size:2rem;font-weight:900;color:var(--ink)}
    .stat-label{font-size:.78rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-top:2px}
    .section{padding:4rem 2rem;max-width:1100px;margin:0 auto}
    .section-title{font-family:'Playfair Display',serif;font-size:2rem;font-weight:700;margin-bottom:.5rem}
    .section-sub{color:var(--muted);margin-bottom:2.5rem;font-size:.95rem}
    .features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem}
    .feature-card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:1.75rem;transition:box-shadow .2s,transform .2s}
    .feature-card:hover{box-shadow:0 8px 32px var(--shadow);transform:translateY(-2px)}
    .feature-icon{font-size:1.75rem;margin-bottom:.75rem}
    .feature-card h3{font-size:1rem;font-weight:600;margin-bottom:.4rem}
    .feature-card p{font-size:.87rem;color:var(--muted);line-height:1.6}
    .blog-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem}
    .blog-card{background:var(--card);border:1px solid var(--border);border-radius:10px;overflow:hidden;cursor:pointer;transition:box-shadow .2s,transform .2s}
    .blog-card:hover{box-shadow:0 8px 32px var(--shadow);transform:translateY(-2px)}
    .blog-img{height:160px;display:flex;align-items:center;justify-content:center;font-size:3rem}
    .blog-body{padding:1.25rem}
    .blog-tag{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);font-weight:600;margin-bottom:.4rem}
    .blog-card h3{font-family:'Playfair Display',serif;font-size:1.05rem;margin-bottom:.4rem;line-height:1.3}
    .blog-card p{font-size:.83rem;color:var(--muted);line-height:1.5}
    .blog-meta{font-size:.75rem;color:var(--border);margin-top:.75rem}
    .news-list{display:flex;flex-direction:column;gap:1rem}
    .news-item{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:1.25rem 1.5rem;display:flex;gap:1rem;align-items:flex-start;cursor:pointer;transition:box-shadow .2s}
    .news-item:hover{box-shadow:0 4px 20px var(--shadow)}
    .news-badge{background:var(--ink);color:var(--gold);font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700;padding:.25rem .5rem;border-radius:3px;white-space:nowrap;flex-shrink:0;margin-top:2px}
    .news-content h4{font-size:.95rem;font-weight:600;margin-bottom:.25rem}
    .news-content p{font-size:.82rem;color:var(--muted);line-height:1.5}
    .news-date{font-size:.72rem;color:var(--border);margin-top:.3rem}
    .modal-overlay{position:fixed;inset:0;background:rgba(13,13,13,.7);z-index:999;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);animation:fadeIn .2s ease}
    .modal{background:var(--cream);border-radius:14px;padding:2.5rem;width:100%;max-width:420px;border:1px solid var(--border);box-shadow:0 32px 80px rgba(13,13,13,.25);position:relative}
    .modal h2{font-family:'Playfair Display',serif;font-size:1.6rem;margin-bottom:.25rem}
    .modal-sub{font-size:.85rem;color:var(--muted);margin-bottom:2rem}
    .form-group{margin-bottom:1rem}
    .form-group label{display:block;font-size:.78rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;margin-bottom:.4rem;color:var(--ink)}
    .form-group input,.form-group select,.form-group textarea{width:100%;padding:.7rem .9rem;border:1.5px solid var(--border);border-radius:6px;font-family:'DM Sans',sans-serif;font-size:.9rem;background:var(--card);color:var(--ink);transition:border-color .2s;resize:none}
    .form-group input:focus,.form-group select:focus,.form-group textarea:focus{outline:none;border-color:var(--gold)}
    .modal-switch{text-align:center;margin-top:1rem;font-size:.82rem;color:var(--muted)}
    .modal-switch button{background:none;border:none;color:var(--gold);font-weight:600;cursor:pointer}
    .modal-close{position:absolute;top:1rem;right:1rem;background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--muted);line-height:1}
    .profile-layout{display:grid;grid-template-columns:280px 1fr;gap:2rem;max-width:1000px;margin:0 auto;padding:3rem 2rem}
    @media(max-width:768px){.profile-layout{grid-template-columns:1fr}}
    .profile-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:2rem;text-align:center;height:fit-content}
    .profile-avatar{width:80px;height:80px;background:var(--ink);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:2rem;color:var(--gold);margin:0 auto 1rem}
    .profile-card h3{font-family:'Playfair Display',serif;font-size:1.2rem}
    .profile-card .location{font-size:.82rem;color:var(--muted);margin-top:.25rem}
    .progress-label{display:flex;justify-content:space-between;font-size:.75rem;margin-bottom:.3rem}
    .progress-bar{height:6px;background:var(--border);border-radius:3px;overflow:hidden}
    .progress-fill{height:100%;background:var(--gold);border-radius:3px;transition:width .5s}
    .profile-form{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:2rem}
    .profile-form h2{font-family:'Playfair Display',serif;font-size:1.4rem;margin-bottom:1.5rem}
    .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
    @media(max-width:600px){.form-row{grid-template-columns:1fr}}
    .tags-input-wrap{display:flex;flex-wrap:wrap;gap:.4rem;padding:.5rem .7rem;border:1.5px solid var(--border);border-radius:6px;background:var(--card);min-height:42px;align-items:center}
    .tag{background:var(--ink);color:var(--paper);font-size:.75rem;padding:.2rem .55rem;border-radius:100px;display:flex;align-items:center;gap:.3rem}
    .tag button{background:none;border:none;color:var(--muted);cursor:pointer;font-size:.9rem;line-height:1;padding:0}
    .tag-input{border:none;outline:none;font-size:.85rem;min-width:80px;font-family:'DM Sans',sans-serif;background:transparent}
    .save-btn{background:var(--ink);color:var(--gold);border:none;padding:.75rem 2rem;border-radius:6px;font-weight:600;font-size:.9rem;cursor:pointer;margin-top:1.5rem;transition:background .2s}
    .save-btn:hover{background:var(--forest)}
    .save-btn:disabled{opacity:.6;cursor:not-allowed}
    .dashboard-header{background:var(--ink);padding:2.5rem 2rem;color:var(--paper);border-bottom:2px solid var(--gold)}
    .dashboard-header h1{font-family:'Playfair Display',serif;font-size:1.8rem;margin-bottom:.25rem}
    .dashboard-header p{color:var(--muted);font-size:.9rem}
    .dashboard-body{padding:2rem;max-width:1200px;margin:0 auto}
    .dash-controls{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:2rem;align-items:center}
    .filter-btn{background:var(--card);border:1.5px solid var(--border);color:var(--ink);font-size:.8rem;font-weight:500;padding:.45rem 1rem;border-radius:100px;cursor:pointer;transition:all .15s;letter-spacing:.04em}
    .filter-btn:hover,.filter-btn.active{background:var(--ink);color:var(--gold);border-color:var(--ink)}
    .analyze-btn{margin-left:auto;background:var(--gold);color:var(--ink);border:none;padding:.6rem 1.5rem;border-radius:100px;font-weight:700;font-size:.82rem;letter-spacing:.05em;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:.4rem}
    .analyze-btn:hover{background:var(--gold-light)}
    .analyze-btn:disabled{opacity:.6;cursor:not-allowed}
    .ops-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.25rem}
    .op-tile{background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;transition:box-shadow .2s,transform .2s;cursor:pointer;animation:fadeIn .4s ease both}
    .op-tile:hover{box-shadow:0 10px 40px var(--shadow);transform:translateY(-2px)}
    .op-tile-header{padding:1.25rem 1.25rem .75rem;display:flex;justify-content:space-between;align-items:flex-start}
    .op-category{font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;font-weight:700;padding:.25rem .6rem;border-radius:100px}
    .cat-job{background:#e8f4e8;color:var(--forest)}
    .cat-education{background:#e8eef8;color:var(--sky)}
    .cat-migration{background:#fdf3e3;color:var(--rust)}
    .op-match{font-size:.78rem;font-weight:700;color:var(--gold);background:var(--ink);padding:.2rem .55rem;border-radius:100px}
    .op-tile-body{padding:0 1.25rem 1.25rem}
    .op-tile h3{font-family:'Playfair Display',serif;font-size:1rem;margin-bottom:.3rem;line-height:1.3}
    .op-org{font-size:.8rem;font-weight:600;color:var(--muted);margin-bottom:.5rem}
    .op-desc{font-size:.82rem;color:var(--muted);line-height:1.55;margin-bottom:.75rem}
    .op-meta{display:flex;flex-wrap:wrap;gap:.4rem}
    .op-chip{font-size:.72rem;background:var(--paper);border:1px solid var(--border);padding:.2rem .55rem;border-radius:100px;color:var(--muted)}
    .op-tile-footer{border-top:1px solid var(--border);padding:.75rem 1.25rem;display:flex;justify-content:space-between;align-items:center}
    .op-deadline{font-size:.75rem;color:var(--muted)}
    .op-action{font-size:.78rem;font-weight:600;color:var(--sky);background:none;border:none;cursor:pointer}
    .op-action:hover{color:var(--ink)}
    .loading-banner{background:var(--ink);color:var(--paper);padding:1.25rem 2rem;text-align:center;font-size:.9rem;display:flex;align-items:center;justify-content:center;gap:.75rem}
    .spinner{width:18px;height:18px;border:2px solid rgba(201,168,76,.3);border-top-color:var(--gold);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty-dash{text-align:center;padding:4rem 2rem;color:var(--muted)}
    .empty-dash .icon{font-size:3rem;margin-bottom:1rem}
    .empty-dash h3{font-family:'Playfair Display',serif;font-size:1.4rem;color:var(--ink);margin-bottom:.5rem}
    .empty-dash p{font-size:.9rem;max-width:360px;margin:0 auto 1.5rem;line-height:1.6}
    .alert{padding:.75rem 1rem;border-radius:6px;font-size:.85rem;margin-bottom:1rem}
    .alert-success{background:#e8f4e8;color:var(--forest);border:1px solid #b8ddb8}
    .alert-error{background:#fde8e8;color:var(--rust);border:1px solid #f0b8b8}
    .footer{background:var(--ink);color:var(--muted);text-align:center;padding:2rem;font-size:.8rem;border-top:1px solid #222;margin-top:auto}
    .footer span{color:var(--gold)}
    .pricing-page{padding:4rem 2rem;max-width:1100px;margin:0 auto}
    .pricing-hero{text-align:center;margin-bottom:3rem}
    .pricing-hero h1{font-family:'Playfair Display',serif;font-size:2.5rem;font-weight:900;margin-bottom:.75rem}
    .pricing-hero p{color:var(--muted);font-size:1rem;max-width:480px;margin:0 auto}
    .pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;align-items:start}
    .pricing-card{background:var(--card);border:1.5px solid var(--border);border-radius:16px;padding:2rem;position:relative;transition:box-shadow .2s,transform .2s}
    .pricing-card:hover{box-shadow:0 12px 40px var(--shadow);transform:translateY(-3px)}
    .pricing-card.featured{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold),0 12px 40px rgba(201,168,76,.15)}
    .pricing-badge{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:var(--gold);color:var(--ink);font-size:.7rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:.3rem 1rem;border-radius:100px;white-space:nowrap}
    .plan-icon{font-size:2.25rem;margin-bottom:.75rem}
    .plan-name{font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:700;margin-bottom:.25rem}
    .plan-price{font-size:2.5rem;font-weight:900;font-family:'Playfair Display',serif;line-height:1;margin:.75rem 0 .25rem}
    .plan-price span{font-size:.9rem;font-weight:400;color:var(--muted);font-family:'DM Sans',sans-serif}
    .plan-desc{font-size:.85rem;color:var(--muted);margin-bottom:1.5rem;line-height:1.5;min-height:48px}
    .plan-features{list-style:none;margin-bottom:2rem;display:flex;flex-direction:column;gap:.6rem}
    .plan-features li{font-size:.85rem;display:flex;align-items:flex-start;gap:.5rem;line-height:1.4}
    .plan-features li .check{color:var(--forest);font-size:1rem;flex-shrink:0;margin-top:1px}
    .plan-features li .cross{color:var(--muted);font-size:1rem;flex-shrink:0;margin-top:1px;opacity:.5}
    .plan-features li.dimmed{opacity:.45}
    .plan-cta{width:100%;padding:.8rem;border-radius:8px;font-weight:700;font-size:.88rem;letter-spacing:.04em;cursor:pointer;transition:all .2s;border:none}
    .plan-cta.primary{background:var(--gold);color:var(--ink)}
    .plan-cta.primary:hover{background:var(--gold-light)}
    .plan-cta.outline{background:transparent;color:var(--ink);border:1.5px solid var(--border)}
    .plan-cta.outline:hover{border-color:var(--ink);background:var(--paper)}
    .plan-cta.dark{background:var(--ink);color:var(--gold)}
    .plan-cta.dark:hover{background:#1a1a1a}
    .current-plan-badge{display:inline-block;background:var(--forest);color:#fff;font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;font-weight:700;padding:.2rem .55rem;border-radius:100px;margin-left:.5rem;vertical-align:middle}
    .plan-divider{height:1px;background:var(--border);margin:1.25rem 0}
    .locked-tile{position:relative;overflow:hidden}
    .locked-tile::after{content:'🔒 Upgrade to unlock';position:absolute;inset:0;background:rgba(245,240,232,.92);display:flex;align-items:center;justify-content:center;font-size:.82rem;font-weight:600;color:var(--muted);letter-spacing:.04em;backdrop-filter:blur(2px)}
    /* ── Google OAuth button ── */
    .google-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:.65rem;background:#fff;color:#3c4043;border:1.5px solid #dadce0;border-radius:8px;padding:.75rem;font-size:.9rem;font-weight:500;cursor:pointer;transition:box-shadow .2s,background .15s;font-family:'DM Sans',sans-serif}
    .google-btn:hover{box-shadow:0 1px 6px rgba(0,0,0,.15);background:#f8f9fa}
    .google-btn:disabled{opacity:.6;cursor:not-allowed}
    .auth-divider{display:flex;align-items:center;gap:.75rem;margin:.9rem 0;color:var(--muted);font-size:.78rem}
    .auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:var(--border)}
    /* ── Hamburger button ── */
    .hamburger{display:none;flex-direction:column;justify-content:center;gap:5px;background:none;border:none;cursor:pointer;padding:.4rem;z-index:200}
    .hamburger span{display:block;width:22px;height:2px;background:var(--paper);border-radius:2px;transition:all .3s}
    .hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
    .hamburger.open span:nth-child(2){opacity:0;transform:scaleX(0)}
    .hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
    /* ── Mobile nav drawer ── */
    .mobile-nav{display:none;position:fixed;inset:0;top:64px;background:var(--ink);z-index:99;flex-direction:column;padding:1.5rem;gap:.25rem;overflow-y:auto;border-top:1px solid rgba(201,168,76,.2);animation:slideDown .25s ease}
    @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
    .mobile-nav.open{display:flex}
    .mobile-nav .nav-link{width:100%;text-align:left;padding:.9rem 1rem;font-size:.95rem;border-radius:8px;opacity:.8}
    .mobile-nav .nav-link.active{opacity:1;background:rgba(201,168,76,.1)}
    .mobile-nav .nav-cta{width:100%;padding:.9rem;font-size:.95rem;border-radius:8px;text-align:center;margin-top:.5rem}
    .mobile-nav .plan-pill{width:100%;text-align:left;padding:.9rem 1rem;border-radius:8px;font-size:.88rem;font-weight:700;cursor:pointer;border:1px solid rgba(201,168,76,.25)}
    .mobile-nav-divider{height:1px;background:rgba(255,255,255,.08);margin:.5rem 0}
    /* ── Responsive breakpoints ── */
    @media(max-width:768px){
      .hamburger{display:flex}
      .nav-links{display:none}
      .hero{padding:3rem 1.25rem 2.5rem}
      .hero h1{font-size:clamp(1.8rem,7vw,2.8rem)}
      .hero-sub{font-size:.95rem}
      .hero-btns{flex-direction:column;align-items:center}
      .hero-btns .btn-primary,.hero-btns .btn-outline{width:100%;max-width:300px;text-align:center}
      .stats-row{gap:1.5rem;padding:1.75rem 1rem}
      .stat-num{font-size:1.5rem}
      .section{padding:2.5rem 1.25rem}
      .section-title{font-size:1.5rem}
      .features-grid{grid-template-columns:1fr}
      .blog-grid{grid-template-columns:1fr}
      .profile-layout{grid-template-columns:1fr;padding:1.5rem 1rem}
      .form-row{grid-template-columns:1fr}
      .dashboard-header{padding:1.5rem 1rem}
      .dashboard-header h1{font-size:1.4rem}
      .dashboard-body{padding:1.25rem 1rem}
      .ops-grid{grid-template-columns:1fr}
      .pricing-page{padding:2rem 1rem}
      .pricing-hero h1{font-size:1.75rem}
      .pricing-grid{grid-template-columns:1fr}
      .modal{padding:1.75rem 1.25rem}
      .news-item{flex-direction:column;gap:.6rem}
      .news-badge{align-self:flex-start}
      .footer{padding:1.5rem 1rem;font-size:.75rem}
    }
    @media(max-width:480px){
      .nav{padding:0 1rem}
      .nav-logo{font-size:1.15rem}
      .dash-controls{gap:.35rem}
      .filter-btn{font-size:.72rem;padding:.35rem .7rem}
    }
  `}</style>
);

// ─── STATIC DATA ─────────────────────────────────────────────────────────────
const BLOG_POSTS = [
  { id: 1, tag: 'Career', emoji: '💼', bg: '#f0f4f8', title: 'Top 10 Countries Actively Recruiting Skilled Workers in 2025', excerpt: "From Canada's Express Entry to Australia's Skills in Demand visa, opportunities abound for qualified professionals.", date: 'Mar 4, 2026' },
  { id: 2, tag: 'Education', emoji: '🎓', bg: '#f8f4f0', title: 'Fully Funded Scholarships You Didn\'t Know About', excerpt: 'Discover hidden gems — lesser-known fully-funded programs at world-class universities across Europe and Asia.', date: 'Feb 28, 2026' },
  { id: 3, tag: 'Migration', emoji: '🌍', bg: '#f0f8f4', title: 'Digital Nomad Visas: A Complete 2026 Guide', excerpt: 'Over 50 countries now offer dedicated visas for remote workers. Here\'s how to find the right one for you.', date: 'Feb 20, 2026' },
  { id: 4, tag: 'Finance', emoji: '📈', bg: '#f8f0f4', title: 'Navigating Foreign Credential Recognition', excerpt: 'Your degree is valuable everywhere — if you know how to present it. A practical guide to recognition processes.', date: 'Feb 14, 2026' },
  { id: 5, tag: 'Lifestyle', emoji: '🏙️', bg: '#f4f8f0', title: 'Cost of Living Comparison: Tech Hubs Worldwide', excerpt: 'San Francisco vs. Lisbon vs. Singapore vs. Nairobi — where does your salary stretch furthest?', date: 'Feb 7, 2026' },
  { id: 6, tag: 'Career', emoji: '🤝', bg: '#f0f0f8', title: 'How to Build a Global Professional Network from Scratch', excerpt: 'LinkedIn strategies, global conferences, and diaspora communities that can accelerate your international career.', date: 'Jan 30, 2026' },
];

const NEWS_ITEMS = [
  { id: 1, badge: 'POLICY', title: 'Canada Announces 500,000 New Immigration Spots for 2026', desc: 'The IRCC confirms a historic intake target, expanding pathways for skilled workers, caregivers, and international graduates.', date: 'March 6, 2026' },
  { id: 2, badge: 'TECH JOBS', title: 'EU AI Act Creates Surge in Demand for Compliance Specialists', desc: 'With the EU AI Act now fully in force, companies are scrambling to hire AI ethics officers, auditors, and legal tech experts.', date: 'March 5, 2026' },
  { id: 3, badge: 'SCHOLARSHIPS', title: 'Chevening 2026/27 Applications Now Open', desc: 'The UK\'s flagship global scholarship programme has opened applications for the upcoming academic year.', date: 'March 4, 2026' },
  { id: 4, badge: 'MIGRATION', title: 'Germany Lowers Skills Points Threshold Under Chancenkarte', desc: 'Germany\'s Opportunity Card now easier to obtain with a reduction in the minimum points threshold required.', date: 'March 3, 2026' },
  { id: 5, badge: 'EDUCATION', title: 'Singapore Launches New Scholarship for ASEAN Students', desc: 'NUS and NTU partner to offer 200 fully-funded postgraduate scholarships to students from ASEAN member states.', date: 'March 1, 2026' },
];

const FALLBACK_OPS = [
  { id: 1, title: 'Senior Software Engineer', org: 'Spotify — Stockholm, Sweden', type: 'job', country: 'Sweden', description: 'Join Spotify\'s backend team working on music discovery systems using distributed architecture.', matchScore: 92, deadline: 'Rolling', requirements: ['5+ yrs backend', 'Distributed systems', 'EU work eligibility'], url: 'https://www.lifeatspotify.com/jobs' },
  { id: 2, title: 'Gates Cambridge Scholarship', org: 'University of Cambridge', type: 'education', country: 'United Kingdom', description: 'Fully-funded postgraduate scholarship for outstanding applicants from outside the UK.', matchScore: 87, deadline: 'Oct 15, 2026', requirements: ['Outstanding academic record', 'Leadership potential', 'Social commitment'], url: 'https://www.gatescambridge.org/apply/' },
  { id: 3, title: 'Canada Express Entry — FSW', org: 'IRCC Canada', type: 'migration', country: 'Canada', description: 'Federal Skilled Worker pathway for professionals with points above current cutoff.', matchScore: 84, deadline: 'Rolling', requirements: ['CRS score 480+', 'Language proficiency', 'Proof of funds'], url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html' },
  { id: 4, title: 'AI Research Scientist', org: 'DeepMind — London, UK', type: 'job', country: 'United Kingdom', description: 'Conduct fundamental and applied research at the frontier of artificial intelligence.', matchScore: 79, deadline: 'Apr 30, 2026', requirements: ['PhD in ML/CS', 'Publications', 'Strong coding skills'], url: 'https://deepmind.google/about/careers/' },
  { id: 5, title: 'DAAD Development-Related Postgrad', org: 'DAAD — German Universities', type: 'education', country: 'Germany', description: 'Master\'s scholarships for professionals from developing countries in development-related fields.', matchScore: 88, deadline: 'Aug 31, 2026', requirements: ["Bachelor's degree", '2 yrs work exp', 'Dev-related field'], url: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/' },
  { id: 6, title: 'Germany Opportunity Card', org: 'German Federal Government', type: 'migration', country: 'Germany', description: 'Points-based visa allowing qualified professionals to move to Germany and seek employment.', matchScore: 81, deadline: 'Rolling', requirements: ['60 points min', 'Recognised qualification', 'Basic German/English'], url: 'https://www.make-it-in-germany.com/en/visa-residence/types/opportunity-card' },
  { id: 7, title: 'Product Manager — APAC Expansion', org: 'Grab — Singapore', type: 'job', country: 'Singapore', description: 'Lead product strategy for Grab\'s mobility and financial services across Southeast Asia.', matchScore: 76, deadline: 'May 15, 2026', requirements: ['4+ yrs PM', 'Fintech/mobility', 'APAC market knowledge'], url: 'https://grab.careers/' },
  { id: 8, title: 'Chevening Scholarship 2026/27', org: 'UK Foreign Commonwealth Office', type: 'education', country: 'United Kingdom', description: "UK government's flagship scholarship for emerging global leaders to pursue a master's in the UK.", matchScore: 82, deadline: 'Nov 5, 2026', requirements: ['2 yrs work exp', 'Leadership potential', 'Return to home country'], url: 'https://www.chevening.org/scholarships/' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
// Stable hash of the fields that affect opportunity results
function profileHash(p) {
  if (!p) return '';
  return [p.country, p.city, p.age, p.education, p.field, p.experience,
    (p.skills||[]).join(','), (p.interests||[]).join(','), (p.languages||[]).join(','), p.bio
  ].join('|');
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('home');
  const [modal, setModal] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loadingOps, setLoadingOps] = useState(false);
  const [dashFilter, setDashFilter] = useState('All');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authMsg, setAuthMsg] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [usageData, setUsageData] = useState(null);
  const [billingDropdown, setBillingDropdown] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [subscriptionModal, setSubscriptionModal] = useState(null); // null | 'manage' | 'cancel' | 'downgrade'
  const [downgradeTarget, setDowngradeTarget] = useState(null);
  const [downgradeLoading, setDowngradeLoading] = useState(false);

  async function handleManageBillingNav() {
    setBillingLoading(true);
    setBillingDropdown(false);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      window.location.href = data.url;
    } catch (_) {
      alert('Could not open billing portal. Please try again.');
    } finally {
      setBillingLoading(false);
    }
  }

  // Restore session on mount
  // onAuthStateChange fires immediately with INITIAL_SESSION — the most reliable
  // way to detect a persisted session on page refresh in Supabase v2
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        // Fires on every page load with the stored session (or null if logged out)
        if (session?.user) {
          const u = session.user;
          setUser({ id: u.id, name: u.user_metadata?.full_name || u.email.split('@')[0], email: u.email });
          loadProfile(u.id);
          try {
            const savedPage = localStorage.getItem('lastPage');
            if (savedPage === 'profile' || savedPage === 'myops') setPage(savedPage);
          } catch (_) {}
        }
        // Unblock UI after initial session check — whether logged in or not
        setSessionLoading(false);
      }

      if (event === 'SIGNED_IN') {
        // Fires after fresh login — handles Google OAuth redirect return
        if (session?.user) {
          const u = session.user;
          const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0];
          setUser({ id: u.id, name, email: u.email, plan: 'silver' });
          setModal(null);
          loadProfile(u.id);
          try {
            const savedPage = localStorage.getItem('lastPage');
            if (savedPage) setPage(savedPage);
            else setPage('profile');
          } catch (_) { setPage('profile'); }
        }
        setSessionLoading(false);
      }

      if (event === 'SIGNED_OUT') {
        setUser(null); setProfile(null); setOpportunities([]); setPage('home');
        try { localStorage.removeItem('lastPage'); } catch (_) {}
        setSessionLoading(false);
      }

      if (event === 'TOKEN_REFRESHED') {
        // Session silently refreshed — update user in case metadata changed
        if (session?.user) {
          const u = session.user;
          setUser({ id: u.id, name: u.user_metadata?.full_name || u.email.split('@')[0], email: u.email });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  function applyProfileData(profileData, opsData) {
    if (profileData?.profile) {
      const p = profileData.profile;
      const normalised = {
        ...p,
        skills:    Array.isArray(p.skills)    ? p.skills    : [],
        interests: Array.isArray(p.interests) ? p.interests : [],
        languages: Array.isArray(p.languages) ? p.languages : [],
      };
      setProfile(normalised);
      if (p.plan) setUser(prev => prev ? { ...prev, plan: p.plan } : prev);
      try {
        // Opportunities saved separately so they survive independent rerun updates
        const existingOps = JSON.parse(localStorage.getItem('lumivo_ops_cache') || '[]');
        localStorage.setItem('lumivo_profile_cache', JSON.stringify({
          profile: normalised, plan: p.plan, cachedAt: Date.now()
        }));
        // Don't overwrite ops cache here — handled below in applyProfileData
        void existingOps;
      } catch (_) {}
    }
    // Usage now bundled in the same response — set immediately
    if (profileData?.usage) setUsageData(profileData.usage);
    const ops = profileData?.opportunities || opsData?.opportunities || [];
    if (ops.length > 0) {
      setOpportunities(ops);
      // Cache ops in localStorage for instant MyOps load next visit
      try {
        localStorage.setItem('lumivo_ops_cache', JSON.stringify({
          opportunities: ops, cachedAt: Date.now(), profileHash: profileHash(profileData?.profile)
        }));
      } catch (_) {}
    }
  }

  async function loadProfile(userId) {
    // 1. Restore profile AND opportunities instantly from localStorage
    try {
      const rawProfile = localStorage.getItem('lumivo_profile_cache');
      const rawOps     = localStorage.getItem('lumivo_ops_cache');
      const AGE_LIMIT  = 30 * 60 * 1000; // 30 minutes

      if (rawProfile) {
        const { profile: cached, plan, cachedAt } = JSON.parse(rawProfile);
        if (Date.now() - cachedAt < AGE_LIMIT) {
          setProfile(cached);
          if (plan) setUser(prev => prev ? { ...prev, plan } : prev);
        }
      }

      if (rawOps && rawProfile) {
        const { opportunities: cachedOps, cachedAt, profileHash: cachedHash } = JSON.parse(rawOps);
        const { profile: cachedProfile } = JSON.parse(rawProfile);
        const currentHash = profileHash(cachedProfile);
        const withinTTL   = Date.now() - cachedAt < 24 * 60 * 60 * 1000; // 24 hours
        const profileSame = cachedHash === currentHash;
        // Only use cache if profile hasn't changed AND within 24hr TTL
        if (cachedOps?.length > 0 && withinTTL && profileSame) {
          setOpportunities(cachedOps);
        }
      }
    } catch (_) {}

    // 2. Fetch fresh data silently in background — updates if anything changed
    try {
      const res = await fetch(`/api/profile?userId=${userId}`);
      const data = await res.json();
      applyProfileData(data, null);
    } catch (_) {}
  }

  async function handleAuth(type) {
    setAuthLoading(true);
    setAuthMsg(null);
    try {
      let result;
      if (type === 'signup') {
        // Sign up directly via browser Supabase client so session is persisted locally
        result = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: { data: { full_name: authForm.name } },
        });
      } else {
        // Sign in directly via browser Supabase client
        result = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        });
      }

      const { data, error } = result;
      if (error) { setAuthMsg({ type: 'error', text: error.message }); return; }
      if (!data.user) { setAuthMsg({ type: 'error', text: 'No user returned. Please try again.' }); return; }

      // Session is now stored in localStorage by the Supabase client automatically.
      // onAuthStateChange will fire SIGNED_IN, but we also set state here directly
      // so the UI updates immediately without waiting for the event.
      const u = data.user;
      setUser({ id: u.id, name: u.user_metadata?.full_name || authForm.name || authForm.email.split('@')[0], email: u.email });
      setModal(null);
      navigateTo('profile');
      loadProfile(u.id);
    } catch (_) {
      setAuthMsg({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setAuthLoading(true);
    setAuthMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) setAuthMsg({ type: 'error', text: error.message });
      // Supabase will redirect to Google — on return, onAuthStateChange fires SIGNED_IN
    } catch (_) {
      setAuthMsg({ type: 'error', text: 'Google sign-in failed. Please try again.' });
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setOpportunities([]); setPage('home');
    try {
      localStorage.removeItem('lastPage');
      localStorage.removeItem('lumivo_profile_cache');
      localStorage.removeItem('lumivo_ops_cache');
    } catch (_) {}
  }

  const navLinks = ['Home', 'Blog', 'News', 'Pricing', ...(user ? ['Profile', 'MyOps'] : [])];

  // Persist active page so we can restore it after a refresh
  function navigateTo(p) {
    setPage(p);
    setMenuOpen(false);
    if (typeof window !== 'undefined') {
      if (p === 'profile' || p === 'myops' || p === 'pricing') localStorage.setItem('lastPage', p);
      else localStorage.removeItem('lastPage');
    }
  }

  if (sessionLoading) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--ink)',flexDirection:'column',gap:'1rem'}}>
        <GlobalStyles />
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.6rem',fontWeight:900,color:'var(--gold)'}}>Lumi<span style={{color:'var(--paper)'}}>vo</span></div>
        <div style={{width:32,height:32,border:'3px solid rgba(201,168,76,.3)',borderTopColor:'var(--gold)',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
      </div>
    );
  }

  return (
    <div className="app">
      <GlobalStyles />
      <nav className="nav">
        <div className="nav-logo" onClick={() => { navigateTo('home'); }}>Lumi<span>vo</span></div>

        {/* ── Desktop nav ── */}
        <div className="nav-links">
          {navLinks.map(l => (
            <button key={l} className={`nav-link${page === l.toLowerCase() ? ' active' : ''}`} onClick={() => navigateTo(l.toLowerCase())}>{l}</button>
          ))}
          {user && (() => {
            const plan = user?.plan || 'silver';
            const cfg = {
              silver:   { label: '🥈 Silver',   color: '#9ca3af', bg: 'rgba(156,163,175,.12)', border: 'rgba(156,163,175,.3)' },
              gold:     { label: '🥇 Gold',     color: '#c9a84c', bg: 'rgba(201,168,76,.12)',  border: 'rgba(201,168,76,.35)' },
              platinum: { label: '💎 Platinum', color: '#7dd3fc', bg: 'rgba(125,211,252,.12)', border: 'rgba(125,211,252,.35)' },
            }[plan] || { label: '🥈 Silver', color: '#9ca3af', bg: 'rgba(156,163,175,.12)', border: 'rgba(156,163,175,.3)' };
            return (
              <div style={{position:'relative'}}>
                <button
                  onClick={() => setBillingDropdown(o => !o)}
                  title="Manage your subscription"
                  style={{background:cfg.bg,border:`1px solid ${cfg.border}`,color:cfg.color,borderRadius:'100px',padding:'.28rem .75rem',fontSize:'.72rem',fontWeight:700,letterSpacing:'.04em',cursor:'pointer',transition:'all .2s',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:'.3rem'}}>
                  {billingLoading ? '…' : cfg.label}
                  <span style={{fontSize:'.6rem',opacity:.7}}>{billingDropdown ? '▲' : '▼'}</span>
                </button>
                {billingDropdown && (
                  <>
                    {/* Click-outside overlay */}
                    <div onClick={() => setBillingDropdown(false)} style={{position:'fixed',inset:0,zIndex:998}}/>
                    <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,background:'#1a1a1a',border:'1px solid rgba(201,168,76,.25)',borderRadius:'12px',padding:'.4rem',minWidth:'230px',zIndex:999,boxShadow:'0 16px 48px rgba(0,0,0,.5)',animation:'fadeIn .15s ease'}}>
                      {/* Header */}
                      <div style={{padding:'.6rem .8rem .65rem',borderBottom:'1px solid rgba(255,255,255,.07)',marginBottom:'.35rem'}}>
                        <div style={{fontSize:'.65rem',color:'rgba(255,255,255,.38)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:'.2rem'}}>Current plan</div>
                        <div style={{fontSize:'.95rem',fontWeight:700,color:cfg.color}}>{cfg.label}</div>
                      </div>

                      {/* Upgrade — only if not platinum */}
                      {plan !== 'platinum' && (
                        <button onClick={() => { setBillingDropdown(false); navigateTo('pricing'); }}
                          style={{width:'100%',textAlign:'left',background:'none',border:'none',color:'var(--gold)',padding:'.6rem .8rem',borderRadius:'7px',fontSize:'.84rem',cursor:'pointer',fontWeight:600,display:'flex',alignItems:'center',gap:'.55rem'}}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(201,168,76,.1)'}
                          onMouseLeave={e=>e.currentTarget.style.background='none'}>
                          ⬆️ Upgrade Plan
                        </button>
                      )}

                      {/* Downgrade — only for platinum */}
                      {plan === 'platinum' && (
                        <button onClick={() => { setBillingDropdown(false); setDowngradeTarget('gold'); setSubscriptionModal('downgrade'); }}
                          style={{width:'100%',textAlign:'left',background:'none',border:'none',color:'rgba(255,255,255,.8)',padding:'.6rem .8rem',borderRadius:'7px',fontSize:'.84rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'.55rem'}}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.06)'}
                          onMouseLeave={e=>e.currentTarget.style.background='none'}>
                          ⬇️ Downgrade to Gold
                        </button>
                      )}

                      {/* Manage billing */}
                      {plan !== 'silver' && (
                        <button onClick={() => { setBillingDropdown(false); handleManageBillingNav(); }}
                          disabled={billingLoading}
                          style={{width:'100%',textAlign:'left',background:'none',border:'none',color:'rgba(255,255,255,.75)',padding:'.6rem .8rem',borderRadius:'7px',fontSize:'.84rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'.55rem'}}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.06)'}
                          onMouseLeave={e=>e.currentTarget.style.background='none'}>
                          💳 Manage Billing
                        </button>
                      )}

                      {/* Divider before destructive actions */}
                      {plan !== 'silver' && <div style={{height:'1px',background:'rgba(255,255,255,.06)',margin:'.3rem 0'}}/>}

                      {/* Cancel */}
                      {plan !== 'silver' && (
                        <button onClick={() => { setBillingDropdown(false); setSubscriptionModal('cancel'); }}
                          style={{width:'100%',textAlign:'left',background:'none',border:'none',color:'#f87171',padding:'.6rem .8rem',borderRadius:'7px',fontSize:'.84rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'.55rem'}}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(248,113,113,.08)'}
                          onMouseLeave={e=>e.currentTarget.style.background='none'}>
                          ✕ Cancel Subscription
                        </button>
                      )}

                      {/* Silver free plan */}
                      {plan === 'silver' && (
                        <button onClick={() => { setBillingDropdown(false); navigateTo('pricing'); }}
                          style={{width:'100%',textAlign:'left',background:'none',border:'none',color:'rgba(255,255,255,.7)',padding:'.6rem .8rem',borderRadius:'7px',fontSize:'.84rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'.55rem'}}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.06)'}
                          onMouseLeave={e=>e.currentTarget.style.background='none'}>
                          🔍 View All Plans
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })()}
          {user
            ? <button className="nav-link" style={{color:'#c9a84c'}} onClick={handleLogout}>Log out</button>
            : <button className="nav-cta" onClick={() => { setModal('signup'); setAuthMsg(null); }}>Sign Up</button>
          }
        </div>

        {/* ── Hamburger button (mobile only) ── */}
        <button className={`hamburger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span/><span/><span/>
        </button>
      </nav>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div className={`mobile-nav${menuOpen ? ' open' : ''}`}>
          {navLinks.map(l => (
            <button key={l} className={`nav-link${page === l.toLowerCase() ? ' active' : ''}`} onClick={() => navigateTo(l.toLowerCase())}>{l}</button>
          ))}
          <div className="mobile-nav-divider"/>
          {user && (() => {
            const plan = user?.plan || 'silver';
            const cfg = {
              silver:   { label: '🥈 Silver Plan',   color: '#9ca3af', bg: 'rgba(156,163,175,.08)', border: 'rgba(156,163,175,.3)' },
              gold:     { label: '🥇 Gold Plan',     color: '#c9a84c', bg: 'rgba(201,168,76,.08)',  border: 'rgba(201,168,76,.35)' },
              platinum: { label: '💎 Platinum Plan', color: '#7dd3fc', bg: 'rgba(125,211,252,.08)', border: 'rgba(125,211,252,.35)' },
            }[plan] || { label: '🥈 Silver Plan', color: '#9ca3af', bg: 'rgba(156,163,175,.08)', border: 'rgba(156,163,175,.3)' };
            return (
              <div style={{display:'flex',flexDirection:'column',gap:'.35rem'}}>
                <div style={{fontSize:'.7rem',color:'rgba(255,255,255,.4)',letterSpacing:'.08em',textTransform:'uppercase',paddingLeft:'.25rem'}}>Your Plan</div>
                <button className="plan-pill" onClick={() => { navigateTo('pricing'); }}
                  style={{background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`}}>
                  {cfg.label} {plan !== 'platinum' ? '— Tap to upgrade' : '— Active'}
                </button>
                {plan !== 'silver' && (
                  <button className="plan-pill"
                    onClick={() => { setMenuOpen(false); handleManageBillingNav(); }}
                    style={{background:'rgba(248,113,113,.08)',color:'#f87171',border:'1px solid rgba(248,113,113,.2)'}}>
                    {billingLoading ? 'Opening…' : '✕ Cancel / Manage Billing'}
                  </button>
                )}
              </div>
            );
          })()}
          <div className="mobile-nav-divider"/>
          {user
            ? <button className="nav-link" style={{color:'#c9a84c'}} onClick={handleLogout}>Log out</button>
            : <>
                <button className="nav-link" onClick={() => { setModal('login'); setAuthMsg(null); setMenuOpen(false); }}>Log In</button>
                <button className="nav-cta" onClick={() => { setModal('signup'); setAuthMsg(null); setMenuOpen(false); }}>Sign Up Free</button>
              </>
          }
        </div>
      )}

      <div className="page">
        {page === 'home' && <HomePage setPage={setPage} setModal={setModal} user={user} />}
        {page === 'blog' && <BlogPage />}
        {page === 'pricing' && <PricingPage setModal={setModal} user={user} navigateTo={navigateTo} />}
        {page === 'news' && <NewsPage />}
        {page === 'profile' && (user
          ? <ProfilePage user={user} profile={profile} setProfile={setProfile} setPage={navigateTo} setOpportunities={setOpportunities} setLoadingOps={setLoadingOps} userPlan={user?.plan || 'silver'} initialUsage={usageData} />
          : <div style={{padding:'4rem 2rem',textAlign:'center'}}><p style={{color:'var(--muted)'}}>Please sign in to view your profile.</p></div>
        )}
        {page === 'myops' && (user
          ? <DashboardPage opportunities={opportunities} loadingOps={loadingOps} dashFilter={dashFilter} setDashFilter={setDashFilter} profile={profile} setOpportunities={setOpportunities} setLoadingOps={setLoadingOps} setPage={navigateTo} user={user} userPlan={user?.plan || 'silver'} usageData={usageData} setUsageData={setUsageData} />
          : <div style={{padding:'4rem 2rem',textAlign:'center'}}><p style={{color:'var(--muted)'}}>Please sign in to view your opportunities.</p></div>
        )}
      </div>

      <footer className="footer">© 2026 <span>Lumivo</span> · Powered by AI · Connecting talent to the world</footer>

      {/* ── Cancel Subscription Modal ── */}
      {subscriptionModal === 'cancel' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSubscriptionModal(null)}>
          <div className="modal" style={{maxWidth:400}}>
            <button className="modal-close" onClick={() => setSubscriptionModal(null)}>✕</button>
            <div style={{textAlign:'center',marginBottom:'1.5rem'}}>
              <div style={{fontSize:'2.5rem',marginBottom:'.75rem'}}>😔</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',marginBottom:'.5rem'}}>Cancel Subscription?</h2>
              <p style={{fontSize:'.88rem',color:'var(--muted)',lineHeight:1.6}}>
                Your plan stays active until the end of your billing period. After that you'll drop to the free Silver plan.
              </p>
            </div>
            <div style={{background:'var(--paper)',border:'1px solid var(--border)',borderRadius:'8px',padding:'1rem',marginBottom:'1.5rem',display:'flex',flexDirection:'column',gap:'.45rem'}}>
              {['Re-run analysis disabled','Only 1 opportunity per category visible','Token allowance removed'].map(item => (
                <div key={item} style={{display:'flex',alignItems:'center',gap:'.5rem',fontSize:'.83rem',color:'var(--muted)'}}>
                  <span style={{color:'var(--rust)'}}>✕</span> {item}
                </div>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'.6rem'}}>
              <button
                onClick={() => { setSubscriptionModal(null); handleManageBillingNav(); }}
                disabled={billingLoading}
                style={{background:'#dc2626',color:'#fff',border:'none',borderRadius:'8px',padding:'.8rem',fontWeight:700,fontSize:'.9rem',cursor:'pointer',opacity:billingLoading?0.6:1}}>
                {billingLoading ? 'Opening portal…' : 'Yes, Cancel Subscription'}
              </button>
              <button
                onClick={() => setSubscriptionModal(null)}
                style={{background:'transparent',color:'var(--ink)',border:'1.5px solid var(--border)',borderRadius:'8px',padding:'.8rem',fontWeight:600,fontSize:'.9rem',cursor:'pointer'}}>
                Keep My Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Downgrade Subscription Modal ── */}
      {subscriptionModal === 'downgrade' && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSubscriptionModal(null)}>
          <div className="modal" style={{maxWidth:420}}>
            <button className="modal-close" onClick={() => setSubscriptionModal(null)}>✕</button>
            <div style={{textAlign:'center',marginBottom:'1.5rem'}}>
              <div style={{fontSize:'2.5rem',marginBottom:'.75rem'}}>⬇️</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.4rem',marginBottom:'.5rem'}}>Downgrade to Gold?</h2>
              <p style={{fontSize:'.88rem',color:'var(--muted)',lineHeight:1.6}}>
                You'll move to the Gold plan at your next billing cycle. You keep Platinum access until then.
              </p>
            </div>
            <div style={{background:'var(--paper)',border:'1px solid var(--border)',borderRadius:'8px',padding:'1rem',marginBottom:'1.5rem',display:'flex',flexDirection:'column',gap:'.45rem'}}>
              {['Priority support removed','Token limit drops to 2,000/mo','All other Gold features remain'].map((item, i) => (
                <div key={item} style={{display:'flex',alignItems:'center',gap:'.5rem',fontSize:'.83rem',color:'var(--muted)'}}>
                  <span style={{color: i < 2 ? 'var(--rust)' : 'var(--forest)'}}>{i < 2 ? '✕' : '✓'}</span> {item}
                </div>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'.6rem'}}>
              <button
                onClick={() => { setSubscriptionModal(null); handleManageBillingNav(); }}
                disabled={billingLoading}
                style={{background:'var(--ink)',color:'var(--gold)',border:'none',borderRadius:'8px',padding:'.8rem',fontWeight:700,fontSize:'.9rem',cursor:'pointer',opacity:billingLoading?0.6:1}}>
                {billingLoading ? 'Opening portal…' : 'Downgrade to Gold'}
              </button>
              <button
                onClick={() => setSubscriptionModal(null)}
                style={{background:'transparent',color:'var(--ink)',border:'1.5px solid var(--border)',borderRadius:'8px',padding:'.8rem',fontWeight:600,fontSize:'.9rem',cursor:'pointer'}}>
                Keep Platinum
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Auth Modal ── */}
      {(modal === 'login' || modal === 'signup') && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            <h2>{modal === 'signup' ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="modal-sub">{modal === 'signup' ? 'Join thousands discovering global opportunities.' : 'Sign in to access your dashboard.'}</p>
            {authMsg && <div className={`alert alert-${authMsg.type}`}>{authMsg.text}</div>}

            {/* Google OAuth */}
            <button className="google-btn" onClick={handleGoogleAuth} disabled={authLoading}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
              {authLoading ? 'Redirecting…' : `Continue with Google`}
            </button>

            <div className="auth-divider">or</div>

            {modal === 'signup' && (
              <div className="form-group">
                <label>Full Name</label>
                <input placeholder="Jane Smith" value={authForm.name} onChange={e => setAuthForm(f => ({ ...f, name: e.target.value }))} />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="jane@example.com" value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <button className="btn-primary" style={{ width: '100%', marginTop: '.5rem' }} disabled={authLoading} onClick={() => handleAuth(modal)}>
              {authLoading ? 'Please wait…' : modal === 'signup' ? 'Create Account →' : 'Sign In →'}
            </button>
            <p className="modal-switch">
              {modal === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
              <button onClick={() => { setModal(modal === 'signup' ? 'login' : 'signup'); setAuthMsg(null); }}>
                {modal === 'signup' ? 'Log in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomePage({ setPage, setModal, user }) {
  return (
    <>
      <div className="hero">
        <p className="hero-eyebrow">✦ AI-Powered Global Opportunity Discovery by Lumivo</p>
        <h1>Your Skills Deserve a <em>World-Class</em> Stage</h1>
        <p className="hero-sub">Create your profile. Let our AI study it. Discover jobs, scholarships, and migration pathways tailored exactly to you — worldwide.</p>
        <div className="hero-btns">
          {user
            ? <button className="btn-primary" onClick={() => setPage('myops')}>View My Opportunities →</button>
            : <button className="btn-primary" onClick={() => setModal('signup')}>Get Started Free →</button>
          }
          <button className="btn-outline" onClick={() => setPage('blog')}>Read Our Blog</button>
        </div>
      </div>
      <div className="stats-row">
        {[['50K+','Opportunities Indexed'],['120+','Countries Covered'],['8K+','Active Users'],['94%','Match Accuracy']].map(([n,l]) => (
          <div className="stat" key={l}><div className="stat-num">{n}</div><div className="stat-label">{l}</div></div>
        ))}
      </div>
      <div className="section">
        <h2 className="section-title">How It Works</h2>
        <p className="section-sub">Three steps to unlocking your global potential.</p>
        <div className="features-grid">
          {[
            ['🧑‍💼','Build Your Profile','Tell us about your location, education, skills, and interests. The more detail, the sharper the AI\'s insights.'],
            ['🤖','AI Analysis by Claude','Sonnet studies your full profile and cross-references thousands of global opportunities across education, work, and migration.'],
            ['🌐','Discover Your MyOps','Receive personalised opportunity tiles on your dashboard — ranked by relevance, match score, and deadline.'],
            ['📬','Stay Updated','New opportunities are continuously surfaced. Follow our blog and news for the latest in global mobility trends.'],
          ].map(([icon,title,desc]) => (
            <div className="feature-card" key={title}><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{desc}</p></div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── BLOG ─────────────────────────────────────────────────────────────────────
function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => { loadPosts(false); }, []);

  function loadPosts(forceRefresh) {
    setLoading(true); setError(null); setPosts([]);
    fetch(`/api/blog${forceRefresh ? '?refresh=1' : ''}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setPosts(d.posts);
        setGeneratedAt(d.generatedAt);
        setFromCache(d.cached || false);
      })
      .catch(() => setError('Failed to load posts'))
      .finally(() => setLoading(false));
  }

  function handleRefresh() { loadPosts(true); }

  // Format how long ago content was generated
  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(diff / 3600000);
    if (hrs >= 1) return `${hrs}h ago`;
    if (mins >= 1) return `${mins}m ago`;
    return 'just now';
  }

  return (
    <div className="section">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:'1rem',marginBottom:'2rem'}}>
        <div>
          <h2 className="section-title" style={{marginBottom:'.4rem'}}>Blog</h2>
          <p className="section-sub" style={{margin:0}}>Insights on global careers, education, and migration — curated by Lumivo AI.</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'.75rem',flexShrink:0}}>
          {generatedAt && (
            <span style={{fontSize:'.72rem',color:'var(--muted)',display:'flex',alignItems:'center',gap:'.35rem'}}>
              {fromCache && <span style={{background:'rgba(201,168,76,.12)',color:'var(--gold)',padding:'.1rem .4rem',borderRadius:'4px',fontWeight:600}}>cached</span>}
              Updated {timeAgo(generatedAt)}
            </span>
          )}
          <button onClick={handleRefresh} disabled={loading} style={{background:'none',border:'1px solid var(--border)',borderRadius:'6px',padding:'.4rem .9rem',fontSize:'.78rem',cursor:'pointer',color:'var(--muted)',opacity:loading?0.6:1}}>
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {loading && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'1.5rem'}}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'12px',overflow:'hidden',animation:'pulse 1.5s ease infinite'}}>
              <div style={{height:'120px',background:'#e8e3d9'}}/>
              <div style={{padding:'1.25rem',display:'flex',flexDirection:'column',gap:'.6rem'}}>
                <div style={{height:'10px',background:'#e8e3d9',borderRadius:'4px',width:'30%'}}/>
                <div style={{height:'16px',background:'#e8e3d9',borderRadius:'4px',width:'90%'}}/>
                <div style={{height:'12px',background:'#e8e3d9',borderRadius:'4px',width:'70%'}}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{textAlign:'center',padding:'3rem',color:'var(--muted)'}}>
          <div style={{fontSize:'2rem',marginBottom:'.75rem'}}>⚠️</div>
          <p style={{marginBottom:'1rem'}}>{error}</p>
          <button className="btn-primary" onClick={handleRefresh}>Try Again</button>
        </div>
      )}

      {!loading && !error && (
        <div className="blog-grid">
          {posts.map(p => (
            <a
              key={p.id}
              href={p.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="blog-card"
              style={{animation:'fadeIn .4s ease both',animationDelay:`${(p.id-1)*80}ms`,textDecoration:'none',color:'inherit',display:'block',cursor:'pointer'}}
            >
              <div className="blog-img" style={{background: p.bg || '#f0f4f8'}}>{p.emoji}</div>
              <div className="blog-body">
                <div className="blog-tag">{p.tag}</div>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
                <div className="blog-meta" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span>{p.date}</span>
                  <span style={{color:'var(--gold)',fontSize:'.78rem',fontWeight:600}}>Read →</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── NEWS ─────────────────────────────────────────────────────────────────────
function NewsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => { loadNews(false); }, []);

  function loadNews(forceRefresh) {
    setLoading(true); setError(null); setItems([]);
    fetch(`/api/news${forceRefresh ? '?refresh=1' : ''}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setItems(d.items);
        setGeneratedAt(d.generatedAt);
        setFromCache(d.cached || false);
      })
      .catch(() => setError('Failed to load news'))
      .finally(() => setLoading(false));
  }

  function handleRefresh() { loadNews(true); }

  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs  = Math.floor(diff / 3600000);
    if (hrs >= 1) return `${hrs}h ago`;
    if (mins >= 1) return `${mins}m ago`;
    return 'just now';
  }

  return (
    <div className="section">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:'1rem',marginBottom:'2rem'}}>
        <div>
          <h2 className="section-title" style={{marginBottom:'.4rem'}}>Latest News</h2>
          <p className="section-sub" style={{margin:0}}>Breaking updates in global mobility, jobs, and education — curated by Lumivo AI.</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'.75rem',flexShrink:0}}>
          {generatedAt && (
            <span style={{fontSize:'.72rem',color:'var(--muted)',display:'flex',alignItems:'center',gap:'.35rem'}}>
              {fromCache && <span style={{background:'rgba(201,168,76,.12)',color:'var(--gold)',padding:'.1rem .4rem',borderRadius:'4px',fontWeight:600}}>cached</span>}
              Updated {timeAgo(generatedAt)}
            </span>
          )}
          <button onClick={handleRefresh} disabled={loading} style={{background:'none',border:'1px solid var(--border)',borderRadius:'6px',padding:'.4rem .9rem',fontSize:'.78rem',cursor:'pointer',color:'var(--muted)',opacity:loading?0.6:1}}>
            {loading ? '…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="news-list">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="news-item" style={{animation:'pulse 1.5s ease infinite'}}>
              <div style={{width:'80px',height:'22px',background:'#e8e3d9',borderRadius:'4px',flexShrink:0}}/>
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:'.5rem'}}>
                <div style={{height:'16px',background:'#e8e3d9',borderRadius:'4px',width:'80%'}}/>
                <div style={{height:'12px',background:'#e8e3d9',borderRadius:'4px',width:'60%'}}/>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{textAlign:'center',padding:'3rem',color:'var(--muted)'}}>
          <div style={{fontSize:'2rem',marginBottom:'.75rem'}}>⚠️</div>
          <p style={{marginBottom:'1rem'}}>{error}</p>
          <button className="btn-primary" onClick={handleRefresh}>Try Again</button>
        </div>
      )}

      {!loading && !error && (
        <div className="news-list">
          {items.map((n,i) => (
            <a
              key={n.id}
              href={n.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="news-item"
              style={{animation:'fadeIn .35s ease both',animationDelay:`${i*60}ms`,textDecoration:'none',color:'inherit',cursor:'pointer'}}
            >
              <span className="news-badge" style={n.urgent?{background:'var(--rust)',color:'#fff'}:{}}>{n.badge}</span>
              <div className="news-content">
                <h4>{n.title}</h4>
                <p>{n.desc}</p>
                <div className="news-date" style={{display:'flex',alignItems:'center',gap:'.5rem',justifyContent:'space-between'}}>
                  <span style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
                    {n.urgent && <span style={{fontSize:'.65rem',background:'rgba(184,92,56,.12)',color:'var(--rust)',padding:'.1rem .4rem',borderRadius:'4px',fontWeight:700}}>BREAKING</span>}
                    {n.date}
                  </span>
                  <span style={{color:'var(--gold)',fontSize:'.78rem',fontWeight:600}}>Read →</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
function ProfilePage({ user, profile, setProfile, setPage, setOpportunities, setLoadingOps, initialUsage }) {
  const emptyForm = { country:'',city:'',age:'',education:'',field:'',experience:'',skills:[],interests:[],languages:[],bio:'' };

  // Normalise a profile row from DB — Supabase can return null for array fields
  function normalise(p) {
    if (!p) return emptyForm;
    return {
      ...emptyForm,
      ...p,
      skills:     Array.isArray(p.skills)     ? p.skills     : [],
      interests:  Array.isArray(p.interests)  ? p.interests  : [],
      languages:  Array.isArray(p.languages)  ? p.languages  : [],
    };
  }

  const [form, setForm] = useState(() => normalise(profile));
  const [skillInput,setSkillInput] = useState('');
  const [interestInput,setInterestInput] = useState('');
  const [langInput,setLangInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState(null);
  const [limitError, setLimitError] = useState(null);
  const [usage, setUsage] = useState(initialUsage || null);

  // initialUsage comes pre-loaded with the profile — no extra fetch needed on mount
  // Only re-fetch after an action that changes token usage (save, analyze)
  function refreshUsage() {
    if (!user?.id) return;
    fetch(`/api/usage?userId=${user.id}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setUsage(d); })
      .catch(() => {});
  }

  // Sync form when profile prop changes (e.g. after re-login)
  useEffect(() => { if (profile) setForm(normalise(profile)); }, [profile]);
  // Sync usage when parent refreshes it
  useEffect(() => { if (initialUsage) setUsage(initialUsage); }, [initialUsage]);

  const completeness = [form.country,form.age,form.education,form.field,form.skills.length,form.interests.length].filter(Boolean).length;
  const pct = Math.round((completeness/6)*100);

  function addTag(field, val, setter) {
    if (!val.trim()) return;
    setForm(f => ({ ...f, [field]: [...f[field], val.trim()] }));
    setter('');
  }
  function removeTag(field, idx) { setForm(f => ({ ...f, [field]: f[field].filter((_,i)=>i!==idx) })); }

  async function handleSave() {
    setSaving(true); setSaveErr(null);
    try {
      const res = await fetch('/api/profile', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId: user.id, profile: form }) });
      const data = await res.json();
      if (data.error) { setSaveErr(data.error); return; }
      setProfile(form);
      try {
        // Bust profile cache so next load gets fresh data
        localStorage.removeItem('lumivo_profile_cache');
        // Bust ops cache — profile changed so existing results are stale
        localStorage.removeItem('lumivo_ops_cache');
      } catch (_) {}
      setSaved(true); setTimeout(()=>setSaved(false),3000);
    } catch(_) { setSaveErr('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  }

  async function handleAnalyze() {
    await handleSave();
    setPage('myops');
    setLoadingOps(true);
    // Don't clear existing ops — keep cached ones visible while new ones load
    const profileSummary = `Location: ${form.city}, ${form.country}\nAge: ${form.age}\nEducation: ${form.education} in ${form.field}\nExperience: ${form.experience} years\nSkills: ${form.skills.join(', ')}\nInterests: ${form.interests.join(', ')}\nLanguages: ${form.languages.join(', ')}\nBio: ${form.bio}`;
    try {
      const res = await fetch('/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ profileSummary, userId: user.id }) });
      const data = await res.json();
      if (data.error === 'limit_reached') {
        setLimitError(data.message);
        return;
      }
      setLimitError(null);
      const ops = data.opportunities || FALLBACK_OPS;
      setOpportunities(ops);
      // Cache locally so MyOps loads instantly next visit
      try {
        localStorage.setItem('lumivo_ops_cache', JSON.stringify({ opportunities: ops, cachedAt: Date.now(), profileHash: profileHash(form) }));
      } catch (_) {}
      // Persist to DB
      fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, opportunities: ops }),
      }).catch(() => {});
    } catch(_) { setOpportunities(FALLBACK_OPS); }
    finally { setLoadingOps(false); }
  }

  return (
    <div className="profile-layout">
      <div>
        <div className="profile-card">
          <div className="profile-avatar">{user.name[0].toUpperCase()}</div>
          <h3>{user.name}</h3>
          <p className="location">{form.city ? `${form.city}, ${form.country}` : 'Location not set'}</p>
          <div style={{marginTop:'1.25rem'}}>
            <div className="progress-label"><span>Profile Completeness</span><span style={{fontWeight:700}}>{pct}%</span></div>
            <div className="progress-bar"><div className="progress-fill" style={{width:`${pct}%`}}/></div>
          </div>
          {usage && (
            <div style={{marginTop:'1.25rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'.75rem',marginBottom:'.3rem'}}>
                <span>AI Tokens Used</span>
                <span style={{fontWeight:700,color: usage.percentUsed >= 90 ? 'var(--rust)' : usage.percentUsed >= 70 ? '#b07a20' : 'var(--ink)'}}>
                  {usage.tokensUsed.toLocaleString()} / {usage.tokenLimit.toLocaleString()}
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width:`${usage.percentUsed}%`,
                  background: usage.percentUsed >= 90 ? 'var(--rust)' : usage.percentUsed >= 70 ? '#c9893c' : 'var(--gold)'
                }}/>
              </div>
              <div style={{fontSize:'.7rem',color:'var(--muted)',marginTop:'.3rem',textAlign:'right'}}>
                Resets {usage.resetDate}
              </div>
            </div>
          )}
          {limitError && (
            <div style={{marginTop:'1rem',background:'rgba(184,92,56,.08)',border:'1px solid rgba(184,92,56,.25)',borderRadius:'8px',padding:'.75rem',fontSize:'.78rem',textAlign:'left'}}>
              <div style={{color:'var(--rust)',marginBottom:'.5rem'}}>🚫 {limitError}</div>
              <button className="btn-primary" style={{width:'100%',fontSize:'.8rem',padding:'.6rem'}} onClick={() => setPage('pricing')}>
                ⬆️ Upgrade Plan →
              </button>
            </div>
          )}
          {!limitError && pct>=50 && <button className="btn-primary" style={{width:'100%',marginTop:'1.25rem',fontSize:'.82rem'}} onClick={handleAnalyze}>✦ Analyse & Find Opportunities</button>}
        </div>
      </div>
      <div className="profile-form">
        <h2>Your Profile</h2>
        {saved&&<div className="alert alert-success">Profile saved successfully!</div>}
        {saveErr&&<div className="alert alert-error">{saveErr}</div>}
        {limitError&&<div className="alert alert-error" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'1rem'}}>🚫 {limitError} <button className="btn-primary" style={{fontSize:'.78rem',padding:'.4rem .9rem',whiteSpace:'nowrap'}} onClick={()=>setPage('pricing')}>Upgrade →</button></div>}
        <div className="form-row">
          <div className="form-group"><label>Country</label><input placeholder="e.g. Nigeria" value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}/></div>
          <div className="form-group"><label>City</label><input placeholder="e.g. Lagos" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Age</label><input type="number" placeholder="e.g. 28" value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))}/></div>
          <div className="form-group"><label>Years of Experience</label><input type="number" placeholder="e.g. 5" value={form.experience} onChange={e=>setForm(f=>({...f,experience:e.target.value}))}/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Highest Education</label>
            <select value={form.education} onChange={e=>setForm(f=>({...f,education:e.target.value}))}>
              <option value="">Select…</option>
              {["High School","Diploma","Bachelor's","Master's","PhD","Professional Cert"].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Field / Industry</label><input placeholder="e.g. Computer Science" value={form.field} onChange={e=>setForm(f=>({...f,field:e.target.value}))}/></div>
        </div>
        {[['Skills','skills',skillInput,setSkillInput,'e.g. Python (press Enter)'],['Interests','interests',interestInput,setInterestInput,'e.g. AI, Climate Tech'],['Languages','languages',langInput,setLangInput,'e.g. English, French']].map(([label,field,val,setter,ph])=>(
          <div className="form-group" key={field}>
            <label>{label}</label>
            <div className="tags-input-wrap">
              {form[field].map((t,i)=><span className="tag" key={i}>{t}<button onClick={()=>removeTag(field,i)}>×</button></span>)}
              <input className="tag-input" placeholder={ph} value={val} onChange={e=>setter(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();addTag(field,val,setter)}}}/>
            </div>
          </div>
        ))}
        <div className="form-group"><label>Short Bio</label><textarea rows={3} placeholder="Tell us about yourself and your goals…" value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))}/></div>
        <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
          <button className="save-btn" disabled={saving} onClick={handleSave}>{saving?'Saving…':'Save Profile'}</button>
          {pct>=50&&<button className="btn-primary" style={{marginTop:'1.5rem'}} onClick={handleAnalyze}>✦ Find My Opportunities →</button>}
        </div>
      </div>
    </div>
  );
}

// Plan limits config
// Silver: 1 per category (3 total), Gold: 10 total, Platinum: all 20
const PLAN_LIMITS = {
  silver:   { maxOpsPerCat: 1, maxOps: null, canRerun: false, tokenLimit: 0,     label: 'Silver',   color: '#9ca3af' },
  gold:     { maxOpsPerCat: null, maxOps: 10, canRerun: true,  tokenLimit: 2000,  label: 'Gold',     color: '#c9a84c' },
  platinum: { maxOpsPerCat: null, maxOps: null, canRerun: true, tokenLimit: 20000, label: 'Platinum', color: '#7dd3fc' },
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage({ opportunities, loadingOps, dashFilter, setDashFilter, profile, setOpportunities, setLoadingOps, setPage, user, userPlan, usageData, setUsageData }) {
  const filters = ['All','Job','Education','Migration'];
  const plan = PLAN_LIMITS[userPlan] || PLAN_LIMITS.silver;
  const [rerunError, setRerunError] = useState(null);
  const [rerunLimitHit, setRerunLimitHit] = useState(false);

  async function handleRerun() {
    if (!profile || loadingOps) return;
    setRerunError(null);
    setRerunLimitHit(false);
    setLoadingOps(true);
    // Keep existing ops visible while refreshing
    const profileSummary = `Location: ${profile.city}, ${profile.country}\nAge: ${profile.age}\nEducation: ${profile.education} in ${profile.field}\nExperience: ${profile.experience} years\nSkills: ${(profile.skills||[]).join(', ')}\nInterests: ${(profile.interests||[]).join(', ')}\nLanguages: ${(profile.languages||[]).join(', ')}\nBio: ${profile.bio}`;
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileSummary, userId: user.id }),
      });
      const data = await res.json();
      if (data.error === 'limit_reached') {
        setRerunError(data.message || 'Monthly token limit reached. Upgrade your plan for more analyses.');
        setRerunLimitHit(true);
        return; // Keep existing ops visible
      }
      if (data.error) { setRerunError(data.error); return; }
      const ops = data.opportunities || [];
      setOpportunities(ops);
      // Update usage meter instantly from the response — no separate fetch needed
      if (data.usage) setUsageData(data.usage);
      // Update localStorage cache so MyOps loads instantly next visit
      try {
        localStorage.setItem('lumivo_ops_cache', JSON.stringify({
          opportunities: ops, cachedAt: Date.now(), profileHash: profileHash(profile)
        }));
      } catch (_) {}
      // Persist to DB
      fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, opportunities: ops }),
      }).catch(() => {});
    } catch(_) {
      setRerunError('Something went wrong. Please try again.');
    } finally {
      setLoadingOps(false);
    }
  }

  // Apply plan limits:
  // Silver  — 1 per category (job/education/migration) regardless of filter
  // Gold    — first 10 total
  // Platinum — all 20
  const allFiltered = dashFilter === 'All'
    ? opportunities
    : opportunities.filter(o => o.type?.toLowerCase() === dashFilter.toLowerCase());

  let visibleOps, lockedOps;
  if (plan.maxOpsPerCat) {
    // Silver: show 1 per category from the full list (not filtered)
    const seen = {};
    const silverVisible = [];
    const silverLocked  = [];
    for (const op of allFiltered) {
      const t = op.type?.toLowerCase() || 'job';
      if ((seen[t] || 0) < plan.maxOpsPerCat) {
        silverVisible.push(op);
        seen[t] = (seen[t] || 0) + 1;
      } else {
        silverLocked.push(op);
      }
    }
    visibleOps = silverVisible;
    lockedOps  = silverLocked;
  } else if (plan.maxOps) {
    // Gold: first 10
    visibleOps = allFiltered.slice(0, plan.maxOps);
    lockedOps  = allFiltered.slice(plan.maxOps);
  } else {
    // Platinum: all
    visibleOps = allFiltered;
    lockedOps  = [];
  }

  return (
    <>
      <div className="dashboard-header">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:'1.5rem'}}>
          <div>
            <h1>✦ MyOps Dashboard</h1>
            <p>Your personalised global opportunities, curated by Lumivo AI</p>
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'.6rem'}}>
            <div style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
              <span style={{fontSize:'.72rem',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--muted)'}}>Plan</span>
              <span style={{fontSize:'.82rem',fontWeight:700,color:plan.color,background:'rgba(255,255,255,0.08)',padding:'.2rem .7rem',borderRadius:'100px',border:`1px solid ${plan.color}44`}}>{plan.label}</span>
              <button onClick={()=>setPage('pricing')} style={{fontSize:'.72rem',color:'var(--gold)',background:'none',border:'none',cursor:'pointer',textDecoration:'underline'}}>Upgrade</button>
            </div>
            {usageData && (
              <div style={{minWidth:'220px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'.3rem'}}>
                  <span style={{fontSize:'.72rem',letterSpacing:'.08em',textTransform:'uppercase',color:'var(--muted)'}}>AI Tokens</span>
                  <span style={{fontSize:'.82rem',fontWeight:700,color:usageData.percentUsed>=90?'var(--rust)':usageData.percentUsed>=70?'#c9893c':'var(--gold)'}}>
                    {usageData.tokensUsed.toLocaleString()} <span style={{fontWeight:400,color:'var(--muted)'}}>/ {usageData.tokenLimit.toLocaleString()}</span>
                  </span>
                </div>
                <div style={{height:'6px',background:'rgba(255,255,255,0.1)',borderRadius:'3px',overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:'3px',width:`${usageData.percentUsed}%`,background:usageData.percentUsed>=90?'var(--rust)':usageData.percentUsed>=70?'#c9893c':'var(--gold)',transition:'width .5s'}}/>
                </div>
                <div style={{fontSize:'.68rem',color:'var(--muted)',marginTop:'.3rem',textAlign:'right'}}>Resets {usageData.resetDate}</div>
              </div>
            )}
          </div>
        </div>
      </div>
      {loadingOps&&<div className="loading-banner"><div className="spinner"/>Claude is analysing your profile and searching the world for opportunities…</div>}
      {rerunError && (
        <div style={{
          background: rerunLimitHit ? 'rgba(184,92,56,.06)' : 'rgba(184,92,56,.08)',
          borderBottom:'1px solid rgba(184,92,56,.25)',
          padding:'1.25rem 2rem',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          gap:'1rem', flexWrap:'wrap'
        }}>
          <div style={{display:'flex',alignItems:'center',gap:'.75rem'}}>
            <span style={{fontSize:'1.25rem'}}>{rerunLimitHit ? '🚫' : '⚠️'}</span>
            <div>
              <div style={{fontSize:'.9rem',fontWeight:700,color:'var(--rust)',marginBottom:'.15rem'}}>
                {rerunLimitHit ? 'Monthly Token Limit Reached' : 'Something went wrong'}
              </div>
              <div style={{fontSize:'.82rem',color:'var(--muted)'}}>{rerunError}</div>
            </div>
          </div>
          {rerunLimitHit && (
            <button className="btn-primary" style={{padding:'.55rem 1.25rem',fontSize:'.85rem',flexShrink:0}}
              onClick={() => setPage('pricing')}>
              ⬆️ Upgrade Plan →
            </button>
          )}
        </div>
      )}
      <div className="dashboard-body">
        <div className="dash-controls">
          {filters.map(f=><button key={f} className={`filter-btn${dashFilter===f?' active':''}`} onClick={()=>setDashFilter(f)}>{f}</button>)}
          {/* Rerun button — only shown for Gold/Platinum */}
          {plan.canRerun && (
            <button
              className="analyze-btn"
              onClick={handleRerun}
              disabled={loadingOps || !profile}
              title={!profile ? 'Complete your profile first' : 'Find fresh opportunities'}
            >
              {loadingOps
                ? <><div className="spinner" style={{width:14,height:14,borderWidth:2}}/>Analysing…</>
                : <>✦ Refresh Opportunities</>
              }
            </button>
          )}
          {/* Silver users see an upgrade nudge instead */}
          {!plan.canRerun && opportunities.length > 0 && (
            <button
              className="analyze-btn"
              onClick={()=>setPage('pricing')}
              style={{background:'rgba(201,168,76,.15)',color:'var(--gold)',border:'1px solid rgba(201,168,76,.3)'}}
            >
              🔒 Upgrade to Rerun
            </button>
          )}
        </div>
        {!loadingOps&&allFiltered.length===0&&(
          <div className="empty-dash">
            <div className="icon">🌐</div>
            <h3>No opportunities yet</h3>
            <p>Complete your profile and click "Find My Opportunities" to let Claude discover tailored results for you.</p>
            <button className="btn-primary" onClick={()=>setPage('profile')}>Go to Profile →</button>
          </div>
        )}
        <div className="ops-grid">
          {visibleOps.map((op,i)=><OpTile key={op.id} op={op} delay={i*60}/>)}
          {lockedOps.map((op,i)=>(
            <div key={op.id} className="op-tile locked-tile" style={{animationDelay:`${(visibleOps.length+i)*60}ms`}}>
              <div className="op-tile-header">
                <span className={`op-category cat-${op.type}`}>{op.type}</span>
                <span className="op-match">{op.matchScore}% match</span>
              </div>
              <div className="op-tile-body">
                <h3 style={{filter:'blur(5px)',userSelect:'none'}}>████████████</h3>
                <div className="op-org" style={{filter:'blur(4px)',userSelect:'none'}}>████████</div>
                <p className="op-desc" style={{filter:'blur(3px)',userSelect:'none'}}>████████████████████████████</p>
              </div>
            </div>
          ))}
        </div>
        {lockedOps.length>0&&(
          <div style={{textAlign:'center',marginTop:'2rem',padding:'2rem',background:'var(--card)',border:'1.5px dashed var(--border)',borderRadius:'12px'}}>
            <div style={{fontSize:'1.5rem',marginBottom:'.5rem'}}>🔒</div>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.1rem',marginBottom:'.4rem'}}>{lockedOps.length} more opportunit{lockedOps.length>1?'ies':'y'} locked</h3>
            <p style={{fontSize:'.85rem',color:'var(--muted)',marginBottom:'1rem'}}>
              {userPlan === 'silver' ? 'Upgrade to Gold to unlock 10 opportunities, or Platinum for all 20.' : 'Upgrade to Platinum to unlock all 20 opportunities.'}
            </p>
            <button className="btn-primary" onClick={()=>setPage('pricing')}>View Plans →</button>
          </div>
        )}
      </div>
    </>
  );
}

function OpTile({ op, delay }) {
  const catClass={job:'cat-job',education:'cat-education',migration:'cat-migration'}[op.type]||'cat-job';
  const catLabel={job:'💼 Job',education:'🎓 Education',migration:'✈️ Migration'}[op.type]||op.type;
  return (
    <div className="op-tile" style={{animationDelay:`${delay}ms`}}>
      <div className="op-tile-header">
        <span className={`op-category ${catClass}`}>{catLabel}</span>
        <span className="op-match">{op.matchScore}% match</span>
      </div>
      <div className="op-tile-body">
        <h3>{op.title}</h3>
        <div className="op-org">{op.org}</div>
        <p className="op-desc">{op.description}</p>
        <div className="op-meta">
          <span className="op-chip">🌍 {op.country}</span>
          {(op.requirements||[]).slice(0,2).map((r,i)=><span className="op-chip" key={i}>{r}</span>)}
        </div>
      </div>
      <div className="op-tile-footer">
        <span className="op-deadline">📅 {op.deadline}</span>
        {op.url
          ? <a className="op-action" href={op.url} target="_blank" rel="noopener noreferrer">Apply Now ↗</a>
          : <span className="op-action" style={{opacity:.4,cursor:'default'}}>No link</span>
        }
      </div>
    </div>
  );
}

// ─── PRICING PAGE ─────────────────────────────────────────────────────────────
function PricingPage({ setModal, user, navigateTo }) {
  const plans = [
    {
      id: 'silver',
      icon: '🥈',
      name: 'Silver',
      price: 'Free',
      priceSub: '',
      desc: 'Get a taste — see 1 opportunity per category from your AI analysis.',
      color: '#9ca3af',
      cta: 'Get Started',
      ctaStyle: 'outline',
      features: [
        { text: '1 opportunity per category (3 total from 20 generated)', on: true },
        { text: 'Profile builder', on: true },
        { text: 'Blog & News access', on: true },
        { text: 'Re-run AI analysis', on: false },
        { text: '10+ opportunity results', on: false },
        { text: 'Token allowance', on: false },
      ],
    },
    {
      id: 'gold',
      icon: '🥇',
      name: 'Gold',
      price: '$9',
      priceSub: '/ month',
      desc: 'Unlock 10 top-matched opportunities and re-run your analysis monthly.',
      color: '#c9a84c',
      cta: 'Upgrade to Gold',
      ctaStyle: 'primary',
      featured: true,
      features: [
        { text: '10 opportunities across Job, Education & Migration', on: true },
        { text: 'Profile builder', on: true },
        { text: 'Blog & News access', on: true },
        { text: 'Re-run AI analysis anytime', on: true },
        { text: '2,000 tokens / month', on: true },
        { text: 'Priority support', on: false },
      ],
    },
    {
      id: 'platinum',
      icon: '💎',
      name: 'Platinum',
      price: '$19',
      priceSub: '/ month',
      desc: 'All 20 opportunities, maximum tokens, and priority support.',
      color: '#7dd3fc',
      cta: 'Upgrade to Platinum',
      ctaStyle: 'dark',
      features: [
        { text: 'All 20 opportunities across Job, Education & Migration', on: true },
        { text: 'Profile builder', on: true },
        { text: 'Blog & News access', on: true },
        { text: 'Re-run AI analysis anytime', on: true },
        { text: '20,000 tokens / month', on: true },
        { text: 'Priority support', on: true },
      ],
    },
  ];

  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [stripeMsg, setStripeMsg] = useState(null);

  // Show success/cancel message from Stripe redirect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const stripeResult = params.get('stripe');
      if (stripeResult === 'success') {
        setStripeMsg({ type: 'success', text: '🎉 Payment successful! Your plan has been upgraded.' });
        // Clean the URL and navigate to pricing page
        window.history.replaceState({}, '', '/');
        navigateTo('pricing');
      }
      if (stripeResult === 'canceled') {
        setStripeMsg({ type: 'error', text: 'Payment cancelled. You have not been charged.' });
        window.history.replaceState({}, '', '/');
        navigateTo('pricing');
      }
      if (stripeResult === 'portal') {
        window.history.replaceState({}, '', '/');
        navigateTo('pricing');
      }
    }
  }, []);

  async function handleCta(plan) {
    if (!user) { setModal('signup'); return; }
    if (plan.id === 'silver') { navigateTo('profile'); return; }
    setCheckoutLoading(plan.id);
    setStripeMsg(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.id, userId: user.id, userEmail: user.email }),
      });
      const data = await res.json();
      if (data.error) { setStripeMsg({ type: 'error', text: data.error }); return; }
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (_) {
      setStripeMsg({ type: 'error', text: 'Could not connect to payment service. Please try again.' });
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handleManageBilling() {
    if (!user) return;
    setCheckoutLoading('portal');
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.error) { setStripeMsg({ type: 'error', text: data.error }); return; }
      window.location.href = data.url;
    } catch (_) {
      setStripeMsg({ type: 'error', text: 'Could not open billing portal.' });
    } finally {
      setCheckoutLoading(null);
    }
  }

  const currentPlan = user?.plan || 'silver';

  return (
    <div className="pricing-page">
      <div className="pricing-hero">
        <h1>Simple, Transparent Pricing</h1>
        <p>Choose the plan that matches your ambition. Upgrade or downgrade anytime.</p>
      </div>
      {stripeMsg && (
        <div style={{
          padding:'.9rem 1.2rem',borderRadius:'8px',marginBottom:'1.5rem',
          background: stripeMsg.type==='success' ? 'rgba(45,90,61,.12)' : 'rgba(184,92,56,.12)',
          border: `1px solid ${stripeMsg.type==='success' ? 'var(--forest)' : 'var(--rust)'}`,
          color: stripeMsg.type==='success' ? 'var(--forest)' : 'var(--rust)',
          fontSize:'.9rem', textAlign:'center'
        }}>
          {stripeMsg.text}
        </div>
      )}
      {user && currentPlan !== 'silver' && (
        <div style={{textAlign:'center',marginBottom:'1.5rem'}}>
          <button
            onClick={handleManageBilling}
            disabled={checkoutLoading==='portal'}
            style={{background:'none',border:'1px solid var(--border)',borderRadius:'6px',padding:'.5rem 1.2rem',fontSize:'.82rem',cursor:'pointer',color:'var(--muted)'}}
          >
            {checkoutLoading==='portal' ? 'Opening…' : '⚙️ Manage Billing & Cancel'}
          </button>
        </div>
      )}
      <div className="pricing-grid">
        {plans.map(plan => (
          <div key={plan.id} className={`pricing-card${plan.featured?' featured':''}`}>
            {plan.featured && <div className="pricing-badge">Most Popular</div>}
            <div className="plan-icon">{plan.icon}</div>
            <div className="plan-name" style={{color:plan.color}}>
              {plan.name}
              {currentPlan===plan.id&&<span className="current-plan-badge">Current</span>}
            </div>
            <div className="plan-price">
              {plan.price}<span>{plan.priceSub}</span>
            </div>
            <p className="plan-desc">{plan.desc}</p>
            <div className="plan-divider"/>
            <ul className="plan-features">
              {plan.features.map((f,i)=>(
                <li key={i} className={!f.on?'dimmed':''}>
                  <span className={f.on?'check':'cross'}>{f.on?'✓':'✕'}</span>
                  {f.text}
                </li>
              ))}
            </ul>
            <button
              className={`plan-cta ${plan.ctaStyle}`}
              onClick={()=>handleCta(plan)}
              disabled={currentPlan===plan.id||checkoutLoading===plan.id}
              style={(currentPlan===plan.id||checkoutLoading===plan.id)?{opacity:.6,cursor:'not-allowed'}:{}}
            >
              {checkoutLoading===plan.id ? 'Redirecting…' : currentPlan===plan.id ? 'Current Plan' : plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

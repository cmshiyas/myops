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

  // Restore session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, name: session.user.user_metadata?.full_name || session.user.email.split('@')[0], email: session.user.email });
        loadProfile(session.user.id);
      }
    });
  }, []);

  async function loadProfile(userId) {
    try {
      const res = await fetch(`/api/profile?userId=${userId}`);
      const data = await res.json();
      if (data.profile) {
        // Ensure array fields are always arrays, never null
        const p = data.profile;
        setProfile({
          ...p,
          skills:    Array.isArray(p.skills)    ? p.skills    : [],
          interests: Array.isArray(p.interests) ? p.interests : [],
          languages: Array.isArray(p.languages) ? p.languages : [],
        });
      }
    } catch (_) {}
  }

  async function handleAuth(type) {
    setAuthLoading(true);
    setAuthMsg(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: type, email: authForm.email, password: authForm.password, name: authForm.name }),
      });
      const data = await res.json();
      if (data.error) { setAuthMsg({ type: 'error', text: data.error }); return; }
      const u = data.user;
      setUser({ id: u.id, name: u.user_metadata?.full_name || authForm.name || authForm.email.split('@')[0], email: u.email });
      setModal(null);
      setPage('profile');
      if (u.id) loadProfile(u.id);
    } catch (_) {
      setAuthMsg({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null); setProfile(null); setOpportunities([]); setPage('home');
  }

  const navLinks = ['Home', 'Blog', 'News', ...(user ? ['Profile', 'MyOps'] : [])];

  return (
    <div className="app">
      <GlobalStyles />
      <nav className="nav">
        <div className="nav-logo" onClick={() => setPage('home')}>Opport<span>unity</span></div>
        <div className="nav-links">
          {navLinks.map(l => (
            <button key={l} className={`nav-link${page === l.toLowerCase() ? ' active' : ''}`} onClick={() => setPage(l.toLowerCase())}>{l}</button>
          ))}
          {user
            ? <button className="nav-link" style={{ color: '#c9a84c' }} onClick={handleLogout}>Log out</button>
            : <button className="nav-cta" onClick={() => { setModal('signup'); setAuthMsg(null); }}>Sign Up</button>
          }
        </div>
      </nav>

      <div className="page" key={page}>
        {page === 'home' && <HomePage setPage={setPage} setModal={setModal} user={user} />}
        {page === 'blog' && <BlogPage />}
        {page === 'news' && <NewsPage />}
        {page === 'profile' && user && <ProfilePage user={user} profile={profile} setProfile={setProfile} setPage={setPage} setOpportunities={setOpportunities} setLoadingOps={setLoadingOps} />}
        {page === 'myops' && user && <DashboardPage opportunities={opportunities} loadingOps={loadingOps} dashFilter={dashFilter} setDashFilter={setDashFilter} profile={profile} setOpportunities={setOpportunities} setLoadingOps={setLoadingOps} setPage={setPage} />}
      </div>

      <footer className="footer">© 2026 <span>OpportunityFinder</span> — Powered by Claude AI · Connecting talent to the world</footer>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <button className="modal-close" onClick={() => setModal(null)}>×</button>
            <h2>{modal === 'signup' ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="modal-sub">{modal === 'signup' ? 'Join thousands discovering global opportunities.' : 'Sign in to access your dashboard.'}</p>
            {authMsg && <div className={`alert alert-${authMsg.type}`}>{authMsg.text}</div>}
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
        <p className="hero-eyebrow">✦ AI-Powered Global Opportunity Discovery</p>
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
  return (
    <div className="section">
      <h2 className="section-title">Blog</h2>
      <p className="section-sub">Insights on global careers, education, and migration.</p>
      <div className="blog-grid">
        {BLOG_POSTS.map(p => (
          <div className="blog-card" key={p.id}>
            <div className="blog-img" style={{ background: p.bg }}>{p.emoji}</div>
            <div className="blog-body">
              <div className="blog-tag">{p.tag}</div>
              <h3>{p.title}</h3>
              <p>{p.excerpt}</p>
              <div className="blog-meta">{p.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NEWS ─────────────────────────────────────────────────────────────────────
function NewsPage() {
  return (
    <div className="section">
      <h2 className="section-title">Latest News</h2>
      <p className="section-sub">Breaking updates in global mobility, jobs, and education.</p>
      <div className="news-list">
        {NEWS_ITEMS.map(n => (
          <div className="news-item" key={n.id}>
            <span className="news-badge">{n.badge}</span>
            <div className="news-content"><h4>{n.title}</h4><p>{n.desc}</p><div className="news-date">{n.date}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
function ProfilePage({ user, profile, setProfile, setPage, setOpportunities, setLoadingOps }) {
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

  // Sync form when profile loads from DB after component already mounted (e.g. after re-login)
  useEffect(() => {
    if (profile) setForm(normalise(profile));
  }, [profile]);

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
      setProfile(form); setSaved(true); setTimeout(()=>setSaved(false),3000);
    } catch(_) { setSaveErr('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  }

  async function handleAnalyze() {
    await handleSave();
    setPage('myops');
    setLoadingOps(true);
    setOpportunities([]);
    const profileSummary = `Location: ${form.city}, ${form.country}\nAge: ${form.age}\nEducation: ${form.education} in ${form.field}\nExperience: ${form.experience} years\nSkills: ${form.skills.join(', ')}\nInterests: ${form.interests.join(', ')}\nLanguages: ${form.languages.join(', ')}\nBio: ${form.bio}`;
    try {
      const res = await fetch('/api/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ profileSummary }) });
      const data = await res.json();
      setOpportunities(data.opportunities || FALLBACK_OPS);
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
          {pct>=50&&<button className="btn-primary" style={{width:'100%',marginTop:'1.25rem',fontSize:'.82rem'}} onClick={handleAnalyze}>✦ Analyse & Find Opportunities</button>}
        </div>
      </div>
      <div className="profile-form">
        <h2>Your Profile</h2>
        {saved&&<div className="alert alert-success">Profile saved successfully!</div>}
        {saveErr&&<div className="alert alert-error">{saveErr}</div>}
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

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage({ opportunities, loadingOps, dashFilter, setDashFilter, profile, setOpportunities, setLoadingOps, setPage }) {
  const filters = ['All','Job','Education','Migration'];
  const displayed = dashFilter==='All' ? opportunities : opportunities.filter(o=>o.type?.toLowerCase()===dashFilter.toLowerCase());

  return (
    <>
      <div className="dashboard-header">
        <h1>✦ MyOps Dashboard</h1>
        <p>Your personalised global opportunities, curated by Claude AI</p>
      </div>
      {loadingOps&&<div className="loading-banner"><div className="spinner"/>Claude is analysing your profile and searching the world for opportunities…</div>}
      <div className="dashboard-body">
        <div className="dash-controls">
          {filters.map(f=><button key={f} className={`filter-btn${dashFilter===f?' active':''}`} onClick={()=>setDashFilter(f)}>{f}</button>)}
        </div>
        {!loadingOps&&displayed.length===0&&(
          <div className="empty-dash">
            <div className="icon">🌐</div>
            <h3>No opportunities yet</h3>
            <p>Complete your profile and click "Find My Opportunities" to let Claude discover tailored results for you.</p>
            <button className="btn-primary" onClick={()=>setPage('profile')}>Go to Profile →</button>
          </div>
        )}
        <div className="ops-grid">
          {displayed.map((op,i)=><OpTile key={op.id} op={op} delay={i*60}/>)}
        </div>
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

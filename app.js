/* ════════════════════════════════════
   COUNTRIES
════════════════════════════════════ */
const COUNTRIES=["Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Belgium","Bolivia","Brazil","Bulgaria","Cambodia","Canada","Chile","China","Colombia","Croatia","Cuba","Czech Republic","Denmark","Ecuador","Egypt","Estonia","Ethiopia","Finland","France","Germany","Ghana","Greece","Guatemala","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kuwait","Latvia","Lebanon","Lithuania","Luxembourg","Malaysia","Mexico","Moldova","Morocco","Myanmar","Netherlands","New Zealand","Nigeria","Norway","Oman","Pakistan","Panama","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia","Singapore","Slovakia","South Africa","South Korea","Spain","Sri Lanka","Sweden","Switzerland","Taiwan","Tanzania","Thailand","Turkey","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"];

function populateCountries(){
  ['analyze-country','li-country','cl-country','ats-country'].forEach(id=>{
    const sel=document.getElementById(id);if(!sel)return;
    COUNTRIES.forEach(c=>{
      const opt=document.createElement('option');opt.value=c;opt.textContent=c;
      if(c==='United States')opt.selected=true;sel.appendChild(opt);
    });
  });
}
populateCountries();

/* ════════════════════════════════════
   ROUTE INITIALIZATION
════════════════════════════════════ */
function initRoutes(){
  const path=window.location.pathname;
  console.log('Page path:', path);
  if(path.includes('/pricing')||path==='/pricing'){
    console.log('Routing to pricing page');
    setTimeout(()=>{go('pricing',null,'careerliftai.com/pricing');},150);
    return 'pricing';
  }
  return 'landing';
}

// Initialize routes on page load
window.addEventListener('DOMContentLoaded', function(){ 
  initRoutes();
  initGoogleSignIn(); 
  restoreSession(); 
});

/* ════════════════════════════════════
   NAVIGATION
════════════════════════════════════ */
const screens=['landing','dashboard','analyze','linkedin','coverletter','atsscore','templates','pricing'];
function go(id,tabEl,url){
  screens.forEach(s=>{const el=document.getElementById('sc-'+s);if(el)el.classList.toggle('on',s===id);});
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  if(tabEl)tabEl.classList.add('on');
  else document.querySelectorAll('.tab').forEach(t=>{if((t.getAttribute('onclick')||'').includes("'"+id+"'"))t.classList.add('on');});
  // sync sidebar links
  document.querySelectorAll('.sb-link').forEach(l=>l.classList.remove('on'));
  document.querySelectorAll('.sb-link').forEach(l=>{if((l.getAttribute('onclick')||'').includes("'"+id+"'"))l.classList.add('on');});
  // sync global nav active state
  document.querySelectorAll('.nav-links a').forEach(a=>a.classList.remove('active'));
  document.querySelectorAll('.nav-links a[data-screen="'+id+'"]').forEach(a=>a.classList.add('active'));
  // scroll to top on page change
  window.scrollTo(0,0);
}

/* ════════════════════════════════════
   MOBILE NAV
════════════════════════════════════ */
function toggleMobileNav(){
  const nav=document.getElementById('mobile-nav');
  const btn=document.getElementById('nav-hamburger');
  if(!nav)return;
  const isOpen=nav.classList.toggle('open');
  if(btn)btn.classList.toggle('open',isOpen);
  // Sync active links in mobile nav
  const currentScreen=screens.find(s=>{const el=document.getElementById('sc-'+s);return el&&el.classList.contains('on');})||'landing';
  document.querySelectorAll('.mobile-nav a[data-screen]').forEach(a=>{
    a.classList.toggle('active',a.dataset.screen===currentScreen);
  });
}
function closeMobileNav(){
  const nav=document.getElementById('mobile-nav');
  const btn=document.getElementById('nav-hamburger');
  if(nav)nav.classList.remove('open');
  if(btn)btn.classList.remove('open');
}
function mobileGo(id,url){
  closeMobileNav();
  go(id,null,url);
}
// Close mobile nav when clicking outside
document.addEventListener('click',function(e){
  const nav=document.getElementById('mobile-nav');
  const btn=document.getElementById('nav-hamburger');
  if(nav&&nav.classList.contains('open')&&!nav.contains(e.target)&&btn&&!btn.contains(e.target)){
    closeMobileNav();
  }
});

/* ════════════════════════════════════
   MODALS
════════════════════════════════════ */
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}
function switchModal(from,to){closeModal(from);openModal(to);}
function toggleFaq(el){el.closest('.faq-item').classList.toggle('open');}

function googleAuth(){
  if(!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'){
    showToast('Google sign-in is not configured.');
    return;
  }
  if(!window.google || !google.accounts){
    showToast('Google library loading... Please try again.');
    setTimeout(googleAuth, 500);
    return;
  }
  try{
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredentialResponse,
      auto_select: false
    });
    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback: render a hidden button and click it to force popup
        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);
        google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          click_listener: () => {}
        });
        const btn = container.querySelector('div[role=button]') || container.querySelector('iframe');
        if(btn) btn.click();
        setTimeout(() => container.remove(), 1000);
      }
    });
  }catch(e){
    console.error('Google Auth error:', e);
    showToast('Google sign-in error. Try email signup.');
  }
}

async function doLogin(){
  const e=document.getElementById('login-email').value.trim().toLowerCase();
  const p=document.getElementById('login-pass').value;
  if(!e||!p){showToast('Please enter your email and password.');return;}
  const account=findAccount(e);
  if(!account){showToast('No account found for this email. Please sign up first.');return;}
  // Support both hashed and legacy plain-text passwords
  const hashed=await hashPassword(p);
  if(account.password!==hashed&&account.password!==p){showToast('Incorrect password. Please try again.');return;}
  // Upgrade plain-text password to hashed on successful login
  if(account.password===p&&p!==''){account.password=hashed;const accounts=loadAccounts().map(a=>a.email===e?account:a);saveAccounts(accounts);}
  setCurrentAccount(account.email);
  closeModal('login-modal');
  showLoader();
  setTimeout(function(){go('dashboard',null,'careerliftai.com/dashboard');hideLoader();showToast('Welcome back, '+account.name.split(' ')[0]+'! ✓');},900);
}

function clearFieldError(id){const el=document.getElementById(id);if(el)el.textContent='';}
function showFieldError(id,msg){const el=document.getElementById(id);if(el){el.textContent=msg;el.scrollIntoView({behavior:'smooth',block:'nearest'});}}

async function doSignup(){
  const n=document.getElementById('signup-name').value.trim();
  const e=document.getElementById('signup-email').value.trim().toLowerCase();
  const p=document.getElementById('signup-pass').value;
  clearFieldError('signup-email-error');
  clearFieldError('signup-pass-error');
  if(!n||!e||!p){showToast('Please fill in all fields.');return;}
  if(p.length<8){
    showFieldError('signup-pass-error','Password must be at least 8 characters.');
    return;
  }
  if(findAccount(e)){
    showFieldError('signup-email-error','This email is already registered. Please log in instead.');
    // Shake the email input
    const emailInput=document.getElementById('signup-email');
    if(emailInput){emailInput.style.borderColor='#DC2626';emailInput.style.animation='shake .3s ease';setTimeout(()=>{emailInput.style.animation='';emailInput.style.borderColor='';},500);}
    return;
  }

  // Hash password before storing
  const hashed=await hashPassword(p);
  localStorage.setItem('signup_temp_name',n);
  localStorage.setItem('signup_temp_email',e);
  localStorage.setItem('signup_temp_password',hashed);

  // Generate OTP and send email
  const otp=Math.floor(100000+Math.random()*900000).toString();
  localStorage.setItem('signup_otp_code',otp);
  localStorage.setItem('signup_otp_time',Date.now().toString());
  localStorage.setItem('signup_otp_email',e);

  // Send OTP via Resend
  showToast('Sending verification email...');
  sendOTPEmail(e,otp);

  // Switch to OTP verification modal
  closeModal('signup-modal');
  document.getElementById('otp-email-display').textContent=e;
  openModal('otp-verification-modal');
}

async function sendOTPEmail(email,otp){
  try{
    const response=await fetch('https://fusxcijaklbrfkszlzsv.supabase.co/functions/v1/send-otp',{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body:JSON.stringify({email:email,otp:otp})
    });
    if(response.ok){
      showToast('Verification email sent ✓');
    }else{
      showToast('Failed to send email. Please try again.');
      console.error('Send OTP failed',await response.text());
    }
  }catch(err){
    console.error('Error sending OTP:',err);
    showToast('Error sending verification email.');
  }
}

function verifyOTP(){
  const inputCode=document.getElementById('otp-input').value.trim();
  const storedOtp=localStorage.getItem('signup_otp_code');
  const otpTime=parseInt(localStorage.getItem('signup_otp_time')||'0');
  const timeout=10*60*1000; // 10 minutes
  
  if(!inputCode){showToast('Please enter the verification code.');return;}
  if(!storedOtp){showToast('No OTP found. Please sign up again.');return;}
  if(Date.now()-otpTime>timeout){
    showToast('Code expired. Please sign up again and request a new code.');
    localStorage.removeItem('signup_otp_code');
    localStorage.removeItem('signup_otp_time');
    closeModal('otp-verification-modal');
    openModal('signup-modal');
    return;
  }
  
  if(inputCode===storedOtp){
    // Create account
    const name=localStorage.getItem('signup_temp_name');
    const email=localStorage.getItem('signup_temp_email');
    const password=localStorage.getItem('signup_temp_password');
    
    const accounts=loadAccounts();
    const newAccount={name,email,password,credits:FREE_CREDITS,history:[]};
    accounts.push(newAccount);
    saveAccounts(accounts);
    
    // Clean up temp data
    localStorage.removeItem('signup_temp_name');
    localStorage.removeItem('signup_temp_email');
    localStorage.removeItem('signup_temp_password');
    localStorage.removeItem('signup_otp_code');
    localStorage.removeItem('signup_otp_time');
    localStorage.removeItem('signup_otp_email');
    
    // Log in and redirect
    setCurrentAccount(email);
    closeModal('otp-verification-modal');
    showLoader();
    setTimeout(function(){go('dashboard',null,'careerliftai.com/dashboard');hideLoader();showToast('✓ Email verified! Account created. Welcome to CareerLift AI!');},900);
  }else{
    showToast('Invalid code. Please try again.');
    document.getElementById('otp-input').value='';
  }
}

function resendOTP(){
  const email=localStorage.getItem('signup_otp_email');
  if(!email){showToast('Email not found. Please sign up again.');return;}
  
  const newOtp=Math.floor(100000+Math.random()*900000).toString();
  localStorage.setItem('signup_otp_code',newOtp);
  localStorage.setItem('signup_otp_time',Date.now().toString());
  
  showToast('Sending new code...');
  sendOTPEmail(email,newOtp);
  document.getElementById('otp-input').value='';
}

function goBackToSignup(){
  closeModal('otp-verification-modal');
  openModal('signup-modal');
  document.getElementById('otp-input').value='';
}

function openForgotModal(){
  const email=document.getElementById('login-email').value.trim();
  if(email)document.getElementById('forgot-email-input').value=email;
  closeModal('login-modal');
  resetForgotFlow();
  openModal('forgot-modal');
}
function resetForgotFlow(){
  document.getElementById('forgot-step-1').style.display='block';
  document.getElementById('forgot-step-2').style.display='none';
  document.getElementById('forgot-tagline').textContent='Enter your email to reset your password';
  document.getElementById('forgot-otp-input').value='';
  document.getElementById('forgot-new-pass').value='';
}
function sendForgotOTP(){
  const e=document.getElementById('forgot-email-input').value.trim().toLowerCase();
  if(!e){showToast('Please enter your email address.');return;}
  const account=findAccount(e);
  if(!account){showToast('No account found with this email.');return;}
  const otp=Math.floor(100000+Math.random()*900000).toString();
  localStorage.setItem('forgot_otp_email',e);
  localStorage.setItem('forgot_otp_code',otp);
  localStorage.setItem('forgot_otp_time',Date.now().toString());
  sendOTPEmail(e,otp);
  showToast('Reset code sent to your email.');
  document.getElementById('forgot-email-display').textContent=e;
  document.getElementById('forgot-step-1').style.display='none';
  document.getElementById('forgot-step-2').style.display='block';
  document.getElementById('forgot-tagline').textContent='Enter the code we sent you';
}
async function confirmForgotReset(){
  const code=document.getElementById('forgot-otp-input').value.trim();
  const newPass=document.getElementById('forgot-new-pass').value;
  const storedCode=localStorage.getItem('forgot_otp_code');
  const storedTime=parseInt(localStorage.getItem('forgot_otp_time')||'0');
  const email=localStorage.getItem('forgot_otp_email');
  if(!code){showToast('Please enter the reset code.');return;}
  if(!newPass||newPass.length<8){showToast('Password must be at least 8 characters.');return;}
  if(Date.now()-storedTime>10*60*1000){showToast('Code expired. Please request a new one.');resetForgotFlow();return;}
  if(code!==storedCode){showToast('Invalid code. Please try again.');return;}
  const account=findAccount(email);
  if(!account){showToast('Account not found.');return;}
  account.password=await hashPassword(newPass);
  const accounts=loadAccounts().map(a=>a.email===email?account:a);
  saveAccounts(accounts);
  localStorage.removeItem('forgot_otp_code');
  localStorage.removeItem('forgot_otp_time');
  localStorage.removeItem('forgot_otp_email');
  closeModal('forgot-modal');
  openModal('login-modal');
  showToast('✓ Password reset! Please log in with your new password.');
}

/* ════════════════════════════════════
   PASSWORD HASHING (Web Crypto API)
════════════════════════════════════ */
async function hashPassword(raw){
  if(!raw)return'';
  const msgBuffer=new TextEncoder().encode(raw+'_cl2024_salt');
  const hashBuffer=await crypto.subtle.digest('SHA-256',msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

let currentAccount=null;
const ACCOUNT_STORAGE_KEY='cl_accounts';
const ACTIVE_USER_KEY='cl_active_user';
const GOOGLE_CLIENT_ID='119140138936-3g0d47584ih5qghfo05dg4ngcuphapqh.apps.googleusercontent.com';

function loadAccounts(){try{return JSON.parse(localStorage.getItem(ACCOUNT_STORAGE_KEY)||'[]');}catch(e){return[];}}
function saveAccounts(accounts){localStorage.setItem(ACCOUNT_STORAGE_KEY,JSON.stringify(accounts));}
function findAccount(email){return loadAccounts().find(a=>a.email===String(email).toLowerCase());}
function setCurrentAccount(email){const account=findAccount(email);if(!account)return;localStorage.setItem(ACTIVE_USER_KEY,account.email);currentAccount=account;setUser(account.name);_credits=typeof account.credits==='number'?account.credits:FREE_CREDITS;localStorage.setItem('cl_credits',_credits);if(Array.isArray(account.history)&&account.history.length){saveHistoryStore(account.history);}refreshCreditUI();}
function syncCurrentAccount(){if(!currentAccount)return;currentAccount.credits=_credits;currentAccount.history=loadHistory();const accounts=loadAccounts().map(a=>a.email===currentAccount.email?currentAccount:a);saveAccounts(accounts);}
function restoreSession(){const email=localStorage.getItem(ACTIVE_USER_KEY);if(!email)return;const account=findAccount(email);if(!account)return;currentAccount=account;_credits=typeof account.credits==='number'?account.credits:FREE_CREDITS;localStorage.setItem('cl_credits',_credits);if(Array.isArray(account.history)&&account.history.length){saveHistoryStore(account.history);}setUser(account.name);refreshCreditUI();go('dashboard',null,'careerliftai.com/dashboard');}
function initGoogleSignIn(){
  const tryInit=()=>{
    if(!window.google||!google.accounts||!google.accounts.id){setTimeout(tryInit,300);return;}
    if(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'){
      try{google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID, callback:handleGoogleCredentialResponse, ux_mode:'popup'});}catch(e){console.warn('Google init:',e);}
    }
  };
  tryInit();
}
function showLoader(){var el=document.getElementById('auth-loader');if(el)el.classList.add('show');}
function hideLoader(){var el=document.getElementById('auth-loader');if(el)el.classList.remove('show');}
function decodeJwt(token){try{return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));}catch(e){return null;}}
function handleGoogleCredentialResponse(response){const payload=decodeJwt(response.credential);if(!payload||!payload.email){showToast('Google sign in failed.');return;}const email=payload.email.toLowerCase();const name=payload.name||email.split('@')[0].replace(/\./g,' ').replace(/\b\w/g,c=>c.toUpperCase());let account=findAccount(email);if(!account){const accounts=loadAccounts();account={name,email,password:'',credits:FREE_CREDITS,history:[]};accounts.push(account);saveAccounts(accounts);}setCurrentAccount(email);closeModal('login-modal');closeModal('signup-modal');showLoader();setTimeout(function(){go('dashboard',null,'careerliftai.com/dashboard');hideLoader();showToast('Signed in with Google ✓');},900);}

function setUser(name){
  const initials=name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
  const el=document.getElementById('dash-av');if(el)el.textContent=initials;
  const nm=document.getElementById('dash-nm');if(nm)nm.textContent=name;
  const wl=document.getElementById('dash-welcome');if(wl)wl.textContent='Welcome back, '+name.split(' ')[0]+'!';
  // Desktop nav: show user state
  const guest=document.getElementById('nav-right-guest');
  const user=document.getElementById('nav-right-user');
  const navNm=document.getElementById('nav-user-name');
  if(guest)guest.style.display='none';
  if(user)user.style.display='flex';
  if(navNm)navNm.textContent=name.split(' ')[0];
  // Mobile nav: show user state
  const mGuest=document.getElementById('mobile-nav-guest');
  const mUser=document.getElementById('mobile-nav-user');
  const mNm=document.getElementById('mobile-nav-username');
  if(mGuest)mGuest.style.display='none';
  if(mUser)mUser.style.display='flex';
  if(mNm)mNm.textContent='Hi, '+name.split(' ')[0];
  updateDashboardMetrics();
}

function logout(){
  syncCurrentAccount();
  localStorage.removeItem(ACTIVE_USER_KEY);
  currentAccount=null;
  _credits=FREE_CREDITS;
  localStorage.setItem('cl_credits',FREE_CREDITS);
  // Desktop nav: reset to guest state
  const guest=document.getElementById('nav-right-guest');
  const user=document.getElementById('nav-right-user');
  if(guest)guest.style.display='flex';
  if(user)user.style.display='none';
  // Mobile nav: reset to guest state
  const mGuest=document.getElementById('mobile-nav-guest');
  const mUser=document.getElementById('mobile-nav-user');
  if(mGuest)mGuest.style.display='flex';
  if(mUser)mUser.style.display='none';
  closeMobileNav();
  refreshCreditUI();
  go('landing',null,'careerliftai.com');
  showToast('Logged out successfully.');
}

document.querySelectorAll('.modal-overlay').forEach(o=>{
  o.addEventListener('click',function(e){if(e.target===this)this.classList.remove('open');});
});

/* ════════════════════════════════════
   TOAST
════════════════════════════════════ */
function showToast(msg,duration=2800){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),duration);
}

async function callClaude(systemPrompt, userMessage){
  const resp=await fetch('https://fusxcijaklbrfkszlzsv.supabase.co/functions/v1/ai-proxy',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'Authorization':'Bearer sb_publishable_jwwBwa_k4Rdzz8WTP6B97A_Zo3qBq3n'
    },
    body:JSON.stringify({systemPrompt,userMessage})
  });
  if(!resp.ok){
    const errText=await resp.text().catch(()=>'Unknown error');
    console.error('API Error:',resp.status,errText);
    throw new Error('API Error '+resp.status+': Check console & verify OPENAI_API_KEY in Supabase Secrets');
  }
  const data=await resp.json();
  if(data.error)throw new Error(data.error);
  return data.text;
}

/* ════════════════════════════════════
   ANALYZE CV — REAL AI
════════════════════════════════════ */
async function runAnalysis(){
  // Credit gate check
  if(!checkCreditGate('analyze'))return;

  const cvText=document.getElementById('analyze-cv-text').value.trim();
  const jobTitle=document.getElementById('analyze-jobtitle').value||'this role';
  const country=document.getElementById('analyze-country').value||'United States';
  const industry=document.getElementById('analyze-industry').value||'Technology';
  const jd=document.getElementById('analyze-jd').value||'';

  if(!cvText){showToast('Please paste your CV text in the text area below the upload zone.');return;}

  const btn=document.getElementById('analyze-btn');
  btn.disabled=true;btn.textContent='Analyzing…';
  document.getElementById('analyze-results').style.display='none';
  document.getElementById('analyze-loading').style.display='flex';

  const steps=['Reading your CV content','Scoring against ATS criteria','Identifying keyword gaps','Rewriting for maximum impact','Finalizing optimized version'];
  let si=0;
  const stepInterval=setInterval(()=>{
    const el=document.getElementById('analyze-step');
    if(el&&si<steps.length)el.textContent=steps[si++];
  },1800);

  try{
    const systemPrompt=`You are an expert ATS CV optimizer. Analyze the user's CV and return ONLY valid JSON with this exact structure:
{
  "scoreBefore": <integer 20-60>,
  "scoreAfter": <integer 70-95>,
  "keywords": {"before": <int>,"after": <int>},
  "format": {"before": <int>,"after": <int>},
  "completeness": {"before": <int>,"after": <int>},
  "readability": {"before": <int>,"after": <int>},
  "keywordsAdded": [<array of 6-10 keyword strings>],
  "optimizedCV": "<full rewritten CV text optimized for ATS, with strong action verbs, quantified achievements, proper sections>",
  "notes": "<3-4 bullet points starting with · explaining key changes made>"
}
All percentage values are integers 0-100. The optimizedCV must be a complete, professional CV rewrite targeting ${jobTitle} in ${country} in the ${industry} industry. Return ONLY the JSON, no markdown, no backticks.`;

    const userMsg=`Target Role: ${jobTitle}\nTarget Country: ${country}\nIndustry: ${industry}\nJob Description: ${jd||'Not provided'}\n\nCV Content:\n${cvText}`;

    const raw=await callClaude(systemPrompt,userMsg);
    clearInterval(stepInterval);
    document.getElementById('analyze-loading').style.display='none';

    let parsed;
    try{
      const clean=raw.replace(/```json|```/g,'').trim();
      parsed=JSON.parse(clean);
    }catch(e){throw new Error('Could not parse AI response. Try again.');}

    // Fill scores
    document.getElementById('score-before').textContent=parsed.scoreBefore;
    document.getElementById('score-after').textContent=parsed.scoreAfter;
    const diff=parsed.scoreAfter-parsed.scoreBefore;
    document.getElementById('score-arrow').textContent=`→ +${diff} pts`;

    // Bars
    setBar('kw',parsed.keywords);
    setBar('fmt',parsed.format);
    setBar('comp',parsed.completeness);
    setBar('read',parsed.readability);

    // CV panels
    document.getElementById('original-cv-display').textContent=cvText.substring(0,800)+(cvText.length>800?'…':'');
    document.getElementById('optimized-cv-display').textContent=parsed.optimizedCV;

    // Keywords
    const chipRow=document.getElementById('keywords-added');
    chipRow.innerHTML='';
    (parsed.keywordsAdded||[]).forEach(kw=>{
      const s=document.createElement('span');s.className='kw-chip';s.textContent=kw;chipRow.appendChild(s);
    });
    document.getElementById('analysis-notes').innerHTML=(parsed.notes||'').replace(/·/g,'<br>·');

    document.getElementById('analyze-results').style.display='block';
    window._optimizedCV=parsed.optimizedCV;

    // Save full analysis object for history
    const fileName=document.getElementById('file-name-analyze')?.textContent||'CV Analysis';
    window._lastAnalysis={
      fileName:fileName==='—'?'CV Analysis':fileName,
      jobTitle,country,industry,
      scoreBefore:parsed.scoreBefore,
      scoreAfter:parsed.scoreAfter,
      optimizedCV:parsed.optimizedCV,
      notes:parsed.notes,
      keywordsAdded:parsed.keywordsAdded||[]
    };

    // Deduct 1 credit on success
    deductCredit();
    // Auto-save to history and dashboard
    autoSaveToHistory(window._lastAnalysis);

    setTimeout(()=>document.getElementById('analyze-results').scrollIntoView({behavior:'smooth'}),100);
    showToast('Analysis complete! CV optimized ✓');

  }catch(err){
    clearInterval(stepInterval);
    document.getElementById('analyze-loading').style.display='none';
    showToast('Error: '+err.message);
  }
  btn.disabled=false;btn.textContent='Analyze Now — uses 1 credit';
}

function setBar(key,data){
  if(!data)return;
  document.getElementById('bar-'+key+'-b').style.width=data.before+'%';
  document.getElementById('bar-'+key+'-a').style.width=data.after+'%';
  document.getElementById('bar-'+key+'-t').textContent=data.before+'% → '+data.after+'%';
}

/* ════════════════════════════════════
   ATS SCORE — REAL AI
════════════════════════════════════ */
async function runATSCheck(){
  const cvText=document.getElementById('ats-cv-text').value.trim();
  const role=document.getElementById('ats-role').value||'Professional';
  const country=document.getElementById('ats-country').value||'United States';
  const atsSystem=document.getElementById('ats-system').value||'Auto-detect';

  if(!cvText){showToast('Please paste your CV text in the text area below the upload zone.');return;}

  const btn=document.getElementById('ats-btn');
  btn.disabled=true;btn.textContent='Scoring…';
  document.getElementById('ats-results').style.display='none';
  document.getElementById('ats-loading').style.display='flex';

  try{
    const systemPrompt=`You are an ATS scoring expert. Analyze the CV and return ONLY valid JSON:
{
  "score": <integer 20-95>,
  "grade": "<Excellent|Good|Needs Improvement|Poor>",
  "description": "<1-2 sentence description of what this score means>",
  "keywords": <integer 20-90>,
  "format": <integer 30-95>,
  "completeness": <integer 20-90>,
  "readability": <integer 40-95>,
  "issues": [
    {"type": "<err|warn|ok>", "title": "<short title>", "detail": "<concise explanation>"},
    ... (5-6 items total)
  ]
}
Return ONLY JSON, no markdown, no backticks.`;

    const userMsg=`Role: ${role}\nCountry: ${country}\nATS System: ${atsSystem}\n\nCV:\n${cvText}`;
    const raw=await callClaude(systemPrompt,userMsg);
    document.getElementById('ats-loading').style.display='none';

    let p;
    try{p=JSON.parse(raw.replace(/```json|```/g,'').trim());}catch(e){throw new Error('Parse error. Try again.');}

    // Score display
    const scoreColor=p.score>=70?'#10B981':p.score>=50?'#F59E0B':'#EF4444';
    document.getElementById('ats-score-num').textContent=p.score;
    document.getElementById('ats-score-num').style.color=scoreColor;
    document.getElementById('ats-score-grade').textContent=p.grade;
    document.getElementById('ats-score-grade').style.color=scoreColor;
    document.getElementById('ats-score-desc').textContent=p.description;

    // Gauge bars
    const gaugeEl=document.getElementById('ats-gauge-bars');
    gaugeEl.innerHTML=`
      <div class="bar-row"><span class="bar-name">Keywords match</span><div class="bar-track"><div class="b-after" style="width:${p.keywords}%;background:${scoreColor}"></div></div><span class="bar-nums">${p.keywords}%</span></div>
      <div class="bar-row"><span class="bar-name">Format compat.</span><div class="bar-track"><div class="b-after" style="width:${p.format}%;background:${scoreColor}"></div></div><span class="bar-nums">${p.format}%</span></div>
      <div class="bar-row"><span class="bar-name">Completeness</span><div class="bar-track"><div class="b-after" style="width:${p.completeness}%;background:${scoreColor}"></div></div><span class="bar-nums">${p.completeness}%</span></div>
      <div class="bar-row"><span class="bar-name">Readability</span><div class="bar-track"><div class="b-after" style="width:${p.readability}%;background:${scoreColor}"></div></div><span class="bar-nums">${p.readability}%</span></div>`;

    // Tips
    const tipsList=document.getElementById('ats-tips-list');
    tipsList.innerHTML='';
    (p.issues||[]).forEach(issue=>{
      const iconClass=issue.type==='err'?'tip-ic-err':issue.type==='warn'?'tip-ic-warn':'tip-ic-ok';
      const iconText=issue.type==='err'?'✕':issue.type==='warn'?'!':'✓';
      tipsList.innerHTML+=`<div class="tip-item"><div class="tip-icon ${iconClass}">${iconText}</div><div class="tip-content"><h4>${issue.title}</h4><p>${issue.detail}</p></div></div>`;
    });

    document.getElementById('ats-results').style.display='block';
    setTimeout(()=>document.getElementById('ats-results').scrollIntoView({behavior:'smooth'}),100);
    showToast('ATS Score: '+p.score+'/100 ✓');

  }catch(err){
    document.getElementById('ats-loading').style.display='none';
    showToast('Error: '+err.message);
  }
  btn.disabled=false;btn.textContent='Check ATS Score — Free';
}

/* ════════════════════════════════════
   LINKEDIN OPTIMIZER — REAL AI
════════════════════════════════════ */
async function optimizeLinkedIn(){
  if(_credits<=0){showToast('No credits remaining. Please upgrade to continue.');go('pricing',null,'careerliftai.com/pricing');return;}

  const headline=document.getElementById('li-headline').value;
  const about=document.getElementById('li-about').value;
  const jobtitle=document.getElementById('li-jobtitle').value||'Professional';
  const skills=document.getElementById('li-skills').value||'various skills';
  const country=document.getElementById('li-country').value||'United States';
  const role=document.getElementById('li-role').value||jobtitle;
  const tone=document.getElementById('li-tone').value;

  const btn=document.getElementById('li-btn');
  btn.disabled=true;btn.textContent='Optimizing…';
  document.getElementById('li-empty').style.display='none';
  document.getElementById('li-results').style.display='none';
  document.getElementById('li-loading').style.display='flex';

  try{
    const systemPrompt=`You are a LinkedIn profile optimization expert. Return ONLY valid JSON:
{
  "headline1": "<keyword-rich headline under 120 chars>",
  "headline2": "<achievement-led headline under 120 chars>",
  "headline3": "<role-focused headline under 120 chars>",
  "about": "<full rewritten About section, 3 paragraphs, recruiter-optimized, ends with a call to connect, tone: ${tone}>",
  "tips": [
    "<actionable LinkedIn tip 1>",
    "<actionable LinkedIn tip 2>",
    "<actionable LinkedIn tip 3>",
    "<actionable LinkedIn tip 4>",
    "<actionable LinkedIn tip 5>"
  ]
}
Return ONLY JSON, no markdown, no backticks.`;

    const userMsg=`Current Headline: ${headline}\nCurrent About: ${about}\nJob Title: ${jobtitle}\nTarget Role: ${role}\nSkills: ${skills}\nTarget Country: ${country}\nTone: ${tone}`;

    const raw=await callClaude(systemPrompt,userMsg);
    document.getElementById('li-loading').style.display='none';

    let p;
    try{p=JSON.parse(raw.replace(/```json|```/g,'').trim());}catch(e){throw new Error('Parse error. Try again.');}

    document.getElementById('li-h1').textContent=p.headline1||'—';
    document.getElementById('li-h2').textContent=p.headline2||'—';
    document.getElementById('li-h3').textContent=p.headline3||'—';
    document.getElementById('li-about-result').textContent=p.about||'—';
    (p.tips||[]).forEach((t,i)=>{const el=document.getElementById('li-tip'+(i+1));if(el)el.textContent=t;});

    document.getElementById('li-results').style.display='block';
    // Reset to headline tab
    document.querySelectorAll('.li-tab').forEach(t=>t.classList.remove('on'));
    document.querySelector('.li-tab').classList.add('on');
    ['li-hl','li-ab','li-ti'].forEach(id=>{const d=document.getElementById(id);if(d)d.style.display=id==='li-hl'?'block':'none';});

    // Deduct credit on success and update metrics
    deductCredit();
    const liCount=document.getElementById('metric-li');
    if(liCount)liCount.textContent=parseInt(liCount.textContent||0)+1;
    showToast('LinkedIn profile optimized ✓');

  }catch(err){
    document.getElementById('li-loading').style.display='none';
    document.getElementById('li-empty').style.display='flex';
    showToast('Error: '+err.message);
  }
  btn.disabled=false;btn.textContent='Optimize LinkedIn — 1 credit';
}

function liTab(el,tab){
  document.querySelectorAll('.li-tab').forEach(t=>t.classList.remove('on'));
  el.classList.add('on');
  ['li-hl','li-ab','li-ti'].forEach(t=>{const d=document.getElementById(t);if(d)d.style.display=t===tab?'block':'none';});
}

/* ════════════════════════════════════
   COVER LETTER — REAL AI
════════════════════════════════════ */
async function generateCoverLetter(){
  if(_credits<=0){showToast('No credits remaining. Please upgrade to continue.');go('pricing',null,'careerliftai.com/pricing');return;}

  const company=document.getElementById('cl-company').value||'the Company';
  const jobtitle=document.getElementById('cl-jobtitle').value||'this role';
  const name=document.getElementById('cl-yourname').value||'Applicant';
  const country=document.getElementById('cl-country').value||'United States';
  const jd=document.getElementById('cl-jd').value||'';
  const skills=document.getElementById('cl-skills').value||'my skills';
  const why=document.getElementById('cl-why').value||'';
  const tone=document.querySelector('.tone-opt.on')?.textContent||'Professional';
  const length=document.getElementById('cl-length').value||'Standard';

  const lengthGuide=length.includes('Short')?'~250 words':length.includes('Detailed')?'~600 words':'~400 words';

  const btn=document.getElementById('cl-btn');
  btn.disabled=true;btn.textContent='Generating…';
  document.getElementById('cl-empty-state').style.display='none';
  document.getElementById('cl-body-text').style.display='none';
  document.getElementById('cl-loading').style.display='flex';

  try{
    const systemPrompt=`You are an expert cover letter writer. Write a compelling, tailored cover letter in plain text (no markdown, no asterisks). Return ONLY the letter text, starting with the date, ending with the signature. Length: ${lengthGuide}. Tone: ${tone}. Do not use any ** or # formatting.`;

    const userMsg=`Company: ${company}\nJob Title: ${jobtitle}\nApplicant Name: ${name}\nCountry: ${country}\nJob Description: ${jd}\nApplicant Skills: ${skills}\nWhy this company: ${why}`;

    const letterText=await callClaude(systemPrompt,userMsg);
    document.getElementById('cl-loading').style.display='none';

    // Format and display
    const formatted=letterText.split('\n').map(line=>{
      if(!line.trim())return '';
      return `<p>${line.trim()}</p>`;
    }).filter(Boolean).join('');

    document.getElementById('cl-body-text').innerHTML=formatted;
    document.getElementById('cl-body-text').style.display='block';
    document.getElementById('cl-preview-title').textContent=`${company} · ${jobtitle}`;

    // Show action buttons
    ['cl-regen-btn','cl-copy-btn','cl-pdf-btn'].forEach(id=>{
      const el=document.getElementById(id);if(el)el.style.display='inline-block';
    });

    window._coverLetterText=letterText;

    // Deduct credit on success and update metrics
    deductCredit();
    const clCount=document.getElementById('metric-cl');
    if(clCount)clCount.textContent=parseInt(clCount.textContent||0)+1;
    showToast('Cover letter generated ✓');

  }catch(err){
    document.getElementById('cl-loading').style.display='none';
    document.getElementById('cl-empty-state').style.display='flex';
    showToast('Error: '+err.message);
  }
  btn.disabled=false;btn.textContent='Generate Cover Letter — 1 credit';
}

function selectTone(el){document.querySelectorAll('.tone-opt').forEach(t=>t.classList.remove('on'));el.classList.add('on');}

/* ════════════════════════════════════
   CV EDITOR
════════════════════════════════════ */
function openEditor(name){
  document.getElementById('editor-title').textContent='Edit Template — '+name;
  document.getElementById('editor-modal').classList.add('open');
  updatePreview();
}
function closeEditor(){document.getElementById('editor-modal').classList.remove('open');}

function saveAndClose(){
  showToast('Template saved! Download it as PDF using the button above.');
  // Optionally download automatically
  downloadEditorCV();
}

function updatePreview(){
  const name=document.getElementById('ed-name').value||'Your Name';
  const title=document.getElementById('ed-title').value||'Job Title';
  const email=document.getElementById('ed-email').value||'email@email.com';
  const phone=document.getElementById('ed-phone').value||'Phone';
  const location=document.getElementById('ed-location').value||'City, Country';
  const url=document.getElementById('ed-url').value||'';
  const summary=document.getElementById('ed-summary').value||'Professional summary...';
  const job1=document.getElementById('ed-job1').value||'Job Title — Company';
  const dates1=document.getElementById('ed-dates1').value||'2020 – Present';
  const rawBullets=(document.getElementById('ed-bullets1').value||'').split('\n').filter(b=>b.trim());
  const bulletsHTML=rawBullets.map(b=>`<div style="font-size:10px;color:#444;padding-left:12px;position:relative;margin-bottom:3px"><span style="position:absolute;left:0;color:#6366F1">▸</span>${b.trim()}</div>`).join('');
  const edu=document.getElementById('ed-edu').value||'Degree — University';
  const eduYear=document.getElementById('ed-edu-year').value||'Year';
  const skillsList=(document.getElementById('ed-skills').value||'').split(',').filter(s=>s.trim());
  const skillsHTML=skillsList.map(s=>`<span style="padding:3px 9px;background:#EEF2FF;color:#4338CA;border-radius:4px;font-size:10px;font-weight:500;margin:2px;display:inline-block">${s.trim()}</span>`).join('');

  document.getElementById('cv-live-preview').innerHTML=`
<div style="font-family:Georgia,serif;padding:28px 30px;color:#222;font-size:11px;line-height:1.5">
  <div style="font-size:24px;font-weight:700;color:#1a1a1a;letter-spacing:-.3px;margin-bottom:2px">${name}</div>
  <div style="font-size:12px;color:#6366F1;font-weight:600;margin-bottom:8px">${title}</div>
  <div style="display:flex;gap:12px;font-size:10px;color:#666;margin-bottom:14px;flex-wrap:wrap">
    <span>${email}</span><span>${phone}</span><span>${location}</span>${url?`<span>${url}</span>`:''}
  </div>
  <div style="height:2px;background:#6366F1;margin-bottom:12px"></div>
  <div style="font-size:10px;font-weight:700;color:#6366F1;text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px">Professional Summary</div>
  <p style="font-size:10px;color:#444;line-height:1.55;margin-bottom:12px">${summary}</p>
  <div style="font-size:10px;font-weight:700;color:#6366F1;text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px;margin-top:12px">Work Experience</div>
  <div style="font-size:11px;font-weight:700;color:#111">${job1}</div>
  <div style="font-size:10px;color:#888;margin-bottom:5px">${dates1}</div>
  ${bulletsHTML}
  <div style="font-size:10px;font-weight:700;color:#6366F1;text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px;margin-top:12px">Education</div>
  <div style="font-size:11px;font-weight:700;color:#111">${edu}</div>
  <div style="font-size:10px;color:#888;margin-bottom:10px">${eduYear}</div>
  <div style="font-size:10px;font-weight:700;color:#6366F1;text-transform:uppercase;letter-spacing:.7px;margin-bottom:8px">Skills</div>
  <div style="display:flex;flex-wrap:wrap;gap:4px">${skillsHTML}</div>
</div>`;
}

// Close editor on overlay click
document.getElementById('editor-modal').addEventListener('click',function(e){if(e.target===this)closeEditor();});

/* ════════════════════════════════════
   TEMPLATES FILTER
════════════════════════════════════ */
function filterTpl(el,cat){
  document.querySelectorAll('.tpl-filter').forEach(f=>f.classList.remove('on'));
  el.classList.add('on');
  document.querySelectorAll('.tpl-card').forEach(c=>{
    const cats=(c.dataset.cat||'').split(' ');
    c.style.display=(cat==='all'||cats.includes(cat))?'block':'none';
  });
}

/* ════════════════════════════════════
   PRICING TOGGLE
════════════════════════════════════ */
let isAnnual=false;
function toggleBill(){
  isAnnual=!isAnnual;
  const swk=document.getElementById('swk');
  const saveT=document.getElementById('save-t');
  const monthlyLbl=document.getElementById('bill-monthly-lbl');
  const annualLbl=document.getElementById('bill-annual-lbl');
  if(isAnnual){
    swk.classList.remove('off');saveT.style.display='inline-block';
    monthlyLbl.style.fontWeight='400';monthlyLbl.style.color='#888';
    annualLbl.style.fontWeight='600';annualLbl.style.color='#111';
    document.getElementById('bp').textContent='$16';document.getElementById('bpd').textContent='/month (billed $190/yr)';
    document.getElementById('pp').textContent='$33';document.getElementById('ppd').textContent='/month (billed $399/yr) · 7-day free trial';
  } else {
    swk.classList.add('off');saveT.style.display='none';
    monthlyLbl.style.fontWeight='600';monthlyLbl.style.color='#111';
    annualLbl.style.fontWeight='400';annualLbl.style.color='#888';
    document.getElementById('bp').textContent='$19';document.getElementById('bpd').textContent='/month';
    document.getElementById('pp').textContent='$49';document.getElementById('ppd').textContent='/month · 7-day free trial';
  }
}

/* ════════════════════════════════════
   CREDIT SYSTEM (localStorage)
════════════════════════════════════ */
const FREE_CREDITS=3;
let _credits=parseInt(localStorage.getItem('cl_credits'));
if(isNaN(_credits)){_credits=FREE_CREDITS;localStorage.setItem('cl_credits',FREE_CREDITS);}

function deductCredit(){
  if(_credits<=0)return false;
  _credits=Math.max(0,_credits-1);
  localStorage.setItem('cl_credits',_credits);
  refreshCreditUI();
  syncCurrentAccount();
  return true;
}
function addCredits(n){
  _credits=Math.min(999,_credits+n);
  localStorage.setItem('cl_credits',_credits);
  refreshCreditUI();showToast(n+' credits added ✓');
  syncCurrentAccount();
}
function refreshCreditUI(){
  const c=_credits;
  const maxC=Math.max(c,FREE_CREDITS); // handles paid users with > 3 credits
  const lbl=document.getElementById('sb-cr-lbl');
  if(lbl)lbl.textContent=c+' credit'+(c!==1?'s':'')+' remaining';
  const bar=document.getElementById('sb-cr-bar');
  if(bar)bar.style.width=Math.round((Math.min(c,maxC)/maxC)*100)+'%';
  const dn=document.getElementById('dash-credit-n');if(dn)dn.textContent=c;
  const dm=document.getElementById('dash-credit-msg');
  if(dm)dm.textContent='You have '+c+' AI '+(c===1?'analysis':'analyses')+' remaining.';
  const pill=document.getElementById('analyze-credit-pill');
  if(pill){
    pill.textContent=c+' credit'+(c!==1?'s':'')+' left';
    pill.className='credit-pill'+(c===0?' credit-pill-zero':c<=1?' credit-pill-low':'');
  }
}

function updateDashboardMetrics(){
  const hist=loadHistory();
  const cvsEl=document.getElementById('metric-cvs');
  const scoreEl=document.getElementById('metric-score');
  const scoreSubEl=document.getElementById('metric-score-sub');
  const cvsSubEl=document.getElementById('metric-cvs-sub');
  if(cvsEl)cvsEl.textContent=hist.length;
  if(cvsSubEl)cvsSubEl.textContent=hist.length>0?'+'+hist.length+' total':'Get started!';
  if(hist.length>0){
    const avg=Math.round(hist.reduce((s,e)=>s+e.scoreAfter,0)/hist.length);
    const min=Math.min(...hist.map(e=>e.scoreBefore));
    if(scoreEl)scoreEl.textContent=avg;
    if(scoreSubEl)scoreSubEl.textContent='↑ from '+min;
  } else {
    if(scoreEl)scoreEl.textContent='—';
    if(scoreSubEl)scoreSubEl.textContent='No data yet';
  }
}
function checkCreditGate(page){
  if(_credits>0){closeGate(page);return true;}
  const g=document.getElementById(page+'-credit-gate');if(g)g.classList.add('show');
  return false;
}
function closeGate(page){
  const g=document.getElementById(page+'-credit-gate');if(g)g.classList.remove('show');
}

/* ════════════════════════════════════
   PDF TEXT EXTRACTION (PDF.js)
════════════════════════════════════ */
async function extractPDFText(file,page){
  const badge=document.getElementById('extract-badge-'+page);
  const badgeTxt=document.getElementById('extract-badge-'+page+'-txt');
  if(badge)badge.classList.add('show');
  if(badgeTxt)badgeTxt.textContent='Extracting text from PDF…';
  try{
    const pdfjs=window.pdfjsLib||window['pdfjs-dist/build/pdf'];
    if(!pdfjs){if(badge)badge.classList.remove('show');showToast('PDF library not ready — paste your CV text manually.');return null;}
    pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const arrayBuffer=await file.arrayBuffer();
    const pdf=await pdfjs.getDocument({data:arrayBuffer}).promise;
    let fullText='';
    for(let i=1;i<=pdf.numPages;i++){
      if(badgeTxt)badgeTxt.textContent='Extracting page '+i+' of '+pdf.numPages+'…';
      const pg=await pdf.getPage(i);
      const tc=await pg.getTextContent();
      fullText+=tc.items.map(item=>item.str).join(' ')+'\n';
    }
    if(badge)badge.classList.remove('show');
    const cleaned=fullText.replace(/\s{3,}/g,' ').trim();
    if(!cleaned||cleaned.length<30){showToast('Could not extract text — paste your CV manually.');return null;}
    return cleaned;
  }catch(err){
    if(badge)badge.classList.remove('show');
    showToast('PDF read error — paste your CV text manually.');return null;
  }
}

/* ════════════════════════════════════
   FILE UPLOAD (with PDF extraction)
════════════════════════════════════ */
async function handleFileUpload(page,input){
  if(!input.files||!input.files[0])return;
  const file=input.files[0];
  const ext=file.name.split('.').pop().toUpperCase();
  document.getElementById('file-name-'+page).textContent=file.name;
  document.getElementById('file-size-'+page).textContent=(file.size/1024).toFixed(0)+' KB · Ready to analyze';
  const ic=document.getElementById('file-type-ic-'+page);if(ic)ic.textContent=ext;
  document.getElementById('dropzone-'+page).style.display='none';
  document.getElementById('file-preview-'+page).style.display='flex';
  if(page==='ats'){document.getElementById('ats-results').style.display='none';}
  if(page==='analyze'){document.getElementById('analyze-results').style.display='none';}
  const taId=page==='analyze'?'analyze-cv-text':'ats-cv-text';
  const ta=document.getElementById(taId);
  if(file.type==='text/plain'||ext==='TXT'){
    const reader=new FileReader();
    reader.onload=ev=>{if(ta)ta.value=ev.target.result;};
    reader.readAsText(file);showToast('Text file loaded ✓');
  } else if(ext==='PDF'){
    const text=await extractPDFText(file,page);
    if(text&&ta){ta.value=text;showToast('PDF extracted ('+text.length+' chars) ✓');}
  } else if(ext==='DOC'||ext==='DOCX'){
    showToast('DOCX detected — please paste your CV text below.');
  } else {
    showToast('Unsupported format — paste your CV text below.');
  }
}
function removeFile(page){
  document.getElementById('dropzone-'+page).style.display='flex';
  document.getElementById('file-preview-'+page).style.display='none';
  document.getElementById('file-input-'+page).value='';
  const badge=document.getElementById('extract-badge-'+page);if(badge)badge.classList.remove('show');
  if(page==='ats'){document.getElementById('ats-results').style.display='none';document.getElementById('ats-loading').style.display='none';}
  if(page==='analyze'){document.getElementById('analyze-results').style.display='none';document.getElementById('analyze-loading').style.display='none';}
}

/* ════════════════════════════════════
   HISTORY SYSTEM (localStorage)
════════════════════════════════════ */
function loadHistory(){try{return JSON.parse(localStorage.getItem('cl_history')||'[]');}catch(e){return[];}}
function saveHistoryStore(hist){localStorage.setItem('cl_history',JSON.stringify(hist.slice(0,20)));syncCurrentAccount();}
function autoSaveToHistory(analysis){
  const hist=loadHistory();
  hist.unshift({
    id:Date.now(),
    fileName:analysis.fileName||'CV Analysis',
    jobTitle:analysis.jobTitle,country:analysis.country,industry:analysis.industry,
    scoreBefore:analysis.scoreBefore,scoreAfter:analysis.scoreAfter,
    optimizedCV:analysis.optimizedCV,notes:analysis.notes,
    keywordsAdded:analysis.keywordsAdded||[],
    date:new Date().toLocaleDateString()
  });
  saveHistoryStore(hist);renderHistory();
  addActivityRow(hist[0].fileName,hist[0].scoreAfter+'/100',hist[0].country);
}
function saveToHistory(){
  if(!window._lastAnalysis){showToast('Run an analysis first.');return;}
  autoSaveToHistory(window._lastAnalysis);
  showToast('Saved to history ✓');
  const btn=document.getElementById('save-hist-btn');
  if(btn){btn.textContent='✓ Saved!';btn.disabled=true;setTimeout(()=>{btn.textContent='✓ Save to History';btn.disabled=false;},2000);}
}
function renderHistory(){
  const hist=loadHistory();
  const list=document.getElementById('history-list');
  const cnt=document.getElementById('hist-count');
  if(!list)return;
  if(cnt)cnt.textContent=hist.length+' saved';
  updateDashboardMetrics();
  if(!hist.length){list.innerHTML='<div class="hist-empty">No analyses saved yet. Run your first CV analysis to get started.</div>';return;}
  list.innerHTML=hist.map(e=>{
    const sc=e.scoreAfter>=70?'hist-score-g':e.scoreAfter>=50?'hist-score-y':'hist-score-r';
    return `<div class="hist-item">
      <div class="hist-ic">CV</div>
      <div class="hist-info">
        <div class="hist-name">${e.fileName}</div>
        <div class="hist-meta">${e.jobTitle} &middot; ${e.country} &middot; ${e.date}</div>
      </div>
      <span class="hist-score ${sc}">${e.scoreAfter}/100</span>
      <button class="hist-restore-btn" onclick="restoreAnalysis(${e.id})">Restore</button>
    </div>`;
  }).join('');
}
function restoreAnalysis(id){
  const hist=loadHistory();
  const e=hist.find(x=>x.id===id);
  if(!e){showToast('Entry not found.');return;}
  window._optimizedCV=e.optimizedCV;window._lastAnalysis=e;
  document.getElementById('score-before').textContent=e.scoreBefore;
  document.getElementById('score-after').textContent=e.scoreAfter;
  document.getElementById('score-arrow').textContent='→ +'+(e.scoreAfter-e.scoreBefore)+' pts';
  document.getElementById('optimized-cv-display').textContent=e.optimizedCV;
  document.getElementById('original-cv-display').textContent='(Restored from history)';
  document.getElementById('analysis-notes').innerHTML=(e.notes||'—').replace(/·/g,'<br>·');
  const cr=document.getElementById('keywords-added');cr.innerHTML='';
  (e.keywordsAdded||[]).forEach(kw=>{const s=document.createElement('span');s.className='kw-chip';s.textContent=kw;cr.appendChild(s);});
  setBar('kw',{before:40,after:85});setBar('fmt',{before:50,after:90});setBar('comp',{before:45,after:88});setBar('read',{before:55,after:87});
  document.getElementById('analyze-results').style.display='block';
  go('analyze',null,'careerliftai.com/analyze');
  setTimeout(()=>document.getElementById('analyze-results').scrollIntoView({behavior:'smooth'}),150);
  showToast('Analysis restored ✓');
}
function addActivityRow(docName,score,country){
  const tbody=document.getElementById('activity-tbody');if(!tbody)return;
  const empty=document.getElementById('activity-empty-row');if(empty)empty.remove();
  const pc=score==='—'?'p-y':(parseInt(score)>=70?'p-g':'p-r');
  const tr=document.createElement('tr');
  tr.innerHTML=`<td>${docName}</td><td><span class="pill ${pc}">${score}</span></td><td>${country}</td><td><span class="done">&#10003; Done</span></td><td><button class="row-btn" onclick="go('analyze',null,'careerliftai.com/analyze')">View</button></td>`;
  tbody.insertBefore(tr,tbody.firstChild);
  while(tbody.rows.length>5)tbody.deleteRow(tbody.rows.length-1);
}
function copyElText(id){
  const el=document.getElementById(id);if(!el)return;
  const text=el.innerText||el.textContent||'';
  navigator.clipboard.writeText(text).then(()=>showToast('Copied ✓')).catch(()=>{
    const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);showToast('Copied ✓');
  });
}
function copyOptimized(){
  const text=window._optimizedCV||document.getElementById('optimized-cv-display').textContent||'';
  navigator.clipboard.writeText(text).then(()=>showToast('Optimized CV copied ✓')).catch(()=>showToast('Copy failed.'));
}
function makePDF(title,text){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:'pt',format:'a4'});
  const margin=50;const pw=doc.internal.pageSize.getWidth();const ph=doc.internal.pageSize.getHeight();
  const uw=pw-margin*2;
  doc.setFont('helvetica','bold');doc.setFontSize(14);doc.setTextColor(99,102,241);
  doc.text('CareerLift AI',margin,margin-10);
  doc.setDrawColor(99,102,241);doc.setLineWidth(1);doc.line(margin,margin,pw-margin,margin);
  doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(17,17,17);
  doc.text(title,margin,margin+20);
  doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor(60,60,60);
  const lines=doc.splitTextToSize(text,uw);let y=margin+40;
  lines.forEach(line=>{if(y>ph-margin){doc.addPage();y=margin;}doc.text(line,margin,y);y+=14;});
  doc.setFontSize(8);doc.setTextColor(170,170,170);doc.text('Generated by CareerLift AI',margin,ph-20);
  return doc;
}
function downloadAnalysisPDF(){
  const text=window._optimizedCV||document.getElementById('optimized-cv-display').textContent;
  if(!text||text==='—'){showToast('Generate analysis first.');return;}
  makePDF('ATS-Optimized CV',text).save('CareerLift_Optimized_CV.pdf');showToast('PDF downloaded ✓');
}
function downloadAnalysisTXT(){
  const text=window._optimizedCV||document.getElementById('optimized-cv-display').textContent;
  if(!text||text==='—'){showToast('Generate analysis first.');return;}
  const blob=new Blob([text],{type:'text/plain'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='CareerLift_Optimized_CV.txt';a.click();URL.revokeObjectURL(url);
  showToast('TXT downloaded ✓');
}
function downloadCoverLetterPDF(){
  const text=window._coverLetterText||document.getElementById('cl-body-text').innerText;
  if(!text){showToast('Generate a cover letter first.');return;}
  const company=document.getElementById('cl-company').value||'Company';
  const jt=document.getElementById('cl-jobtitle').value||'Role';
  makePDF('Cover Letter — '+jt+' at '+company,text).save('CareerLift_Cover_Letter.pdf');showToast('PDF downloaded ✓');
}
function downloadEditorCV(){
  const name=document.getElementById('ed-name').value||'My CV';
  const text=document.getElementById('cv-live-preview')?.innerText||'';
  if(!text){showToast('Fill in your CV details first.');return;}
  makePDF(name+' — CV',text).save('CareerLift_CV_'+name.replace(/\s+/g,'_')+'.pdf');showToast('CV downloaded ✓');
}

/* ════════════════════════════════════
   INIT
════════════════════════════════════ */
refreshCreditUI();
renderHistory();
updateDashboardMetrics();


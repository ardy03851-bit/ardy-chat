import { createIcons, MessageCircle, MessagesSquare, Compass, Bookmark, Settings, Plus, Search, ChevronDown, ChevronRight, Hash, Phone, Video, Info, X, ArrowUpRight, ArrowRight, ArrowLeft, Send, Paperclip, Smile, AtSign, Image, FileText, Download, Check, CheckCheck, ShieldCheck, LockKeyhole, Users, Bell, BellOff, MoreHorizontal, LogOut, Copy, Link, WifiOff, Globe, Heart, ThumbsUp, Sparkles, Reply, Pencil, Trash2, Pin, Menu, Mic, MicOff, VideoOff, PhoneOff, MonitorUp, Sun, Moon, CheckCircle2, CircleHelp } from 'lucide';
import { LIMITS } from './schema.js';

const icons = {MessageCircle,MessagesSquare,Compass,Bookmark,Settings,Plus,Search,ChevronDown,ChevronRight,Hash,Phone,Video,Info,X,ArrowUpRight,ArrowRight,ArrowLeft,Send,Paperclip,Smile,AtSign,Image,FileText,Download,Check,CheckCheck,ShieldCheck,LockKeyhole,Users,Bell,BellOff,MoreHorizontal,LogOut,Copy,Link,WifiOff,Globe,Heart,ThumbsUp,Sparkles,Reply,Pencil,Trash2,Pin,Menu,Mic,MicOff,VideoOff,PhoneOff,MonitorUp,Sun,Moon,CheckCircle2,CircleHelp};
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const e = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = name => `<i data-lucide="${name.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase()}"></i>`;
const ib = (name, title, action, cls='') => `<button class="icon-button ${cls}" aria-label="${e(title)}" title="${e(title)}" data-action="${action}" data-testid="button-${action}">${icon(name)}</button>`;
const asset = name => `${import.meta.env.BASE_URL}${name}`;
const paintIcons = () => createIcons({icons, attrs:{'aria-hidden':'true'}});
const samplePeople = [
  {uid:'maya',displayName:'Maya Chen',color:'sand',bio:'Collecting little moments'},
  {uid:'oliver',displayName:'Oliver James',color:'blue',bio:'Somewhere outside'},
  {uid:'sophie',displayName:'Sophie Williams',color:'rose',bio:'Design, coffee, repeat'},
  {uid:'alex',displayName:'Alex Morgan',color:'',bio:'Making things together'},
];
const sampleRooms = [
  {id:'sample-general',name:'general',description:'A little bit of everything. A good place to be.',type:'space',sample:true},
  {id:'sample-introductions',name:'introductions',description:'Good conversations start with a hello.',type:'space',sample:true},
  {id:'sample-inspiration',name:'inspiration',description:'Things worth passing along.',type:'space',sample:true},
];
const today = new Date(); today.setHours(9,40,0,0);
const sampleMessages = [
  {id:'s1',senderId:'maya',senderName:'Maya Chen',text:'Morning, everyone. A small reminder to step away from your screen and find something good today.',createdAt:new Date(+today),reactions:{heart:['oliver','sophie','alex']}},
  {id:'s2',senderId:'oliver',senderName:'Oliver James',text:'Taking that advice. Finally made it out to the Highlands this weekend. No notifications, just this.',createdAt:new Date(+today+180000),attachment:{url:asset('highlands.webp'),name:'a-quiet-morning.webp',size:248320,type:'image/webp'},reactions:{heart:['maya','sophie'],sparkles:['alex']}},
  {id:'s3',senderId:'sophie',senderName:'Sophie Williams',text:'That is the kind of reset I need. Putting a weekend away on the calendar.',createdAt:new Date(+today+300000),reactions:{}},
  {id:'s4',senderId:'alex',senderName:'Alex Morgan',text:'Less scrolling, more of this. Anyone up for a coffee and a catch-up this week?',createdAt:new Date(+today+420000),reactions:{thumbs:['maya','oliver']}},
];
let F, firebasePromise, unsubRooms, unsubMessages, unsubTyping, unsubCalls;
let user=null, rooms=[], current=sampleRooms[0], messages=sampleMessages, saved=[], mode='chat', replyTo=null, attachment=null, draft='', sending=false, authBusy=false, online=navigator.onLine, offlineEnabled=false, cachedUser=null;
let showDetails=innerWidth>1180, sidebarOpen=false, roomError='', typingTimer, lastTyped=0, toastTimer, installEvent, call=null, callUnsub, candidateUnsub, callTimer, rtc, localStream, remoteStream;
const messageCache=new Map(), unreads=new Set();
let globalError='', screenStream, previousWide=innerWidth>1180;
const PRIVATE_CACHE='ardy-private-v1';

async function firebase() {
  if (!firebasePromise) firebasePromise=import('./firebase.js').then(module=>F=module);
  return firebasePromise;
}
function avatar(person={},cls='') {
  const name=person.displayName||person.senderName||'You';
  const initials=name.split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase();
  return `<span class="avatar ${person.color||''} ${cls}" role="img" aria-label="${e(name)}">${person.photoURL&&safeURL(person.photoURL)?`<img src="${e(person.photoURL)}" alt="" referrerpolicy="no-referrer" loading="lazy" />`:e(initials)}</span>`;
}
function safeURL(value) { try { return ['https:','blob:','http:'].includes(new URL(value,location.href).protocol); } catch { return false; } }
function date(value) { return value?.toDate?.() || (value?.seconds ? new Date(value.seconds*1000) : new Date(value||Date.now())); }
function time(value) { return date(value).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }
function filesize(bytes=0) { return bytes>1048576 ? `${(bytes/1048576).toFixed(1)} MB` : `${Math.max(1,Math.round(bytes/1024))} KB`; }
function textHTML(value) {
  return e(value).replace(/https?:\/\/[^\s<]+/g,url=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
}
function roomName(room=current) {
  if (!room) return 'Your conversations';
  if(room.type==='dm') return Object.entries(room.memberProfiles||{}).find(([uid])=>uid!==user?.uid)?.[1]?.displayName||room.name;
  return room.name;
}
function notify(text) {
  const t=$('#toast');t.textContent=text;t.classList.add('visible');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),4200);
}
function errorMessage(error) {
  const codes={
    'auth/unauthorized-domain':'This website domain needs to be added to Firebase Authentication → Settings → Authorized domains.',
    'auth/operation-not-allowed':'Google sign-in is not enabled yet. Enable Google in Firebase Authentication → Sign-in method.',
    'auth/configuration-not-found':'Firebase Authentication needs to be set up for this project before Google sign-in can work.',
    'auth/popup-blocked':'The browser blocked Google sign-in. Allow pop-ups for this site, then try again.',
    'auth/operation-not-supported-in-this-environment':'Open Ardy directly on GitHub Pages to sign in. Embedded previews cannot reliably open Google authentication.',
    'auth/popup-closed-by-user':'Sign-in was closed. You can try again whenever you are ready.',
    'auth/cancelled-popup-request':'Another sign-in window is already open.',
    'auth/network-request-failed':'Could not reach Google. Check your connection and try again.',
    'permission-denied':'Firebase denied access. The project owner needs to publish the included Firestore security rules.',
    'storage/unauthorized':'Image upload is not permitted. The project owner needs to publish the included Storage rules.',
    'storage/unknown':'Storage could not complete the upload. Check that Firebase Storage is enabled and its rules are published.',
    'unavailable':'The service is temporarily unavailable. Your draft is still here.',
    'not-found':'The requested conversation could not be found.'
  };
  return codes[error?.code] || error?.message || 'Something went wrong. Please try again.';
}
async function cacheRead(key) {
  try { const cache=await caches.open(PRIVATE_CACHE);const response=await cache.match(new URL(`__ardy_private__/${key}`,location.href));return response?await response.json():null; } catch {return null;}
}
async function cacheWrite(key,value) {
  if(!offlineEnabled) return;
  try {const cache=await caches.open(PRIVATE_CACHE);await cache.put(new URL(`__ardy_private__/${key}`,location.href),new Response(JSON.stringify(value),{headers:{'content-type':'application/json'}}));}catch{}
}
async function clearPrivateCache() { try {await caches.delete(PRIVATE_CACHE);}catch{} }
function serializeMessage(m) { return {...m,createdAt:date(m.createdAt).toISOString(),editedAt:m.editedAt?date(m.editedAt).toISOString():null}; }
async function snapshotRoom() {
  if(!offlineEnabled||!user||!current||current.sample)return;
  await cacheWrite(`${user.uid}/messages/${current.id}`,messages.map(serializeMessage));
  // Cache already-viewed attachments only after explicit offline opt-in.
  try { const cache=await caches.open(PRIVATE_CACHE); for(const m of messages) {
    if(m.attachment?.type?.startsWith('image/') && safeURL(m.attachment.url) && !await cache.match(m.attachment.url)) {
      const r=await fetch(m.attachment.url,{mode:'cors'});if(r.ok&&offlineEnabled&&user)await cache.put(m.attachment.url,r);
    }
  }}catch{}
}
function currentPeople() {
  if(current?.sample)return samplePeople;
  return Object.entries(current?.memberProfiles||{}).map(([uid,p])=>({...p,uid}));
}
function render() {
  const isSample=!user && !cachedUser;
  const my=user||cachedUser;
  const spaceRooms=isSample?sampleRooms:rooms.filter(r=>r.type==='space');
  const dmRooms=isSample?samplePeople.slice(0,3).map(p=>({id:`sample-dm-${p.uid}`,name:p.displayName,sample:true,person:p})):rooms.filter(r=>r.type==='dm');
  $('#app').innerHTML=`<div class="app-shell ${showDetails?'show-details':'no-details'} ${sidebarOpen?'mobile-nav':''}">
    <nav class="rail" aria-label="Main navigation">
      <button class="wordmark-small" data-action="home" aria-label="Ardy home" title="Ardy home">a.</button>
      <div class="rail-line"></div>
      <button class="rail-button ${mode==='chat'?'active':''}" data-action="home" aria-label="Conversations" title="Conversations">${icon('MessagesSquare')}</button>
      <button class="rail-button ${mode==='discover'?'active':''}" data-action="discover" aria-label="Your spaces" title="Your spaces">${icon('Compass')}</button>
      <div class="rail-line"></div>
      <button class="rail-button space-button" data-action="spaces" aria-label="Your spaces" title="Your spaces">C</button>
      <button class="rail-button space-button" data-action="create-space" aria-label="Create a space" title="Create a space">${icon('Plus')}</button>
      <div class="rail-bottom">${ib('CircleHelp','Help & installation','help')}${ib('Settings','Settings','settings')}<button data-action="${my?'profile':'login'}" aria-label="${my?'Your profile':'Sign in'}" title="${my?'Your profile':'Sign in'}">${avatar(my||{displayName:'Guest'},'account-avatar')}</button></div>
    </nav>
    <aside class="sidebar" aria-label="Conversations sidebar">
      <header class="workspace-heading"><div><div class="wordmark">ardy<span style="color:var(--accent)">.</span></div><div class="tagline">A little closer.</div></div>${ib('ChevronDown','Workspace options','workspace')}</header>
      <button class="search-launch" data-action="search" data-testid="button-search">${icon('Search')}<span>Find a conversation</span><kbd>⌘ K</kbd></button>
      <div class="sidebar-scroll">
        <button class="nav-item ${mode==='chat'&&!current?'active':''}" data-action="home">${icon('MessageCircle')}<span>All conversations</span></button>
        <button class="nav-item ${mode==='saved'?'active':''}" data-action="saved">${icon('Bookmark')}<span>Saved messages</span>${saved.length?`<span class="count">${saved.length}</span>`:''}</button>
        <div class="section-label">Your spaces${ib('Plus','Create a space','create-space')}</div>
        ${spaceRooms.map(r=>`<button class="nav-item ${current?.id===r.id&&mode==='chat'?'active':''}" data-room="${e(r.id)}" data-testid="room-${e(r.id)}"><span class="channel-hash">#</span><span class="dm-name">${e(r.name)}</span>${unreads.has(r.id)?'<span class="status-dot"></span>':''}</button>`).join('')||'<p class="detail-description" style="padding:var(--space-3)">Your people, your space. Create one to get started.</p>'}
        <div class="section-label">Direct messages${ib('Plus','New direct message','create-dm')}</div>
        ${dmRooms.map((r,i)=>`<button class="nav-item ${current?.id===r.id&&mode==='chat'?'active':''}" data-room="${e(r.id)}">${avatar(r.person||Object.entries(r.memberProfiles||{}).find(([uid])=>uid!==my?.uid)?.[1]||{displayName:roomName(r)},'small')}<span class="dm-name">${e(roomName(r))}</span>${r.sample?'<span class="status-dot"></span>':''}</button>`).join('')||'<p class="detail-description" style="padding:var(--space-3)">Start with a friend’s Ardy ID.</p>'}
      </div>
      <div class="sidebar-note"><div class="eyebrow">${icon(isSample?'LockKeyhole':'Users')}${isSample?'Your people. Your space.':'Better with your people.'}</div><p>${isSample?'Good conversations deserve a place of their own. Make yours here.':'Bring your friends into the conversation with a private invite.'}</p><button data-action="${isSample?'login':'invite'}">${isSample?'Make yourself at home':'Invite a friend'} ${icon('ArrowUpRight')}</button></div>
      <footer class="sidebar-footer">${avatar(my||{displayName:'Guest'})}<div class="user-info"><strong>${e(my?.displayName||'Join Ardy')}</strong><span>${my?(online?'Connected':'Offline · read only'):'Continue with Google'}</span></div>${ib(my?'Settings':'ArrowRight',my?'Settings':'Sign in',my?'settings':'login')}</footer>
    </aside>
    <main class="chat-main" id="conversation" tabindex="-1">${mode==='chat'?chatHTML():alternateHTML()}</main>
    <aside class="details" aria-label="Conversation details">${detailsHTML()}</aside>
  </div>`;
  paintIcons();
  bindComposer();
  if(mode==='chat'&&!current?.sample)scrollBottom();
  if(globalError)notify(globalError);
}
function chatHTML() {
  if(!current)return `<header class="chat-header">${ib('Menu','Open navigation','menu','mobile-menu')}<div class="chat-title"><h1>Your conversations</h1><p>A quieter place to connect.</p></div></header>${!online?offlineStrip():''}<div class="empty-state">${icon('MessagesSquare')}<h2>A conversation starts with you.</h2><p>Create a private space or send a friend your Ardy ID. Your messages will appear here in real time.</p><button class="button primary" data-action="create-space">${icon('Plus')}Create a space</button></div>`;
  const sample=current.sample;
  return `<header class="chat-header">${ib('Menu','Open navigation','menu','mobile-menu')}<span class="channel-symbol">${current.type==='dm'?icon('MessageCircle'):'#'}</span><div class="chat-title"><h1>${e(roomName())}</h1><p>${e(current.description||(current.type==='dm'?'Just the two of you.':'A space for your people.'))}</p></div><div class="chat-header-actions"><div class="member-stack">${currentPeople().slice(0,3).map(p=>avatar(p,'small')).join('')}<span class="members-count">${currentPeople().length}</span></div>${ib('Phone','Start voice call','voice-call')}${ib('Video','Start video call','video-call','video-action')}<div class="header-divider"></div>${ib('Search','Search this conversation','search','search-action')}${ib('Info','Conversation details','details',showDetails?'active':'')}</div></header>
  ${!online?offlineStrip():sample?`<div class="preview-strip"><span>${icon('Globe')}You’re exploring a sample space.<span class="strip-extra"> Make it yours.</span></span><button data-action="login">Continue with Google ${iconInlineArrow()}</button></div>`:''}
  ${roomError?`<div class="inline-error" role="alert">${e(roomError)}</div>`:''}
  <div class="messages-scroll" id="messages-scroll" role="log" aria-label="Conversation messages" aria-live="polite">
    <section class="room-welcome"><div class="welcome-mark">${current.type==='dm'?icon('MessageCircle'):'#'}</div><h2>${sample?'Good people. Great conversations.':`This is ${roomName()}.`}</h2><p>${sample?'A space to share the everyday, and everything in between.':current.type==='dm'?'The beginning of your conversation. Say something good.':'The beginning of something good. Invite your people and say hello.'}</p></section>
    ${messages.length?`<div class="date-divider">${date(messages[0].createdAt).toLocaleDateString([],{month:'long',day:'numeric',year:'numeric'})}${sample?' · Sample conversation':''}</div>`:''}
    ${messages.map(messageHTML).join('')||(!roomError?'<div class="empty-state"><p>No messages yet. A simple hello is a great start.</p></div>':'')}
  </div><div class="typing-line" id="typing-line" aria-live="polite"></div>
  <div class="composer-area"><div class="composer">
    ${replyTo?`<div class="composer-reply">${icon('Reply')}<span>Replying to ${e(replyTo.senderName)}: ${e(replyTo.text.slice(0,100))}</span>${ib('X','Cancel reply','cancel-reply')}</div>`:''}
    ${attachment?`<div class="file-preview">${attachment.preview?`<img src="${attachment.preview}" alt="Attachment preview" />`:icon('FileText')}<span>${e(attachment.file.name)} · ${filesize(attachment.file.size)}</span>${ib('X','Remove attachment','remove-attachment')}</div>`:''}
    <textarea id="message-input" aria-label="Message ${e(roomName())}" placeholder="${!online?'You’re offline. You can still read saved conversations.':`Message ${current.type==='dm'?'':'#'}${e(roomName())}...`}" maxlength="${LIMITS.message}" rows="2" ${!online||sending?'disabled':''} data-testid="input-message">${e(draft)}</textarea>
    <div class="composer-toolbar">${ib('Plus','Attach an image or file','attach')}${ib('Smile','Add a reaction symbol','emoji')}${ib('AtSign','Mention a member','mention')}<span class="header-divider"></span>${ib('Image','Attach an image','attach-image')}<button class="send-button" data-action="send" data-testid="button-send" ${!online||sending?'disabled':''}>${sending?'Sending…':'Send'}${icon('Send')}</button></div>
    <div id="upload-progress"></div><div id="send-error" class="inline-error" role="alert" hidden></div>
  </div><div class="composer-hint"><span>${iconInlineLock()} ${current.sample?'Sample preview · sign in to send':!online?'Read-only · nothing will be sent':'Private to this conversation'}</span><span class="right-hint"><kbd>Enter</kbd> to send · <kbd>Shift + Enter</kbd> for a new line</span></div></div><input type="file" id="file-input" class="sr-only" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain" aria-label="Choose an attachment" />`;
}
function iconInlineArrow(){return '<span aria-hidden="true">↗</span>';}
function iconInlineLock(){return '<span aria-hidden="true" style="display:inline-block;margin-right:4px">·</span>';}
function offlineStrip(){return `<div class="preview-strip offline-strip"><span>${icon('WifiOff')}Offline. Previously saved conversations are read-only.</span></div>`;}
function messageHTML(m) {
  const person=samplePeople.find(p=>p.uid===m.senderId)||{displayName:m.senderName,photoURL:m.senderPhoto};
  const mine=user?.uid===m.senderId;
  const reactIcons={heart:'Heart',thumbs:'ThumbsUp',sparkles:'Sparkles'};
  return `<article class="message" id="message-${e(m.id)}" data-message="${e(m.id)}" data-testid="message-${e(m.id)}">${avatar(person)}<div class="message-body">
    ${m.pinned?`<div class="pinned-marker">${icon('Pin')}Pinned message</div>`:''}
    ${m.replyTo?`<div class="reply-quote">${icon('Reply')}<strong>${e(m.replyTo.senderName)}</strong> ${e(m.replyTo.text.slice(0,100))}</div>`:''}
    <div class="message-meta"><strong>${e(m.senderName)}</strong>${mine?'<span class="you-label">you</span>':''}<time datetime="${date(m.createdAt).toISOString()}">${time(m.createdAt)}</time>${m.editedAt?'<time>edited</time>':''}</div>
    <p class="message-text ${m.deleted?'deleted':''}">${m.deleted?'This message was deleted.':textHTML(m.text)}</p>
    ${!m.deleted&&m.attachment?attachmentHTML(m.attachment,m.id):''}
    ${!m.deleted?`<div class="reactions">${Object.entries(m.reactions||{}).filter(([k,v])=>v.length).map(([k,v])=>`<button class="reaction ${v.includes(user?.uid)?'mine':''}" data-react="${e(k)}" data-mid="${e(m.id)}" title="${e(k)} · ${v.length} reactions" aria-label="${e(k)}, ${v.length} reactions" aria-pressed="${v.includes(user?.uid)}">${icon(reactIcons[k]||'Heart')}${v.length}</button>`).join('')}</div><div class="message-tools">${ib('Smile','React to message',`react:${m.id}`)}${ib('Reply','Reply to message',`reply:${m.id}`)}${ib('Bookmark','Save message',`save:${m.id}`)}${ib('Pin',m.pinned?'Unpin message':'Pin message',`pin:${m.id}`,'optional-tool')}${mine?ib('Pencil','Edit message',`edit:${m.id}`,'optional-tool')+ib('Trash2','Delete message',`delete:${m.id}`,'optional-tool'):''}</div>`:''}
  </div></article>`;
}
function attachmentHTML(a,id) {
  if(!safeURL(a.url))return '';
  return a.type?.startsWith('image/')?`<button class="attachment-image" data-image="${e(id)}" aria-label="View ${e(a.name)}"><img src="${e(a.url)}" alt="${e(a.name)}" width="800" height="450" loading="lazy" decoding="async" /><span class="attachment-caption"><span>${e(a.name)} <span style="opacity:.65">· ${filesize(a.size)}</span></span>${icon('ArrowUpRight')}</span></button>`:`<a class="file-tile" href="${e(a.url)}" target="_blank" rel="noopener noreferrer">${icon('FileText')}<span><strong>${e(a.name)}</strong><small>${filesize(a.size)} · Open attachment</small></span>${icon('Download')}</a>`;
}
function detailsHTML() {
  const sample=current?.sample;
  const people=currentPeople();
  const files=messages.filter(m=>m.attachment&&!m.deleted);
  return `<div class="details-header"><h2>About this space</h2>${ib('X','Close details','details')}</div>
    ${sample?`<img class="detail-cover" src="${asset('highlands.webp')}" alt="A quiet Highland valley" width="450" height="190" />`:''}
    <div class="detail-space-name">${e(sample?'The Common Room':roomName())}</div><p class="detail-description">${e(sample?'A small corner of the internet for good company and unhurried conversations.':current?.description||'A private place to share, catch up, and stay a little closer.')}</p>
    <div class="detail-label">${sample?'Sample members':'Members'} <span>${people.length}</span></div>
    ${people.map((p,i)=>`<div class="member-row">${avatar(p,'small')}<div class="member-info"><strong>${e(p.displayName)}</strong><small>${sample?p.bio:p.uid===user?.uid?'You':p.uid===current?.ownerId?'Space owner':'Member'}</small></div>${sample&&i===0?'<span class="role">owner</span>':''}</div>`).join('')||'<p class="detail-description">Your people will appear here.</p>'}
    <div class="detail-label">Shared files <span>${files.length}</span></div>
    ${files.slice(-3).map(m=>`<button class="file-tile" data-image="${e(m.id)}">${icon(m.attachment.type?.startsWith('image/')?'Image':'FileText')}<span><strong>${e(m.attachment.name)}</strong><small>${filesize(m.attachment.size)} · ${e(m.senderName.split(' ')[0])}</small></span>${icon('ArrowUpRight')}</button>`).join('')||'<p class="detail-description">Images and files shared here stay together.</p>'}
    <div class="detail-label">Pinned messages <span>${messages.filter(m=>m.pinned&&!m.deleted).length}</span></div>
    ${messages.filter(m=>m.pinned&&!m.deleted).slice(0,3).map(m=>`<button class="search-result" data-jump="${e(m.id)}"><small>${e(m.senderName)}</small><p>${e(m.text.slice(0,120))}</p></button>`).join('')||'<p class="detail-description">Keep the important things within reach. Pin a message to find it here.</p>'}
    <div class="detail-bottom">${icon('LockKeyhole')}${sample?'Sample space · not a live conversation':'Only conversation members have access'}</div>`;
}
function alternateHTML() {
  if(mode==='saved')return `<header class="chat-header">${ib('Menu','Open navigation','menu','mobile-menu')}<div class="chat-title"><h1>Saved messages</h1><p>The things you want to come back to.</p></div>${ib('Bookmark','Saved messages','saved','active')}</header><div class="saved-list">${saved.length?saved.map(s=>`<article class="saved-card"><small>${e(s.roomName)} · ${e(s.authorName)}</small><p>${e(s.text||'Image or attachment')}</p><button class="button" data-open-saved="${e(s.id)}">Open conversation${icon('ArrowUpRight')}</button><button class="icon-button" data-unsave="${e(s.id)}" aria-label="Remove saved message" title="Remove saved message">${icon('X')}</button></article>`).join(''):`<div class="empty-state">${icon('Bookmark')}<h2>A place for the keepers.</h2><p>Save a message using its bookmark button. Find it here whenever you need it.</p></div>`}</div>`;
  return `<header class="chat-header">${ib('Menu','Open navigation','menu','mobile-menu')}<div class="chat-title"><h1>Your spaces</h1><p>Small communities. Real connection.</p></div>${ib('Plus','Create a space','create-space')}</header><div class="view-heading"><h1>Find your common ground.</h1><p>Spaces are private by default. Start one, or join with a friend’s invite.</p></div><div class="saved-list">${rooms.filter(r=>r.type==='space').map(r=>`<button class="search-result" data-room="${e(r.id)}"><small>${r.memberIds.length} members</small><p># ${e(r.name)}</p></button>`).join('')}<div class="empty-state">${icon('Users')}<h2>A room for your people.</h2><p>Book clubs, weekend plans, late-night ideas. There’s room for all of it.</p><button class="button primary" data-action="create-space">${icon('Plus')}Create a space</button><button class="button" style="margin:var(--space-3)" data-action="join-space">${icon('Link')}Join with an invite</button></div></div>`;
}
function scrollBottom() {requestAnimationFrame(()=>{const el=$('#messages-scroll');if(el)el.scrollTop=el.scrollHeight;});}
function bindComposer() {
  const input=$('#message-input');
  if(!input)return;
  input.addEventListener('input',()=>{draft=input.value;input.style.height='auto';input.style.height=Math.min(input.scrollHeight,160)+'px';sendTyping();});
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();sendMessage();}});
  $('#file-input')?.addEventListener('change',event=>chooseAttachment(event.target.files?.[0]));
  const main=$('.chat-main');
  main?.addEventListener('dragover',event=>{if(event.dataTransfer.types.includes('Files'))event.preventDefault();});
  main?.addEventListener('drop',event=>{event.preventDefault();chooseAttachment(event.dataTransfer.files[0]);});
  input.addEventListener('paste',event=>{const file=[...event.clipboardData.items].find(i=>i.kind==='file')?.getAsFile();if(file){event.preventDefault();chooseAttachment(file);}});
}
function modal(title,body,{wide=false,cls=''}={}) {
  const previous=document.activeElement;
  $('#overlay-root').innerHTML=`<div class="overlay-backdrop"><section class="dialog ${wide?'wide':''} ${cls}" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="dialog-header"><h2 id="dialog-title">${e(title)}</h2>${ib('X','Close dialog','close-modal')}</div>${body}</section></div>`;
  paintIcons();
  requestAnimationFrame(()=>$('.dialog input,.dialog textarea,.dialog button')?.focus());
  $('#overlay-root')._previous=previous;
}
function closeModal() {if(call)return;$('#overlay-root').innerHTML='';$('#overlay-root')._previous?.focus?.();}
function formError(error) {const el=$('#form-error');if(el){el.textContent=errorMessage(error);el.hidden=false;}}
function requireUser() {if(!user){loginModal();return false;}if(!online){notify('You’re offline. Conversations are read-only until you reconnect.');return false;}return true;}
function loginModal() {
  modal('Make yourself at home.',`<img class="auth-visual" src="${asset('highlands.webp')}" alt="Morning mist in the Highlands" width="800" height="450" /><div class="eyebrow">A little closer</div><h2 class="auth-title">For the conversations<br>that matter.</h2><p>Your friends, your spaces, your everyday. Sign in to start a real conversation.</p><button class="button primary full" id="google-login" data-action="google-login" data-testid="button-google-login"><span class="google-mark" aria-hidden="true">G</span>${authBusy?'Connecting…':'Continue with Google'}</button><div id="form-error" class="form-error" role="alert"></div><p class="auth-footnote">Only your name and profile photo are shared.<br>No AI. No public feed. Just your people.</p>`);
}
async function doLogin() {
  if(authBusy)return;
  if(!online){formError(new Error('Reconnect to the internet to sign in.'));return;}
  authBusy=true;const button=$('#google-login');if(button){button.disabled=true;button.lastChild.textContent='Connecting…';}
  try{const f=await firebase();await f.login();closeModal();}
  catch(error){formError(error);}
  finally{authBusy=false;const b=$('#google-login');if(b){b.disabled=false;b.innerHTML='<span class="google-mark" aria-hidden="true">G</span>Continue with Google';}}
}
async function authChanged(next) {
  if(!next){user=null;cachedUser=null;rooms=[];saved=[];messages=sampleMessages;current=sampleRooms[0];unsubRooms?.();unsubMessages?.();unsubTyping?.();unsubCalls?.();render();return;}
  user={uid:next.uid,displayName:next.displayName||'Ardy member',photoURL:next.photoURL||'',bio:''};
  cachedUser=null;rooms=[];current=null;messages=[];globalError='';mode='chat';render();
  try {
    const existing=await F.getDoc(F.doc(F.db,'users',user.uid));
    if(existing.exists())user.bio=existing.data().bio||'';
    await F.setDoc(F.doc(F.db,'users',user.uid),{...user,lastActive:F.serverTimestamp()},{merge:true});
    const config=await cacheRead('profile');
    offlineEnabled=!!config&&config.uid===user.uid;
    await cacheWrite('profile',user);
    subscribeRooms();loadSaved();subscribeIncomingCalls();
    const token=new URLSearchParams(location.hash.replace(/^#/, '')).get('invite');
    if(token)joinSpaceModal(token);
  }catch(error){globalError=errorMessage(error);roomError=globalError;render();}
}
function subscribeRooms() {
  unsubRooms?.();
  unsubRooms=F.onSnapshot(F.query(F.collection(F.db,'rooms'),F.where('memberIds','array-contains',user.uid)),snapshot=>{
    rooms=snapshot.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>date(b.lastMessageAt||b.createdAt)-date(a.lastMessageAt||a.createdAt));
    for(const r of rooms){const old=messageCache.get(`last-${r.id}`);if(old&&old!==r.lastMessage&&current?.id!==r.id)unreads.add(r.id);messageCache.set(`last-${r.id}`,r.lastMessage);}
    cacheWrite(`${user.uid}/rooms`,rooms.map(r=>({...r,createdAt:date(r.createdAt).toISOString(),lastMessageAt:date(r.lastMessageAt).toISOString()})));
    if(!current&&rooms.length)openRoom(rooms[0].id);
    else{if(current)current=rooms.find(r=>r.id===current.id)||current;render();}
  },error=>{roomError=errorMessage(error);render();});
}
async function loadSaved() {
  if(!user)return;
  try{const snapshot=await F.getDocs(F.collection(F.db,'users',user.uid,'saved'));saved=snapshot.docs.map(d=>({id:d.id,...d.data()}));if(mode==='saved')render();}catch(error){notify(errorMessage(error));}
}
async function openRoom(id) {
  draft=$('#message-input')?.value||draft;
  replyTo=null;clearAttachment();draft='';mode='chat';sidebarOpen=false;roomError='';
  unsubMessages?.();unsubTyping?.();
  current=rooms.find(r=>r.id===id)||sampleRooms.find(r=>r.id===id);
  if(!current&&id.startsWith('sample-dm-')) {
    const p=samplePeople.find(p=>`sample-dm-${p.uid}`===id);current={id,name:p.displayName,type:'dm',sample:true,description:'Sample direct conversation'};
    messages=[{id:'dm-sample',senderId:p.uid,senderName:p.displayName,text:'Good to see you here. Sign in and invite a friend to start a real conversation.',createdAt:today,reactions:{}}];render();return;
  }
  if(!current)return;
  unreads.delete(id);
  if(current.sample){messages=id==='sample-general'?sampleMessages:[{id:'sample-empty',senderId:'maya',senderName:'Maya Chen',text:id==='sample-introductions'?'A good place to start: your name, your corner of the world, and something you’re into lately.':'A home for the things that make you stop and look. A photo, an idea, a little inspiration.',createdAt:today,reactions:{}}];render();return;}
  messages=messageCache.get(id)||await cacheRead(`${(user||cachedUser)?.uid}/messages/${id}`)||[];render();
  if(!online||!user)return;
  unsubMessages=F.onSnapshot(F.query(F.collection(F.db,'rooms',id,'messages'),F.orderBy('createdAt','desc'),F.limit(150)),snapshot=>{
    const scroller=$('#messages-scroll');const nearBottom=!scroller||scroller.scrollHeight-scroller.scrollTop-scroller.clientHeight<180;
    const position=scroller?.scrollTop;
    messages=snapshot.docs.map(d=>({id:d.id,...d.data()})).reverse();messageCache.set(id,messages);roomError='';snapshotRoom();
    const input=$('#message-input');const focused=document.activeElement===input;const cursor=input?.selectionStart;
    render();if(!nearBottom&&$('#messages-scroll'))$('#messages-scroll').scrollTop=position;
    if(focused){$('#message-input')?.focus();$('#message-input')?.setSelectionRange(cursor,cursor);}
  },error=>{roomError=errorMessage(error);render();});
  unsubTyping=F.onSnapshot(F.collection(F.db,'rooms',id,'typing'),snapshot=>{
    const names=snapshot.docs.filter(d=>d.id!==user?.uid&&Date.now()-date(d.data().at).getTime()<6000).map(d=>d.data().name.split(' ')[0]);
    if($('#typing-line'))$('#typing-line').textContent=names.length?`${names.slice(0,2).join(' and ')} ${names.length>1?'are':'is'} typing…`:'';
  },()=>{});
}
async function sendTyping() {
  if(!user||!online||current?.sample||!current||Date.now()-lastTyped<2500)return;
  lastTyped=Date.now();
  F.setDoc(F.doc(F.db,'rooms',current.id,'typing',user.uid),{name:user.displayName,at:F.serverTimestamp()}).catch(()=>{});
  clearTimeout(typingTimer);typingTimer=setTimeout(()=>F.deleteDoc(F.doc(F.db,'rooms',current.id,'typing',user.uid)).catch(()=>{}),4000);
}
async function chooseAttachment(file) {
  if(!file)return;if(!requireUser())return;
  const types=['image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain'];
  if(!types.includes(file.type)){notify('Choose a JPG, PNG, WebP, GIF, PDF, or text file.');return;}
  if(file.size>LIMITS.attachment){notify('That file is too large. Choose one smaller than 10 MB.');return;}
  clearAttachment();
  attachment={file,preview:file.type.startsWith('image/')?URL.createObjectURL(file):null};
  render();$('#message-input')?.focus();
}
function clearAttachment(){if(attachment?.preview)URL.revokeObjectURL(attachment.preview);attachment=null;}
async function compressImage(file) {
  if(!file.type.startsWith('image/')||file.type==='image/gif'||file.size<300000)return file;
  const image=new window.Image();const url=URL.createObjectURL(file);
  try{image.src=url;await image.decode();const scale=Math.min(1,1600/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.82));return blob&&blob.size<file.size?new File([blob],file.name.replace(/\.[^.]+$/,'.webp'),{type:'image/webp'}):file;}catch{return file;}finally{URL.revokeObjectURL(url);}
}
async function uploadAttachment(roomId) {
  const file=await compressImage(attachment.file);
  const path=`attachments/${roomId}/${user.uid}/${crypto.randomUUID()}/${file.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
  const task=F.uploadBytesResumable(F.ref(F.storage,path),file,{contentType:file.type});
  await new Promise((resolve,reject)=>task.on('state_changed',s=>{const el=$('#upload-progress');if(el)el.innerHTML=`<div class="progress-bar" aria-label="Upload progress"><span style="width:${s.bytesTransferred/s.totalBytes*100}%"></span></div>`;},reject,resolve));
  return {url:await F.getDownloadURL(task.snapshot.ref),path,name:file.name,type:file.type,size:file.size};
}
async function sendMessage() {
  if(sending||!current)return;if(!requireUser())return;
  const text=($('#message-input')?.value||draft).trim();
  if(!text&&!attachment){$('#message-input')?.focus();return;}
  if(text.length>LIMITS.message)return;
  const roomId=current.id;
  sending=true;draft=text;render();
  try {
    const uploaded=attachment?await uploadAttachment(roomId):null;
    if(!navigator.onLine)throw new Error('You went offline. Nothing was sent. Your draft is still here.');
    const m={text,senderId:user.uid,senderName:user.displayName,senderPhoto:user.photoURL||'',createdAt:F.serverTimestamp(),reactions:{},pinned:false};
    if(uploaded)m.attachment=uploaded;
    if(replyTo)m.replyTo={id:replyTo.id,senderName:replyTo.senderName,text:replyTo.text.slice(0,300)};
    await F.addDoc(F.collection(F.db,'rooms',roomId,'messages'),m);
    // A failed conversation preview must not make a successfully delivered message look failed.
    F.updateDoc(F.doc(F.db,'rooms',roomId),{lastMessage:text||`Shared ${uploaded?.name||'an attachment'}`,lastMessageAt:F.serverTimestamp()}).catch(()=>{});
    F.deleteDoc(F.doc(F.db,'rooms',roomId,'typing',user.uid)).catch(()=>{});
    draft='';clearAttachment();replyTo=null;
  }catch(error){const el=$('#send-error');if(el){el.hidden=false;el.textContent=errorMessage(error);}notify(errorMessage(error));}
  finally{sending=false;render();$('#message-input')?.focus();}
}
function createSpaceModal() {
  if(!requireUser())return;
  modal('Make room for your people.',`<p>A private space for a group, a project, or simply good company. Only people with your invite can join.</p><form id="space-form"><div class="field"><label for="space-name">Space name</label><input id="space-name" required maxlength="48" placeholder="e.g. The weekend people" autocomplete="off" /></div><div class="field"><label for="space-description">A few words about it</label><textarea id="space-description" maxlength="160" placeholder="What brings you together?"></textarea></div><div id="form-error" class="form-error" role="alert"></div><button class="button primary full" type="submit">Create your space${icon('ArrowRight')}</button></form>`);
  $('#space-form').onsubmit=async event=>{
    event.preventDefault();const button=$('button[type=submit]');button.disabled=true;
    try{
      const name=$('#space-name').value.trim();if(!name)throw new Error('Give your space a name.');
      const token=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
      const room=await F.addDoc(F.collection(F.db,'rooms'),{name,description:$('#space-description').value.trim(),type:'space',memberIds:[user.uid],memberProfiles:{[user.uid]:{displayName:user.displayName,photoURL:user.photoURL||''}},ownerId:user.uid,inviteCode:token,createdAt:F.serverTimestamp(),lastMessage:'',lastMessageAt:F.serverTimestamp()});
      await F.setDoc(F.doc(F.db,'invites',token),{roomId:room.id,roomName:name,createdBy:user.uid,expiresAt:new Date(Date.now()+7*86400000)});
      current={id:room.id,name,type:'space',memberIds:[user.uid],memberProfiles:{[user.uid]:user},inviteCode:token,ownerId:user.uid};
      if(!rooms.some(r=>r.id===room.id))rooms.push(current);
      closeModal();await openRoom(room.id);notify('Your space is ready. Invite someone good.');
    }catch(error){formError(error);button.disabled=false;}
  };
}
function createDMModal() {
  if(!requireUser())return;
  modal('Start a conversation.',`<p>Ask your friend for their Ardy ID. They’ll find it in their profile. No email address required.</p><form id="dm-form"><div class="field"><label for="friend-id">Your friend’s Ardy ID</label><input id="friend-id" required maxlength="128" autocomplete="off" placeholder="Paste their ID here" /></div><div id="form-error" class="form-error" role="alert"></div><button class="button primary full" type="submit">Open conversation${icon('ArrowRight')}</button></form>`);
  $('#dm-form').onsubmit=async event=>{
    event.preventDefault();const button=$('button[type=submit]');button.disabled=true;
    try{
      const uid=$('#friend-id').value.trim();if(uid===user.uid)throw new Error('That’s your own ID. Try a friend’s instead.');
      const profile=await F.getDoc(F.doc(F.db,'users',uid));if(!profile.exists())throw new Error('No one with that ID yet. Ask your friend to sign in to Ardy first.');
      const p=profile.data();const roomId=`dm_${[user.uid,uid].sort().join('_')}`;
      const existing=await F.getDoc(F.doc(F.db,'rooms',roomId));
      if(!existing.exists())await F.setDoc(F.doc(F.db,'rooms',roomId),{name:'Direct conversation',description:'Just the two of you.',type:'dm',memberIds:[user.uid,uid],memberProfiles:{[user.uid]:{displayName:user.displayName,photoURL:user.photoURL},[uid]:{displayName:p.displayName,photoURL:p.photoURL||''}},ownerId:user.uid,inviteCode:'',createdAt:F.serverTimestamp(),lastMessage:'',lastMessageAt:F.serverTimestamp()});
      closeModal();if(!rooms.find(r=>r.id===roomId))rooms.push({id:roomId,...(await F.getDoc(F.doc(F.db,'rooms',roomId))).data()});openRoom(roomId);
    }catch(error){formError(error);button.disabled=false;}
  };
}
async function copyText(text,button) {
  try{await navigator.clipboard.writeText(text);if(button){button.innerHTML=`${icon('Check')}Copied`;paintIcons();}else notify('Copied to clipboard.');}
  catch{modal('Copy this link',`<p>Select and copy the text below.</p><div class="field"><input id="copy-fallback" readonly value="${e(text)}" aria-label="Text to copy" /></div>`);$('#copy-fallback').select();}
}
async function inviteModal() {
  if(!requireUser())return;
  if(!current||current.type!=='space'){notify('Open a group space to create an invite.');return;}
  if(current.ownerId!==user.uid){notify('Only the space owner can create invitation links.');return;}
  try{
    const token=current.inviteCode;
    await F.setDoc(F.doc(F.db,'invites',token),{roomId:current.id,roomName:current.name,createdBy:user.uid,expiresAt:new Date(Date.now()+7*86400000)});
    const url=new URL(location.href);url.search='';url.hash=`invite=${token}`;
    modal('Good company starts here.',`<p>Invite someone to ${e(current.name)}. Anyone with this private link can join after signing in. The link expires in seven days.</p><div class="account-code"><code>${e(url.href)}</code></div><button class="button primary full" style="margin-top:var(--space-5)" id="copy-invite">${icon('Copy')}Copy invite link</button><p class="auth-footnote">Share only with people you want in this space.</p>`);
    $('#copy-invite').onclick=()=>copyText(url.href,$('#copy-invite'));
  }catch(error){notify(errorMessage(error));}
}
function joinSpaceModal(token='') {
  if(!requireUser())return;
  modal('There’s a place for you.',`<p>Paste a private invite link or code from a friend.</p><form id="join-form"><div class="field"><label for="invite-token">Invitation</label><input id="invite-token" value="${e(token)}" required autocomplete="off" placeholder="Paste an invite link" /></div><div id="form-error" class="form-error" role="alert"></div><button class="button primary full" type="submit">Join space${icon('ArrowRight')}</button></form>`);
  $('#join-form').onsubmit=async event=>{
    event.preventDefault();const button=$('button[type=submit]');button.disabled=true;
    try{
      let value=$('#invite-token').value.trim();if(value.includes('#'))value=new URLSearchParams(value.split('#')[1]).get('invite')||'';
      if(!/^[a-f0-9]{64}$/.test(value))throw new Error('That invitation doesn’t look right. Ask your friend for a fresh link.');
      const invite=await F.getDoc(F.doc(F.db,'invites',value));if(!invite.exists())throw new Error('That invite has expired or no longer exists.');
      const data=invite.data();if(date(data.expiresAt)<new Date())throw new Error('That invite has expired. Ask the owner for a fresh one.');
      if(!rooms.some(r=>r.id===data.roomId))await F.updateDoc(F.doc(F.db,'rooms',data.roomId),{memberIds:F.arrayUnion(user.uid),[`memberProfiles.${user.uid}`]:{displayName:user.displayName,photoURL:user.photoURL||''}});
      location.hash='';closeModal();notify(`You’ve joined ${data.roomName}.`);
    }catch(error){formError(error);button.disabled=false;}
  };
}
function profileModal() {
  if(!user){loginModal();return;}
  modal('Your corner of Ardy.',`<div style="display:flex;gap:var(--space-4);align-items:center;margin-bottom:var(--space-6)">${avatar(user,'large')}<div><h2>${e(user.displayName)}</h2><p style="margin:var(--space-1) 0 0">Good to have you here.</p></div></div><form id="profile-form"><div class="field"><label for="profile-name">Display name</label><input id="profile-name" value="${e(user.displayName)}" maxlength="50" required /></div><div class="field"><label for="profile-bio">A little about you</label><input id="profile-bio" value="${e(user.bio)}" maxlength="100" placeholder="A few words, if you like." /></div><div id="form-error" class="form-error" role="alert"></div><button class="button primary full" type="submit">Save profile</button></form><div class="detail-label">Your Ardy ID</div><p style="font-size:var(--text-xs);margin-bottom:var(--space-2)">Share this with a friend to start a direct conversation.</p><div class="account-code"><code>${e(user.uid)}</code>${ib('Copy','Copy your Ardy ID','copy-id')}</div>`);
  $('#profile-form').onsubmit=async event=>{event.preventDefault();if(!online){formError(new Error('Reconnect to save changes.'));return;}const button=$('button[type=submit]');button.disabled=true;try{const displayName=$('#profile-name').value.trim();if(!displayName)throw new Error('Please enter a display name.');const bio=$('#profile-bio').value.trim();await F.updateProfile(F.auth.currentUser,{displayName});await F.updateDoc(F.doc(F.db,'users',user.uid),{displayName,bio});user={...user,displayName,bio};await cacheWrite('profile',user);closeModal();render();notify('Profile updated.');}catch(error){formError(error);button.disabled=false;}};
}
function settingsModal() {
  modal('Make it feel like you.',`<div class="setting-row"><div><strong>Light appearance</strong><small>A different light. The same space.</small></div><button class="toggle" role="switch" aria-label="Light appearance" aria-checked="${document.documentElement.dataset.theme==='light'}" data-action="toggle-theme"></button></div><div class="setting-row"><div><strong>Offline reading</strong><small>Save viewed conversations on this device. Use only on a trusted device.</small></div><button class="toggle" role="switch" aria-label="Offline reading" aria-checked="${offlineEnabled}" data-action="toggle-offline"></button></div><div class="setting-row"><div><strong>Install Ardy</strong><small>A little closer, right on your home screen.</small></div>${ib('Download','Install app','install')}</div><div class="setting-row"><div><strong>Conversation data</strong><small>Private Firebase storage. Not end-to-end encrypted. Previously viewed messages may be stored on this device when offline reading is enabled.</small></div></div><div id="form-error" class="form-error" role="alert"></div><div class="dialog-actions"><button class="button" data-action="help">Help & installation</button>${user?'<button class="button danger" data-action="logout">Sign out</button>':'<button class="button primary" data-action="login">Sign in</button>'}</div>`);
}
async function toggleOffline(button) {
  if(!user){formError(new Error('Sign in before enabling offline reading.'));return;}
  offlineEnabled=!offlineEnabled;
  button.setAttribute('aria-checked',String(offlineEnabled));
  if(offlineEnabled){
    await cacheWrite('profile',user);await cacheWrite(`${user.uid}/rooms`,rooms);await snapshotRoom();
    if(!('caches' in window)){offlineEnabled=false;formError(new Error('Offline storage is unavailable in this browser. Open Ardy directly in Safari or Chrome.'));return;}
    notify('Offline reading enabled for viewed conversations on this device.');
  }else{await clearPrivateCache();notify('Offline copies removed from this device.');}
  button.setAttribute('aria-checked',String(offlineEnabled));
}
function helpModal() {
  modal('A little help.',`<p>Ardy is built for real people, private spaces, and unhurried conversations.</p><div class="setting-row"><div><strong>Start with your people</strong><small>Sign in with Google. Create a space and share its invite, or exchange Ardy IDs for a direct message.</small></div></div><div class="setting-row"><div><strong>On iPad or iPhone</strong><small>Open the GitHub Pages app in Safari. Tap Share, then Add to Home Screen and choose Open as Web App if shown.</small></div></div><div class="setting-row"><div><strong>Offline, not out of touch</strong><small>Enable Offline reading in Settings while connected. Previously viewed conversations are available on this device. Sending, reactions, uploads, and calls are disabled offline. Sign-out removes offline copies.</small></div></div><div class="setting-row"><div><strong>Audio & video calls</strong><small>Open a direct conversation and tap the phone or camera. Allow microphone/camera access when asked. Calls need both people online. Some restrictive networks need a TURN relay, which is not configured in this version.</small></div></div><div class="setting-row"><div><strong>Your privacy</strong><small>Messages are protected by Firebase member access rules, not end-to-end encryption. Offline copies stay on this device. Don’t enable offline reading on a shared device.</small></div></div><p class="auth-footnote">Ardy 1.0 · Made for human connection.</p>`,{wide:true});
}
function searchModal() {
  modal('Find something good.',`<input class="search-input" id="search-input" aria-label="Search conversations and loaded messages" placeholder="Search conversations and messages…" autocomplete="off" /><p style="font-size:var(--text-xs);margin-bottom:var(--space-3)">Searches your conversations and the latest 150 loaded messages in this room.</p><div id="search-results"></div>`,{wide:true});
  $('#search-input').oninput=()=>{
    const term=$('#search-input').value.toLocaleLowerCase().trim();const list=$('#search-results');
    if(!term){list.innerHTML='';return;}
    const hits=messages.filter(m=>!m.deleted&&`${m.text} ${m.senderName}`.toLocaleLowerCase().includes(term));
    const matches=(!user?sampleRooms:rooms).filter(r=>roomName(r).toLowerCase().includes(term));
    list.innerHTML=matches.map(r=>`<button class="search-result" data-room="${e(r.id)}"><small>Conversation</small><p># ${e(roomName(r))}</p></button>`).join('')+hits.map(m=>`<button class="search-result" data-jump="${e(m.id)}"><small>${e(m.senderName)} · ${time(m.createdAt)}</small><p>${e(m.text.slice(0,300))}</p></button>`).join('')||'<div class="empty-state"><p>Nothing here yet. Try a different word.</p></div>';
  };
}
function messageAction(id,kind) {
  const m=messages.find(m=>m.id===id);if(!m||m.deleted)return;
  if(!requireUser())return;
  if(kind==='reply'){replyTo=m;render();$('#message-input')?.focus();return;}
  if(kind==='react'){
    modal('A little acknowledgement.',`<p>React to ${e(m.senderName.split(' ')[0])}’s message.</p><div style="display:flex;gap:var(--space-3)">${[['heart','Heart','Love it'],['thumbs','ThumbsUp','Sounds good'],['sparkles','Sparkles','Something special']].map(([key,ic,label])=>`<button class="button" data-react="${key}" data-mid="${id}" aria-label="${label}">${icon(ic)}${label}</button>`).join('')}</div>`,{wide:true});return;
  }
  if(kind==='save'){saveMessage(m);return;}
  if(kind==='pin'){F.updateDoc(F.doc(F.db,'rooms',current.id,'messages',id),{pinned:!m.pinned}).catch(error=>notify(errorMessage(error)));return;}
  if(kind==='edit'&&m.senderId===user.uid){
    modal('A second thought.',`<form id="edit-form"><div class="field"><label for="edit-text">Edit your message</label><textarea id="edit-text" maxlength="${LIMITS.message}" required>${e(m.text)}</textarea></div><div id="form-error" class="form-error" role="alert"></div><button class="button primary full" type="submit">Save changes</button></form>`);
    $('#edit-form').onsubmit=async event=>{event.preventDefault();try{const text=$('#edit-text').value.trim();if(!text)throw new Error('A message needs a little something.');await F.updateDoc(F.doc(F.db,'rooms',current.id,'messages',id),{text,editedAt:F.serverTimestamp()});closeModal();}catch(error){formError(error);}};return;
  }
  if(kind==='delete'&&m.senderId===user.uid){
    modal('Delete this message?',`<p>The message will be removed for everyone in this conversation. This can’t be undone.</p><div id="form-error" class="form-error" role="alert"></div><div class="dialog-actions"><button class="button" data-action="close-modal">Keep message</button><button class="button danger" id="confirm-delete">Delete message</button></div>`);
    $('#confirm-delete').onclick=async()=>{try{await F.updateDoc(F.doc(F.db,'rooms',current.id,'messages',id),{text:'',deleted:true,attachment:null,reactions:{}});closeModal();}catch(error){formError(error);}};return;
  }
}
async function reactToMessage(id,key) {
  if(!requireUser())return;
  if(!['heart','thumbs','sparkles'].includes(key))return;
  const m=messages.find(m=>m.id===id);if(!m)return;
  const selected=(m.reactions?.[key]||[]).includes(user.uid);
  try{await F.updateDoc(F.doc(F.db,'rooms',current.id,'messages',id),{[`reactions.${key}`]:selected?F.arrayRemove(user.uid):F.arrayUnion(user.uid)});closeModal();}catch(error){notify(errorMessage(error));}
}
async function saveMessage(m) {
  try{const id=`${current.id}_${m.id}`;await F.setDoc(F.doc(F.db,'users',user.uid,'saved',id),{roomId:current.id,messageId:m.id,text:m.text,authorName:m.senderName,roomName:roomName(),savedAt:F.serverTimestamp()});await loadSaved();notify('Saved for another time.');}catch(error){notify(errorMessage(error));}
}
async function logout() {
  modal('Until next time.',`<p>Sign out of Ardy on this device? Your offline copies will be removed. Your conversations remain safely in your Firebase account.</p><div class="dialog-actions"><button class="button" data-action="settings">Stay here</button><button class="button danger" id="confirm-logout">Sign out</button></div>`);
  $('#confirm-logout').onclick=async()=>{try{offlineEnabled=false;await clearPrivateCache();messageCache.clear();clearAttachment();draft='';await F.signOut(F.auth);closeModal();notify('Signed out. Offline copies cleared.');}catch(error){notify(errorMessage(error));}};
}
async function installApp() {
  if(installEvent){await installEvent.prompt();installEvent=null;return;}
  helpModal();
}
async function imageModal(id) {
  const m=messages.find(m=>m.id===id);if(!m?.attachment)return;
  const a=m.attachment;
  if(!a.type?.startsWith('image/')){window.open(a.url,'_blank','noopener,noreferrer');return;}
  let url=a.url;
  if(!online){try{const cache=await caches.open(PRIVATE_CACHE);const response=await cache.match(a.url);if(response)url=URL.createObjectURL(await response.blob());}catch{}}
  modal(a.name,`<img src="${e(url)}" alt="${e(a.name)}" /><div class="dialog-actions"><a class="button" href="${e(url)}" target="_blank" rel="noopener noreferrer">${icon('ArrowUpRight')}Open image</a></div>`,{wide:true,cls:'image-lightbox'});
}
function mentionModal() {
  modal('Bring someone in.',`<p>Add a name to your message. Mentions are text references, not push notifications.</p>${currentPeople().map(p=>`<button class="nav-item" data-mention="${e(p.displayName)}">${avatar(p,'small')}<span>${e(p.displayName)}</span></button>`).join('')}`);
}

// One-to-one WebRTC. Firestore carries signaling only; media flows between peers.
function subscribeIncomingCalls() {
  unsubCalls?.();
  unsubCalls=F.onSnapshot(F.query(F.collection(F.db,'calls'),F.where('calleeId','==',user.uid)),snapshot=>{
    const incoming=snapshot.docs.map(d=>({id:d.id,...d.data()})).find(c=>c.status==='ringing'&&Date.now()-date(c.createdAt).getTime()<60000);
    if(call?.incoming&&call.status==='ringing') {
      const active=snapshot.docs.find(d=>d.id===call.id);
      if(!active||active.data().status!=='ringing'){cleanupCall();$('#overlay-root').innerHTML='';notify('This call has ended.');return;}
    }
    if(incoming&&!call){call={...incoming,incoming:true};renderCall();}
  },()=>{});
}
async function startCall(video=false) {
  if(!requireUser())return;
  if(!current||current.type!=='dm'){notify('Calls are available in direct messages. Open a conversation with one person first.');return;}
  if(call){notify('You already have a call open.');return;}
  const calleeId=current.memberIds.find(id=>id!==user.uid);
  if(!navigator.mediaDevices?.getUserMedia){notify('Calls need a supported browser and a secure HTTPS connection.');return;}
  call={roomId:current.id,callerId:user.uid,callerName:user.displayName,calleeId,participantIds:[user.uid,calleeId],video,status:'preparing',name:roomName()};renderCall();
  try {
    await setupPeer(video);
    rtc.onicecandidate=event=>{if(event.candidate)pendingCandidates.push(event.candidate.toJSON());};
    const offer=await rtc.createOffer();await rtc.setLocalDescription(offer);
    const reference=await F.addDoc(F.collection(F.db,'calls'),{roomId:call.roomId,callerId:user.uid,callerName:user.displayName,calleeId,participantIds:[user.uid,calleeId],video,status:'ringing',offer:{type:offer.type,sdp:offer.sdp},createdAt:F.serverTimestamp()});
    call.id=reference.id;call.status='ringing';wireSignaling(true);renderCall();
    callTimer=setTimeout(()=>{if(call&&call.status!=='connected'){endCall('unanswered');notify('No answer this time. Try again later.');}},45000);
  }catch(error){notify(error.name==='NotAllowedError'?'Microphone or camera permission was declined. Allow access in your browser settings to call.':errorMessage(error));await endCall();}
}
async function setupPeer(video) {
  localStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:video?{width:{ideal:1280},height:{ideal:720},facingMode:'user'}:false});
  rtc=new RTCPeerConnection({iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}]});
  remoteStream=new MediaStream();
  for(const track of localStream.getTracks())rtc.addTrack(track,localStream);
  rtc.ontrack=event=>{for(const track of event.streams[0].getTracks())if(!remoteStream.getTracks().some(t=>t.id===track.id))remoteStream.addTrack(track);attachStreams();};
  rtc.onconnectionstatechange=()=>{
    if(!call)return;
    if(rtc.connectionState==='connected'){clearTimeout(callTimer);call.status='connected';F.updateDoc(F.doc(F.db,'calls',call.id),{status:'connected'}).catch(()=>{});renderCall();}
    if(rtc.connectionState==='failed'){notify('Couldn’t connect this call. This network may need a TURN relay.');endCall('failed');}
    if(rtc.connectionState==='disconnected'){const status=$('#call-status');if(status)status.textContent='Connection interrupted…';}
  };
}
function wireSignaling(caller) {
  const callRef=F.doc(F.db,'calls',call.id);
  const own=caller?'callerCandidates':'calleeCandidates',peer=caller?'calleeCandidates':'callerCandidates';
  // ICE candidates can be collected before the call document exists.
  for(const candidate of pendingCandidates)F.addDoc(F.collection(callRef,own),candidate).catch(()=>{});
  pendingCandidates=[];
  rtc.onicecandidate=event=>{if(event.candidate)F.addDoc(F.collection(callRef,own),event.candidate.toJSON()).catch(()=>{});};
  const waiting=[];
  candidateUnsub=F.onSnapshot(F.collection(callRef,peer),snapshot=>{
    snapshot.docChanges().filter(c=>c.type==='added').forEach(change=>{
      const c=change.doc.data();if(rtc?.remoteDescription)rtc.addIceCandidate(c).catch(()=>{});else waiting.push(c);
    });
  },()=>{});
  callUnsub=F.onSnapshot(callRef,async snapshot=>{
    if(!snapshot.exists()||!call||!rtc)return;const data=snapshot.data();
    if(['ended','declined','unanswered','failed'].includes(data.status)){const incoming=call.incoming;cleanupCall();$('#overlay-root').innerHTML='';notify(data.status==='declined'?'The call was declined.':'Call ended.');return;}
    if(caller&&data.answer&&!rtc.currentRemoteDescription){try{await rtc.setRemoteDescription(data.answer);for(const c of waiting.splice(0))await rtc.addIceCandidate(c);}catch{}}
    if(!caller&&rtc.remoteDescription){for(const c of waiting.splice(0))rtc.addIceCandidate(c).catch(()=>{});}
  },error=>{notify(errorMessage(error));endCall('failed');});
}
let pendingCandidates=[];
async function acceptCall() {
  if(!call)return;
  call.status='connecting';renderCall();
  try{
    await setupPeer(call.video);rtc.onicecandidate=event=>{if(event.candidate)pendingCandidates.push(event.candidate.toJSON());};
    await rtc.setRemoteDescription(call.offer);const answer=await rtc.createAnswer();await rtc.setLocalDescription(answer);
    await F.updateDoc(F.doc(F.db,'calls',call.id),{answer:{type:answer.type,sdp:answer.sdp},status:'connecting'});wireSignaling(false);renderCall();
    callTimer=setTimeout(()=>{if(call&&call.status!=='connected'){notify('Couldn’t connect. A restrictive network may require a TURN relay.');endCall('failed');}},40000);
  }catch(error){notify(error.name==='NotAllowedError'?'Allow microphone access to answer.':errorMessage(error));endCall('failed');}
}
function renderCall() {
  if(!call)return;
  const incoming=call.incoming&&call.status==='ringing';
  const name=call.incoming?call.callerName:call.name;
  modal(incoming?'Someone’s calling.':call.video?'A little face time.':'A little closer.',`<div class="call-dialog">${call.video&&!incoming?'<div class="call-videos"><video class="remote" id="remote-video" autoplay playsinline></video><video class="local" id="local-video" autoplay playsinline muted></video></div>':avatar({displayName:name},'large')}<h2>${e(name)}</h2><div class="call-status" id="call-status">${incoming?`Incoming ${call.video?'video':'voice'} call`:call.status==='connected'?'Connected':call.status==='ringing'?'Calling…':call.status==='connecting'?'Connecting…':'Preparing microphone…'}</div><audio id="remote-audio" autoplay></audio><div class="call-controls">${incoming?`<button class="button primary" data-action="accept-call">${icon('Phone')}Answer</button>`:`${ib('Mic','Mute microphone','mute-call')}${call.video?ib('Video','Turn camera off','camera-call'):''}${ib('MonitorUp','Share screen','screen-call')}`}<button class="icon-button hangup" data-action="end-call" aria-label="${incoming?'Decline call':'End call'}" title="${incoming?'Decline call':'End call'}">${icon('PhoneOff')}</button></div><p class="call-note">Direct, peer-to-peer media. Calls need both people online. Some restrictive networks may not connect.</p></div>`,{wide:call.video});
  attachStreams();
}
function attachStreams() {
  if($('#local-video'))$('#local-video').srcObject=localStream;
  if($('#remote-video'))$('#remote-video').srcObject=remoteStream;
  if($('#remote-audio')&&!call?.video)$('#remote-audio').srcObject=remoteStream;
}
function cleanupCall() {
  clearTimeout(callTimer);callUnsub?.();candidateUnsub?.();callUnsub=null;candidateUnsub=null;
  rtc?.close();rtc=null;localStream?.getTracks().forEach(t=>t.stop());screenStream?.getTracks().forEach(t=>t.stop());screenStream=null;localStream=null;remoteStream=null;pendingCandidates=[];call=null;
}
async function endCall(status='ended') {
  const id=call?.id;cleanupCall();$('#overlay-root').innerHTML='';
  if(id&&online&&F)F.updateDoc(F.doc(F.db,'calls',id),{status}).catch(()=>{});
}
async function screenShare() {
  if(!rtc||!call)return;
  if(!navigator.mediaDevices.getDisplayMedia){notify('Screen sharing is not supported by this browser. Audio and video still work.');return;}
  try{const stream=await navigator.mediaDevices.getDisplayMedia({video:true});screenStream=stream;const track=stream.getVideoTracks()[0];const sender=rtc.getSenders().find(s=>s.track?.kind==='video');if(!sender){track.stop();notify('Start a video call to share your screen.');return;}await sender.replaceTrack(track);track.onended=()=>sender.replaceTrack(localStream?.getVideoTracks()[0]||null).catch(()=>{});notify('Your screen is being shared. Use the browser’s Stop sharing control to finish.');}catch(error){if(error.name!=='NotAllowedError')notify(errorMessage(error));}
}

document.addEventListener('click',async event=>{
  const room=event.target.closest('[data-room]');if(room){closeModal();openRoom(room.dataset.room);return;}
  const reaction=event.target.closest('[data-react]');if(reaction){reactToMessage(reaction.dataset.mid,reaction.dataset.react);return;}
  const image=event.target.closest('[data-image]');if(image){imageModal(image.dataset.image);return;}
  const mention=event.target.closest('[data-mention]');if(mention){draft+=`@${mention.dataset.mention} `;closeModal();render();$('#message-input')?.focus();return;}
  const jump=event.target.closest('[data-jump]');if(jump){mode='chat';closeModal();render();requestAnimationFrame(()=>$(`#message-${CSS.escape(jump.dataset.jump)}`)?.scrollIntoView({block:'center',behavior:'smooth'}));return;}
  const unsave=event.target.closest('[data-unsave]');if(unsave&&requireUser()){await F.deleteDoc(F.doc(F.db,'users',user.uid,'saved',unsave.dataset.unsave)).catch(error=>notify(errorMessage(error)));await loadSaved();render();return;}
  const openSaved=event.target.closest('[data-open-saved]');if(openSaved){const s=saved.find(s=>s.id===openSaved.dataset.openSaved);if(s)openRoom(s.roomId);return;}
  const button=event.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;
  if(action.includes(':')){const [kind,id]=action.split(':');messageAction(id,kind);return;}
  const actions={
    home:()=>{mode='chat';sidebarOpen=false;if(!current&&rooms.length)openRoom(rooms[0].id);else render();},
    discover:()=>{mode='discover';sidebarOpen=false;render();},spaces:()=>{mode='discover';sidebarOpen=false;render();},
    saved:()=>{mode='saved';sidebarOpen=false;render();},
    menu:()=>{sidebarOpen=!sidebarOpen;render();},
    details:()=>{showDetails=!showDetails;$('.app-shell').classList.toggle('show-details',showDetails);$('.app-shell').classList.toggle('no-details',!showDetails);},
    workspace:()=>modal('Your place, your pace.',`<p>Create a room for your people, join one with an invite, or start a direct conversation.</p><button class="nav-item" data-action="create-space">${icon('Plus')}Create a space</button><button class="nav-item" data-action="join-space">${icon('Link')}Join with an invite</button><button class="nav-item" data-action="create-dm">${icon('MessageCircle')}New direct message</button>`),
    login:loginModal,'google-login':doLogin,'close-modal':()=>{if(call)endCall(call.incoming&&call.status==='ringing'?'declined':'ended');else closeModal();},
    profile:profileModal,settings:settingsModal,help:helpModal,install:installApp,logout,
    'create-space':createSpaceModal,'create-dm':createDMModal,'join-space':()=>joinSpaceModal(),invite:inviteModal,search:searchModal,
    'copy-id':()=>copyText(user.uid),
    send:sendMessage,attach:()=>{if(requireUser())$('#file-input')?.click();},'attach-image':()=>{if(requireUser()){$('#file-input').accept='image/jpeg,image/png,image/webp,image/gif';$('#file-input').click();}},
    'remove-attachment':()=>{clearAttachment();render();},'cancel-reply':()=>{replyTo=null;render();},
    emoji:()=>{if(!requireUser())return;modal('Say it your way.',`<p>Choose a symbol to add to your message.</p><div style="display:flex;gap:var(--space-3)">${['♡','✦','☺','✓'].map(s=>`<button class="button" data-symbol="${s}" aria-label="Insert ${s}">${s}</button>`).join('')}</div>`);$$('[data-symbol]').forEach(b=>b.onclick=()=>{draft+=b.dataset.symbol;closeModal();render();$('#message-input')?.focus();});},
    mention:mentionModal,'toggle-theme':()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='light'?'dark':'light';button.setAttribute('aria-checked',String(document.documentElement.dataset.theme==='light'));},
    'toggle-offline':()=>toggleOffline(button),
    'voice-call':()=>startCall(false),'video-call':()=>startCall(true),'accept-call':acceptCall,'end-call':()=>endCall(call?.incoming&&call.status==='ringing'?'declined':'ended'),
    'mute-call':()=>{if(!localStream)return;const tracks=localStream.getAudioTracks();tracks.forEach(t=>t.enabled=!t.enabled);button.classList.toggle('active',!tracks[0]?.enabled);button.setAttribute('aria-label',tracks[0]?.enabled?'Mute microphone':'Unmute microphone');},
    'camera-call':()=>{if(!localStream)return;const tracks=localStream.getVideoTracks();tracks.forEach(t=>t.enabled=!t.enabled);button.classList.toggle('active',!tracks[0]?.enabled);button.setAttribute('aria-label',tracks[0]?.enabled?'Turn camera off':'Turn camera on');},
    'screen-call':screenShare,
  };
  try{await actions[action]?.();}catch(error){notify(errorMessage(error));}
});
document.addEventListener('click',event=>{if(event.target.classList.contains('overlay-backdrop')&&!call)closeModal();});
document.addEventListener('click',event=>{if(sidebarOpen&&!event.target.closest('.sidebar,.rail,.mobile-menu')){sidebarOpen=false;$('.app-shell')?.classList.remove('mobile-nav');}});
document.addEventListener('keydown',event=>{
  if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();searchModal();}
  if(event.key==='Escape'){if(!call)closeModal();if(sidebarOpen){sidebarOpen=false;render();}}
  if(event.key==='Tab'&&$('.dialog')){const focusable=$$('button,a,input,textarea,select,[tabindex="0"]',$('.dialog')).filter(el=>!el.disabled);const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
});
document.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement){event.target.style.opacity='.2';event.target.alt=event.target.alt||'Image unavailable';}},true);
window.addEventListener('offline',()=>{online=false;endCall();render();});
window.addEventListener('online',()=>{online=true;if(cachedUser&&F){authChanged(F.auth.currentUser);return;}if(user&&current&&!current.sample)openRoom(current.id);else render();});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installEvent=event;});
window.addEventListener('hashchange',()=>{const token=new URLSearchParams(location.hash.slice(1)).get('invite');if(token){if(user)joinSpaceModal(token);else loginModal();}});
window.addEventListener('resize',()=>{if(innerWidth>640&&sidebarOpen){sidebarOpen=false;$('.app-shell')?.classList.remove('mobile-nav');}const wide=innerWidth>1180;if(wide!==previousWide){showDetails=wide;previousWide=wide;$('.app-shell')?.classList.toggle('show-details',wide);$('.app-shell')?.classList.toggle('no-details',!wide);}});
window.addEventListener('pagehide',()=>{localStream?.getTracks().forEach(t=>t.stop());screenStream?.getTracks().forEach(t=>t.stop());});
render();

async function boot() {
  const profile=await cacheRead('profile');
  if(profile){offlineEnabled=true;if(!online){cachedUser=profile;rooms=await cacheRead(`${profile.uid}/rooms`)||[];current=rooms[0]||null;messages=current?await cacheRead(`${profile.uid}/messages/${current.id}`)||[]:[];render();}}
  try{const f=await firebase();f.onAuthStateChanged(f.auth,next=>{if(!online&&cachedUser){user=next?{...cachedUser}:null;return;}authChanged(next);});}
  catch(error){console.warn('Firebase is unavailable:',error.message);}
  if('serviceWorker' in navigator){try{await navigator.serviceWorker.register(asset('sw.js'),{scope:import.meta.env.BASE_URL});}catch(error){console.info('Install/offline features require a standalone secure origin.');}}
  const invite=new URLSearchParams(location.hash.slice(1)).get('invite');
  if(invite&&!user)loginModal();
}
boot();

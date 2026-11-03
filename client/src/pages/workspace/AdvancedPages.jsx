import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { io } from "socket.io-client";
import ReactMarkdown from "react-markdown";
import { MessageCircle, Send, Users, BookOpen, Plus, Save, Trash2, CalendarDays, ChevronLeft, ChevronRight, Download, ShieldCheck, UserRound, FolderKanban, MessagesSquare, FileText, RefreshCw } from "lucide-react";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const card = "rounded-2xl border border-white/[0.08] bg-[#111526] p-5";
const input = "w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/60";
const button = "inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50";
const subtle = "text-sm text-slate-400";
const messageOf = e => e.response?.data?.message || e.message || "Something went wrong";
function Shell({title, subtitle, children, action}) {
 return <DashboardLayout><div className="space-y-6"><header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-semibold tracking-[.18em] text-violet-300">STUDYCIRCLE COLLABORATION</p><h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{subtitle}</p></div>{action}</header>{children}</div></DashboardLayout>;
}
function GroupSelect({groups, value, onChange}) {
 return <select className={input} value={value} onChange={e=>onChange(e.target.value)}><option value="">Select a group</option>{groups.map(g=><option key={g._id} value={g._id}>{g.name}</option>)}</select>;
}
function useGroups() {
 const [groups,setGroups]=useState([]);
 useEffect(()=>{api.get("/dashboard").then(r=>setGroups(r.data.joinedGroups||[])).catch(()=>setGroups([]));},[]);
 return groups;
}

export function GroupChatPage() {
 const {groupId:routeGroupId}=useParams(); const groups=useGroups(); const {user}=useAuth();
 const [selectedGroupId,setSelectedGroupId]=useState(routeGroupId||"");
 const groupId=routeGroupId||selectedGroupId;
 const [group,setGroup]=useState(null),[messages,setMessages]=useState([]),[text,setText]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[connected,setConnected]=useState(false),[hasMore,setHasMore]=useState(false),[typingName,setTypingName]=useState("");
 const socketRef=useRef(null);
 const typingTimer=useRef(null);
 const token=localStorage.getItem("studycircle_token");
 useEffect(()=>{if(routeGroupId)setSelectedGroupId(routeGroupId);else if(!selectedGroupId&&groups.length)setSelectedGroupId(groups[0]._id);},[routeGroupId,groups,selectedGroupId]);
 useEffect(()=>{const found=groups.find(g=>g._id===groupId);if(found)setGroup(found);},[groups,groupId]);
 useEffect(()=>{
   if(!groupId||!token)return;
   let active=true;
   api.get(`/chat/${groupId}`).then(r=>{if(active){setMessages(r.data.messages||[]);setHasMore(Boolean(r.data.hasMore));}}).catch(e=>{if(active)setError(messageOf(e));});
   const socket=io(import.meta.env.VITE_API_SOCKET_URL||"http://localhost:5000",{auth:{token},transports:["websocket","polling"]});
   socketRef.current=socket;
   socket.on("connect",()=>{setConnected(true);socket.emit("group:join",groupId,result=>{if(!result?.success)setError(result?.message||"Could not join group chat");});});
   socket.on("disconnect",()=>setConnected(false));
   socket.on("connect_error",e=>setError(e.message||"Chat connection failed"));
   socket.on("chat:message",m=>setMessages(old=>old.some(x=>x._id===m._id)?old:[...old,m]));
   socket.on("chat:typing",event=>{
     if(String(event.groupId)!==String(groupId))return;
     setTypingName(event.name || "A member");
     clearTimeout(typingTimer.current);
     typingTimer.current=setTimeout(()=>setTypingName(""),1800);
   });
   socket.on("group:disabled",()=>setError("This study group has been disabled by an administrator."));
   return ()=>{active=false;socketRef.current=null;clearTimeout(typingTimer.current);socket.disconnect();setConnected(false);};
 },[groupId,token]);
 const loadOlder=async()=>{
   if(!messages.length||!hasMore)return;
   try{
     const before=encodeURIComponent(messages[0].createdAt);
     const r=await api.get(`/chat/${groupId}?limit=50&before=${before}`);
     setMessages(old=>[...(r.data.messages||[]),...old]);
     setHasMore(Boolean(r.data.hasMore));
   }catch(e){setError(messageOf(e));}
 };
 const handleTyping=value=>{
   setText(value);
   if(value.trim())socketRef.current?.emit("group:typing",{groupId});
 };
 const send=async e=>{e.preventDefault();if(!text.trim()||busy)return;setBusy(true);setError("");try{const r=await api.post(`/chat/${groupId}`,{content:text.trim()});setMessages(old=>old.some(x=>x._id===r.data.message._id)?old:[...old,r.data.message]);setText("");}catch(e){setError(messageOf(e));}finally{setBusy(false);}};
 return <Shell title="Group chat" subtitle={group?.name?`Live conversation for ${group.name}. Messages are saved and synchronized in real time.`:"Chat with members of your study group."}>
 <div className={card}>{!routeGroupId&&<div className="mb-4"><label className="mb-2 block text-xs uppercase tracking-wider text-slate-400">Choose a study group</label><GroupSelect groups={groups} value={selectedGroupId} onChange={v=>{setSelectedGroupId(v);setMessages([]);setError("");}}/></div>}<div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${connected?"bg-emerald-400":"bg-amber-400"}`}/><span className="text-sm text-slate-300">{connected?"Live connection":"Connecting…"}</span></div><Link to={`/groups/${groupId}`} className="text-sm text-violet-300 hover:text-white">Group workspace →</Link></div>
 {error&&<p className="mb-3 rounded-lg bg-rose-400/10 p-3 text-sm text-rose-300">{error}</p>}
 <div className="flex h-[55vh] min-h-[360px] flex-col gap-3 overflow-y-auto rounded-xl border border-white/[.06] bg-[#0b1020] p-3 sm:p-5">
 {hasMore&&<button onClick={loadOlder} className="mx-auto rounded-lg border border-white/10 px-3 py-2 text-xs text-violet-300 hover:bg-white/5">Load earlier messages</button>}
 {messages.length===0?<div className="m-auto text-center"><MessageCircle className="mx-auto mb-3 text-violet-300" size={30}/><p className="font-semibold">Start the conversation</p><p className={subtle}>Share a question, idea or useful update.</p></div>:messages.map(m=><div key={m._id} className={`flex ${String(m.sender?._id||m.sender)===String(user?.id||user?._id)?"justify-end":"justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${String(m.sender?._id||m.sender)===String(user?.id||user?._id)?"bg-violet-600/25":"bg-white/[.06]"}`}><div className="mb-1 flex items-center gap-2"><span className="text-xs font-semibold text-violet-200">{m.sender?.name||"Member"}</span><span className="text-[10px] text-slate-500">{new Date(m.createdAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span></div><p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{m.content}</p></div></div>)}</div>
 {typingName&&<p className="mt-2 text-xs text-emerald-300">{typingName} is typing…</p>}
 <form onSubmit={send} className="mt-4 flex gap-2"><input className={input} value={text} onChange={e=>handleTyping(e.target.value)} maxLength={3000} placeholder="Message your group…" aria-label="Message" /><button className={button} disabled={busy||!text.trim()||!groupId}><Send size={16}/><span className="hidden sm:inline">{busy?"Sending":"Send"}</span></button></form>
 </div></Shell>;
}

export function SharedNotesPage() {
 const {groupId:routeGroupId}=useParams(); const groups=useGroups();
 const [groupId,setGroupId]=useState(routeGroupId||""),[notes,setNotes]=useState([]),[selected,setSelected]=useState(null),[title,setTitle]=useState(""),[content,setContent]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{if(routeGroupId)setGroupId(routeGroupId);else if(!groupId&&groups.length)setGroupId(groups[0]._id);},[routeGroupId,groups]);
 const load=async()=>{if(!groupId)return;try{const r=await api.get(`/notes/group/${groupId}`);setNotes(r.data.notes||[]);}catch(e){setError(messageOf(e));}};
 useEffect(()=>{
   load();
   const token = localStorage.getItem("studycircle_token");
   if (!groupId || !token) return;
   const socket = io(import.meta.env.VITE_API_SOCKET_URL || "http://localhost:5000", { auth: { token }, transports: ["websocket", "polling"] });
   socket.on("connect", () => socket.emit("group:join", groupId));
   socket.on("notes:changed", event => {
     if (String(event.groupId) === String(groupId)) load();
   });
   return () => socket.disconnect();
 },[groupId]);
 const startNew=()=>{setSelected(null);setTitle("");setContent("");};
 const open=note=>{setSelected(note);setTitle(note.title);setContent(note.content||"");};
 const insert=(syntax)=>{const el=document.getElementById("note-editor");if(!el){setContent(v=>v+syntax);return;}const a=el.selectionStart,b=el.selectionEnd;setContent(v=>v.slice(0,a)+syntax+v.slice(b));el.focus();};
 const save=async e=>{e.preventDefault();setBusy(true);setError("");try{const payload={title,content};if(selected)await api.put(`/notes/${selected._id}`,payload);else await api.post("/notes",{...payload,groupId});await load();startNew();}catch(e){setError(messageOf(e));}finally{setBusy(false);}};
 const remove=async()=>{if(!selected||!confirm("Delete this shared note?"))return;try{await api.delete(`/notes/${selected._id}`);await load();startNew();}catch(e){setError(messageOf(e));}};
 return <Shell title="Shared notes" subtitle="Create group notes with Markdown formatting, live preview and shared editing. Changes are saved to the group workspace.">
 <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]"><aside className={`${card} h-fit`}><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Your groups</h2><BookOpen size={17} className="text-violet-300"/></div><GroupSelect groups={groups} value={groupId} onChange={v=>{setGroupId(v);startNew();}}/><div className="mt-5 flex items-center justify-between"><h3 className="text-sm font-semibold">Notes</h3><button onClick={startNew} className="rounded-lg bg-violet-500/15 p-2 text-violet-300"><Plus size={16}/></button></div><div className="mt-3 space-y-2">{notes.map(n=><button key={n._id} onClick={()=>open(n)} className={`w-full rounded-xl border p-3 text-left ${selected?._id===n._id?"border-violet-400/40 bg-violet-500/10":"border-white/[.06] bg-white/[.025] hover:bg-white/[.05]"}`}><p className="truncate text-sm font-semibold">{n.title}</p><p className="mt-1 text-xs text-slate-500">Updated {new Date(n.updatedAt).toLocaleDateString()}</p></button>)}{!notes.length&&<p className={subtle}>No shared notes yet.</p>}</div></aside>
 <section className={card}><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">{selected?"Edit shared note":"Create a shared note"}</h2><p className={`mt-1 ${subtle}`}>Markdown supported · preview updates as you type</p></div>{selected&&<button onClick={remove} className="rounded-lg p-2 text-rose-300 hover:bg-rose-400/10"><Trash2 size={17}/></button>}</div>{error&&<p className="mb-3 rounded-lg bg-rose-400/10 p-3 text-sm text-rose-300">{error}</p>}
 <form onSubmit={save} className="space-y-3"><input className={input} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Note title" maxLength={140} required/><div className="flex flex-wrap gap-2">{[["**bold**","Bold"],["_italic_","Italic"],["## Heading\n","Heading"],["- List item\n","List"],["`code`","Code"],["[link](https://example.com)","Link"]].map(([v,l])=><button type="button" key={l} onClick={()=>insert(v)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5">{l}</button>)}</div>
 <div className="grid gap-3 lg:grid-cols-2"><textarea id="note-editor" className={`${input} min-h-[360px] resize-y font-mono text-xs leading-6`} value={content} onChange={e=>setContent(e.target.value)} placeholder={"# Topic\\n\\nWrite your notes here…"} maxLength={30000}/><div className="min-h-[360px] overflow-auto rounded-xl border border-white/[.07] bg-[#0b1020] p-4"><p className="mb-3 text-[10px] font-semibold tracking-widest text-slate-500">LIVE PREVIEW</p><article className="prose prose-invert prose-sm max-w-none break-words"><ReactMarkdown>{content||"*Your formatted notes will appear here.*"}</ReactMarkdown></article></div></div>
 <div className="flex flex-wrap items-center justify-between gap-3"><p className={subtle}>Shared with members of this study group.</p><button className={button} disabled={busy||!groupId||!title.trim()}><Save size={16}/>{busy?"Saving…":"Save note"}</button></div></form>
 </section></div></Shell>;
}

export function CalendarPage() {
 const groups=useGroups(); const [month,setMonth]=useState(()=>new Date(new Date().getFullYear(),new Date().getMonth(),1)); const [events,setEvents]=useState([]); const [error,setError]=useState("");
 useEffect(()=>{if(!groups.length){setEvents([]);return;}Promise.all(groups.map(g=>api.get(`/sessions/group/${g._id}`).then(r=>(r.data.sessions||[]).map(s=>({...s,groupName:g.name}))).catch(()=>[]))).then(all=>setEvents(all.flat())).catch(e=>setError(messageOf(e)));},[groups]);
 const year=month.getFullYear(),m=month.getMonth(),first=new Date(year,m,1),days=new Date(year,m+1,0).getDate(),offset=(first.getDay()+6)%7;
 const byDay=useMemo(()=>events.reduce((acc,e)=>{const d=new Date(e.scheduledAt);const k=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;(acc[k]??=[]).push(e);return acc;},{}),[events]);
 const exportIcs=()=>{const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//StudyCircle//Study Calendar//EN",...events.map(e=>{const d=new Date(e.scheduledAt);const stamp=d.toISOString().replace(/[-:]/g,"").replace(/\\.\\d{3}/,"");const end=new Date(d.getTime()+(e.duration||60)*60000).toISOString().replace(/[-:]/g,"").replace(/\\.\\d{3}/,"");return ["BEGIN:VEVENT",`UID:${e._id}@studycircle`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,"").replace(/\\.\\d{3}/,"")}`,`DTSTART:${stamp}`,`DTEND:${end}`,`SUMMARY:${String(e.title).replace(/[,;]/g," ")}`,`DESCRIPTION:${String(e.description||"").replace(/\\n/g,"\\\\n")}`,`LOCATION:${e.groupName||"StudyCircle"}`,"END:VEVENT"].join("\\r\\n");}),"END:VCALENDAR"].join("\\r\\n");const url=URL.createObjectURL(new Blob([lines],{type:"text/calendar;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="studycircle-calendar.ics";a.click();URL.revokeObjectURL(url);};
 const monthEvents=events.filter(e=>{const d=new Date(e.scheduledAt);return d.getFullYear()===year&&d.getMonth()===m;}).sort((a,b)=>new Date(a.scheduledAt)-new Date(b.scheduledAt));
 return <Shell title="Study calendar" subtitle="See sessions across all your joined groups in one calendar. Export your schedule to Google Calendar, Apple Calendar or Outlook." action={<button className={button} onClick={exportIcs} disabled={!events.length}><Download size={16}/> Export .ics</button>}>
 <div className={card}><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-bold">{month.toLocaleDateString(undefined,{month:"long",year:"numeric"})}</h2><p className={subtle}>{monthEvents.length} sessions this month</p></div><div className="flex gap-2"><button className="rounded-lg border border-white/10 p-2" onClick={()=>setMonth(new Date(year,m-1,1))}><ChevronLeft size={18}/></button><button className="rounded-lg border border-white/10 p-2" onClick={()=>setMonth(new Date())}>Today</button><button className="rounded-lg border border-white/10 p-2" onClick={()=>setMonth(new Date(year,m+1,1))}><ChevronRight size={18}/></button></div></div>
 <div className="grid grid-cols-7 gap-1 sm:gap-2">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">{d}</div>)}{Array.from({length:offset},(_,i)=><div key={`blank-${i}`} className="min-h-20 rounded-lg bg-white/[.015] sm:min-h-28"/>)}{Array.from({length:days},(_,i)=>{const date=i+1;const dayEvents=byDay[`${year}-${m}-${date}`]||[];return <div key={date} className="min-h-20 overflow-hidden rounded-lg border border-white/[.06] bg-white/[.02] p-1.5 sm:min-h-28 sm:p-2"><span className={`text-xs ${date===new Date().getDate()&&m===new Date().getMonth()&&year===new Date().getFullYear()?"inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white":"text-slate-400"}`}>{date}</span><div className="mt-1 space-y-1">{dayEvents.slice(0,2).map(e=><div key={e._id} title={`${e.title} · ${e.groupName}`} className="truncate rounded bg-violet-500/20 px-1 py-1 text-[9px] text-violet-200 sm:text-[11px]">{new Date(e.scheduledAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})} {e.title}</div>)}{dayEvents.length>2&&<p className="text-[9px] text-slate-500">+{dayEvents.length-2} more</p>}</div></div>;})}</div></div>
 {error&&<p className="text-sm text-rose-300">{error}</p>}<div className="space-y-3"><h2 className="font-semibold">This month</h2>{monthEvents.length?monthEvents.map(e=><article key={e._id} className={`${card} flex flex-wrap items-center gap-4`}><div className="w-16 rounded-xl bg-violet-500/10 p-3 text-center"><p className="text-xs text-violet-300">{new Date(e.scheduledAt).toLocaleDateString(undefined,{month:"short"})}</p><p className="text-2xl font-bold">{new Date(e.scheduledAt).getDate()}</p></div><div className="min-w-0 flex-1"><h3 className="font-semibold">{e.title}</h3><p className={subtle}>{e.groupName} · {new Date(e.scheduledAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})} · {e.duration} min</p></div>{e.meetingLink&&<a className="text-sm text-violet-300" href={e.meetingLink} target="_blank" rel="noreferrer">Join meeting ↗</a>}</article>):<div className={card}><p className={subtle}>No sessions scheduled for this month.</p><Link className="mt-2 inline-flex text-sm text-violet-300" to="/sessions">Schedule a study session →</Link></div>}</div>
 </Shell>;
}

export function AdminPage() {
 const {user}=useAuth(); const [data,setData]=useState(null),[users,setUsers]=useState([]),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 const load=async()=>{setLoading(true);setError("");try{const [overview,userList]=await Promise.all([api.get("/admin/overview"),api.get("/admin/users")]);setData(overview.data);setUsers(userList.data.users||[]);}catch(e){setError(messageOf(e));}finally{setLoading(false);}};
 useEffect(()=>{if(user?.role==="admin")load();else setLoading(false);},[user?.role]);
 const toggleUser=async u=>{try{await api.patch(`/admin/users/${u._id}/status`,{isActive:!u.isActive});await load();}catch(e){setError(messageOf(e));}};
 const toggleGroup=async g=>{try{await api.patch(`/admin/groups/${g._id}/status`,{isActive:!g.isActive});await load();}catch(e){setError(messageOf(e));}};
 if(user?.role!=="admin")return <Shell title="Admin console" subtitle="Restricted administration area."><div className={card}><ShieldCheck className="mb-3 text-amber-300" size={28}/><h2 className="font-semibold">Administrator permission required</h2><p className={`mt-2 ${subtle}`}>This account does not have the admin role. An existing administrator must assign the role securely in the database.</p></div></Shell>;
 const stats=data?.stats||{};
 return <Shell title="Admin console" subtitle="Platform health, account moderation and community oversight." action={<button onClick={load} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300"><RefreshCw size={15} className="mr-2 inline"/>Refresh</button>}>
 {error&&<p className="rounded-xl bg-rose-400/10 p-3 text-sm text-rose-300">{error}</p>}{loading?<div className={card}>Loading moderation data…</div>:<>
 <div className="grid gap-3 grid-cols-2 xl:grid-cols-6">{[["Users",stats.users,UserRound],["Groups",stats.groups,FolderKanban],["Discussions",stats.discussions,MessagesSquare],["Resources",stats.resources,FileText],["Sessions",stats.sessions,CalendarDays],["Chat messages",stats.messages,MessageCircle]].map(([label,value,Icon])=><div key={label} className={card}><Icon className="mb-3 text-violet-300" size={19}/><p className="text-2xl font-bold">{value??0}</p><p className={subtle}>{label}</p></div>)}</div>
 <div className="grid gap-5 xl:grid-cols-2"><section className={card}><h2 className="mb-4 font-semibold">User moderation</h2><div className="space-y-2">{users.map(u=><div key={u._id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/[.03] p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{u.name} {u.role==="admin"&&<span className="text-violet-300">· Admin</span>}</p><p className="truncate text-xs text-slate-500">{u.email}</p></div><span className={`text-xs ${u.isActive?"text-emerald-300":"text-rose-300"}`}>{u.isActive?"Active":"Suspended"}</span>{u._id!==user.id&&u.role!=="admin"&&<button onClick={()=>toggleUser(u)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300">{u.isActive?"Suspend":"Reactivate"}</button>}</div>)}</div></section>
 <section className={card}><h2 className="mb-4 font-semibold">Group moderation</h2><div className="space-y-2">{(data?.recentGroups||[]).map(g=><div key={g._id} className="flex flex-wrap items-center gap-3 rounded-xl bg-white/[.03] p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{g.name}</p><p className="text-xs text-slate-500">{g.subject} · {g.members?.length||0} members</p></div><span className={`text-xs ${g.isActive?"text-emerald-300":"text-rose-300"}`}>{g.isActive?"Active":"Disabled"}</span><button onClick={()=>toggleGroup(g)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300">{g.isActive?"Disable":"Enable"}</button></div>)}</div></section></div>
 <div className="grid gap-5 xl:grid-cols-2"><section className={card}><h2 className="mb-4 font-semibold">Discussion moderation</h2><div className="space-y-2">{(data?.recentDiscussions||[]).map(d=><div key={d._id} className="flex items-start gap-3 rounded-xl bg-white/[.03] p-3"><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{d.title}</p><p className="mt-1 text-xs text-slate-500">{d.group?.name||"Group"} · {d.author?.name||"Member"}</p></div><button onClick={async()=>{if(!confirm("Remove this discussion?"))return;try{await api.delete(`/admin/discussions/${d._id}`);await load();}catch(e){setError(messageOf(e));}}} className="rounded-lg border border-rose-400/20 px-2.5 py-1.5 text-xs text-rose-300">Remove</button></div>)}</div></section>
 <section className={card}><h2 className="mb-4 font-semibold">Resource moderation</h2><div className="space-y-2">{(data?.recentResources||[]).map(r=><div key={r._id} className="flex items-start gap-3 rounded-xl bg-white/[.03] p-3"><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{r.title}</p><p className="mt-1 text-xs text-slate-500">{r.group?.name||"Group"} · {r.uploadedBy?.name||"Member"}</p></div><button onClick={async()=>{if(!confirm("Remove this resource?"))return;try{await api.delete(`/admin/resources/${r._id}`);await load();}catch(e){setError(messageOf(e));}}} className="rounded-lg border border-rose-400/20 px-2.5 py-1.5 text-xs text-rose-300">Remove</button></div>)}</div></section></div>
 <p className={subtle}>Admin actions are restricted by server-side role checks. Suspended users cannot authenticate; disabled groups are hidden from member workflows.</p>
 </>}
 </Shell>;
}

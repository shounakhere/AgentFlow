import { useCallback, useEffect, useState } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Activity, Bell, Bot, Boxes, ChevronLeft, ChevronRight,
  CircleHelp, Clock3, Cpu, FileText, FolderKanban,
  LayoutDashboard, MoreHorizontal, Network, Play, Plus,
  Search, Settings, Sparkles, Users, Zap, BarChart3, Database,
  Plug, ShieldCheck, Terminal, Undo2, Redo2, Save, Wand2,
  Workflow as WorkflowIcon, CheckCircle2, AlertCircle, PauseCircle,
  Timer, ArrowUpRight, Trash2, X, Paperclip, Send, MessageSquare,
  Globe, Braces, RotateCcw, Copy, SlidersHorizontal,
  Download, Wifi, WifiOff,
} from 'lucide-react'
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import './App.css'

type Agent = { id: number; name: string; role: string; description: string; model: string; status: 'Active' | 'Idle'; executions: number; success: number }
type Toast = { id: number; message: string }

const initialAgents: Agent[] = [
  { id: 1, name: 'Planner Agent', role: 'Planning', description: 'Task decomposition and strategic planning.', model: 'Qwen 2.5 32B', status: 'Active', executions: 384, success: 96 },
  { id: 2, name: 'Research Agent', role: 'Research', description: 'Research and information gathering.', model: 'Llama 3.2 70B', status: 'Active', executions: 291, success: 93 },
  { id: 3, name: 'Coder Agent', role: 'Coding', description: 'Code generation and debugging.', model: 'Qwen Coder 32B', status: 'Active', executions: 248, success: 95 },
  { id: 4, name: 'Analyst Agent', role: 'Analysis', description: 'Data analysis and reasoning.', model: 'Gemma 2 27B', status: 'Idle', executions: 206, success: 91 },
  { id: 5, name: 'Writer Agent', role: 'Writing', description: 'Content and report generation.', model: 'Llama 3.1 8B', status: 'Active', executions: 174, success: 97 },
  { id: 6, name: 'Reviewer Agent', role: 'Review', description: 'Quality control and output verification.', model: 'Qwen 2.5 32B', status: 'Active', executions: 151, success: 94 },
]

type AppState = {
  agents: Agent[]
  setAgents: (agents: Agent[]) => void
  workflows: { id: number; name: string; status: string; agents: number; last: string; duration: string }[]
  setWorkflows: (workflows: AppState['workflows']) => void
  toast: Toast | null
  notify: (message: string) => void
  clearToast: () => void
}

function Playground() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const send = () => {
    if (!input.trim()) return
    setMessages(m => [...m, { role: 'user', text: input }])
    setInput(''); setRunning(true)
    window.setTimeout(() => { setMessages(m => [...m, { role: 'assistant', text: 'Simulated response: The workflow plan is ready. Planner and Research agents would coordinate this task, followed by analysis and final review.' }]); setRunning(false) }, 900)
  }
  const prompts = ['Research the latest developments in AI agents.', 'Analyze a CSV dataset.', 'Generate a technical project report.', 'Review a Python codebase.', 'Create a development roadmap.']
  return <div className="playground"><aside className="conversation-list"><div className="conversation-head"><h2>Conversations</h2><button className="icon-btn"><Plus /></button></div><button className="new-chat" onClick={() => setMessages([])}><MessageSquare size={15} /> New conversation</button><button className="conversation active"><div><strong>Project research</strong><span>12 minutes ago</span></div></button><button className="conversation"><div><strong>Code review pipeline</strong><span>Yesterday</span></div></button><button className="conversation"><div><strong>Report generation</strong><span>Nov 18</span></div></button></aside>
    <main className="chat-main">{messages.length === 0 ? <div className="chat-welcome"><div className="welcome-mark"><Sparkles /></div><h1>Give your agents something to work on.</h1><p>Describe a task and let AgentFlow coordinate the execution.</p><div className="prompt-grid">{prompts.map(p => <button key={p} onClick={() => setInput(p)}><Sparkles size={14} />{p}</button>)}</div></div> : <div className="messages">{messages.map((m,i) => <div className={`message ${m.role}`} key={i}><div className="message-avatar">{m.role === 'user' ? 'DV' : <Bot size={16} />}</div><div><strong>{m.role === 'user' ? 'You' : 'AgentFlow'}</strong><p>{m.text}</p></div></div>)}{running && <div className="message assistant"><div className="message-avatar"><Bot /></div><div><strong>AgentFlow</strong><div className="typing"><i /><i /><i /></div></div></div>}</div>}
      <div className="chat-composer"><textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} placeholder="Describe a task for your agents..." /><div className="composer-actions"><button className="icon-btn"><Paperclip /></button><select><option>Qwen 2.5 32B</option><option>Llama 3.2 70B</option></select><select><option>Research Assistant</option><option>Code Review</option></select><button className="send-btn" onClick={send} disabled={!input.trim()}><Send size={16} /></button></div></div>
    </main>
    <aside className="activity-panel-right"><h3>Agent Activity <span>Simulation</span></h3>{[['Planner Agent','Completed','success'],['Research Agent','Running','running'],['Analyst Agent','Waiting','waiting'],['Reviewer Agent','Pending','pending']].map(([name,status,type]) => <div className="agent-activity-row" key={name}><div className={`activity-dot ${type}`}><Bot size={13} /></div><div><strong>{name}</strong><span>{status}</span></div><CheckCircle2 size={14} /></div>)}<h4>Execution timeline</h4><div className="timeline"><div className="done"><i /><span>Task received<small>0.2s</small></span></div><div className="done"><i /><span>Planner started<small>0.8s</small></span></div><div className="active"><i /><span>Research in progress<small>running</small></span></div><div><i /><span>Final review</span></div></div></aside>
  </div>
}

const executions = [
  { id:'EXC-8F2A1', workflow:'Research Assistant', status:'Completed', start:'Today, 10:42 AM', duration:'1m 24s', agents:4 },
  { id:'EXC-7C91D', workflow:'Code Review Pipeline', status:'Running', start:'Today, 10:38 AM', duration:'3m 08s', agents:3 },
  { id:'EXC-6A42B', workflow:'Data Analysis Workflow', status:'Completed', start:'Today, 10:21 AM', duration:'2m 42s', agents:5 },
  { id:'EXC-5D83F', workflow:'Content Generation', status:'Failed', start:'Today, 09:54 AM', duration:'48s', agents:3 },
  { id:'EXC-4B71C', workflow:'Automated Report Generator', status:'Completed', start:'Today, 09:12 AM', duration:'4m 11s', agents:4 },
]

function ExecutionsPage() {
  const [filter,setFilter] = useState('All')
  const [detail,setDetail] = useState<typeof executions[number] | null>(null)
  const filtered = executions.filter(e => filter === 'All' || e.status === filter)
  return <div className="page"><PageHeader title="Executions" subtitle="Monitor workflow runs and inspect execution details."><button className="secondary-btn"><Download size={15} /> Export</button></PageHeader>
    <div className="stats-grid exec-stats"><StatCard label="Total executions" value="1,284" detail="+18.4% this month" icon={Activity} /><StatCard label="Successful" value="1,217" detail="94.8% success rate" icon={CheckCircle2} /><StatCard label="Failed" value="67" detail="5.2% failure rate" icon={AlertCircle} /><StatCard label="Avg. duration" value="2m 18s" detail="-12s from last month" icon={Timer} /></div>
    <section className="panel"><div className="panel-header"><h2>Execution history</h2><div className="segmented">{['All','Completed','Running','Failed'].map(f => <button className={filter === f ? 'active' : ''} onClick={() => setFilter(f)} key={f}>{f}</button>)}</div></div><div className="table-wrap"><table><thead><tr><th>Execution ID</th><th>Workflow</th><th>Status</th><th>Start time</th><th>Duration</th><th>Agents</th><th /></tr></thead><tbody>{filtered.map(e => <tr key={e.id} onClick={() => setDetail(e)}><td><code>{e.id}</code></td><td>{e.workflow}</td><td><StatusBadge status={e.status} /></td><td>{e.start}</td><td>{e.duration}</td><td>{e.agents}</td><td><button className="text-btn">View <ChevronRight size={14} /></button></td></tr>)}</tbody></table></div></section>
    {detail && <div className="modal-backdrop" onMouseDown={() => setDetail(null)}><div className="execution-detail modal" onMouseDown={e => e.stopPropagation()}><div className="modal-header"><div><h2>{detail.id}</h2><p>{detail.workflow}</p></div><button className="icon-btn" onClick={() => setDetail(null)}><X /></button></div><div className="detail-summary"><StatusBadge status={detail.status} /><span><Clock3 /> {detail.duration}</span><span><Bot /> {detail.agents} agents</span></div><div className="mini-workflow"><div>Manual <small>Trigger</small></div><ChevronRight /><div>Planner <small>Completed</small></div><ChevronRight /><div>Research <small>Completed</small></div><ChevronRight /><div>Reviewer <small>{detail.status === 'Failed' ? 'Failed' : 'Completed'}</small></div></div><h3>Execution log</h3><div className="log-lines"><code>10:42:01  Workflow execution started</code><code>10:42:02  Planner Agent received task</code><code>10:42:18  Research Agent completed 12 sources</code><code>10:43:05  Analyst Agent generated summary</code><code>10:43:25  {detail.status === 'Failed' ? 'Reviewer Agent failed validation' : 'Workflow completed successfully'}</code></div></div></div>}
  </div>
}

function ModelsPage() {
  const { notify } = useStore()
  const models = [
    {name:'Qwen Instruct',provider:'Ollama',ctx:'32K',local:true,status:'Available'},
    {name:'Llama Instruct',provider:'Hugging Face',ctx:'128K',local:false,status:'Available'},
    {name:'Gemma Instruct',provider:'Local inference',ctx:'8K',local:true,status:'Demo'},
  ]
  return <div className="page"><PageHeader title="Models & Providers" subtitle="Manage model providers and local inference connections."><button className="primary-btn" onClick={() => notify('Model refresh requested (demo)')}><RotateCcw size={15} /> Refresh models</button></PageHeader>
    <div className="provider-grid">{[
      ['Ollama','Local model runtime','Local',Wifi],['Hugging Face','Open model ecosystem','Cloud',Globe],['Local Inference','Custom model endpoints','Local',Cpu]
    ].map(([name,desc,kind,Icon]: any) => <section className="provider-card" key={name}><div className="provider-head"><div className="provider-icon"><Icon /></div><span className="demo-pill">{kind}</span></div><h3>{name}</h3><p>{desc}</p><button className="secondary-btn" onClick={() => notify(`${name} configuration opened (demo)`)}>Configure</button></section>)}</div>
    <section className="panel"><div className="panel-header"><div><h2>Ollama connection</h2><p>Demonstration connection settings</p></div><span className="offline-pill"><WifiOff size={13} /> Not connected</span></div><div className="ollama-config"><label>Base URL<div className="input-with-icon"><Globe size={15} /><input defaultValue="http://localhost:11434" /></div></label><label>Default model<select><option>Qwen 2.5 32B</option><option>Llama 3.2 70B</option></select></label><button className="secondary-btn" onClick={() => notify('Ollama connection check (demo)')}>Test connection</button></div></section>
    <section className="panel"><div className="panel-header"><div><h2>Model registry</h2><p>Available demonstration models</p></div></div><div className="model-grid">{models.map(m => <article className="model-card" key={m.name}><div className="model-head"><div className="model-icon"><Cpu /></div><span className={m.status === 'Available' ? 'available' : 'demo-status'}>{m.status}</span></div><h3>{m.name}</h3><p>{m.provider}</p><div className="model-meta"><span>Context <strong>{m.ctx}</strong></span><span>{m.local ? 'Local' : 'Cloud'}</span></div></article>)}</div></section>
  </div>
}

function IntegrationsPage() {
  const { notify } = useStore()
  const [enabled,setEnabled] = useState<Record<string,boolean>>({'Web Search':true,'Python Executor':true,'File Reader':true,'CSV Analyzer':false,'HTTP Request':true,'MCP Server':false})
  const tools = [
    ['Search','Web Search','Search the public web and current sources.',Globe],
    ['Coding','Python Executor','Execute Python in an isolated environment.',Terminal],
    ['File management','File Reader','Read and extract text from local files.',FileText],
    ['Data analysis','CSV Analyzer','Inspect and analyze structured datasets.',Database],
    ['APIs','HTTP Request','Send requests to external APIs.',Braces],
    ['MCP integrations','MCP Server','Connect tools through Model Context Protocol.',Plug],
  ] as const
  return <div className="page"><PageHeader title="Tools & Integrations" subtitle="Enable capabilities and connect services to your agents."><button className="primary-btn" onClick={() => notify('Integration marketplace opened (demo)')}><Plus size={15} /> Add integration</button></PageHeader>
    <div className="integration-grid">{tools.map(([category,name,desc,Icon]) => <article className="integration-card" key={name}><div className="integration-head"><div className="integration-icon"><Icon /></div><label className="toggle"><input type="checkbox" checked={enabled[name]} onChange={() => setEnabled(v => ({...v,[name]:!v[name]}))}/><i /></label></div><span className="integration-category">{category}</span><h3>{name}</h3><p>{desc}</p><div className="integration-footer"><span className={enabled[name]?'connected':'disconnected'}><i />{enabled[name]?'Enabled':'Disabled'}</span><button className="text-btn" onClick={() => notify(`${name} configuration opened (demo)`)}>Configure <ArrowUpRight size={13}/></button></div></article>)}</div>
  </div>
}

function SettingsPage() {
  const { notify } = useStore()
  const [section,setSection] = useState('General')
  const sections = [['General',Settings],['Appearance',Sparkles],['Model defaults',Cpu],['Agent execution',Bot],['Workflow preferences',WorkflowIcon],['Notifications',Bell]] as const
  return <div className="page settings-page"><PageHeader title="Settings" subtitle="Configure your AgentFlow workspace preferences."/><div className="settings-layout"><aside className="settings-nav">{sections.map(([name,Icon]) => <button key={name} className={section===name?'active':''} onClick={()=>setSection(name)}><Icon size={16}/>{name}</button>)}</aside><main className="settings-content"><section className="panel"><div className="panel-header"><div><h2>{section}</h2><p>Workspace configuration</p></div></div><div className="settings-form"><label>Workspace name<input defaultValue="Developer Workspace"/></label><label>Workspace description<textarea rows={3} defaultValue="AI agent orchestration for engineering workflows."/></label><label>Default timezone<select><option>UTC +05:30 — Kolkata</option><option>UTC — London</option></select></label><div className="toggle-row"><span><strong>Enable desktop notifications</strong><small>Receive updates for workflow events</small></span><label className="toggle"><input type="checkbox" defaultChecked/><i/></label></div><div className="toggle-row"><span><strong>Auto-save workflows</strong><small>Save changes every 30 seconds</small></span><label className="toggle"><input type="checkbox" defaultChecked/><i/></label></div></div><div className="settings-actions"><button className="secondary-btn">Cancel</button><button className="primary-btn" onClick={() => notify('Settings saved locally')}><Save size={15}/> Save changes</button></div></section></main></div></div>
}

function AnalyticsPage() {
  const volume = [{d:'Mon',v:142},{d:'Tue',v:188},{d:'Wed',v:164},{d:'Thu',v:221},{d:'Fri',v:196},{d:'Sat',v:168},{d:'Sun',v:205}]
  const agentData = [{name:'Planner',v:96},{name:'Research',v:93},{name:'Coder',v:95},{name:'Analyst',v:91},{name:'Writer',v:97},{name:'Reviewer',v:94}]
  const pieData = [{name:'Success',value:94.8},{name:'Failed',value:5.2}]
  return <div className="page"><PageHeader title="Analytics" subtitle="Demonstration analytics across your workspace."><button className="secondary-btn"><Download size={15} /> Export report</button></PageHeader>
    <div className="stats-grid"><StatCard label="Execution volume" value="1,284" detail="+18.4% this month" icon={Activity} /><StatCard label="Avg. execution" value="2m 18s" detail="-12s improvement" icon={Timer} /><StatCard label="Agent utilization" value="78.2%" detail="Across 12 agents" icon={Cpu} /><StatCard label="Cost estimate" value="$42.60" detail="Demonstration only" icon={BarChart3} /></div>
    <div className="analytics-grid"><section className="panel chart-panel"><div className="panel-header"><div><h2>Workflow executions</h2><p>Execution volume over time</p></div><select><option>Last 7 days</option></select></div><div className="chart"><ResponsiveContainer><AreaChart data={volume}><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={.35}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#252733" vertical={false}/><XAxis dataKey="d" stroke="#777b8c" tickLine={false}/><YAxis stroke="#777b8c" tickLine={false}/><Tooltip contentStyle={{background:'#171922',border:'1px solid #303342',borderRadius:8}}/><Area type="monotone" dataKey="v" stroke="#9b7cf5" fill="url(#chartFill)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></section>
    <section className="panel chart-panel"><div className="panel-header"><div><h2>Success vs. failure</h2><p>All workflow executions</p></div></div><div className="pie-wrap"><ResponsiveContainer><PieChart><Pie data={pieData} innerRadius={70} outerRadius={94} dataKey="value" paddingAngle={3}>{pieData.map((_,i) => <Cell key={i} fill={i ? '#ef6a7a' : '#8b5cf6'} />)}</Pie><Tooltip contentStyle={{background:'#171922',border:'1px solid #303342',borderRadius:8}}/></PieChart></ResponsiveContainer><div className="pie-center"><strong>94.8%</strong><span>success</span></div></div></section>
    <section className="panel chart-panel wide"><div className="panel-header"><div><h2>Agent performance comparison</h2><p>Success rate by agent</p></div></div><div className="chart"><ResponsiveContainer><BarChart data={agentData} layout="vertical"><CartesianGrid stroke="#252733" horizontal={false}/><XAxis type="number" domain={[0,100]} stroke="#777b8c" tickLine={false}/><YAxis type="category" dataKey="name" width={70} stroke="#777b8c" tickLine={false}/><Tooltip contentStyle={{background:'#171922',border:'1px solid #303342',borderRadius:8}}/><Bar dataKey="v" fill="#7c62d9" radius={[0,4,4,0]} barSize={18}/></BarChart></ResponsiveContainer></div></section></div>
  </div>
}

const useStore = create<AppState>()(persist((set) => ({
  agents: initialAgents,
  setAgents: (agents) => set({ agents }),
  workflows: [
    { id: 1, name: 'Research Assistant', status: 'Completed', agents: 4, last: '2 min ago', duration: '1m 24s' },
    { id: 2, name: 'Code Review Pipeline', status: 'Running', agents: 3, last: '5 min ago', duration: '3m 08s' },
    { id: 3, name: 'Data Analysis Workflow', status: 'Completed', agents: 5, last: '18 min ago', duration: '2m 42s' },
    { id: 4, name: 'Content Generation', status: 'Failed', agents: 3, last: '1 hr ago', duration: '48s' },
    { id: 5, name: 'Automated Report Generator', status: 'Pending', agents: 4, last: '3 hr ago', duration: '—' },
  ],
  setWorkflows: (workflows) => set({ workflows }),
  toast: null,
  notify: (message) => set({ toast: { id: Date.now(), message } }),
  clearToast: () => set({ toast: null }),
}), { name: 'agentflow-state' }))

function StatusBadge({ status }: { status: string }) {
  const icon = status === 'Running' ? <Activity /> : status === 'Failed' ? <AlertCircle /> : status === 'Pending' ? <PauseCircle /> : <CheckCircle2 />
  return <span className={`status status-${status.toLowerCase()}`}>{icon}{status}</span>
}

function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const sections = [
    { title: 'WORKSPACE', items: [
      ['Overview', '/', LayoutDashboard], ['Workflows', '/workflows', WorkflowIcon],
      ['Agents', '/agents', Bot], ['AI Playground', '/playground', Sparkles],
    ] },
    { title: 'MONITORING', items: [['Executions', '/executions', Terminal], ['Analytics', '/analytics', BarChart3]] },
    { title: 'CONFIGURATION', items: [['Models & Providers', '/models', Cpu], ['Tools & Integrations', '/integrations', Plug], ['Settings', '/settings', Settings]] },
  ] as const
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <div className="brand-mark"><Network size={19} /></div>
        {!collapsed && <div><strong>AgentFlow</strong><span>AI ORCHESTRATION</span></div>}
      </div>
      <nav>
        {sections.map(section => (
          <div className="nav-section" key={section.title}>
            {!collapsed && <div className="nav-label">{section.title}</div>}
            {section.items.map(([label, path, Icon]) => (
              <NavLink key={path} to={path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title={collapsed ? label : undefined}>
                <Icon size={17} /><span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="profile" title="Account settings">
          <div className="avatar">DV</div>{!collapsed && <div className="profile-copy"><strong>Dev User</strong><span>Developer workspace</span></div>}<Settings size={15} />
        </button>
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight /> : <ChevronLeft />} {!collapsed && 'Collapse'}</button>
      </div>
    </aside>
  )
}

function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const names: Record<string, string> = { '/': 'Overview', '/workflows': 'Workflows', '/agents': 'Agents', '/playground': 'AI Playground', '/executions': 'Executions', '/analytics': 'Analytics', '/models': 'Models & Providers', '/integrations': 'Tools & Integrations', '/settings': 'Settings' }
  const [palette, setPalette] = useState(false)
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(v => !v) } }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  return (
    <>
      <header className="topbar">
        <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={13} /><strong>{names[location.pathname] || 'Page'}</strong></div>
        <button className="global-search" onClick={() => setPalette(true)}><Search size={16} /><span>Search anything...</span><kbd>⌘ K</kbd></button>
        <div className="top-actions">
          <button className="icon-btn" title="Notifications"><Bell size={17} /><i /></button>
          <button className="icon-btn" title="Help"><CircleHelp size={17} /></button>
          <button className="primary-btn" onClick={() => navigate('/workflows')}><Plus size={16} /> New Workflow</button>
        </div>
      </header>
      {palette && <div className="modal-backdrop" onMouseDown={() => setPalette(false)}><div className="command-palette" onMouseDown={e => e.stopPropagation()}>
        <div className="command-input"><Search size={18} /><input autoFocus placeholder="Search pages and actions..." /></div>
        <div className="command-list">{Object.entries(names).map(([path, name]) => <button key={path} onClick={() => { navigate(path); setPalette(false) }}><FolderKanban size={16} /> {name}<ChevronRight size={14} /></button>)}</div>
      </div></div>}
    </>
  )
}

function PageHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return <div className="page-header"><div><h1>{title}</h1><p>{subtitle}</p></div><div className="header-actions">{children}</div></div>
}

function StatCard({ label, value, detail, icon: Icon, trend }: { label: string; value: string; detail: string; icon: React.ElementType; trend?: number[] }) {
  return <section className="stat-card"><div className="stat-head"><span>{label}</span><div className="stat-icon"><Icon size={17} /></div></div><div className="stat-body"><strong>{value}</strong>{trend && <div className="sparkline">{trend.map((v, i) => <i key={i} style={{ height: `${v}%` }} />)}</div>}</div><div className="stat-detail"><span>{detail}</span><em>Demo</em></div></section>
}

function Dashboard() {
  const navigate = useNavigate()
  const { workflows, agents } = useStore()
  const activity = [
    ['Planner Agent', 'completed task decomposition', '2 min ago', 'success'],
    ['Research Agent', 'started web research', '5 min ago', 'running'],
    ['Coder Agent', 'completed code review', '12 min ago', 'success'],
    ['Reviewer Agent', 'failed quality validation', '18 min ago', 'failed'],
  ] as const
  return (
    <div className="page">
      <PageHeader title="Good morning, Developer" subtitle="Monitor your agents, workflows and automation activity.">
        <button className="secondary-btn" onClick={() => navigate('/agents')}><Bot size={16} /> Create Agent</button>
        <button className="primary-btn" onClick={() => navigate('/workflows')}><Plus size={16} /> Create Workflow</button>
      </PageHeader>
      <div className="stats-grid">
        <StatCard label="Total Agents" value="12" detail="8 active" icon={Bot} trend={[35,48,42,61,55,72,68,82]} />
        <StatCard label="Workflows" value="24" detail="6 currently running" icon={WorkflowIcon} trend={[28,36,52,44,58,64,56,74]} />
        <StatCard label="Tasks Executed" value="1,284" detail="+18.4% from last month" icon={Zap} trend={[20,31,28,46,42,58,64,76]} />
        <StatCard label="Success Rate" value="94.8%" detail="+2.1% from last month" icon={ShieldCheck} trend={[62,58,66,64,70,68,74,78]} />
      </div>
      <div className="dashboard-grid">
        <section className="panel workflow-panel">
          <div className="panel-header"><div><h2>Workflow Activity</h2><p>Latest workflow executions</p></div><button className="text-btn" onClick={() => navigate('/executions')}>View all <ArrowUpRight size={14} /></button></div>
          <div className="table-wrap"><table><thead><tr><th>Workflow name</th><th>Status</th><th>Agents</th><th>Last executed</th><th>Duration</th><th /></tr></thead><tbody>
            {workflows.map(w => <tr key={w.id} onClick={() => navigate('/executions')}><td><div className="workflow-name"><div className="workflow-icon"><WorkflowIcon size={14} /></div>{w.name}</div></td><td><StatusBadge status={w.status} /></td><td><div className="agent-stack">{[0,1,2].slice(0, Math.min(w.agents, 3)).map(i => <i key={i}>{['P','R','C'][i]}</i>)}</div></td><td>{w.last}</td><td>{w.duration}</td><td><button className="icon-btn small"><MoreHorizontal size={16} /></button></td></tr>)}
          </tbody></table></div>
        </section>
        <section className="panel activity-panel">
          <div className="panel-header"><div><h2>Recent Activity</h2><p>Live workspace events</p></div><button className="icon-btn small"><MoreHorizontal /></button></div>
          <div className="activity-feed">{activity.map(([name, action, time, type], i) => <div className="activity-row" key={i}><div className={`activity-dot ${type}`}><Bot size={14} /></div><div><strong>{name}</strong><span>{action}</span></div><time>{time}</time></div>)}</div>
        </section>
      </div>
      <section className="panel performance-panel">
        <div className="panel-header"><div><h2>Agent Performance</h2><p>Execution health across active agents</p></div><button className="text-btn" onClick={() => navigate('/agents')}>Manage agents <ArrowUpRight size={14} /></button></div>
        <div className="performance-grid">{agents.slice(0,5).map((a, i) => <div className="performance-card" key={a.id}><div className="performance-head"><div className={`agent-avatar av-${i}`}><Bot size={16} /></div><div><strong>{a.name}</strong><span><i className={a.status === 'Active' ? 'online' : ''} />{a.status}</span></div></div><div className="performance-stats"><div><span>Executions</span><strong>{a.executions}</strong></div><div><span>Success</span><strong>{a.success}%</strong></div><div><span>Avg. time</span><strong>{(1.1 + i * .35).toFixed(1)}s</strong></div></div></div>)}</div>
      </section>
    </div>
  )
}

function WorkflowsPage() {
  const { workflows, setWorkflows, notify } = useStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const filtered = workflows.filter(w => w.name.toLowerCase().includes(search.toLowerCase()))
  const createWorkflow = () => {
    const w = { id: Date.now(), name: 'Untitled Workflow', status: 'Pending', agents: 0, last: 'Never', duration: '—' }
    setWorkflows([w, ...workflows])
    navigate(`/workflows/${w.id}`)
  }
  return <div className="page">
    <PageHeader title="Workflows" subtitle="Build, organize and run your agent workflows.">
      <button className="primary-btn" onClick={createWorkflow}><Plus size={16} /> Create Workflow</button>
    </PageHeader>
    <div className="toolbar"><div className="search-box"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search workflows..." /></div><button className="secondary-btn"><SlidersHorizontal size={15} /> Filters</button></div>
    <div className="workflow-grid">{filtered.map(w => <article className="workflow-card" key={w.id}><div className="workflow-card-head"><div className="workflow-icon large"><WorkflowIcon /></div><button className="icon-btn small"><MoreHorizontal /></button></div><h3>{w.name}</h3><StatusBadge status={w.status} /><div className="workflow-meta"><span><Users size={14} /> {w.agents} agents</span><span><Clock3 size={14} /> {w.last}</span></div><div className="workflow-card-actions"><button className="secondary-btn" onClick={() => navigate(`/workflows/${w.id}`)}><Wand2 size={15} /> Edit</button><button className="icon-btn" onClick={() => notify(`${w.name} test started (simulation)`)}><Play size={16} /></button></div></article>)}</div>
  </div>
}

function AgentModal({ agent, onClose }: { agent?: Agent; onClose: () => void }) {
  const { agents, setAgents, notify } = useStore()
  const [name, setName] = useState(agent?.name || '')
  const [description, setDescription] = useState(agent?.description || '')
  const [role, setRole] = useState(agent?.role || 'Planning')
  const [model, setModel] = useState(agent?.model || 'Qwen 2.5 32B')
  const [temperature, setTemperature] = useState(0.7)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (agent) setAgents(agents.map(a => a.id === agent.id ? { ...a, name, description, role, model } : a))
    else setAgents([...agents, { id: Date.now(), name, description, role, model, status: 'Active', executions: 0, success: 100 }])
    notify(agent ? 'Agent updated' : 'Agent created')
    onClose()
  }
  return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal agent-modal" onMouseDown={e => e.stopPropagation()} onSubmit={submit}><div className="modal-header"><div><h2>{agent ? 'Configure Agent' : 'Create Agent'}</h2><p>Define behavior and execution settings</p></div><button type="button" className="icon-btn" onClick={onClose}><X /></button></div><div className="form-grid">
    <label className="full">Agent name<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Research Agent" required /></label>
    <label className="full">Description<input value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this agent do?" /></label>
    <label>Agent role<select value={role} onChange={e => setRole(e.target.value)}>{['Planning','Research','Coding','Analysis','Writing','Review'].map(v => <option key={v}>{v}</option>)}</select></label>
    <label>Model<select value={model} onChange={e => setModel(e.target.value)}>{['Qwen 2.5 32B','Llama 3.2 70B','Qwen Coder 32B','Gemma 2 27B'].map(v => <option key={v}>{v}</option>)}</select></label>
    <label className="full">System prompt<textarea rows={4} defaultValue="You are a specialized AgentFlow agent. Complete your assigned task accurately and return structured output." /></label>
    <label className="range-label">Temperature <span>{temperature}</span><input type="range" min="0" max="1" step="0.1" value={temperature} onChange={e => setTemperature(Number(e.target.value))} /></label>
    <label>Maximum iterations<input type="number" defaultValue={10} min={1} /></label>
  </div><div className="toggle-row"><span><strong>Memory enabled</strong><small>Persist context across executions</small></span><label className="toggle"><input type="checkbox" defaultChecked /><i /></label></div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" type="submit">{agent ? 'Save Changes' : 'Create Agent'}</button></div></form></div>
}

function AgentsPage() {
  const { agents, setAgents, notify } = useStore()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [modal, setModal] = useState<Agent | 'new' | null>(null)
  const filtered = agents.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) && (status === 'All' || a.status === status))
  const remove = (id: number) => { setAgents(agents.filter(a => a.id !== id)); notify('Agent deleted') }
  return <div className="page"><PageHeader title="AI Agents" subtitle="Create and manage specialized agents in your workspace."><button className="primary-btn" onClick={() => setModal('new')}><Plus size={16} /> Create Agent</button></PageHeader>
    <div className="toolbar"><div className="search-box"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..." /></div><select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}><option>All</option><option>Active</option><option>Idle</option></select></div>
    <div className="agent-grid">{filtered.map((a, i) => <article className="agent-card" key={a.id}><div className="agent-card-head"><div className={`agent-avatar av-${i % 5}`}><Bot /></div><span className={`agent-status ${a.status.toLowerCase()}`}><i />{a.status}</span><button className="icon-btn small"><MoreHorizontal /></button></div><h3>{a.name}</h3><p>{a.description}</p><div className="agent-model"><Cpu size={14} /> {a.model}</div><div className="agent-metrics"><div><span>Executions</span><strong>{a.executions}</strong></div><div><span>Success rate</span><strong>{a.success}%</strong></div></div><div className="workflow-card-actions"><button className="secondary-btn" onClick={() => setModal(a)}><SlidersHorizontal size={15} /> Configure</button><button className="icon-btn danger" onClick={() => remove(a.id)} title="Delete agent"><Trash2 size={16} /></button></div></article>)}</div>
    {modal && <AgentModal agent={modal === 'new' ? undefined : modal} onClose={() => setModal(null)} />}
  </div>
}

const initialNodes: Node[] = [
  { id:'1', type:'default', position:{x:40,y:180}, data:{label:'Manual Trigger'}, style:{width:168} },
  { id:'2', type:'default', position:{x:280,y:180}, data:{label:'Planner Agent'}, style:{width:168} },
  { id:'3', type:'default', position:{x:520,y:180}, data:{label:'Research Agent'}, style:{width:168} },
  { id:'4', type:'default', position:{x:760,y:180}, data:{label:'Analyst Agent'}, style:{width:168} },
  { id:'5', type:'default', position:{x:1000,y:180}, data:{label:'Reviewer Agent'}, style:{width:168} },
  { id:'6', type:'default', position:{x:1240,y:180}, data:{label:'Text Output'}, style:{width:168} },
]
const initialEdges: Edge[] = [
  { id:'e1-2', source:'1', target:'2', animated:true }, { id:'e2-3', source:'2', target:'3', animated:true },
  { id:'e3-4', source:'3', target:'4', animated:true }, { id:'e4-5', source:'4', target:'5', animated:true },
  { id:'e5-6', source:'5', target:'6', animated:true },
]

function WorkflowBuilder() {
  const { notify } = useStore()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selected, setSelected] = useState<Node | null>(null)
  const [name, setName] = useState('Research Assistant')
  const onConnect = useCallback((connection: Connection) => setEdges(eds => addEdge({ ...connection, animated: true }, eds)), [setEdges])
  const addNode = (label: string) => {
    setNodes(ns => [...ns, { id: `node-${Date.now()}`, type: 'default', position: { x: 420 + ns.length * 12, y: 380 }, data: { label }, style: { width: 168 } }])
  }
  const duplicate = () => {
    if (!selected) return
    setNodes(ns => [...ns, { ...selected, id: `node-${Date.now()}`, position: { x: selected.position.x + 40, y: selected.position.y + 40 }, selected: false }])
  }
  const save = () => {
    localStorage.setItem('agentflow-workflow', JSON.stringify({ name, nodes, edges }))
    notify('Workflow saved locally')
  }
  const nodeGroups = [
    { title:'TRIGGERS', nodes:['Manual Trigger','Chat Input','Scheduled Trigger'] },
    { title:'AI AGENTS', nodes:['Planner Agent','Researcher Agent','Coder Agent','Analyst Agent','Writer Agent','Reviewer Agent','Custom Agent'] },
    { title:'LOGIC', nodes:['Conditional Branch','Router','Parallel Execution','Merge'] },
    { title:'TOOLS', nodes:['Web Search','Python Executor','File Reader','API Request'] },
    { title:'OUTPUT', nodes:['Text Output','Report Generator','End Workflow'] },
  ]
  return <div className="builder">
    <header className="builder-toolbar"><div className="builder-title"><button className="icon-btn"><ChevronLeft /></button><WorkflowIcon size={17} /><input value={name} onChange={e => setName(e.target.value)} /><StatusBadge status="Pending" /></div><div className="builder-actions"><button className="icon-btn" title="Undo"><Undo2 /></button><button className="icon-btn" title="Redo"><Redo2 /></button><span /><button className="secondary-btn" onClick={() => notify('Test run started (simulation)')}><Play size={15} /> Test</button><button className="primary-btn" onClick={save}><Save size={15} /> Save</button><button className="run-btn" onClick={() => notify('Workflow run started (simulation)')}><Zap size={15} /> Run</button></div></header>
    <div className="builder-body"><aside className="node-library"><div className="library-search"><Search size={15} /><input placeholder="Search nodes" /></div>{nodeGroups.map(group => <div className="node-group" key={group.title}><h4>{group.title}</h4>{group.nodes.map(label => <button draggable onDragStart={e => e.dataTransfer.setData('text/plain', label)} onClick={() => addNode(label)} className="library-node" key={label}><div><Boxes size={15} /></div><span>{label}</span><Plus size={13} /></button>)}</div>)}</aside>
      <main className="flow-canvas"><ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(_, node) => setSelected(node)} fitView className="reactflow-dark"><Background gap={20} size={1} /><Controls /><MiniMap pannable zoomable /></ReactFlow></main>
      {selected && <aside className="config-panel"><div className="config-header"><div><span>NODE CONFIGURATION</span><h3>{String(selected.data.label)}</h3></div><button className="icon-btn" onClick={() => setSelected(null)}><X /></button></div><div className="config-form"><label>Node name<input defaultValue={String(selected.data.label)} /></label><label>Agent role<select><option>Planning</option><option>Research</option><option>Analysis</option></select></label><label>Model<select><option>Qwen 2.5 32B</option><option>Llama 3.2 70B</option></select></label><label>System instructions<textarea rows={5} defaultValue="Complete the assigned task and return structured, actionable output." /></label><label className="range-label">Temperature <span>0.7</span><input type="range" /></label><label className="range-label">Maximum iterations <span>10</span><input type="range" min="1" max="20" defaultValue="10" /></label><div className="toggle-row"><span>Memory enabled</span><label className="toggle"><input type="checkbox" defaultChecked /><i /></label></div><div className="config-actions"><button className="secondary-btn" onClick={() => setNodes(ns => ns.filter(n => n.id !== selected.id))}><Trash2 size={15} /> Delete</button><button className="secondary-btn" onClick={duplicate}><Copy size={15} /> Duplicate</button></div></div></aside>}
    </div>
  </div>
}

function AppShell() {
  const [collapsed,setCollapsed] = useState(false)
  const { toast, clearToast } = useStore()
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(clearToast, 2600)
    return () => window.clearTimeout(timer)
  }, [toast, clearToast])
  return <div className={`app-shell ${collapsed?'sidebar-collapsed':''}`}><Sidebar collapsed={collapsed} setCollapsed={setCollapsed}/><div className="app-main"><Topbar/><Routes><Route path="/" element={<Dashboard/>}/><Route path="/workflows" element={<WorkflowsPage/>}/><Route path="/workflows/:id" element={<ReactFlowProvider><WorkflowBuilder/></ReactFlowProvider>}/><Route path="/agents" element={<AgentsPage/>}/><Route path="/playground" element={<Playground/>}/><Route path="/executions" element={<ExecutionsPage/>}/><Route path="/analytics" element={<AnalyticsPage/>}/><Route path="/models" element={<ModelsPage/>}/><Route path="/integrations" element={<IntegrationsPage/>}/><Route path="/settings" element={<SettingsPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></div>{toast && <div className="toast"><CheckCircle2 size={16}/>{toast.message}</div>}</div>
}

export default function App() {
  return <BrowserRouter><AppShell/></BrowserRouter>
}

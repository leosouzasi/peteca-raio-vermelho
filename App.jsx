import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://bdnpkywrlomenawgvxku.supabase.co',
  'sb_publishable_5z2GQX5fxrNFqtLQCyTP0A_ta5AhIb4'
)

const PIX = '13067675630'
const LIMITE_PADRAO = 18
const jogadoresPadrao = ['Luiza','Pedro','Anna Júlia','Clara','Ruth','Antonio','Weber','Tiago','Carol','Rodrigo','Rafael','Leo','Paulinho','Shirley','Bárbara','Gustavo','Giseli','Emilly','Bryan','Brunno','Bruno Gi','Lucas M.','Luide','Ayrton','Mateus','Jhon','Jeff','Ayer','Tavares']

function inicial(nome){ return nome ? nome.trim()[0].toUpperCase() : '?' }
function normalizarNome(nome){ return String(nome || '').trim().replace(/\s+/g, ' ') }
function formatarData(data){
  if(!data) return ''
  const d = new Date(data)
  return d.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).replace(',', ' -')
}
function embaralhar(lista){ return [...lista].sort(() => Math.random() - 0.5) }
function pontosNivel(nivel){ if(nivel==='Avançado') return 4; if(nivel==='Intermediário alto') return 3; if(nivel==='Intermediário') return 2; return 1 }

export default function App(){
  const [eventos,setEventos]=useState([])
  const [eventoId,setEventoId]=useState('')
  const [presencas,setPresencas]=useState([])
  const [jogadores,setJogadores]=useState([])
  const [nome,setNome]=useState(localStorage.getItem('lobos_nome')||'')
  const [nomeManual,setNomeManual]=useState('')
  const [modoOutroNome,setModoOutroNome]=useState(false)
  const [pagamento,setPagamento]=useState('nao_paguei')
  const [mensagem,setMensagem]=useState('')
  const [carregando,setCarregando]=useState(false)
  const [pixAberto,setPixAberto]=useState(false)
  const [adminAberto,setAdminAberto]=useState(false)
  const [adminLogado,setAdminLogado]=useState(localStorage.getItem('lobos_admin')==='sim')
  const [usuarioAdmin,setUsuarioAdmin]=useState('')
  const [senhaAdmin,setSenhaAdmin]=useState('')
  const [novaData,setNovaData]=useState('')
  const [novoLimite,setNovoLimite]=useState(LIMITE_PADRAO)
  const [adminNome,setAdminNome]=useState('')
  const [adminNomeManual,setAdminNomeManual]=useState('')
  const [cadastroAberto,setCadastroAberto]=useState(false)
  const [historico,setHistorico]=useState([])
  const [historicoAberto,setHistoricoAberto]=useState(false)
  const [times,setTimes]=useState([])
  const [sorteando,setSorteando]=useState(false)

  useEffect(()=>{ carregarTudo() },[])
  useEffect(()=>{ if(eventoId) carregarPresencas(eventoId) },[eventoId])

  async function carregarTudo(){ await carregarJogadores(); await carregarEventos(); await carregarHistorico() }
  async function carregarEventos(){
    const {data}=await supabase.from('volei_eventos').select('*').eq('aberto',true).order('data_evento',{ascending:true})
    const lista=data||[]; setEventos(lista); if(!eventoId && lista.length>0) setEventoId(lista[0].id)
  }
  async function carregarHistorico(){
    const {data}=await supabase.from('volei_eventos').select('*').eq('aberto',false).order('data_evento',{ascending:false}).limit(30)
    setHistorico(data||[])
  }
  async function carregarJogadores(){
    const {data,error}=await supabase.from('volei_jogadores').select('id,nome,sexo,nivel').order('nome',{ascending:true})
    if(error || !data || data.length===0){ setJogadores(jogadoresPadrao.map(nome=>({nome,sexo:'M',nivel:'Intermediário'}))); return }
    const nomesBanco=data.map(j=>j.nome).filter(Boolean)
    const faltantes=jogadoresPadrao.filter(p=>!nomesBanco.some(n=>n.toLowerCase()===p.toLowerCase())).map(nome=>({nome,sexo:'M',nivel:'Intermediário'}))
    setJogadores([...data,...faltantes].sort((a,b)=>a.nome.localeCompare(b.nome)))
  }
  async function carregarPresencas(id){
    const {data}=await supabase.from('volei_presencas').select('*').eq('evento_id',id)
    const lista=(data||[]).sort((a,b)=>{ const sa=a.status==='espera'?1:0; const sb=b.status==='espera'?1:0; if(sa!==sb) return sa-sb; return a.jogador.localeCompare(b.jogador) })
    setPresencas(lista)
  }

  const eventoSelecionado=useMemo(()=>eventos.find(e=>e.id===eventoId),[eventos,eventoId])
  const nomeAtual=normalizarNome(modoOutroNome?nomeManual:nome)
  const minhaPresenca=useMemo(()=>presencas.find(p=>p.jogador?.toLowerCase()===nomeAtual?.toLowerCase()),[presencas,nomeAtual])
  const confirmados=presencas.filter(p=>p.status!=='espera')
  const espera=presencas.filter(p=>p.status==='espera')
  const limiteVagas=Number(eventoSelecionado?.limite_vagas||LIMITE_PADRAO)
  const vagasRestantes=Math.max(limiteVagas-confirmados.length,0)
  const eventoLotado=vagasRestantes<=0
  const timesPublicos=useMemo(()=>{ if(!eventoSelecionado?.times) return []; return String(eventoSelecionado.times).split('\n\n').filter(Boolean).map(b=>b.split('\n').filter(Boolean)) },[eventoSelecionado])

  function aviso(texto){ setMensagem(texto); setTimeout(()=>setMensagem(''),3500) }
  function copiarPix(mostrarMsg=true){ navigator.clipboard.writeText(PIX); if(mostrarMsg) aviso('Pix copiado: '+PIX) }
  async function salvarJogadorSeNovo(nomeJogador){
    const limpo=normalizarNome(nomeJogador); if(!limpo) return
    if(jogadores.some(j=>j.nome?.toLowerCase()===limpo.toLowerCase())) return
    await supabase.from('volei_jogadores').insert([{nome:limpo,sexo:'M',nivel:'Intermediário'}]); await carregarJogadores()
  }
  async function confirmarPresenca(){
    const limpo=nomeAtual; if(!eventoId) return aviso('Escolha um vôlei primeiro.'); if(!limpo) return aviso('Escolha ou digite seu nome.')
    if(presencas.find(p=>p.jogador?.toLowerCase()===limpo.toLowerCase())){ setNome(limpo); localStorage.setItem('lobos_nome',limpo); setPixAberto(true); copiarPix(false); return aviso('Você já está na lista 😎') }
    const status=eventoLotado?'espera':'confirmado'; const pixPago=pagamento==='mensal'||pagamento==='pago'
    setCarregando(true); await salvarJogadorSeNovo(limpo)
    const {error}=await supabase.from('volei_presencas').insert([{evento_id:eventoId,jogador:limpo,status,pix_pago:pixPago,tipo_pagamento:pagamento}])
    setCarregando(false); if(error) return aviso('Não consegui confirmar presença.')
    setNome(limpo); localStorage.setItem('lobos_nome',limpo); await carregarPresencas(eventoId)
    if(!pixPago){ setPixAberto(true); copiarPix(false) }
    aviso(status==='espera'?'Lista cheia! Você entrou na espera.':'Presença confirmada 🐺')
  }
  async function retirarNome(){
    if(!minhaPresenca) return aviso('Seu nome ainda não está na lista.')
    const {error}=await supabase.from('volei_presencas').delete().eq('id',minhaPresenca.id)
    if(error) return aviso('Não consegui retirar seu nome.')
    await carregarPresencas(eventoId); await promoverPrimeiroDaEspera(); aviso('Nome retirado da lista.')
  }
  async function promoverPrimeiroDaEspera(){
    const {data}=await supabase.from('volei_presencas').select('*').eq('evento_id',eventoId)
    const lista=data||[]; const conf=lista.filter(p=>p.status!=='espera'); const esp=lista.filter(p=>p.status==='espera').sort((a,b)=>new Date(a.criado_em)-new Date(b.criado_em))
    if(conf.length<limiteVagas && esp.length>0){ await supabase.from('volei_presencas').update({status:'confirmado'}).eq('id',esp[0].id); await carregarPresencas(eventoId); aviso(`${esp[0].jogador} saiu da espera e entrou na lista.`) }
  }
  async function marcarPixPago(){
    if(!minhaPresenca) return aviso('Confirme presença antes de marcar pagamento.')
    const {error}=await supabase.from('volei_presencas').update({pix_pago:true,tipo_pagamento:'pago'}).eq('id',minhaPresenca.id)
    if(error) return aviso('Não consegui marcar como pago.')
    await carregarPresencas(eventoId); setPixAberto(false); aviso('Pagamento marcado como pago ✅')
  }
  function loginAdmin(){ const user=usuarioAdmin.trim().toLowerCase(); const ok=(user==='leo'&&senhaAdmin==='1234')||(user==='luiza'&&senhaAdmin==='741852')||(user==='pedro'&&senhaAdmin==='963852'); if(!ok) return aviso('Usuário ou senha inválidos.'); localStorage.setItem('lobos_admin','sim'); setAdminLogado(true); aviso('Admin logado.') }
  function sairAdmin(){ localStorage.removeItem('lobos_admin'); setAdminLogado(false) }
  async function criarEvento(){
    if(!novaData) return aviso('Escolha data e hora.'); const dataEvento=new Date(novaData); const nomeEvento='Vôlei '+formatarData(dataEvento)
    const {error}=await supabase.from('volei_eventos').insert([{nome:nomeEvento,data_evento:novaData,aberto:true,limite_vagas:Number(novoLimite||LIMITE_PADRAO),times:''}])
    if(error) return aviso('Não consegui criar o evento.'); setNovaData(''); setNovoLimite(LIMITE_PADRAO); await carregarTudo(); aviso('Vôlei criado 🐺')
  }
  async function fecharEvento(id){ const {error}=await supabase.from('volei_eventos').update({aberto:false}).eq('id',id); if(error) return aviso('Não consegui fechar o evento.'); if(eventoId===id){ setEventoId(''); setPresencas([]) } await carregarTudo(); aviso('Evento encerrado.') }
  async function reabrirEvento(id){ const {error}=await supabase.from('volei_eventos').update({aberto:true}).eq('id',id); if(error) return aviso('Não consegui reabrir.'); await carregarTudo(); aviso('Evento reaberto.') }
  async function atualizarSexo(jogador,sexo){ await supabase.from('volei_jogadores').update({sexo}).eq('nome',jogador.nome); await carregarJogadores() }
  async function atualizarNivel(jogador,nivel){ await supabase.from('volei_jogadores').update({nivel}).eq('nome',jogador.nome); await carregarJogadores() }
  async function adminMarcarPago(p){ await supabase.from('volei_presencas').update({pix_pago:!p.pix_pago,tipo_pagamento:!p.pix_pago?'pago':'nao_paguei'}).eq('id',p.id); await carregarPresencas(eventoId) }
  async function adminPromover(p){ if(vagasRestantes<=0) return aviso('Não tem vaga livre.'); await supabase.from('volei_presencas').update({status:'confirmado'}).eq('id',p.id); await carregarPresencas(eventoId) }
  async function adminMoverParaEspera(p){ await supabase.from('volei_presencas').update({status:'espera'}).eq('id',p.id); await carregarPresencas(eventoId) }
  async function adminAdicionarJogador(){
    const limpo=normalizarNome(adminNomeManual||adminNome); if(!limpo) return aviso('Escolha ou digite um nome.'); if(!eventoId) return aviso('Escolha um evento.')
    if(presencas.find(p=>p.jogador?.toLowerCase()===limpo.toLowerCase())) return aviso('Esse nome já está nesse vôlei.')
    const status=eventoLotado?'espera':'confirmado'; await salvarJogadorSeNovo(limpo)
    const {error}=await supabase.from('volei_presencas').insert([{evento_id:eventoId,jogador:limpo,status,pix_pago:false,tipo_pagamento:'nao_paguei'}])
    if(error) return aviso('Não consegui adicionar.'); setAdminNome(''); setAdminNomeManual(''); await carregarPresencas(eventoId); aviso(status==='espera'?'Jogador foi para espera.':'Jogador adicionado.')
  }
  function jogadorInfo(nomeJogador){ const j=jogadores.find(x=>x.nome?.toLowerCase()===nomeJogador?.toLowerCase()); const nivel=j?.nivel||'Intermediário'; return {nome:nomeJogador,sexo:j?.sexo||'M',nivel,pontos:pontosNivel(nivel)} }
  function sortearTimesBalanceados(){
    const lista=confirmados.map(p=>jogadorInfo(p.jogador)); const embaralhados=embaralhar(lista).sort((a,b)=>b.pontos-a.pontos)
    const timesBase=[{nome:'Time 1',jogadores:[],pontos:0,mulheres:0},{nome:'Time 2',jogadores:[],pontos:0,mulheres:0},{nome:'Time 3',jogadores:[],pontos:0,mulheres:0}]
    embaralhados.forEach(jogador=>{ const ordenados=[...timesBase].sort((a,b)=>{ if(a.jogadores.length!==b.jogadores.length) return a.jogadores.length-b.jogadores.length; if(jogador.sexo==='F'&&a.mulheres!==b.mulheres) return a.mulheres-b.mulheres; return a.pontos-b.pontos }); const escolhido=ordenados[0]; escolhido.jogadores.push(jogador); escolhido.pontos+=jogador.pontos; if(jogador.sexo==='F') escolhido.mulheres+=1 })
    return timesBase
  }
  async function sortearTimes(){
    if(confirmados.length<6) return aviso('Precisa de pelo menos 6 confirmados para sortear.'); setSorteando(true); setTimes([])
    setTimeout(async()=>{ const resultado=sortearTimesBalanceados(); setTimes(resultado); setSorteando(false); const texto=resultado.map(time=>{ const linhas=time.jogadores.map(j=>`- ${j.nome} (${j.nivel})`); return `${time.nome}\n${linhas.join('\n')}` }).join('\n\n'); await supabase.from('volei_eventos').update({times:texto}).eq('id',eventoId); await carregarEventos(); aviso('Times sorteados e publicados 🐺') },1500)
  }
  async function limparSorteio(){ await supabase.from('volei_eventos').update({times:''}).eq('id',eventoId); setTimes([]); await carregarEventos(); aviso('Sorteio limpo.') }

  return <div className="app"><div className="container">
    <header className="hero"><div className="raio">🐺</div><h1>Lobos Vôlei</h1><p>Quem vai pra quadra hoje?</p></header>
    {mensagem && <div className="toast">{mensagem}</div>}

    <section className="card"><h2>📅 Próximos Vôleis</h2>{eventos.length===0?<p className="muted">Nenhum vôlei aberto ainda.</p>:<select value={eventoId} onChange={e=>setEventoId(e.target.value)}>{eventos.map(ev=><option key={ev.id} value={ev.id}>{ev.nome}</option>)}</select>}{eventoSelecionado&&<div className="event-box"><div><strong>{eventoSelecionado.nome}</strong><span>{formatarData(eventoSelecionado.data_evento)}</span></div><div className="vagas"><strong>{confirmados.length}/{limiteVagas}</strong><span>{vagasRestantes>0?`faltam ${vagasRestantes} vagas`:`lista cheia • ${espera.length} na espera`}</span></div></div>}</section>

    <section className="card"><h2>👤 Seu nome</h2>{nome&&!modoOutroNome?<div className="profile"><div className="avatar">{inicial(nome)}</div><div><strong>Olá, {nome}</strong><button className="link" onClick={()=>{localStorage.removeItem('lobos_nome');setNome('');setNomeManual('');setModoOutroNome(false)}}>trocar nome</button></div></div>:<div><select value={modoOutroNome?'__outro__':nome} onChange={e=>{ if(e.target.value==='__outro__'){setModoOutroNome(true);setNome('');setNomeManual('');localStorage.removeItem('lobos_nome')}else{setModoOutroNome(false);setNome(e.target.value);setNomeManual('');if(e.target.value)localStorage.setItem('lobos_nome',e.target.value)}}}><option value="">Escolha seu nome</option>{jogadores.map(j=><option key={j.nome} value={j.nome}>{j.nome}</option>)}<option value="__outro__">Não estou na lista</option></select>{modoOutroNome&&<input className="manual-name" placeholder="Digite seu nome" value={nomeManual} onChange={e=>setNomeManual(e.target.value)}/>}</div>}<h3>Pagamento</h3><div className="payment-options"><button className={pagamento==='mensal'?'paid':'ghost'} onClick={()=>setPagamento('mensal')}>Sou mensal</button><button className={pagamento==='pago'?'paid':'ghost'} onClick={()=>setPagamento('pago')}>Já paguei</button><button className={pagamento==='nao_paguei'?'danger':'ghost'} onClick={()=>setPagamento('nao_paguei')}>Não paguei</button></div><div className="actions"><button className="primary" disabled={carregando||!eventoId||(!nome&&!nomeManual)} onClick={confirmarPresenca}>✅ Confirmar presença / Pix</button><button className="danger" disabled={carregando||!minhaPresenca} onClick={retirarNome}>❌ Retirar meu nome</button></div></section>

    {pixAberto&&<section className="card pix"><h2>💸 Faz o Pix</h2><div className="pix-key">{PIX}</div><button className="primary" onClick={()=>copiarPix(true)}>📋 Copiar chave Pix</button><button className="paid" onClick={marcarPixPago}>✅ Já paguei</button><button className="ghost" onClick={()=>setPixAberto(false)}>Depois</button></section>}

    <section className="card"><h2>🔥 Confirmados</h2>{confirmados.length===0?<p className="muted">Ninguém confirmou ainda.</p>:<div className="players">{confirmados.map((p,index)=><div className="player" key={p.id}><div className="numero">{index+1}</div><div className="avatar small">{inicial(p.jogador)}</div><span>{p.jogador}</span><span className="status confirmado">Confirmado</span><span className={p.pix_pago?'status pago':'status pendente'}>{p.tipo_pagamento==='mensal'?'Mensal':p.pix_pago?'Pago':'Pendente'}</span></div>)}</div>}</section>
    {espera.length>0&&<section className="card wait"><h2>⏳ Lista de espera</h2><div className="players">{espera.map((p,index)=><div className="player wait-player" key={p.id}><div className="numero">{index+1}</div><div className="avatar small">{inicial(p.jogador)}</div><span>{p.jogador}</span><span className="status espera">Espera</span></div>)}</div></section>}
    {timesPublicos.length>0&&<section className="card sorteio-publico"><h2>🎲 Times sorteados</h2>{timesPublicos.map((time,i)=><div className="time-box" key={i}>{time.map((linha,idx)=>idx===0?<h3 key={idx}>{linha}</h3>:<div key={idx}>{linha}</div>)}</div>)}</section>}

    <section className="card"><button className="admin-toggle" onClick={()=>setAdminAberto(!adminAberto)}>👑 Área Admin</button>{adminAberto&&!adminLogado&&<div className="admin-login"><input placeholder="usuário" value={usuarioAdmin} onChange={e=>setUsuarioAdmin(e.target.value)}/><input placeholder="senha" type="password" value={senhaAdmin} onChange={e=>setSenhaAdmin(e.target.value)}/><button className="primary" onClick={loginAdmin}>Entrar</button></div>}{adminAberto&&adminLogado&&<div className="admin-panel"><button className="ghost" onClick={sairAdmin}>Sair do admin</button><h3>Criar novo Vôlei</h3><input type="datetime-local" value={novaData} onChange={e=>setNovaData(e.target.value)}/><input type="number" min="6" placeholder="Número de vagas" value={novoLimite} onChange={e=>setNovoLimite(e.target.value)}/><button className="primary" onClick={criarEvento}>Criar vôlei</button><h3>Adicionar jogador na lista</h3><select value={adminNome} onChange={e=>setAdminNome(e.target.value)}><option value="">Escolha um jogador</option>{jogadores.map(j=><option key={j.nome} value={j.nome}>{j.nome}</option>)}</select><input placeholder="Ou digite novo nome" value={adminNomeManual} onChange={e=>setAdminNomeManual(e.target.value)}/><button className="primary" onClick={adminAdicionarJogador}>Adicionar jogador</button><button className="ghost" onClick={()=>setCadastroAberto(!cadastroAberto)}>{cadastroAberto?'Ocultar jogadores':'👥 Definir sexo e nível'}</button>{cadastroAberto&&<><h3>Sexo e nível</h3>{jogadores.map(j=><div className="admin-row nivel-row" key={j.nome}><span>{j.nome}</span><div className="nivel-controls"><select className="sexo-select" value={j.sexo||'M'} onChange={e=>atualizarSexo(j,e.target.value)}><option value="M">Masculino</option><option value="F">Feminino</option></select><select className="nivel-select" value={j.nivel||'Intermediário'} onChange={e=>atualizarNivel(j,e.target.value)}><option value="Avançado">Avançado</option><option value="Intermediário alto">Intermediário alto</option><option value="Intermediário">Intermediário</option><option value="Iniciante">Iniciante</option></select></div></div>)}</>}<h3>Eventos abertos</h3>{eventos.map(ev=><div className="admin-row" key={ev.id}><span>{ev.nome} • {ev.limite_vagas||LIMITE_PADRAO} vagas</span><button className="danger mini" onClick={()=>fecharEvento(ev.id)}>Fechar</button></div>)}<button className="ghost" onClick={()=>setHistoricoAberto(!historicoAberto)}>{historicoAberto?'Ocultar encerrados':'📜 Ver eventos encerrados'}</button>{historicoAberto&&<><h3>Histórico</h3>{historico.map(ev=><div className="admin-row" key={ev.id}><span>{ev.nome}</span><button className="ghost mini" onClick={()=>reabrirEvento(ev.id)}>Reabrir</button></div>)}</>}<h3>Pagamentos e lista</h3>{presencas.map((p,index)=><div className="admin-row" key={p.id}><span>{index+1}. {p.jogador} [{p.status==='espera'?'Espera':'Confirmado'}]</span><div className="admin-actions">{p.status==='espera'?<button className="paid mini" onClick={()=>adminPromover(p)}>Promover</button>:<button className="ghost mini" onClick={()=>adminMoverParaEspera(p)}>Mover p/ espera</button>}<button className={p.pix_pago?'paid mini':'ghost mini'} onClick={()=>adminMarcarPago(p)}>{p.tipo_pagamento==='mensal'?'Mensal':p.pix_pago?'Pago':'Pendente'}</button></div></div>)}<h3>Sorteio de times</h3><button className="primary" onClick={sortearTimes}>🎲 Sortear 3 times</button><button className="ghost" onClick={limparSorteio}>Limpar sorteio público</button>{sorteando&&<div className="shuffle">Montando times equilibrados... 🐺</div>}{times.map((time,i)=><div className="time-box" key={i}><h3>{time.nome} — {time.pontos} pontos</h3>{time.jogadores.map((j,idx)=><div key={idx}>- {j.nome} ({j.nivel})</div>)}</div>)}</div>}</section>
  </div></div>
}

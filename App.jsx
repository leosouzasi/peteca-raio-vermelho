import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://oxoisszxawezocahjayi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94b2lzc3p4YXdlem9jYWhqYXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODE5MTgsImV4cCI6MjA5MzQ1NzkxOH0.DCTsSSB9mrRHJb5TIW1NBPhTD_-b4SetkpsYvawj6M0'
)

const jogadoresPadrao = [
  'Analice','Bruno','Camila','Diamante','Douglas','Geane','Leo',
  'Leonan','Samuel','Tata','Tavares','Victor','Welington'
]

const PIX = '38988364439'

function formatarData(data) {
  if (!data) return ''
  const d = new Date(data)
  return d.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', ' -')
}

function inicial(nome) {
  return nome ? nome.trim()[0].toUpperCase() : '?'
}

function normalizarNome(nome) {
  return String(nome || '').trim().replace(/\s+/g, ' ')
}

function embaralhar(lista) {
  return [...lista].sort(() => Math.random() - 0.5)
}

export default function App() {
  const [eventos, setEventos] = useState([])
  const [eventoId, setEventoId] = useState('')
  const [presencas, setPresencas] = useState([])
  const [jogadores, setJogadores] = useState([])
  const [rankingFrequencia, setRankingFrequencia] = useState([])
  const [nome, setNome] = useState(localStorage.getItem('peteca_nome') || '')
  const [nomeManual, setNomeManual] = useState('')
  const [modoOutroNome, setModoOutroNome] = useState(false)
  const [pixAberto, setPixAberto] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [adminAberto, setAdminAberto] = useState(false)
  const [adminLogado, setAdminLogado] = useState(localStorage.getItem('peteca_admin') === 'sim')
  const [usuarioAdmin, setUsuarioAdmin] = useState('')
  const [senhaAdmin, setSenhaAdmin] = useState('')
  const [novaData, setNovaData] = useState('')
  const [novoLimite, setNovoLimite] = useState(12)
  const [adminNome, setAdminNome] = useState('')
  const [adminNomeManual, setAdminNomeManual] = useState('')
  const [duplas, setDuplas] = useState([])
  const [sorteando, setSorteando] = useState(false)
  const [historico, setHistorico] = useState([])
  const [historicoAberto, setHistoricoAberto] = useState(false)
  const [listaChurrasco, setListaChurrasco] = useState([])
  const [nomeChurrascoAdmin, setNomeChurrascoAdmin] = useState('')
  const [sexoAberto, setSexoAberto] = useState(false)

  useEffect(() => { carregarTudo() }, [])
  useEffect(() => {
    if (eventoId) {
      carregarPresencas(eventoId)
      carregarChurrasco(eventoId)
    }
  }, [eventoId])
  useEffect(() => { if (adminLogado) carregarRankingFrequencia() }, [adminLogado])

  async function carregarTudo() {
    await carregarJogadores()
    await carregarEventosAbertos()
    await carregarHistorico()
    await carregarRankingFrequencia()
  }

  async function carregarEventosAbertos() {
    const { data } = await supabase.from('eventos').select('*').eq('aberto', true).order('data_evento', { ascending: true })
    const listaEventos = data || []
    setEventos(listaEventos)
    if (!eventoId && listaEventos.length > 0) setEventoId(listaEventos[0].id)
  }

  async function carregarHistorico() {
    const { data } = await supabase.from('eventos').select('*').eq('aberto', false).order('data_evento', { ascending: false }).limit(20)
    setHistorico(data || [])
  }

  async function carregarRankingFrequencia() {
    const { data } = await supabase.from('presencas').select('jogador,status')
    const mapa = {}
    ;(data || []).forEach(p => {
      if (!p.jogador) return
      if (p.status === 'espera') return
      mapa[p.jogador] = (mapa[p.jogador] || 0) + 1
    })
    const ranking = Object.entries(mapa)
      .map(([jogador, total]) => ({ jogador, total }))
      .sort((a,b) => b.total - a.total || a.jogador.localeCompare(b.jogador))
    setRankingFrequencia(ranking)
  }

  async function carregarJogadores() {
    const { data, error } = await supabase.from('jogadores').select('id,nome,sexo,nivel').order('nome', { ascending: true })
    if (error || !data || data.length === 0) {
      setJogadores(jogadoresPadrao.map(nome => ({ nome, sexo: 'M', nivel: 'Intermediário' })))
      return
    }
    const nomesBanco = data.map(j => j.nome).filter(Boolean)
    const faltantes = jogadoresPadrao.filter(p => !nomesBanco.some(n => n.toLowerCase() === p.toLowerCase())).map(nome => ({ nome, sexo: 'M', nivel: 'Intermediário' }))
    const todos = [...data, ...faltantes].sort((a,b) => a.nome.localeCompare(b.nome))
    setJogadores(todos)
  }

  async function salvarJogadorSeNovo(nomeJogador) {
    const limpo = normalizarNome(nomeJogador)
    if (!limpo) return
    const existeLocal = jogadores.some(j => j.nome.toLowerCase() === limpo.toLowerCase())
    if (existeLocal) return
    await supabase.from('jogadores').insert([{ nome: limpo, sexo: 'M', nivel: 'Intermediário' }])
    await carregarJogadores()
  }


  async function carregarChurrasco(id = eventoId) {
    if (!id) return
    const { data } = await supabase
      .from('churrasco')
      .select('*')
      .eq('evento_id', id)
      .order('criado_em', { ascending: true })

    setListaChurrasco(data || [])
  }

  async function entrarChurrasco(nomePessoa = nomeAtual, origem = 'jogador') {
    const limpo = normalizarNome(nomePessoa)
    if (!eventoId) return aviso('Escolha uma peteca primeiro.')
    if (!limpo) return aviso('Escolha ou digite um nome para o churrasco.')

    const jaEsta = listaChurrasco.find(c => c.nome?.toLowerCase() === limpo.toLowerCase())
    if (jaEsta) return aviso('Esse nome já está no churrasco 🍖')

    const { error } = await supabase.from('churrasco').insert([{
      evento_id: eventoId,
      nome: limpo,
      origem
    }])

    if (error) return aviso('Não consegui adicionar no churrasco.')

    setNomeChurrascoAdmin('')
    await carregarChurrasco(eventoId)
    aviso('Nome adicionado no churrasco 🍖')
  }

  async function removerChurrasco(id) {
    const { error } = await supabase.from('churrasco').delete().eq('id', id)
    if (error) return aviso('Não consegui remover do churrasco.')

    await carregarChurrasco(eventoId)
    aviso('Removido do churrasco.')
  }

  async function carregarPresencas(id) {
    const { data } = await supabase.from('presencas').select('*').eq('evento_id', id)
    const lista = (data || []).sort((a, b) => {
      const sa = a.status === 'espera' ? 1 : 0
      const sb = b.status === 'espera' ? 1 : 0
      if (sa !== sb) return sa - sb
      return a.jogador.localeCompare(b.jogador)
    })
    setPresencas(lista)
  }

  const eventoSelecionado = useMemo(() => eventos.find(e => e.id === eventoId), [eventos, eventoId])
  const nomeAtual = normalizarNome(modoOutroNome ? nomeManual : nome)
  const minhaPresenca = useMemo(() => presencas.find(p => p.jogador?.toLowerCase() === nomeAtual?.toLowerCase()), [presencas, nomeAtual])
  const duplasPublicas = useMemo(() => {
    if (!eventoSelecionado?.duplas) return []
    return String(eventoSelecionado.duplas).split('\n').filter(Boolean)
  }, [eventoSelecionado])

  const confirmados = presencas.filter(p => p.status !== 'espera')
  const espera = presencas.filter(p => p.status === 'espera')
  const limiteVagas = Number(eventoSelecionado?.limite_vagas || 12)
  const vagasUsadas = confirmados.length
  const vagasRestantes = Math.max(limiteVagas - vagasUsadas, 0)
  const eventoLotado = vagasRestantes <= 0

  function sexoDoJogador(nomeJogador) {
    const j = jogadores.find(x => x.nome?.toLowerCase() === nomeJogador?.toLowerCase())
    return j?.sexo || 'M'
  }

  function nivelDoJogador(nomeJogador) {
    const j = jogadores.find(x => x.nome?.toLowerCase() === nomeJogador?.toLowerCase())
    return j?.nivel || 'Intermediário'
  }

  function pontosNivel(nivel) {
    if (nivel === 'Avançado') return 3
    if (nivel === 'Iniciante') return 1
    return 2
  }

  function criarJogadorSorteio(nome) {
    const nivel = nivelDoJogador(nome)
    return {
      nome,
      sexo: sexoDoJogador(nome),
      nivel,
      pontos: pontosNivel(nivel)
    }
  }

  function montarDuplasBalanceadas(nomesConfirmados) {
    const todos = nomesConfirmados.map(criarJogadorSorteio)

    let mulheres = embaralhar(todos.filter(j => j.sexo === 'F')).sort((a, b) => b.pontos - a.pontos)
    let homens = embaralhar(todos.filter(j => j.sexo === 'M')).sort((a, b) => a.pontos - b.pontos)
    const duplas = []

    while (mulheres.length > 0 && homens.length > 0) {
      const mulher = mulheres.shift()
      let melhorIndice = 0
      let melhorScore = Infinity

      homens.forEach((homem, index) => {
        const soma = mulher.pontos + homem.pontos
        const penalidadeForteForte = mulher.pontos === 3 && homem.pontos === 3 ? 10 : 0
        const score = Math.abs(soma - 4) + penalidadeForteForte

        if (score < melhorScore) {
          melhorScore = score
          melhorIndice = index
        }
      })

      const homem = homens.splice(melhorIndice, 1)[0]
      duplas.push([mulher, homem])
    }

    let restantes = embaralhar([...mulheres, ...homens]).sort((a, b) => b.pontos - a.pontos)

    while (restantes.length > 0) {
      const primeiro = restantes.shift()

      if (restantes.length === 0) {
        duplas.push([primeiro, { nome: 'Reserva', nivel: '', pontos: 0, sexo: '' }])
        break
      }

      let melhorIndice = 0
      let melhorScore = Infinity

      restantes.forEach((segundo, index) => {
        const soma = primeiro.pontos + segundo.pontos
        const penalidadeForteForte = primeiro.pontos === 3 && segundo.pontos === 3 ? 10 : 0
        const score = Math.abs(soma - 4) + penalidadeForteForte

        if (score < melhorScore) {
          melhorScore = score
          melhorIndice = index
        }
      })

      const segundo = restantes.splice(melhorIndice, 1)[0]
      duplas.push([primeiro, segundo])
    }

    return duplas.map(([a, b]) => `${a.nome} + ${b.nome}`)
  }

  async function inserirNaLista(nomeFinal, origemAdmin = false) {
    const limpo = normalizarNome(nomeFinal)
    if (!eventoId) return aviso('Escolha uma peteca primeiro.')
    if (!limpo) return aviso('Escolha ou digite um nome.')

    const jaConfirmado = presencas.find(p => p.jogador?.toLowerCase() === limpo.toLowerCase())
    if (jaConfirmado) {
      if (!origemAdmin) {
        setNome(limpo)
        localStorage.setItem('peteca_nome', limpo)
        setPixAberto(true)
        copiarPix(false)
        return aviso('Você já está na lista. Faz o pix caloteiro 😎')
      }
      return aviso('Esse nome já está nessa peteca.')
    }

    const status = eventoLotado ? 'espera' : 'confirmado'
    setCarregando(true)
    await salvarJogadorSeNovo(limpo)

    const { error } = await supabase.from('presencas').insert([{ jogador: limpo, evento_id: eventoId, pix_pago: false, status }])
    setCarregando(false)

    if (error) return aviso('Não consegui colocar o nome na lista.')
    await carregarPresencas(eventoId)
    await carregarRankingFrequencia()

    if (origemAdmin) {
      setAdminNome('')
      setAdminNomeManual('')
      aviso(status === 'espera' ? 'Nome entrou na lista de espera.' : 'Nome adicionado na lista.')
    } else {
      setNome(limpo)
      localStorage.setItem('peteca_nome', limpo)
      setPixAberto(true)
      copiarPix(false)
      aviso(status === 'espera' ? 'Lista cheia! Você entrou na lista de espera.' : 'Presença confirmada.')
    }
  }

  async function confirmarPresenca() { await inserirNaLista(nomeAtual, false) }

  async function retirarNome() {
    if (!minhaPresenca) return aviso('Seu nome ainda não está na lista.')
    setCarregando(true)
    const { error } = await supabase.from('presencas').delete().eq('id', minhaPresenca.id)
    setCarregando(false)
    if (error) return aviso('Não consegui retirar seu nome.')
    await carregarPresencas(eventoId)
    await carregarRankingFrequencia()
    await promoverPrimeiroDaEspera()
    aviso('Nome retirado da lista.')
  }

  async function promoverPrimeiroDaEspera() {
    const atualizados = await supabase.from('presencas').select('*').eq('evento_id', eventoId)
    const lista = atualizados.data || []
    const confirmadosAgora = lista.filter(p => p.status !== 'espera')
    const esperaAgora = lista.filter(p => p.status === 'espera').sort((a,b) => new Date(a.data_jogo) - new Date(b.data_jogo))
    const limite = Number(eventoSelecionado?.limite_vagas || 12)
    if (confirmadosAgora.length < limite && esperaAgora.length > 0) {
      await supabase.from('presencas').update({ status: 'confirmado' }).eq('id', esperaAgora[0].id)
      await carregarPresencas(eventoId)
      await carregarRankingFrequencia()
      aviso(`${esperaAgora[0].jogador} saiu da espera e entrou na lista.`)
    }
  }

  async function adminPromover(p) {
    if (vagasRestantes <= 0) return aviso('Não tem vaga livre.')
    await supabase.from('presencas').update({ status: 'confirmado' }).eq('id', p.id)
    await carregarPresencas(eventoId)
    await carregarRankingFrequencia()
  }

  async function adminMoverParaEspera(p) {
    await supabase.from('presencas').update({ status: 'espera' }).eq('id', p.id)
    await carregarPresencas(eventoId)
    await carregarRankingFrequencia()
  }

  async function marcarPixPago() {
    const presencaAtual = presencas.find(p => p.jogador?.toLowerCase() === nomeAtual?.toLowerCase())
    if (!presencaAtual) return aviso('Confirme presença antes de marcar o pix.')
    const { error } = await supabase.from('presencas').update({ pix_pago: true }).eq('id', presencaAtual.id)
    if (error) return aviso('Não consegui marcar o pix como pago.')
    await carregarPresencas(eventoId)
    aviso('Pix marcado como pago ✅')
    setPixAberto(false)
  }

  function copiarPix(mostrarMsg = true) {
    navigator.clipboard.writeText(PIX)
    if (mostrarMsg) aviso('Pix copiado: ' + PIX)
  }

  function aviso(texto) {
    setMensagem(texto)
    setTimeout(() => setMensagem(''), 3500)
  }

  function loginAdmin() {
    const user = usuarioAdmin.trim().toLowerCase()
    const ok = (user === 'leo' || user === 'tamires') && senhaAdmin === '1234'
    if (!ok) return aviso('Usuário ou senha inválidos.')
    localStorage.setItem('peteca_admin', 'sim')
    setAdminLogado(true)
    aviso('Admin logado.')
  }

  function sairAdmin() {
    localStorage.removeItem('peteca_admin')
    setAdminLogado(false)
  }

  async function criarEvento() {
    if (!novaData) return aviso('Escolha data e hora.')
    const dataEvento = new Date(novaData)
    const nomeEvento = 'Peteca ' + formatarData(dataEvento)
    const { error } = await supabase.from('eventos').insert([{ nome: nomeEvento, data_evento: dataEvento.toISOString(), aberto: true, limite_vagas: Number(novoLimite || 12), duplas: '' }])
    if (error) return aviso('Não consegui criar o evento.')
    setNovaData('')
    setNovoLimite(12)
    await carregarTudo()
    aviso('Peteca criada ⚡')
  }

  async function atualizarLimiteEvento(id, limiteAtual) {
    const novo = prompt('Novo número de vagas:', limiteAtual || 12)
    if (!novo) return
    const { error } = await supabase.from('eventos').update({ limite_vagas: Number(novo) }).eq('id', id)
    if (error) return aviso('Não consegui atualizar o limite.')
    await carregarTudo()
    await carregarPresencas(eventoId)
    aviso('Limite atualizado.')
  }


  async function alternarChurrasco(evento) {
    const novoStatus = !evento.churrasco_ativo

    const { error } = await supabase
      .from('eventos')
      .update({ churrasco_ativo: novoStatus })
      .eq('id', evento.id)

    if (error) return aviso('Não consegui alterar o churrasco.')

    await carregarTudo()
    aviso(novoStatus ? 'Churrasco ativado 🍖' : 'Churrasco ocultado.')
  }

  async function fecharEvento(id) {
    const { error } = await supabase.from('eventos').update({ aberto: false }).eq('id', id)
    if (error) return aviso('Não consegui fechar o evento.')
    if (eventoId === id) { setEventoId(''); setPresencas([]) }
    await carregarTudo()
    aviso('Peteca encerrada e enviada para o histórico.')
  }

  async function reabrirEvento(id) {
    const { error } = await supabase.from('eventos').update({ aberto: true }).eq('id', id)
    if (error) return aviso('Não consegui reabrir o evento.')
    await carregarTudo()
    aviso('Peteca reaberta.')
  }

  async function adminMarcarPago(p) {
    await supabase.from('presencas').update({ pix_pago: !p.pix_pago }).eq('id', p.id)
    await carregarPresencas(eventoId)
  }

  async function atualizarSexo(jogador, sexo) {
    await supabase.from('jogadores').update({ sexo }).eq('nome', jogador.nome)
    await carregarJogadores()
  }

  async function atualizarNivel(jogador, nivel) {
    await supabase.from('jogadores').update({ nivel }).eq('nome', jogador.nome)
    await carregarJogadores()
  }

  async function sortearDuplasAnimado() {
    const nomesConfirmados = confirmados.map(p => p.jogador)
    if (nomesConfirmados.length < 2) return aviso('Precisa de pelo menos 2 confirmados.')

    setSorteando(true)
    setDuplas([])

    setTimeout(async () => {
      const resultado = montarDuplasBalanceadas(nomesConfirmados)

      setDuplas(resultado)
      setSorteando(false)

      await supabase.from('eventos').update({ duplas: resultado.join('\n') }).eq('id', eventoId)
      await carregarEventosAbertos()
      aviso('Sorteio publicado para a galera ⚡')
    }, 1800)
  }

  async function limparSorteio() {
    await supabase.from('eventos').update({ duplas: '' }).eq('id', eventoId)
    setDuplas([])
    await carregarEventosAbertos()
    aviso('Sorteio limpo.')
  }

  return (
    <div className="app">
      <div className="container">
        <header className="hero"><div className="raio">⚡</div><h1>Peteca Raio Vermelho</h1><p>Quem vai apanhar na peteca hoje?</p></header>
        {mensagem && <div className="toast">{mensagem}</div>}

        <section className="card">
          <h2>📅 Próximas Petecas</h2>
          {eventos.length === 0 ? <p className="muted">Nenhuma peteca aberta ainda. Chama o admin aí.</p> : (
            <select value={eventoId} onChange={e => setEventoId(e.target.value)}>
              {eventos.map(ev => <option key={ev.id} value={ev.id}>{ev.nome || 'Peteca ' + formatarData(ev.data_evento)}</option>)}
            </select>
          )}
          {eventoSelecionado && (
            <div className="event-box">
              <div><strong>{eventoSelecionado.nome}</strong><span>{formatarData(eventoSelecionado.data_evento)}</span></div>
              <div className="vagas"><strong>{vagasUsadas}/{limiteVagas}</strong><span>{vagasRestantes > 0 ? `faltam ${vagasRestantes} vagas` : `lista cheia • ${espera.length} na espera`}</span></div>
            </div>
          )}
        </section>

        <section className="card">
          <h2>👤 Seu nome</h2>
          {nome && !modoOutroNome ? (
            <div className="profile"><div className="avatar">{inicial(nome)}</div><div><strong>Olá, {nome}</strong><button className="link" onClick={() => { localStorage.removeItem('peteca_nome'); setNome(''); setNomeManual(''); setModoOutroNome(false) }}>trocar nome</button></div></div>
          ) : (
            <div className="name-box">
              <select value={modoOutroNome ? '__outro__' : nome} onChange={e => {
                if (e.target.value === '__outro__') { setModoOutroNome(true); setNome(''); setNomeManual(''); localStorage.removeItem('peteca_nome') }
                else { setModoOutroNome(false); setNome(e.target.value); setNomeManual(''); if (e.target.value) localStorage.setItem('peteca_nome', e.target.value) }
              }}>
                <option value="">Escolha seu nome</option>
                {jogadores.map(j => <option key={j.nome} value={j.nome}>{j.nome}</option>)}
                <option value="__outro__">Não estou na lista</option>
              </select>
              {modoOutroNome && <input className="manual-name" placeholder="Digite seu nome" value={nomeManual} onChange={e => setNomeManual(e.target.value)} />}
            </div>
          )}
          <div className="actions"><button className="primary" disabled={carregando || !eventoId || (!nome && !nomeManual)} onClick={confirmarPresenca}>✅ Confirmar presença / Pix</button><button className="danger" disabled={carregando || !minhaPresenca} onClick={retirarNome}>❌ Retirar meu nome</button></div>
        </section>

        {pixAberto && (
          <section className="card pix"><h2>💸 Faz o pix caloteiro</h2><div className="pix-key">{PIX}</div><button className="primary" onClick={() => copiarPix(true)}>📋 Copiar chave Pix</button><button className="paid" onClick={marcarPixPago}>✅ Já paguei</button><button className="ghost" onClick={() => setPixAberto(false)}>⏳ Ainda não</button></section>
        )}

        <section className="card">
          <h2>🔥 Confirmados</h2>
          {confirmados.length === 0 ? <p className="muted">Ninguém confirmou ainda. Tá todo mundo correndo?</p> : (
            <div className="players">{confirmados.map((p, index) => <div className="player" key={p.id}><div className="numero">{index + 1}</div><div className="avatar small">{inicial(p.jogador)}</div><span>{p.jogador}</span><span className={p.pix_pago ? 'status pago' : 'status pendente'}>{p.pix_pago ? 'Pago' : 'Pendente'}</span></div>)}</div>
          )}
        </section>

        {espera.length > 0 && (
          <section className="card wait"><h2>⏳ Lista de espera</h2><div className="players">{espera.map((p, index) => <div className="player wait-player" key={p.id}><div className="numero">{index + 1}</div><div className="avatar small">{inicial(p.jogador)}</div><span>{p.jogador}</span><span className="status espera">Lista de espera</span></div>)}</div></section>
        )}

        {eventoSelecionado?.churrasco_ativo && (
          <section className="card churrasco-card">
          <h2>🥩 Churrasco ({listaChurrasco.length})</h2>
          <button className="primary" disabled={!eventoId || !nomeAtual} onClick={() => entrarChurrasco(nomeAtual, 'jogador')}>
            🥩 Quero ir pro churrasco
          </button>

          {listaChurrasco.length === 0 ? (
            <p className="muted">Ninguém entrou no churrasco ainda.</p>
          ) : (
            <div className="players churrasco-lista">
              {listaChurrasco.map((c, index) => (
                <div className="player churrasco-player" key={c.id}>
                  <div className="numero">{index + 1}</div>
                  <div className="avatar small">{inicial(c.nome)}</div>
                  <span>{c.nome}</span>
                  <span className="status churrasco">Churrasco</span>
                </div>
              ))}
            </div>
          )}
          </section>
        )}

        {duplasPublicas.length > 0 && (
          <section className="card sorteio-publico"><h2>🎲 Duplas sorteadas</h2>{duplasPublicas.map((d, i) => <div className="dupla" key={i}>{i + 1}. {d}</div>)}</section>
        )}

        <section className="card">
          <button className="admin-toggle" onClick={() => setAdminAberto(!adminAberto)}>👑 Área Admin</button>
          {adminAberto && !adminLogado && <div className="admin-login"><input placeholder="usuário" value={usuarioAdmin} onChange={e => setUsuarioAdmin(e.target.value)} /><input placeholder="senha" type="password" value={senhaAdmin} onChange={e => setSenhaAdmin(e.target.value)} /><button className="primary" onClick={loginAdmin}>Entrar</button></div>}
          {adminAberto && adminLogado && (
            <div className="admin-panel">
              <button className="ghost" onClick={sairAdmin}>Sair do admin</button>
              <h3>Criar nova Peteca</h3><input type="datetime-local" value={novaData} onChange={e => setNovaData(e.target.value)} /><input type="number" min="2" placeholder="Número de vagas" value={novoLimite} onChange={e => setNovoLimite(e.target.value)} /><button className="primary" onClick={criarEvento}>Criar peteca</button>

              <h3>Adicionar jogador na lista</h3>
              <select value={adminNome} onChange={e => setAdminNome(e.target.value)}><option value="">Escolha um jogador</option>{jogadores.map(j => <option key={j.nome} value={j.nome}>{j.nome}</option>)}</select>
              <input placeholder="Ou digite novo nome" value={adminNomeManual} onChange={e => setAdminNomeManual(e.target.value)} />
              <button className="primary" onClick={() => inserirNaLista(adminNomeManual || adminNome, true)}>Adicionar jogador</button>

              <button className="ghost" onClick={() => setSexoAberto(!sexoAberto)}>
                {sexoAberto ? 'Ocultar sexo e nível dos jogadores' : '👥 Definir sexo e nível dos jogadores'}
              </button>

              {sexoAberto && (
                <>
                  <h3>Definir sexo e nível para sorteio</h3>
                  {jogadores.map(j => (
                    <div className="admin-row nivel-row" key={j.nome}>
                      <span>{j.nome}</span>
                      <div className="nivel-controls">
                        <select className="sexo-select" value={j.sexo || 'M'} onChange={e => atualizarSexo(j, e.target.value)}>
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                        </select>
                        <select className="nivel-select" value={j.nivel || 'Intermediário'} onChange={e => atualizarNivel(j, e.target.value)}>
                          <option value="Avançado">Avançado</option>
                          <option value="Intermediário">Intermediário</option>
                          <option value="Iniciante">Iniciante</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </>
              )}

              <h3>Churrasco</h3>
              {eventoSelecionado && (
                <button className={eventoSelecionado.churrasco_ativo ? 'danger' : 'primary'} onClick={() => alternarChurrasco(eventoSelecionado)}>
                  {eventoSelecionado.churrasco_ativo ? '🥩 Ocultar churrasco' : '🥩 Ativar churrasco'}
                </button>
              )}
              <input
                placeholder="Nome para o churrasco"
                value={nomeChurrascoAdmin}
                onChange={e => setNomeChurrascoAdmin(e.target.value)}
              />
              <button className="primary" onClick={() => entrarChurrasco(nomeChurrascoAdmin, 'admin')}>
                🥩 Adicionar no churrasco
              </button>

              {listaChurrasco.length === 0 ? (
                <p className="muted">Nenhum nome no churrasco.</p>
              ) : (
                listaChurrasco.map((c, index) => (
                  <div className="admin-row" key={c.id}>
                    <span>{index + 1}. {c.nome}</span>
                    <button className="danger mini" onClick={() => removerChurrasco(c.id)}>Remover</button>
                  </div>
                ))
              )}

              <h3>Eventos abertos</h3>
              {eventos.map(ev => <div className="admin-row" key={ev.id}><span>{ev.nome} • {ev.limite_vagas || 12} vagas</span><div className="admin-actions"><button className="ghost mini" onClick={() => atualizarLimiteEvento(ev.id, ev.limite_vagas)}>Vagas</button><button className="danger mini" onClick={() => fecharEvento(ev.id)}>Fechar</button></div></div>)}

              <h3>Ranking dos mais frequentes</h3>
              {rankingFrequencia.length === 0 ? <p className="muted">Ainda sem ranking.</p> : rankingFrequencia.slice(0, 10).map((r, index) => <div className="admin-row rank-row" key={r.jogador}><span>{index + 1}. {r.jogador}</span><strong>{r.total} presenças</strong></div>)}

              <button className="ghost" onClick={() => setHistoricoAberto(!historicoAberto)}>
                {historicoAberto ? 'Ocultar petecas encerradas' : '📜 Ver petecas encerradas'}
              </button>

              {historicoAberto && (
                <>
                  <h3>Histórico de petecas encerradas</h3>
                  {historico.length === 0 ? (
                    <p className="muted">Nenhuma peteca encerrada ainda.</p>
                  ) : (
                    historico.map(ev => (
                      <div className="admin-row" key={ev.id}>
                        <span>{ev.nome}</span>
                        <button className="ghost mini" onClick={() => reabrirEvento(ev.id)}>Reabrir</button>
                      </div>
                    ))
                  )}
                </>
              )}

              <h3>Pagamentos e lista</h3>
              {presencas.map((p, index) => <div className="admin-row" key={p.id}><span>{index + 1}. {p.jogador} {p.status === 'espera' ? '• espera' : ''}</span><div className="admin-actions">{p.status === 'espera' ? <button className="paid mini" onClick={() => adminPromover(p)}>Promover</button> : <button className="ghost mini" onClick={() => adminMoverParaEspera(p)}>Mover p/ espera</button>}<button className={p.pix_pago ? 'paid mini' : 'ghost mini'} onClick={() => adminMarcarPago(p)}>{p.pix_pago ? 'Pago' : 'Pendente'}</button></div></div>)}

              <h3>Sorteio misto</h3>
              <button className="primary" onClick={sortearDuplasAnimado}>🎲 Sortear e publicar duplas</button>
              <button className="ghost" onClick={limparSorteio}>Limpar sorteio público</button>
              {sorteando && <div className="shuffle">Embaralhando os brabos... ⚡</div>}
              {duplas.map((d, i) => <div className="dupla" key={i}>{i + 1}. {d}</div>)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

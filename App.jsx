import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://oxoisszxawezocahjayi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94b2lzc3p4YXdlem9jYWhqYXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODE5MTgsImV4cCI6MjA5MzQ1NzkxOH0.DCTsSSB9mrRHJb5TIW1NBPhTD_-b4SetkpsYvawj6M0'
)

const jogadoresFixos = [
  'Analice','Bruno','Camila','Diamante','Douglas','Geane','Leo',
  'Leonan','Samuel','Tata','Tavares','Victor','Welington'
]

const PIX = '38988364439'

function formatarData(data) {
  if (!data) return ''
  const d = new Date(data)
  return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }) + ' - ' +
    d.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
}

function inicial(nome) {
  return nome ? nome.trim()[0].toUpperCase() : '?'
}

export default function App() {
  const [eventos, setEventos] = useState([])
  const [eventoId, setEventoId] = useState('')
  const [presencas, setPresencas] = useState([])
  const [nome, setNome] = useState(localStorage.getItem('peteca_nome') || '')
  const [pixAberto, setPixAberto] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [adminAberto, setAdminAberto] = useState(false)
  const [adminLogado, setAdminLogado] = useState(localStorage.getItem('peteca_admin') === 'sim')
  const [usuarioAdmin, setUsuarioAdmin] = useState('')
  const [senhaAdmin, setSenhaAdmin] = useState('')
  const [novaData, setNovaData] = useState('')
  const [duplas, setDuplas] = useState([])
  const [sorteando, setSorteando] = useState(false)

  useEffect(() => {
    carregarTudo()
  }, [])

  useEffect(() => {
    if (eventoId) carregarPresencas(eventoId)
  }, [eventoId])

  async function carregarTudo() {
    const { data } = await supabase
      .from('eventos')
      .select('*')
      .eq('aberto', true)
      .order('data_evento', { ascending: true })

    const listaEventos = data || []
    setEventos(listaEventos)

    if (!eventoId && listaEventos.length > 0) {
      setEventoId(listaEventos[0].id)
    }
  }

  async function carregarPresencas(id) {
    const { data } = await supabase
      .from('presencas')
      .select('*')
      .eq('evento_id', id)

    const lista = (data || []).sort((a, b) => a.jogador.localeCompare(b.jogador))
    setPresencas(lista)
  }

  const eventoSelecionado = useMemo(
    () => eventos.find(e => e.id === eventoId),
    [eventos, eventoId]
  )

  const minhaPresenca = useMemo(
    () => presencas.find(p => p.jogador === nome),
    [presencas, nome]
  )

  async function confirmarPresenca() {
    if (!eventoId) return aviso('Escolha uma peteca primeiro.')
    if (!nome) return aviso('Escolha seu nome primeiro.')

    localStorage.setItem('peteca_nome', nome)

    if (minhaPresenca) {
      aviso('Você já está confirmado nessa peteca 😎')
      setPixAberto(true)
      return
    }

    setCarregando(true)
    const { error } = await supabase.from('presencas').insert([{
      jogador: nome,
      evento_id: eventoId,
      pix_pago: false
    }])

    setCarregando(false)

    if (error) {
      aviso('Não consegui confirmar. Verifique as permissões no Supabase.')
      return
    }

    await carregarPresencas(eventoId)
    setPixAberto(true)
    copiarPix(false)
  }

  async function retirarNome() {
    if (!minhaPresenca) return aviso('Seu nome ainda não está na lista.')
    setCarregando(true)

    const { error } = await supabase
      .from('presencas')
      .delete()
      .eq('id', minhaPresenca.id)

    setCarregando(false)

    if (error) {
      aviso('Não consegui retirar seu nome. Verifique as permissões no Supabase.')
      return
    }

    await carregarPresencas(eventoId)
    aviso('Nome retirado da lista.')
  }

  async function marcarPixPago() {
    if (!minhaPresenca) return aviso('Confirme presença antes de marcar o pix.')
    const { error } = await supabase
      .from('presencas')
      .update({ pix_pago: true })
      .eq('id', minhaPresenca.id)

    if (error) {
      aviso('Não consegui marcar o pix como pago.')
      return
    }

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

    const { error } = await supabase.from('eventos').insert([{
      nome: nomeEvento,
      data_evento: dataEvento.toISOString(),
      aberto: true
    }])

    if (error) {
      aviso('Não consegui criar o evento. Verifique a policy de eventos.')
      return
    }

    setNovaData('')
    await carregarTudo()
    aviso('Peteca criada ⚡')
  }

  async function fecharEvento(id) {
    const { error } = await supabase
      .from('eventos')
      .update({ aberto: false })
      .eq('id', id)

    if (error) {
      aviso('Não consegui fechar o evento. Verifique a policy de eventos.')
      return
    }

    await carregarTudo()
    aviso('Peteca fechada.')
  }

  async function adminMarcarPago(p) {
    await supabase.from('presencas').update({ pix_pago: !p.pix_pago }).eq('id', p.id)
    await carregarPresencas(eventoId)
  }

  function sortearDuplasAnimado() {
    const nomes = presencas.map(p => p.jogador)
    if (nomes.length < 2) return aviso('Precisa de pelo menos 2 confirmados.')

    setSorteando(true)
    setDuplas([])

    setTimeout(() => {
      const embaralhados = [...nomes].sort(() => Math.random() - 0.5)
      const resultado = []

      for (let i = 0; i < embaralhados.length; i += 2) {
        resultado.push(`${embaralhados[i]} + ${embaralhados[i + 1] || 'Reserva'}`)
      }

      setDuplas(resultado)
      setSorteando(false)
    }, 1800)
  }

  return (
    <div className="app">
      <div className="container">
        <header className="hero">
          <div className="raio">⚡</div>
          <h1>Peteca Raio Vermelho</h1>
          <p>Quem vai apanhar na peteca hoje?</p>
        </header>

        {mensagem && <div className="toast">{mensagem}</div>}

        <section className="card">
          <h2>📅 Próximas Petecas</h2>

          {eventos.length === 0 ? (
            <p className="muted">Nenhuma peteca aberta ainda. Chama o admin aí.</p>
          ) : (
            <select value={eventoId} onChange={e => setEventoId(e.target.value)}>
              {eventos.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.nome || 'Peteca ' + formatarData(ev.data_evento)}
                </option>
              ))}
            </select>
          )}

          {eventoSelecionado && (
            <div className="event-box">
              <strong>{eventoSelecionado.nome}</strong>
              <span>{formatarData(eventoSelecionado.data_evento)}</span>
            </div>
          )}
        </section>

        <section className="card">
          <h2>👤 Seu nome</h2>

          {nome ? (
            <div className="profile">
              <div className="avatar">{inicial(nome)}</div>
              <div>
                <strong>Olá, {nome}</strong>
                <button className="link" onClick={() => {
                  localStorage.removeItem('peteca_nome')
                  setNome('')
                }}>trocar nome</button>
              </div>
            </div>
          ) : (
            <select value={nome} onChange={e => {
              setNome(e.target.value)
              if (e.target.value) localStorage.setItem('peteca_nome', e.target.value)
            }}>
              <option value="">Escolha seu nome</option>
              {jogadoresFixos.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          )}

          <div className="actions">
            <button className="primary" disabled={carregando || !eventoId || !nome} onClick={confirmarPresenca}>
              ✅ Confirmar presença
            </button>
            <button className="danger" disabled={carregando || !minhaPresenca} onClick={retirarNome}>
              ❌ Retirar meu nome
            </button>
          </div>
        </section>

        {pixAberto && (
          <section className="card pix">
            <h2>💸 Faz o pix caloteiro</h2>
            <div className="pix-key">{PIX}</div>
            <button className="primary" onClick={() => copiarPix(true)}>📋 Copiar chave Pix</button>
            <button className="paid" onClick={marcarPixPago}>✅ Já paguei</button>
            <button className="ghost" onClick={() => setPixAberto(false)}>⏳ Ainda não</button>
          </section>
        )}

        <section className="card">
          <h2>🔥 Só os brabos confirmados</h2>
          {presencas.length === 0 ? (
            <p className="muted">Ninguém confirmou ainda. Tá todo mundo correndo?</p>
          ) : (
            <div className="players">
              {presencas.map(p => (
                <div className="player" key={p.id}>
                  <div className="avatar small">{inicial(p.jogador)}</div>
                  <span>{p.jogador}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <button className="admin-toggle" onClick={() => setAdminAberto(!adminAberto)}>
            👑 Área Admin
          </button>

          {adminAberto && !adminLogado && (
            <div className="admin-login">
              <input placeholder="usuário" value={usuarioAdmin} onChange={e => setUsuarioAdmin(e.target.value)} />
              <input placeholder="senha" type="password" value={senhaAdmin} onChange={e => setSenhaAdmin(e.target.value)} />
              <button className="primary" onClick={loginAdmin}>Entrar</button>
            </div>
          )}

          {adminAberto && adminLogado && (
            <div className="admin-panel">
              <button className="ghost" onClick={sairAdmin}>Sair do admin</button>

              <h3>Criar nova Peteca</h3>
              <input type="datetime-local" value={novaData} onChange={e => setNovaData(e.target.value)} />
              <button className="primary" onClick={criarEvento}>Criar peteca</button>

              <h3>Eventos abertos</h3>
              {eventos.map(ev => (
                <div className="admin-row" key={ev.id}>
                  <span>{ev.nome}</span>
                  <button className="danger mini" onClick={() => fecharEvento(ev.id)}>Fechar</button>
                </div>
              ))}

              <h3>Pagamentos do evento selecionado</h3>
              {presencas.map(p => (
                <div className="admin-row" key={p.id}>
                  <span>{p.jogador}</span>
                  <button className={p.pix_pago ? 'paid mini' : 'ghost mini'} onClick={() => adminMarcarPago(p)}>
                    {p.pix_pago ? 'Pago' : 'Pendente'}
                  </button>
                </div>
              ))}

              <h3>Sorteio</h3>
              <button className="primary" onClick={sortearDuplasAnimado}>🎲 Sortear duplas</button>
              {sorteando && <div className="shuffle">Embaralhando os brabos... ⚡</div>}
              {duplas.map((d, i) => <div className="dupla" key={i}>{i + 1}. {d}</div>)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

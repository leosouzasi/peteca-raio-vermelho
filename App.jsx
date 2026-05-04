import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://oxoisszxawezocahjayi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94b2lzc3p4YXdlem9jYWhqYXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODE5MTgsImV4cCI6MjA5MzQ1NzkxOH0.DCTsSSB9mrRHJb5TIW1NBPhTD_-b4SetkpsYvawj6M0'
)

const jogadores = ['Tata','Victor','Samuel','Bruno','Douglas','Camila','Leo','Geane','Leonan','Analice','Tavares','Welington','Diamante']

export default function App(){
  const [nome,setNome] = useState('')
  const [lista,setLista] = useState([])

  useEffect(()=>{ carregar() },[])

  async function carregar(){
    const { data } = await supabase.from('presencas').select('*')
    setLista(data || [])
  }

  async function confirmar(){
    if(!nome) return
    await supabase.from('presencas').insert([{ jogador:nome }])
    alert('Faça o PIX caloteiro 😎\n38988364439 - Tamires Dias Olivera')
    carregar()
  }

  return (
    <div style={{background:'#111',color:'#fff',minHeight:'100vh',padding:20}}>
      <h1>⚡ Peteca Raio Vermelho</h1>
      <select onChange={(e)=>setNome(e.target.value)}>
        <option>Escolha seu nome</option>
        {jogadores.map((j,i)=><option key={i}>{j}</option>)}
      </select>
      <button onClick={confirmar} style={{marginLeft:10}}>Confirmar + Pix</button>
      <h2>Confirmados</h2>
      {lista.map((p,i)=>(<div key={i}>{p.jogador}</div>))}
    </div>
  )
}
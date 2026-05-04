import React,{useEffect,useState} from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase=createClient('https://oxoisszxawezocahjayi.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94b2lzc3p4YXdlem9jYWhqYXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODE5MTgsImV4cCI6MjA5MzQ1NzkxOH0.DCTsSSB9mrRHJb5TIW1NBPhTD_-b4SetkpsYvawj6M0')
const jogadores=['Tata','Victor','Samuel','Bruno','Douglas','Camila','Leo','Geane','Leonan','Analice','Tavares','Welington','Diamante']
export default function App(){
const [nome,setNome]=useState(''); const [lista,setLista]=useState([]); const hoje=new Date().toISOString().slice(0,10)
useEffect(()=>{carregar()},[])
async function carregar(){ const {data}=await supabase.from('presencas').select('*').order('data_jogo'); setLista(data||[]) }
async function confirmar(){
 if(!nome) return;
 const existe=lista.find(x=>x.jogador===nome && x.data_jogo.slice(0,10)===hoje);
 if(existe){ alert('Você já confirmou presença hoje 😎'); return; }
 await supabase.from('presencas').insert([{jogador:nome}]);
 navigator.clipboard.writeText('38988364439');
 alert('Faça o PIX caloteiro 😎');
 carregar();
}
return <div style={{background:'#111',color:'#fff',minHeight:'100vh',padding:20,fontFamily:'Arial'}}>
<h1 style={{color:'red'}}>⚡ Peteca Raio Vermelho</h1>
<select onChange={e=>setNome(e.target.value)} style={{padding:10,borderRadius:8}}>
<option value=''>Escolha seu nome</option>{jogadores.map((j,i)=><option key={i}>{j}</option>)}
</select>
<button onClick={confirmar} style={{marginLeft:10,padding:10,borderRadius:8}}>Confirmar + Copiar Pix</button>
<h2>Confirmados Hoje</h2>
{lista.filter(x=>x.data_jogo.slice(0,10)===hoje).map((p,i)=><div key={i} style={{background:'#222',margin:'5px 0',padding:10,borderRadius:8}}>{p.jogador}</div>)}
</div>}
